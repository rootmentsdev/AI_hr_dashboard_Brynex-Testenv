import fs from 'fs';
import path from 'path';

/**
 * External Integration Service
 * Connects to external retail LMS & Operations APIs:
 * - GET /api/external/employee-overview?empId={id}&email={email}
 * - GET /api/external/store-overview?locCode={locCode}&storeName={storeName}
 *
 * Provides resilient, zero-empty-state live ingestion:
 * - Attempts live HTTP fetch with Bearer token authorization
 * - Gracefully falls back to high-fidelity baseline retail telemetry if external service is offline
 */

export const getExternalBaseUrl = () => {
  return (process.env.EXTERNAL_LMS_BASE_URL || 'https://lms.brynexapparels.in').trim().replace(/\/+$/, '');
};
export const getExternalToken = () => {
  return process.env.EXTERNAL_LMS_API_TOKEN || 'RootX-production-9d17d9485eb772e79df8564004d4a4d4';
};

// Live Ingested External Telemetry (Strictly sourced from LMS API & Disk Cache - Zero Mock/Fallback Data)
/**
 * Fetch Store 360 Overview from External LMS API (with automatic high-fidelity fallback)
 */
export async function fetchStoreOverview({ locCode, storeName, branchId } = {}) {
  // 1. Attempt live HTTP request if external LMS service is reachable
  try {
    const queryParams = new URLSearchParams();
    if (locCode) queryParams.append('locCode', locCode);
    if (storeName) queryParams.append('storeName', storeName);
    if (branchId) queryParams.append('branchId', branchId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout for large live HTTPS telemetry

    const url = `${getExternalBaseUrl()}/api/external/store-overview?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getExternalToken()}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        console.log(`[External LMS API] Successfully fetched live store overview from ${getExternalBaseUrl()}`);
        return { source: 'live_api', data: json.data };
      }
    }
  } catch (err) {
    console.warn(`[External LMS API] Live store fetch failed (${err.message}). Checking synchronized store cache...`);
  }

  // 2. Lookup in Live Synced Cache
  let matched = null;
  const qLoc = locCode ? String(locCode).trim().toLowerCase() : '';
  const qName = storeName ? String(storeName).trim().toLowerCase() : '';

  if (LIVE_STORES_CACHE.size > 0) {
    if (qLoc) {
      matched = Array.from(LIVE_STORES_CACHE.values()).find(s => (s.summary?.locCode || s.branch?.locCode || '').toLowerCase() === qLoc);
    }
    if (!matched && qName) {
      matched = Array.from(LIVE_STORES_CACHE.values()).find(s => 
        (s.summary?.workingBranch || s.branch?.workingBranch || '').toLowerCase().includes(qName) ||
        (s.summary?.storeAliases || []).some(alias => alias.toLowerCase().includes(qName))
      );
    }
  }

  if (matched) {
    return { source: 'live_synced_cache', data: matched };
  }

  throw new Error(`Store with locCode: "${locCode}" or storeName: "${storeName}" not found in external LMS or synchronized cache.`);
}

/**
 * Fetch Employee 360 Overview from External LMS API (with automatic high-fidelity fallback)
 */
export async function fetchEmployeeOverview({ empId, userId, email } = {}) {
  // 1. Attempt live HTTP request if external LMS service is reachable
  try {
    const queryParams = new URLSearchParams();
    if (empId) queryParams.append('empId', empId);
    if (userId) queryParams.append('userId', userId);
    if (email) queryParams.append('email', email);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const url = `${getExternalBaseUrl()}/api/external/employee-overview?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getExternalToken()}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        console.log(`[External LMS API] Successfully fetched live employee overview from ${getExternalBaseUrl()}`);
        return { source: 'live_api', data: json.data };
      }
    }
  } catch (err) {
    console.warn(`[External LMS API] Live employee fetch failed (${err.message}). Checking synchronized employee cache...`);
  }

  // 2. Lookup in Live Synced Cache
  let matched = null;
  const qEmpId = empId ? String(empId).trim().toLowerCase() : '';
  const qEmail = email ? String(email).trim().toLowerCase() : '';

  if (LIVE_EMPLOYEES_CACHE.size > 0) {
    if (qEmpId) {
      matched = Array.from(LIVE_EMPLOYEES_CACHE.values()).find(e => 
        (e.summary?.empId || '').toLowerCase() === qEmpId ||
        (e.summary?.name || '').toLowerCase().includes(qEmpId)
      );
    }
    if (!matched && qEmail) {
      matched = Array.from(LIVE_EMPLOYEES_CACHE.values()).find(e => (e.summary?.email || '').toLowerCase() === qEmail);
    }
  }

  if (matched) {
    return { source: 'live_synced_cache', data: matched };
  }

  throw new Error(`Employee with ID: "${empId}" or email: "${email}" not found in external LMS or synchronized cache.`);
}

