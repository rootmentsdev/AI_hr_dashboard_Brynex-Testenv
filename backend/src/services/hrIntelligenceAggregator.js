/**
 * HR Intelligence Aggregator Engine (Dual-State Ingestion & Merger)
 *
 * Architecture:
 * 1. Persistent Live Ingestion (Baseline Layer):
 *    Continuously aggregates data from External LMS Integration APIs
 *    (Store 360 & Employee 360). Zero-empty-state guarantee.
 * 2. File Augmentation (Enrichment Layer):
 *    Idempotently merges uploaded CSV/Excel files (Employees, Attendance,
 *    Payroll, Sales) with baseline records on primary keys:
 *    (employeeId / empId / email, and locCode / branchId / storeName).
 */

import { fetchAllStoresOverview, fetchAllEmployeesOverview } from './externalIntegrationService.js';

export const extractStoreMonthlyTarget = (store) => {
  if (!store?.targets || store.targets.length === 0) return 0;
  let maxTarget = 0;
  for (const t of store.targets) {
    if (t.monthlyTarget && typeof t.monthlyTarget === 'number') {
      if (t.monthlyTarget > maxTarget) maxTarget = t.monthlyTarget;
    }
    if (t.weeklyTargets && typeof t.weeklyTargets === 'object') {
      const wSum = Object.values(t.weeklyTargets).reduce((a, b) => a + (Number(b) || 0), 0);
      if (wSum > maxTarget) maxTarget = wSum;
    }
    if (Array.isArray(t.employeeTargets) && t.employeeTargets.length > 0) {
      const eSum = t.employeeTargets.reduce((acc, emp) => {
        if (emp.targetAmount) return acc + (Number(emp.targetAmount) || 0);
        if (emp.weeklyTargets && typeof emp.weeklyTargets === 'object') {
          return acc + Object.values(emp.weeklyTargets).reduce((wa, wb) => wa + (Number(wb) || 0), 0);
        }
        return acc;
      }, 0);
      if (eSum > maxTarget) maxTarget = eSum;
    }
  }
  return maxTarget;
};

export const extractStoreNetSales = (store) => {
  let totalSales = 0;
  const dappr = store?.attributions?.dappr || [];
  for (const d of dappr) {
    if (d.attribution?.netSales) {
      totalSales += Number(d.attribution.netSales) || 0;
    } else if (d.netSales) {
      totalSales += Number(d.netSales) || 0;
    } else if (Array.isArray(d.attributions)) {
      for (const a of d.attributions) {
        totalSales += Number(a.billWtd) || 0;
      }
    }
  }
  const custom = store?.attributions?.customization || [];
  for (const c of custom) {
    if (c.attribution?.customOrderRevenue) {
      totalSales += Number(c.attribution.customOrderRevenue) || 0;
    } else if (c.customOrderRevenue) {
      totalSales += Number(c.customOrderRevenue) || 0;
    }
  }
  return totalSales;
};

export const extractStoreFootfallAndWalkins = (store) => {
  const walkins = Number(store?.summary?.totalWalkinsLogged || store?.operations?.totalWalkinsCount || 0);
  let camFootfall = 0;
  (store?.operations?.cameraAudits || []).forEach(ca => {
    camFootfall += (Number(ca.footfallCount) || Number(ca.inCamCount) || 0);
  });
  return {
    walkins,
    footfall: Math.max(walkins, camFootfall)
  };
};

