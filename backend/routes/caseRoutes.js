import express from 'express';
import { 
  createCase, 
  getAllCases, 
  getCasesByRole, 
  getCaseById, 
  updateCaseStatus, 
  assignForensic, 
  assignJudge, 
  approveCase,
  submitVerdict,
  scheduleHearing,
  getHearings
} from './caseController.js';
import {
  addInvestigationNote,
  getInvestigationNotes,
  updateInvestigationNote,
  addSuspect,
  getSuspects,
  updateSuspectStatus,
  addWitness,
  getWitnesses,
  updateWitnessReliability,
  getActivityLogs,
  getUserActivityLogs
} from './investigationController.js';

const router = express.Router();

// Case routes
router.post('/create', createCase);
router.get('/all', getAllCases);
router.get('/my-cases', getCasesByRole);
router.get('/:caseId', getCaseById);
router.put('/:caseId/status', updateCaseStatus);
router.put('/:caseId/verdict', submitVerdict);
router.post('/:caseId/hearings', scheduleHearing);
router.get('/:caseId/hearings', getHearings);
router.post('/assign-forensic', assignForensic);
router.post('/assign-judge', assignJudge);
router.put('/:caseId/approve', approveCase);

// Investigation Notes routes
router.post('/:caseId/investigation-notes', addInvestigationNote);
router.get('/:caseId/investigation-notes', getInvestigationNotes);
router.put('/:caseId/investigation-notes/:noteId', updateInvestigationNote);

// Suspects routes
router.post('/:caseId/suspects', addSuspect);
router.get('/:caseId/suspects', getSuspects);
router.put('/:caseId/suspects/:suspectId', updateSuspectStatus);

// Witnesses routes
router.post('/:caseId/witnesses', addWitness);
router.get('/:caseId/witnesses', getWitnesses);
router.put('/:caseId/witnesses/:witnessId', updateWitnessReliability);

// Activity Logs routes
router.get('/:caseId/activity-logs', getActivityLogs);
router.get('/logs/user/activity', getUserActivityLogs);

export default router;