// In-Memory Live Ingestion Cache (populated from external LMS API)
const LIVE_STORES_CACHE = new Map();
const LIVE_EMPLOYEES_CACHE = new Map();

const UPLOADS_DIR = fs.existsSync(path.join(process.cwd(), 'uploads'))
  ? path.join(process.cwd(), 'uploads')
  : path.join(process.cwd(), 'backend', 'uploads');
const LMS_CACHE_FILE = path.join(UPLOADS_DIR, 'lms_synced_data.json');
const RENTAL_PERFORMANCE_CACHE_FILE = path.join(UPLOADS_DIR, 'rental_performance_cache.json');
let LIVE_PERFORMANCE_REPORT_CACHE = [];

const persistLmsCache = () => {
  try {
    const data = {
      stores: Array.from(LIVE_STORES_CACHE.entries()),
      employees: Array.from(LIVE_EMPLOYEES_CACHE.entries()),
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(LMS_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[LMS Ingestion] Failed to persist LMS cache to disk:', err.message);
  }
};

const hydratePerformanceCache = () => {
  try {
    if (fs.existsSync(RENTAL_PERFORMANCE_CACHE_FILE)) {
      const raw = fs.readFileSync(RENTAL_PERFORMANCE_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        LIVE_PERFORMANCE_REPORT_CACHE = parsed;
        console.log(`[Rental Ingestion] Hydrated ${parsed.length} staff & store performance records from disk cache.`);
      }
    }
  } catch (err) {
    console.warn('[Rental Ingestion] Failed to hydrate performance cache:', err.message);
  }
};

const hydrateLmsCache = () => {
  try {
    if (fs.existsSync(LMS_CACHE_FILE)) {
      const raw = fs.readFileSync(LMS_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.stores)) {
        parsed.stores.forEach(([k, v]) => LIVE_STORES_CACHE.set(k, v));
      }
      if (Array.isArray(parsed.employees)) {
        parsed.employees.forEach(([k, v]) => LIVE_EMPLOYEES_CACHE.set(k, v));
      }
      console.log(`[LMS Ingestion] Hydrated ${LIVE_STORES_CACHE.size} stores and ${LIVE_EMPLOYEES_CACHE.size} employees from disk cache.`);
    }
  } catch (err) {
    console.warn('[LMS Ingestion] Failed to hydrate LMS cache:', err.message);
  }
};

// Initialize cache hydration on module load
hydratePerformanceCache();
hydrateLmsCache();

/**
 * Sync entire retail store network and associated employee 360 profiles
 * For each store code:
 *  1. Query /api/external/store-overview?locCode={storeCode}
 *  2. Extract all employee IDs (staff.users, staff.admins, targets)
 *  3. Query /api/external/employee-overview?empId={empId} for every employee
 */
export async function syncStoresAndEmployees(storeCodes = []) {
  const codes = (Array.isArray(storeCodes) ? storeCodes : String(storeCodes).split(/[,\s]+/))
    .map(s => String(s).trim())
    .filter(Boolean);

  if (codes.length === 0) {
    throw new Error('Please provide at least one valid store code.');
  }

  const syncedStores = [];
  const discoveredEmpIds = new Set();
  const errors = [];

  console.log(`[LMS Sync] Beginning synchronization for ${codes.length} store codes: ${codes.join(', ')}...`);

  // 1. Fetch store overviews
  for (const code of codes) {
    try {
      console.log(`[LMS Sync] Querying live store overview for storeCode: "${code}"...`);
      const storeRes = await fetchStoreOverview({ locCode: code });
      if (storeRes && storeRes.data) {
        LIVE_STORES_CACHE.set(String(code), storeRes.data);
        syncedStores.push(storeRes.data);

        // Extract employee IDs from users
        const users = storeRes.data.staff?.users || [];
        users.forEach(u => {
          const id = u.empID || u.EmpId || u.employeeId;
          if (id) discoveredEmpIds.add(String(id).trim());
        });

        // Extract employee IDs from admins
        const admins = storeRes.data.staff?.admins || [];
        admins.forEach(a => {
          const id = a.EmpId || a.empID || a.employeeId;
          if (id) discoveredEmpIds.add(String(id).trim());
        });

        // Extract employee IDs from targets
        (storeRes.data.targets || []).forEach(t => {
          (t.employeeTargets || []).forEach(et => {
            if (et.empId) discoveredEmpIds.add(String(et.empId).trim());
          });
        });
      }
    } catch (err) {
      console.warn(`[LMS Sync] Store "${code}" error:`, err.message);
      errors.push({ code, error: err.message });
    }
  }

  console.log(`[LMS Sync] Extracted ${discoveredEmpIds.size} unique employee IDs across ${syncedStores.length} stores. Fetching employee 360 overviews...`);

  // 2. Fetch employee 360 overviews in parallel chunks
  const empIdList = Array.from(discoveredEmpIds);
  const CHUNK_SIZE = 5;
  for (let i = 0; i < empIdList.length; i += CHUNK_SIZE) {
    const chunk = empIdList.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (empId) => {
        try {
          const empRes = await fetchEmployeeOverview({ empId });
          if (empRes && empRes.data) {
            LIVE_EMPLOYEES_CACHE.set(String(empId).toLowerCase(), empRes.data);
          }
        } catch (err) {
          console.warn(`[LMS Sync] Employee "${empId}" error:`, err.message);
        }
      })
    );
  }

  // 3. Persist combined cache to disk
  persistLmsCache();

  return {
    success: true,
    totalStoresSynced: LIVE_STORES_CACHE.size,
    totalEmployeesSynced: LIVE_EMPLOYEES_CACHE.size,
    syncedStoreCodes: codes,
    stores: Array.from(LIVE_STORES_CACHE.values()).map(s => ({
      locCode: s.summary?.locCode || s.branch?.locCode,
      name: s.summary?.workingBranch || s.branch?.workingBranch,
      staffCount: s.summary?.totalStaffCount || s.staff?.totalUsers || 0,
      location: s.summary?.location || s.branch?.location
    })),
    employees: Array.from(LIVE_EMPLOYEES_CACHE.values()).map(e => ({
      empId: e.summary?.empId,
      name: e.summary?.name,
      designation: e.summary?.designation,
      workingBranch: e.summary?.workingBranch
    })),
    errors
  };
}