export async function aggregateHrIntelligence({ uploadedFiles = [], customRules = null, adminPrompt = '' } = {}) {
  // 1. Fetch Baseline Layer from External Integration APIs
  const [stores, employees] = await Promise.all([
    fetchAllStoresOverview(),
    fetchAllEmployeesOverview()
  ]);

  // Aggregate Baseline Telemetry
  let totalNetSales = 0;
  let totalTargetAmount = 0;
  let totalFootfall = 0;
  let totalDiscrepancies = 0;
  let totalWalkins = 0;
  let totalStaffBaseline = 0;
  let openTasksCount = 0;
  let inProgressTasksCount = 0;
  let overdueTasksCount = 0;
  let completedTasksCount = 0;
  let auditScoresSum = 0;
  let auditScoresCount = 0;

  stores.forEach(store => {
    // Sales and targets
    const dAtt = extractStoreNetSales(store);
    const sTarget = extractStoreMonthlyTarget(store);
    totalNetSales += dAtt;
    totalTargetAmount += sTarget;

    // Footfall and discrepancies
    const { walkins, footfall } = extractStoreFootfallAndWalkins(store);
    totalFootfall += footfall;
    totalWalkins += walkins;
    (store.operations?.cameraAudits || []).forEach(ca => {
      totalDiscrepancies += (ca.discrepancyCount || 0);
    });

    totalStaffBaseline += (store.summary?.totalStaffCount || store.staff?.totalUsers || 0);

    // Audit scores
    (store.operations?.branchAudits || []).forEach(ba => {
      if (ba.auditScore) {
        auditScoresSum += ba.auditScore;
        auditScoresCount += 1;
      }
    });

    // Store tasks
    (store.operations?.storeTasks || []).forEach(t => {
      if (t.status === 'In Progress') inProgressTasksCount++;
      else if (t.status === 'Completed') completedTasksCount++;
      else openTasksCount++;

      if (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed') {
        overdueTasksCount++;
      }
    });
  });

  // Learning and Assessment Pass Rates across employees
  let assessmentScoresSum = 0;
  let assessmentScoresCount = 0;
  let assessmentPassCount = 0;
  let trainingProgressSum = 0;
  let trainingProgressCount = 0;

  employees.forEach(emp => {
    (emp.learning?.assessmentAttempts || []).forEach(att => {
      const s = att.score || att.percentage || 0;
      assessmentScoresSum += s;
      assessmentScoresCount += 1;
      if (att.status === 'Passed' || s >= 75) assessmentPassCount += 1;
    });

    (emp.learning?.trainingProgress || []).forEach(tp => {
      trainingProgressSum += (tp.overallProgress ?? (tp.status === 'Completed' ? 100 : null) ?? 0);
      trainingProgressCount += 1;
    });

    (emp.tasks?.assignedTasks || []).forEach(t => {
      if (t.status === 'In Progress') inProgressTasksCount++;
      else if (t.status === 'Completed') completedTasksCount++;
      else openTasksCount++;
    });
  });

  // Baseline Metric Formulas — derived purely from live API data, no fallbacks
  const quotaAttainment = totalTargetAmount > 0 ? (totalNetSales / totalTargetAmount) * 100 : null;
  const avgAuditScore = auditScoresCount > 0 ? (auditScoresSum / auditScoresCount) : null;
  const avgAssessmentPassRate = assessmentScoresCount > 0 ? (assessmentPassCount / assessmentScoresCount) * 100 : null;
  const totalTasks = openTasksCount + inProgressTasksCount + completedTasksCount;
  const taskCompletionRate = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : null;

  // HR Health Score %: Weighted formula (Quota 35%, Audit 25%, Assessment 20%, Tasks 20%)
  // Only computed when enough real data exists; null otherwise
  const availableComponents = [
    quotaAttainment !== null ? { val: quotaAttainment, weight: 0.35 } : null,
    avgAuditScore !== null ? { val: avgAuditScore, weight: 0.25 } : null,
    avgAssessmentPassRate !== null ? { val: avgAssessmentPassRate, weight: 0.20 } : null,
    taskCompletionRate !== null ? { val: taskCompletionRate, weight: 0.20 } : null
  ].filter(Boolean);
  const totalWeight = availableComponents.reduce((s, c) => s + c.weight, 0);
  const baselineHealthScore = totalWeight > 0
    ? Math.round(availableComponents.reduce((s, c) => s + c.val * (c.weight / totalWeight), 0))
    : null;

  // 2. File Augmentation & Idempotent Merge (Enrichment Layer)
  const isFileUploaded = uploadedFiles && uploadedFiles.length > 0;
  let enrichedPayrollRatio = null;
  let enrichedAttritionRate = null;
  let enrichedExitsCount = 0;
  let totalUploadedEmployeesCount = 0;
  let uploadedOvertimeHours = 0;
  let restIntervalViolations = 0;

  const masterEmployeesMap = new Map();

  // Populate master map with Baseline Employees first
  employees.forEach(emp => {
    const key = (emp.summary.empId || emp.summary.email).toLowerCase();
    masterEmployeesMap.set(key, {
      id: emp.summary.empId,
      name: emp.summary.name,
      role: emp.summary.designation || null,
      dept: emp.summary.department || null,
      branch: emp.summary.workingBranch || null,
      salary: emp.profile?.employeeRecord?.baseSalaryMonthly
        ? `₹${emp.profile.employeeRecord.baseSalaryMonthly.toLocaleString()}`
        : null,
      rawSalary: emp.profile?.employeeRecord?.baseSalaryMonthly || 0,
      ot: null,
      rawOt: 0,
      att: null,
      risk: null,
      source: 'External LMS API (Live)',
      sales: emp.salesAttributions?.dappr?.[0]?.attribution?.netSales || 0,
      target: emp.salesAttributions?.targets?.[0]?.targets?.targetAmount || 0,
      trainingStatus: emp.learning?.trainingProgress?.[0]?.status || null
    });
  });

  // Also seed other staff members from store branches
  stores.forEach(st => {
    (st.staff?.users || []).forEach(u => {
      const key = (u.empID || u.email || u.username).toLowerCase();
      if (!masterEmployeesMap.has(key)) {
        masterEmployeesMap.set(key, {
          id: u.empID || null,
          name: u.username || null,
          role: u.designation || null,
          dept: u.department || null,
          branch: u.workingBranch || st.summary?.workingBranch || null,
          salary: null,
          rawSalary: 0,
          ot: null,
          rawOt: 0,
          att: null,
          risk: null,
          source: 'External LMS API (Store Staff)',
          sales: 0,
          target: 0,
          trainingStatus: null
        });
      }
    });
  });

  // If CSV files are present, perform idempotent merge on empId / email / locCode
  if (isFileUploaded) {
    uploadedFiles.forEach(file => {
      const rows = file.parsedRows || [];
      rows.forEach((r, idx) => {
        const id = r.employee_id || r.id || r.emp_id || r.empID;
        const name = r.full_name || r.name || r.employee_name;
        const email = r.email;
        const branch = r.branch || r.location || r.workingBranch;
        const dept = r.department || r.dept;
        const status = r.status || '';
        const baseSal = parseFloat(String(r.base_salary_monthly || r.salary || r.pay).replace(/[^0-9.]/g, '')) || 0;
        const ot = parseFloat(String(r.overtime_hours || r.ot_hours || r.ot).replace(/[^0-9.]/g, '')) || 0;
        const rest = parseFloat(String(r.rest_interval_hours || r.rest).replace(/[^0-9.]/g, '')) || 0;

        if (ot > 0) uploadedOvertimeHours += ot;
        if (rest > 0 && rest < 10) restIntervalViolations += 1;

        const isExit = /exit|resigned|notice|terminated|left/i.test(status);
        if (isExit) enrichedExitsCount++;

        const mergeKey = (id || email || name || `emp-${idx}`).toLowerCase();

        if (masterEmployeesMap.has(mergeKey)) {
          // Idempotent enrichment of existing employee
          const existing = masterEmployeesMap.get(mergeKey);
          if (baseSal > 0) {
            existing.salary = baseSal > 1000 ? `₹${baseSal.toLocaleString()}` : `$${baseSal.toLocaleString()}`;
            existing.rawSalary = baseSal;
          }
          if (ot > 0) {
            existing.rawOt += ot;
            existing.ot = `${existing.rawOt.toFixed(1)} hrs`;
          }
          if (dept) existing.dept = dept;
          if (branch) existing.branch = branch;
          if (isExit) {
            existing.risk = 'Critical (Exit Notice Active)';
          } else if (ot > 15) {
            existing.risk = 'High (Overtime Fatigue)';
          }
          existing.source = 'External LMS + Ingested CSV';
        } else if (id || name) {
          // New employee record from uploaded file
          let risk = 'Low (Stable)';
          if (isExit) risk = 'Critical (Exit Notice Active)';
          else if (ot > 15) risk = 'High (Overtime Fatigue)';

          masterEmployeesMap.set(mergeKey, {
            id: id || null,
            name: name || null,
            role: (r.role_id || r.role || r.designation || null)?.replace?.('ROLE-', '')?.replace?.(/-/g, ' ') || null,
            dept: dept || null,
            branch: branch || null,
            salary: baseSal > 0 ? (baseSal > 1000 ? `₹${baseSal.toLocaleString()}` : `$${baseSal.toLocaleString()}`) : null,
            rawSalary: baseSal || 0,
            ot: ot > 0 ? `${ot.toFixed(1)} hrs` : null,
            rawOt: ot,
            att: null,
            risk,
            source: 'Ingested CSV Dataset'
          });
        }
      });
    });

    totalUploadedEmployeesCount = masterEmployeesMap.size;
    if (totalUploadedEmployeesCount > 0 && enrichedExitsCount > 0) {
      enrichedAttritionRate = ((enrichedExitsCount / totalUploadedEmployeesCount) * 100).toFixed(1);
    }
  }

  const allMergedEmployees = Array.from(masterEmployeesMap.values());
  const totalMergedHeadcount = allMergedEmployees.length;

  // Financial Payroll Calculation
  const totalMergedPayroll = allMergedEmployees.reduce((sum, e) => sum + (e.rawSalary || 0), 0);
  if (totalNetSales > 0 && totalMergedPayroll > 0) {
    enrichedPayrollRatio = ((totalMergedPayroll / totalNetSales) * 100).toFixed(1) + '%';
  }

  // Final Health Score calculation with enrichment
  let finalHealthScore = baselineHealthScore;
  if (finalHealthScore !== null && enrichedAttritionRate && parseFloat(enrichedAttritionRate) > 8) {
    finalHealthScore = Math.max(0, finalHealthScore - 6);
  }

  // 3. Attention items are only synthesized by AI analysis — zero un-analyzed raw store/telemetry flags
  const activeDateRange = 'Current Period';
  const attentionItems = [];

  // 4. Synthesize Dynamic KPI Counters from Real Data
  const totalIssuesDetected = attentionItems.length;
  const awaitedDecisionsCount = 0;
  const beingMonitoredCount = inProgressTasksCount;
  const opportunitiesCount = 0;
  const avgProductivityDisplay = quotaAttainment !== null ? `${Math.round(quotaAttainment)}%` : 'N/A';

  const kpiMetrics = [
    {
      id: 'issues',
      title: 'Issues Detected',
      value: String(totalIssuesDetected),
      trend: totalIssuesDetected > 0 ? `${totalIssuesDetected} active risks across datasets` : 'No active risks logged',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-purple'
    },
    {
      id: 'decisions',
      title: 'Awaited Decisions',
      value: String(awaitedDecisionsCount),
      trend: awaitedDecisionsCount > 0 ? `${awaitedDecisionsCount} management options ready for approval` : 'No pending decisions',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-red'
    },
    {
      id: 'monitored',
      title: 'Being Monitored',
      value: String(totalStaffBaseline || totalMergedHeadcount || 0),
      trend: 'Active records in monitored network',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-green'
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      value: String(opportunitiesCount),
      trend: 'Optimization levers',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-orange'
    },
    {
      id: 'productivity',
      title: 'Avg. Productivity',
      value: avgProductivityDisplay,
      trend: quotaAttainment !== null ? `${quotaAttainment.toFixed(1)}% quota attainment across network` : 'No target data available',
      trendPositive: true,
      colorClass: 'hr-kpi-icon-blue'
    }
  ];

  // Compile Comprehensive Aggregated Payload
  return {
    status: 'success',
    isZeroStateBaseline: !isFileUploaded,
    connectedFilesCount: uploadedFiles.length,
    fileNames: uploadedFiles.map(f => f.name),
    reportingPeriod: activeDateRange,
    healthScore: finalHealthScore !== null ? `${finalHealthScore}%` : 'N/A',
    healthStatus: finalHealthScore !== null ? (finalHealthScore >= 80 ? 'Healthy' : 'Needs Attention') : 'Insufficient Data',
    adminPromptApplied: adminPrompt || (isFileUploaded ? 'File Ingestion Synthesis' : 'Live External Retail LMS API Telemetry'),
    kpiMetrics,
    attentionItems,
    attentionSummary: isFileUploaded
      ? `Dual-layer intelligence active: Ingested ${uploadedFiles.length} file(s) with ${totalMergedHeadcount} employee records (${enrichedExitsCount} exit records).`
      : (stores.length > 0
          ? `Live external retail ingestion active: Monitoring ${stores.length} retail branches (${totalStaffBaseline} staff). Upload workforce records in Data Management to activate AI anomaly detection.`
          : `No workforce datasets currently synced. Upload employee and attendance records in Data Management to detect live management issues.`),
    storesSummary: {
      count: stores.length,
      branches: stores.map(s => {
        const resolvedName = (
          s.summary?.workingBranch?.trim() ||
          s.branch?.workingBranch?.trim() ||
          s.staff?.users?.[0]?.workingBranch?.trim() ||
          s.summary?.storeAliases?.[0]?.trim() ||
          `Store ${s.summary?.locCode || 'Unknown'}`
        );
        const monthlyTarget = extractStoreMonthlyTarget(s);
        const netSales = extractStoreNetSales(s);
        const { walkins, footfall } = extractStoreFootfallAndWalkins(s);
        const quotaAttainment = monthlyTarget > 0 ? ((netSales / monthlyTarget) * 100).toFixed(1) + '%' : 'N/A';

        return {
          locCode: s.summary?.locCode || s.branch?.locCode || 'N/A',
          name: resolvedName,
          cluster: s.summary?.cluster || s.branch?.clusterId?.name || null,
          manager: s.summary?.manager || s.branch?.manager || null,
          staffCount: s.summary?.totalStaffCount || s.staff?.totalUsers || 0,
          monthlyTarget,
          netSales,
          quotaAttainment,
          footfall,
          discrepancies: s.operations?.cameraAudits?.[0]?.discrepancyCount || 0,
          auditScore: s.operations?.branchAudits?.[0]?.auditScore ?? null,
          walkinsCount: walkins,
          googleReviewAvg: s.operations?.googleReviews?.length > 0
            ? (s.operations.googleReviews.reduce((acc, r) => acc + r.rating, 0) / s.operations.googleReviews.length).toFixed(1)
            : null
        };
      })
    },
    employeesSummary: {
      totalCount: totalMergedHeadcount,
      employees: allMergedEmployees
    },
    enterpriseAnalytics: {
      sales: {
        totalRevenue: Math.round(totalNetSales),
        formattedRevenue: totalNetSales > 0 ? `₹${(totalNetSales / 100000).toFixed(2)}L` : 'N/A',
        topBranch: (() => {
          if (stores.length === 0) return null;
          const topStore = stores.reduce((best, s) => {
            const rev = extractStoreNetSales(s);
            return rev > (extractStoreNetSales(best) || 0) ? s : best;
          }, stores[0]);
          return (
            topStore?.summary?.workingBranch?.trim() ||
            topStore?.branch?.workingBranch?.trim() ||
            topStore?.summary?.storeAliases?.[0]?.trim() ||
            null
          );
        })(),
        branches: stores.map(s => {
          const resolvedName = (
            s.summary?.workingBranch?.trim() ||
            s.branch?.workingBranch?.trim() ||
            s.staff?.users?.[0]?.workingBranch?.trim() ||
            s.summary?.storeAliases?.[0]?.trim() ||
            `Store ${s.summary?.locCode || 'Unknown'}`
          );
          const monthlyTarget = extractStoreMonthlyTarget(s);
          const netSales = extractStoreNetSales(s);
          return {
            name: resolvedName,
            revenue: netSales >= 100000 ? `₹${(netSales / 100000).toFixed(2)}L` : `₹${netSales.toLocaleString()}`,
            rawRevenue: netSales,
            target: monthlyTarget >= 100000 ? `₹${(monthlyTarget / 100000).toFixed(2)}L` : `₹${monthlyTarget.toLocaleString()}`,
            rawTarget: monthlyTarget
          };
        })
      },
      finance: {
        totalMonthlyPayroll: totalMergedPayroll,
        formattedPayroll: totalMergedPayroll > 0 ? `₹${(totalMergedPayroll / 100000).toFixed(2)}L` : 'N/A',
        grossRevenue: totalNetSales,
        payrollRatio: enrichedPayrollRatio,
        targetPayrollRatio: null
      },
      operations: {
        activeHeadcount: totalMergedHeadcount,
        totalHeadcount: totalMergedHeadcount,
        totalOvertimeHours: uploadedOvertimeHours.toFixed(1),
        openAuditDiscrepancies: totalDiscrepancies,
        inProgressTasks: inProgressTasksCount
      },
      marketing: {
        totalFootfallAndLeads: totalFootfall,
        customerConversionPct: totalWalkins > 0 && completedTasksCount >= 0 ? `${((completedTasksCount / (totalWalkins || 1)) * 100).toFixed(1)}%` : 'N/A'
      }
    }
  };
}
