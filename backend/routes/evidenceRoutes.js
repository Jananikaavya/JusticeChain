import express from 'express';
import { 
  uploadEvidence, 
  getAllEvidence,
  getEvidenceByCase, 
  getEvidenceById, 
  submitAnalysis, 
  markImmutable, 
  getEvidenceChain,
  verifyEvidence
} from './evidenceController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/evidence/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Evidence routes
router.post('/upload', upload.single('file'), uploadEvidence);
router.get('/all', getAllEvidence);
router.get('/case/:caseId', getEvidenceByCase);
router.get('/:evidenceId', getEvidenceById);
router.post('/verify/:evidenceId', verifyEvidence);
router.put('/:evidenceId/analysis', submitAnalysis);
router.put('/:evidenceId/immutable', markImmutable);
router.get('/:evidenceId/chain', getEvidenceChain);

export default router;
