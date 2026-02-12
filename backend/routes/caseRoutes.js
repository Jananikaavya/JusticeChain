import express from 'express';
import { 
  createCase, 
  getAllCases, 
  getCasesByRole, 
  getCaseById, 
  updateCaseStatus, 
  assignForensic, 
  assignJudge, 
  approveCase 
} from './caseController.js';

const router = express.Router();

// Case routes
router.post('/create', createCase);
router.get('/all', getAllCases);
router.get('/my-cases', getCasesByRole);
router.get('/:caseId', getCaseById);
router.put('/:caseId/status', updateCaseStatus);
router.post('/assign-forensic', assignForensic);
router.post('/assign-judge', assignJudge);
router.put('/:caseId/approve', approveCase);

export default router;
