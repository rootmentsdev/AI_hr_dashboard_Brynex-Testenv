import path from 'path';
import fs from 'fs';
import { parseUploadedFile } from '../services/fileParserService.js';
import { analyzeHrData } from '../services/hrIntelligenceService.js';
import { analyzeMultiFileHrData, identifyFileScope } from '../services/multiFileCorrelatorService.js';

// In-memory data store with initial sample data (matching screenshots)
let uploadedFilesStore = [
  {
    id: 'f1',
    name: 'employee.csv',
    originalName: 'employee.csv',
    holds: 'People, roles, teams, salaries, join dates',
    rows: 32,
    period: 'Current',
    status: 'All rows valid',
    uploadedAt: new Date().toISOString(),
    parsedRows: Array.from({ length: 32 }, (_, i) => ({
      id: `EMP-${1000 + i + 1}`,
      name: `Employee ${i + 1}`,
      department: i % 4 === 0 ? 'Sales' : i % 4 === 1 ? 'Retail' : i % 4 === 2 ? 'Operations' : 'Engineering',
      role: i % 4 === 0 ? 'Account Executive' : i % 4 === 1 ? 'Store Specialist' : i % 4 === 2 ? 'Coordinator' : 'Developer',
      status: i < 3 ? 'Exited' : 'Active',
      salary: `$${50000 + (i * 1200)}`,
      attendance: `${85 + (i % 14)}%`,
      joinDate: '2024-03-15'
    }))
  }
];

// Current active AI intelligence dashboard state
let latestAnalysis = null;

// Initialize default analysis based on initial file
const initAnalysis = async () => {
  if (uploadedFilesStore.length > 0) {
    latestAnalysis = await analyzeMultiFileHrData({
      files: uploadedFilesStore
    });
  }
};
initAnalysis();

export const uploadHrFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const { filename, originalname, path: filePath, size } = req.file;
    const adminPrompt = req.body.adminPrompt || '';
    let customRules = null;
    if (req.body.customRules) {
      try {
        customRules = typeof req.body.customRules === 'string' ? JSON.parse(req.body.customRules) : req.body.customRules;
      } catch (err) {
        console.warn('Invalid custom rules format, falling back to default:', err.message);
      }
    }

    // 1. Parse file content into tabular rows (CSV, XLSX, XLS, PDF)
    const parsedRows = await parseUploadedFile(filePath, originalname);

    // 2. Identify the file's primary scope (Attendance, Payroll, Employee records, etc.)
    const detectedHolds = identifyFileScope(originalname, parsedRows);

    // 3. Save to uploaded records store
    const newFileRecord = {
      id: `f_${Date.now()}`,
      name: originalname,
      savedFilename: filename,
      downloadUrl: `/api/hr/files/${filename}/download`,
      holds: detectedHolds,
      rows: parsedRows.length,
      period: 'Current',
      status: 'All rows valid',
      uploadedAt: new Date().toISOString(),
      parsedRows: parsedRows.slice(0, 500) // preserve preview records
    };

    uploadedFilesStore.unshift(newFileRecord);

    // 4. Perform Multi-File Correlated AI Analysis across all connected datasets
    const combinedAnalysis = await analyzeMultiFileHrData({
      files: uploadedFilesStore,
      customRules,
      adminPrompt
    });

    latestAnalysis = combinedAnalysis;

    return res.json({
      status: 'success',
      message: `File "${originalname}" analyzed and cross-correlated across ${uploadedFilesStore.length} datasets.`,
      file: newFileRecord,
      analysis: combinedAnalysis
    });
  } catch (error) {
    console.error('File upload & analysis error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error processing file.'
    });
  }
};

export const getUploadedFiles = (req, res) => {
  res.json({
    status: 'success',
    files: uploadedFilesStore.map((f) => ({
      id: f.id,
      name: f.name,
      holds: f.holds,
      rows: f.rows,
      period: f.period,
      status: f.status,
      savedFilename: f.savedFilename,
      downloadUrl: f.savedFilename ? `/api/hr/files/${f.savedFilename}/download` : null,
      uploadedAt: f.uploadedAt
    }))
  });
};

export const getFilePreview = (req, res) => {
  const { id } = req.params;
  const file = uploadedFilesStore.find((f) => f.id === id || f.savedFilename === id);
  if (!file) {
    return res.status(404).json({ status: 'error', message: 'File not found.' });
  }

  res.json({
    status: 'success',
    file: {
      id: file.id,
      name: file.name,
      holds: file.holds,
      rowsCount: file.rows,
      columns: file.parsedRows.length > 0 ? Object.keys(file.parsedRows[0]) : [],
      data: file.parsedRows,
      downloadUrl: file.savedFilename ? `/api/hr/files/${file.savedFilename}/download` : null
    }
  });
};

export const downloadRawFile = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', filename);

  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  }

  // If in-memory mock or not found on disk, create on-the-fly CSV download
  const file = uploadedFilesStore.find((f) => f.savedFilename === filename || f.name === filename);
  if (file && file.parsedRows && file.parsedRows.length > 0) {
    const keys = Object.keys(file.parsedRows[0]);
    const csvContent = [
      keys.join(','),
      ...file.parsedRows.map((r) => keys.map((k) => `"${r[k] || ''}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name || 'export.csv'}"`);
    return res.send(csvContent);
  }

  return res.status(404).json({ status: 'error', message: 'File does not exist on server.' });
};

export const deleteHrFile = async (req, res) => {
  try {
    const { id } = req.params;
    const fileIndex = uploadedFilesStore.findIndex((f) => f.id === id || f.savedFilename === id);
    if (fileIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'File not found.' });
    }

    const removedFile = uploadedFilesStore[fileIndex];

    // Delete file from disk if saved
    if (removedFile.savedFilename) {
      const filePath = path.join(process.cwd(), 'uploads', removedFile.savedFilename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn('Could not remove file from disk:', err.message);
        }
      }
    }

    uploadedFilesStore.splice(fileIndex, 1);

    // Re-run correlation over remaining files
    if (uploadedFilesStore.length > 0) {
      latestAnalysis = await analyzeMultiFileHrData({
        files: uploadedFilesStore
      });
    } else {
      latestAnalysis = null;
    }

    res.json({
      status: 'success',
      message: `File "${removedFile.name}" deleted successfully.`,
      remainingFilesCount: uploadedFilesStore.length,
      analysis: latestAnalysis
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const getLatestHrAnalysis = (req, res) => {
  res.json({
    status: 'success',
    data: latestAnalysis
  });
};

export const runCustomAiAnalysis = async (req, res) => {
  try {
    const { adminPrompt, customRules } = req.body;

    const analysis = await analyzeMultiFileHrData({
      files: uploadedFilesStore,
      customRules,
      adminPrompt
    });

    latestAnalysis = analysis;

    res.json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