/**
 * Fetch all integrated stores across retail network
 */
export async function fetchAllStoresOverview() {
  if (LIVE_STORES_CACHE.size > 0) {
    return Array.from(LIVE_STORES_CACHE.values());
  }
  return [];
}

/**
 * Fetch all integrated employee digital profiles
 */
export async function fetchAllEmployeesOverview() {
  if (LIVE_EMPLOYEES_CACHE.size > 0) {
    return Array.from(LIVE_EMPLOYEES_CACHE.values());
  }
  return [];
}

export function getLiveSyncedStatus() {
  return {
    storesCount: LIVE_STORES_CACHE.size,
    employeesCount: LIVE_EMPLOYEES_CACHE.size,
    storeCodes: Array.from(LIVE_STORES_CACHE.keys())
  };
}

/**
 * Fetch Staff & Store Performance Report from Rootments Live Rental API
 * URL: https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel
 */
export async function fetchStaffPerformanceReport({ forceRefresh = false } = {}) {
  if (!forceRefresh && LIVE_PERFORMANCE_REPORT_CACHE.length > 0) {
    return LIVE_PERFORMANCE_REPORT_CACHE;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('https://rentalapi.rootments.live/api/Reports/GetPerformanceStaffReportWithCancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.dataSet && Array.isArray(json.dataSet.data)) {
        LIVE_PERFORMANCE_REPORT_CACHE = json.dataSet.data;
        try {
          fs.writeFileSync(RENTAL_PERFORMANCE_CACHE_FILE, JSON.stringify(json.dataSet.data, null, 2), 'utf-8');
        } catch (e) {
          console.warn('[Rental Ingestion] Could not write cache to disk:', e.message);
        }
        console.log(`[Rental Ingestion] Successfully fetched ${LIVE_PERFORMANCE_REPORT_CACHE.length} records from live API.`);
        return LIVE_PERFORMANCE_REPORT_CACHE;
      }
    }
  } catch (err) {
    console.warn('[Rental Ingestion] Live fetch failed or timed out:', err.message);
  }

  return LIVE_PERFORMANCE_REPORT_CACHE;
}

export function getAllStaffPerformanceRecords() {
  return LIVE_PERFORMANCE_REPORT_CACHE;
}

/**
 * Match Store Achieved Sales & Performance from Report by Store locCode or workingBranch name
 */
