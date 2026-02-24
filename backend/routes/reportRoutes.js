import express from 'express';
import multer from 'multer';
import {
  createManualReport,
  uploadReportFile,
  getReportsByCase,
  getReportById,
  updateReport,
  submitReport,
  reviewReport,
  deleteReport
} from './reportController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    // Accept all file types but validate in controller if needed
    cb(null, true);
  }
});

// ===== REPORT ROUTES =====

// Create manual report (POST /api/cases/:caseId/reports/manual)
router.post('/:caseId/reports/manual', createManualReport);

// Upload report file (POST /api/cases/:caseId/reports/upload)
router.post('/:caseId/reports/upload', upload.single('file'), uploadReportFile);

// Get all reports for a case (GET /api/cases/:caseId/reports)
router.get('/:caseId/reports', getReportsByCase);

// Get single report (GET /api/cases/:caseId/reports/:reportId)
router.get('/:caseId/reports/:reportId', getReportById);

// Update report (PUT /api/cases/:caseId/reports/:reportId)
router.put('/:caseId/reports/:reportId', updateReport);

// Submit report (POST /api/cases/:caseId/reports/:reportId/submit)
router.post('/:caseId/reports/:reportId/submit', submitReport);

// Review report (POST /api/cases/:caseId/reports/:reportId/review)
router.post('/:caseId/reports/:reportId/review', reviewReport);

// Delete report (DELETE /api/cases/:caseId/reports/:reportId)
router.delete('/:caseId/reports/:reportId', deleteReport);

export default router;
