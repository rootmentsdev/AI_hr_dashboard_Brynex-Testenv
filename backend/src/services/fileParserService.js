import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import csvParser from 'csv-parser';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const pdfParse = require('pdf-parse');

export const parseUploadedFile = async (filePath, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.csv') {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawMatrix || rawMatrix.length === 0) return [];

    // 1. Detect if sheet is a calendar/matrix attendance roster (e.g. Row 1-3: Month/Title, Row with staff/employee name and day columns)
    const matrixHeaderRowIdx = rawMatrix.findIndex(
      (r) => Array.isArray(r) && r.some((c) => /staff\s*name|employee\s*name|emp\s*name|^staff$|^employee$/i.test(String(c).trim()))
    );

    if (matrixHeaderRowIdx !== -1) {
      const headerRow = rawMatrix[matrixHeaderRowIdx];
      const nameColIdx = headerRow.findIndex((c) => /staff\s*name|employee\s*name|emp\s*name|^staff$|^employee$/i.test(String(c).trim()));
      const extractedRows = [];

      for (let i = matrixHeaderRowIdx + 1; i < rawMatrix.length; i++) {
        const row = rawMatrix[i];
        if (!row || !row[nameColIdx] || String(row[nameColIdx]).trim() === '') continue;
        const staffName = String(row[nameColIdx]).trim();
        if (/total|sum|average|day|sat|sun|mon|tue|wed|thr|fri/i.test(staffName)) continue;

        let present = 0;
        let absent = 0;
        for (let j = 0; j < row.length; j++) {
          if (j === nameColIdx) continue;
          const mark = String(row[j] || '').toUpperCase().trim();
          if (mark === 'P' || mark === 'PRESENT' || mark === '1') present++;
          else if (mark === 'A' || mark === 'ABSENT' || mark === '0') absent++;
        }

        const totalMarked = present + absent;
        const attendancePct = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : 100;

        extractedRows.push({
          id: `EMP-${1000 + extractedRows.length + 1}`,
          name: staffName,
          department: null,
          presentDays: present,
          absentDays: absent,
          attendance: `${attendancePct}%`,
          status: attendancePct < 60 ? 'Exited' : 'Active'
        });
      }

      if (extractedRows.length > 0) {
        return extractedRows;
      }
    }

    // 2. Adaptive standard table header locator (skips metadata/empty rows above true columns)
    let bestHeaderIdx = 0;
    let maxRecognizedHeaders = 0;
    for (let r = 0; r < Math.min(rawMatrix.length, 10); r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row)) continue;
      const count = row.filter((cell) =>
        /name|id|code|dept|department|team|role|title|salary|pay|wage|attend|status|date|cost|rate/i.test(String(cell))
      ).length;
      if (count > maxRecognizedHeaders) {
        maxRecognizedHeaders = count;
        bestHeaderIdx = r;
      }
    }

    if (maxRecognizedHeaders >= 2 && bestHeaderIdx > 0) {
      const headers = rawMatrix[bestHeaderIdx].map((h, i) => String(h || `col_${i}`).trim());
      const records = [];
      for (let r = bestHeaderIdx + 1; r < rawMatrix.length; r++) {
        const row = rawMatrix[r];
        if (!row || row.every((c) => c === '' || c === null || c === undefined)) continue;
        const obj = {};
        headers.forEach((h, i) => {
          if (h) obj[h] = row[i] !== undefined ? row[i] : '';
        });
        records.push(obj);
      }
      return records;
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return data;
  }

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const lines = pdfData.text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    // Parse simple tabular lines or structured text from PDF
    const records = [];
    let headers = [];
    lines.forEach((line, idx) => {
      const parts = line.split(/\s{2,}|\t|,/);
      if (idx === 0) {
        headers = parts.length > 1 ? parts : ['line', 'content'];
      } else {
        const row = {};
        if (headers.length > 1 && parts.length === headers.length) {
          headers.forEach((h, i) => {
            row[h] = parts[i];
          });
        } else {
          row['Record'] = `Item ${idx}`;
          row['Content'] = line;
        }
        records.push(row);
      }
    });
    return records.length > 0 ? records : [{ Content: pdfData.text.slice(0, 500) }];
  }

  // Fallback text/json
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const json = JSON.parse(raw);
    return Array.isArray(json) ? json : [json];
  } catch {
    return raw.split('\n').map((l, idx) => ({ id: idx + 1, text: l }));
  }
};