export function getStorePerformanceMetrics(locCode, storeName = '') {
  if (!LIVE_PERFORMANCE_REPORT_CACHE || LIVE_PERFORMANCE_REPORT_CACHE.length === 0) {
    return null;
  }
  const cleanCode = String(locCode || '').trim();
  const dsCode = `DS${cleanCode}`.toUpperCase();
  const sgCode = `SG${cleanCode}`.toUpperCase();
  
  const zrMap = {
    '100': 'ZR01',
    '122': 'ZR02',
    '133': 'ZR03',
    '144': 'ZR04'
  };
  const zrCode = (zrMap[cleanCode] || '').toUpperCase();
  const isZorucci = cleanCode === '100' || cleanCode === '122' || cleanCode === '133' || cleanCode === '144' ||
                    String(storeName || '').toUpperCase().startsWith('Z');

  const cleanName = String(storeName || '')
    .toUpperCase()
    .replace(/^[ZG][\s.-]*/i, '')
    .replace(/[0-9]/g, '')
    .trim();

  const matchingRecords = LIVE_PERFORMANCE_REPORT_CACHE.filter(item => {
    const itemCode = String(item.empCode || '').toUpperCase().trim();
    const itemBooking = String(item.bookingBy || '').toUpperCase().trim();

    // 1. Specific Zorucci showroom mappings
    if (cleanCode === '144' && (itemCode === 'ZR04' || itemBooking.includes('ZORUCCI EDAPPALLY'))) return true;
    if (cleanCode === '100' && (itemCode === 'ZR01' || (itemBooking.includes('ZORUCCI EDAPPAL') && !itemBooking.includes('EDAPPALLY')))) return true;
    if (cleanCode === '133' && (itemCode === 'ZR03' || itemBooking.includes('ZORUCCI PERINTHALMANNA'))) return true;
    if (cleanCode === '122' && (itemCode === 'ZR02' || itemBooking.includes('ZORUCCI KOTTAKKAL'))) return true;

    // If this store is a Zorucci store, don't match Suitor Guy branches
    if (isZorucci) return false;

    // 2. Exact branch code match for Suitor Guy (DS700-DS718, SG700-SG718)
    if (dsCode.length > 2 && itemCode === dsCode) return true;
    if (sgCode.length > 2 && itemCode === sgCode) return true;

    // 3. Fallback name matching with town disambiguation
    if (cleanName.length >= 4) {
      if (cleanName === 'EDAPPAL' && itemBooking.includes('EDAPPALLY')) return false;
      if (cleanName === 'EDAPPALLY' && !itemBooking.includes('EDAPPALLY')) return false;
      if (itemBooking.includes('ZORUCCI')) return false;
      if (itemBooking.includes(cleanName) || cleanName.includes(itemBooking)) return true;
    }
    return false;
  });

  if (matchingRecords.length === 0) {
    return null;
  }

  const totalValue = matchingRecords.reduce((sum, r) => sum + (Number(r.totalValue) || 0), 0);
  const createdValue = matchingRecords.reduce((sum, r) => sum + (Number(r.createdValue) || 0), 0);
  const canceledValue = matchingRecords.reduce((sum, r) => sum + (Number(r.canceledValue) || 0), 0);
  const totalBills = matchingRecords.reduce((sum, r) => sum + (Number(r.total_Number_Of_Bill) || 0), 0);
  const canceledBills = matchingRecords.reduce((sum, r) => sum + (Number(r.canceled_Number_Of_Bill) || 0), 0);
  const createdBills = matchingRecords.reduce((sum, r) => sum + (Number(r.created_Number_Of_Bill) || 0), 0);
  const cancellationRate = createdValue > 0 ? ((canceledValue / createdValue) * 100).toFixed(1) + '%' : '0.0%';

  return {
    bookingBy: matchingRecords[0].bookingBy,
    empCode: matchingRecords[0].empCode || zrCode || dsCode,
    totalValue,
    createdValue,
    canceledValue,
    total_Number_Of_Bill: totalBills,
    canceled_Number_Of_Bill: canceledBills,
    created_Number_Of_Bill: createdBills,
    cancellationRate,
    recordsCount: matchingRecords.length,
    matchingRecords
  };
}

/**
 * Match Employee Performance by empId (e.g. Emp84) or Name
 */
export function getEmployeePerformanceMetrics(empId, empName = '') {
  if (!LIVE_PERFORMANCE_REPORT_CACHE || LIVE_PERFORMANCE_REPORT_CACHE.length === 0) {
    return null;
  }
  const eIdClean = String(empId || '').trim().toLowerCase();
  const eNameClean = String(empName || '').trim().toLowerCase();

  const match = LIVE_PERFORMANCE_REPORT_CACHE.find(item => {
    if (item.empCode && item.empCode.trim().toLowerCase() === eIdClean) return true;
    if (eNameClean && item.bookingBy && item.bookingBy.trim().toLowerCase() === eNameClean) return true;
    return false;
  });

  return match || null;
}

