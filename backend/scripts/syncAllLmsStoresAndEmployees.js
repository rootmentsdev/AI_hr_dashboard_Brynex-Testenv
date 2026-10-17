import fs from 'fs';
import path from 'path';

const LMS_BASE_URL = (process.env.EXTERNAL_LMS_BASE_URL || 'https://lms.brynexapparels.in').trim().replace(/\/+$/, '');
const LMS_TOKEN = process.env.EXTERNAL_LMS_API_TOKEN || 'RootX-production-9d17d9485eb772e79df8564004d4a4d4';

const STORE_LOC_CODES = [
  { name: 'Z-Edapally1', code: '144' },
  { name: 'Z- Edappal', code: '100' },
  { name: 'Z.Perinthalmanna', code: '133' },
  { name: 'Z.Kottakkal', code: '122' },
  { name: 'G-Trivandrum', code: '700' },
  { name: 'G.Kottayam', code: '701' },
  { name: 'G-Edappally', code: '702' },
  { name: 'G.Perumbavoor', code: '703' },
  { name: 'G.Thrissur', code: '704' },
  { name: 'G.Palakkad', code: '705' },
  { name: 'G.Chavakkad', code: '706' },
  { name: 'G.Edappal', code: '707' },
  { name: 'G.Vadakara', code: '708' },
  { name: 'G.Perinthalmanna', code: '709' },
  { name: 'G.Manjeri', code: '710' },
  { name: 'G.Kottakkal', code: '711' },
  { name: 'G.Calicut', code: '712' },
  { name: 'G.Kannur', code: '716' },
  { name: 'G.Kalpetta', code: '717' },
  { name: 'G.MG Road', code: '718' },
  { name: 'Dappr Squad', code: '555' },
  { name: 'office', code: '102' },
  { name: 'production', code: '101' },
  { name: 'WAREHOUSE', code: '103' },
  { name: 'Test SG Kollam', code: '785' }
];

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function runSync() {
  console.log(`[LMS Ingestion Engine] Starting Full Multi-Store Sync from ${LMS_BASE_URL}`);
  console.log(`[LMS Ingestion Engine] Total Target Stores: ${STORE_LOC_CODES.length}`);

  const storesMap = new Map();
  const employeesMap = new Map();
  const discoveredEmpIds = new Set();
  const storeSyncResults = [];

  // Phase 1: Ingest All Store Overviews
  for (const item of STORE_LOC_CODES) {
    const url = `${LMS_BASE_URL}/api/external/store-overview?locCode=${encodeURIComponent(item.code)}`;
    try {
      process.stdout.write(`Fetching store [${item.code}] ${item.name}... `);
      const res = await fetchWithRetry(url, {
        headers: {
          'Authorization': `Bearer ${LMS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        console.log(`FAILED (HTTP ${res.status})`);
        storeSyncResults.push({ code: item.code, name: item.name, status: `HTTP ${res.status}`, staffCount: 0 });
        continue;
      }

      const json = await res.json();
      if (json.success && json.data) {
        storesMap.set(String(item.code), json.data);

        const users = json.data.staff?.users || [];
        const admins = json.data.staff?.admins || [];
        const targets = json.data.targets || [];

        let empCountForStore = 0;
        users.forEach(u => {
          const empId = u.empID || u.EmpId || u.employeeId;
          if (empId) {
            discoveredEmpIds.add(String(empId).trim());
            empCountForStore++;
          }
        });

        admins.forEach(a => {
          const empId = a.EmpId || a.empID || a.employeeId;
          if (empId) {
            discoveredEmpIds.add(String(empId).trim());
            empCountForStore++;
          }
        });

        targets.forEach(t => {
          (t.employeeTargets || []).forEach(et => {
            if (et.empId) discoveredEmpIds.add(String(et.empId).trim());
          });
        });

        const workingBranch = json.data.summary?.workingBranch || json.data.branch?.workingBranch || item.name;
        const totalStaff = json.data.summary?.totalStaffCount || users.length || 0;
        console.log(`SUCCESS! (${workingBranch} • ${totalStaff} staff, ${users.length} users)`);
        storeSyncResults.push({
          code: item.code,
          name: workingBranch,
          status: 'Synced',
          staffCount: totalStaff,
          usersCount: users.length
        });
      } else {
        console.log(`EMPTY DATA`);
        storeSyncResults.push({ code: item.code, name: item.name, status: 'Empty Data', staffCount: 0 });
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      storeSyncResults.push({ code: item.code, name: item.name, status: `Error: ${err.message}`, staffCount: 0 });
    }
  }

  console.log(`\n========================================`);
  console.log(`[Phase 1 Complete] Synced ${storesMap.size}/${STORE_LOC_CODES.length} stores.`);
  console.log(`[Phase 2 Starting] Discovered ${discoveredEmpIds.size} unique employee IDs across all stores.`);
  console.log(`Fetching 360 Employee Overviews...\n`);

  // Phase 2: Ingest 360 Employee Overviews
  const empIdList = Array.from(discoveredEmpIds);
  let empSuccessCount = 0;
  const CHUNK_SIZE = 6;

  for (let i = 0; i < empIdList.length; i += CHUNK_SIZE) {
    const chunk = empIdList.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (empId) => {
        const empUrl = `${LMS_BASE_URL}/api/external/employee-overview?empId=${encodeURIComponent(empId)}`;
        try {
          const res = await fetchWithRetry(empUrl, {
            headers: {
              'Authorization': `Bearer ${LMS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              employeesMap.set(String(empId).toLowerCase(), json.data);
              empSuccessCount++;
            }
          }
        } catch (err) {
          // Fallback or ignore individual employee error
        }
      })
    );
    process.stdout.write(`\rProgress: ${Math.min(i + CHUNK_SIZE, empIdList.length)}/${empIdList.length} employees synced...`);
  }

  console.log(`\n[Phase 2 Complete] Successfully ingested ${employeesMap.size} complete Employee 360 profiles.`);

  // Phase 3: Persist Cache to Disk for Instant Startup
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const cacheFile = path.join(uploadsDir, 'lms_synced_data.json');
  const cacheData = {
    updatedAt: new Date().toISOString(),
    storeLocCodes: STORE_LOC_CODES.map(s => s.code),
    stores: Array.from(storesMap.entries()),
    employees: Array.from(employeesMap.entries())
  };

  fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf-8');
  console.log(`[LMS Ingestion Engine] Persisted full multi-store data to: ${cacheFile}`);

  console.log(`\n========================================`);
  console.log(`MULTI-STORE & EMPLOYEE SYNC SUMMARY`);
  console.log(`========================================`);
  console.table(storeSyncResults);
  console.log(`Total Stores Synced: ${storesMap.size}`);
  console.log(`Total Employee Profiles Ingested: ${employeesMap.size}`);
  console.log(`========================================\n`);
}

runSync().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
