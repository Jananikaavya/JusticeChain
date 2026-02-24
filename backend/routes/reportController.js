import express from 'express';
import Report from '../models/Report.js';
import Case from '../models/Case.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Helper to log activity
const logActivity = async (userId, userRole, action, caseId, resourceId = null, description = null, metadata = null) => {
  try {
    const logId = `LOG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    await ActivityLog.create({
      logId,
      performedBy: userId,
      performedByRole: userRole,
      action,
      relatedCaseId: caseId,
      relatedResourceId: resourceId,
      description,
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// ===== CREATE MANUAL REPORT =====
export const createManualReport = async (req, res) => {
  try {
    const { caseId } = req.params;
    const {
      title,
      description,
      observations,
      analysis,
      conclusion,
      findings,
      recommendations,
      priority,
      tags,
      relatedEvidence
    } = req.body;

    let userId = req.user.userId || req.user.id;
    if (!userId) { userId = 'SYSTEM_ADMIN'; }

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Verify user is FORENSIC role
    const user = await User.findById(userId);
    if (!user || user.role !== 'FORENSIC') {
      return res.status(403).json({ message: 'Only forensic officers can create reports' });
    }

    const reportId = `RPT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newReport = new Report({
      reportId,
      caseId,
      createdBy: userId,
      reportType: 'MANUAL',
      title: title || `Forensic Report - ${new Date().toLocaleDateString()}`,
      description,
      observations,
      analysis,
      conclusion,
      findings: findings || [],
      recommendations: recommendations || [],
      priority: priority || 'MEDIUM',
      tags: tags || [],
      relatedEvidence: relatedEvidence || [],
      status: 'DRAFT'
    });

    await newReport.save();

    // Log activity
    await logActivity(
      userId,
      user.role,
      'CREATE_REPORT',
      caseId.toString(),
      reportId,
      `Created manual forensic report: ${title}`,
      { reportType: 'MANUAL' }
    );

    return res.status(201).json({
      message: 'Manual report created successfully',
      report: newReport
    });
  } catch (error) {
    console.error('Error creating manual report:', error);
    return res.status(500).json({
      message: 'Failed to create manual report',
      error: error.message
    });
  }
};

// ===== UPLOAD REPORT FILE =====
export const uploadReportFile = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { title, description, priority, tags, relatedEvidence } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    let userId = req.user.userId || req.user.id;
    if (!userId) { userId = 'SYSTEM_ADMIN'; }

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Verify user is FORENSIC role
    const user = await User.findById(userId);
    if (!user || user.role !== 'FORENSIC') {
      return res.status(403).json({ message: 'Only forensic officers can upload reports' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    // Calculate SHA-256 hash of file
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Upload to IPFS via Pinata
    let ipfsHash = null;
    let pinataUrl = null;

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (pinataApiKey && pinataSecretKey) {
      try {
        const formData = new FormData();
        formData.append('file', fileBuffer, {
          filename: fileName,
          contentType: mimeType
        });

        const response = await axios.post(
          'https://api.pinata.cloud/pinning/pinFileToIPFS',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'pinata_api_key': pinataApiKey,
              'pinata_secret_api_key': pinataSecretKey
            }
          }
        );

        ipfsHash = response.data.IpfsHash;
        const gateway = process.env.PINATA_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
        pinataUrl = `${gateway}${ipfsHash}`;
      } catch (pinataError) {
        console.warn('Pinata upload failed, continuing without IPFS:', pinataError.message);
      }
    }

    const reportId = `RPT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newReport = new Report({
      reportId,
      caseId,
      createdBy: userId,
      reportType: 'UPLOADED',
      title: title || fileName,
      description,
      fileName,
      fileSize,
      mimeType,
      ipfsHash,
      pinataUrl,
      sha256Hash,
      priority: priority || 'MEDIUM',
      tags: tags || [],
      relatedEvidence: relatedEvidence || [],
      status: 'DRAFT'
    });

    await newReport.save();

    // Log activity
    await logActivity(
      userId,
      user.role,
      'UPLOAD_REPORT',
      caseId.toString(),
      reportId,
      `Uploaded report file: ${fileName}`,
      {
        reportType: 'UPLOADED',
        fileName,
        fileSize,
        ipfsHash,
        sha256Hash
      }
    );

    return res.status(201).json({
      message: 'Report file uploaded successfully',
      report: newReport,
      ipfsHash,
      pinataUrl
    });
  } catch (error) {
    console.error('Error uploading report file:', error);
    return res.status(500).json({
      message: 'Failed to upload report file',
      error: error.message
    });
  }
};

// ===== GET ALL REPORTS FOR A CASE =====
export const getReportsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status, reportType } = req.query;

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const query = { caseId };

    if (status) {
      query.status = status;
    }
    if (reportType) {
      query.reportType = reportType;
    }

    const reports = await Report.find(query)
      .populate('createdBy', 'username email roleId')
      .populate('reviewedBy', 'username email roleId')
      .populate('relatedEvidence', 'title ipfsHash')
      .sort({ createdAt: -1 });

    return res.json({
      message: 'Reports retrieved successfully',
      count: reports.length,
      reports
    });
  } catch (error) {
    console.error('Error retrieving reports:', error);
    return res.status(500).json({
      message: 'Failed to retrieve reports',
      error: error.message
    });
  }
};

// ===== GET SINGLE REPORT =====
export const getReportById = async (req, res) => {
  try {
    const { caseId, reportId } = req.params;

    const report = await Report.findById(reportId)
      .populate('caseId', 'caseId caseNumber title')
      .populate('createdBy', 'username email roleId')
      .populate('reviewedBy', 'username email roleId')
      .populate('relatedEvidence', 'title type ipfsHash');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify report belongs to case
    if (report.caseId._id.toString() !== caseId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    return res.json({
      message: 'Report retrieved successfully',
      report
    });
  } catch (error) {
    console.error('Error retrieving report:', error);
    return res.status(500).json({
      message: 'Failed to retrieve report',
      error: error.message
    });
  }
};

// ===== UPDATE REPORT (before submission) =====
export const updateReport = async (req, res) => {
  try {
    const { caseId, reportId } = req.params;
    const updates = req.body;

    let userId = req.user.userId || req.user.id;
    if (!userId) { userId = 'SYSTEM_ADMIN'; }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify report belongs to case
    if (report.caseId.toString() !== caseId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only creator can edit draft reports
    if (report.createdBy.toString() !== userId && userId !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Only the report creator can edit this report' });
    }

    // Cannot edit submitted reports
    if (report.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Cannot edit submitted reports' });
    }

    // Update allowed fields
    const allowedFields = [
      'title',
      'description',
      'observations',
      'analysis',
      'conclusion',
      'findings',
      'recommendations',
      'priority',
      'tags',
      'relatedEvidence'
    ];

    allowedFields.forEach(field => {
      if (field in updates) {
        report[field] = updates[field];
      }
    });

    report.updatedAt = new Date();
    await report.save();

    // Log activity
    const user = await User.findById(userId);
    await logActivity(
      userId,
      user?.role || 'FORENSIC',
      'UPDATE_REPORT',
      caseId,
      reportId,
      'Updated report content',
      { reportType: report.reportType }
    );

    return res.json({
      message: 'Report updated successfully',
      report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return res.status(500).json({
      message: 'Failed to update report',
      error: error.message
    });
  }
};

// ===== SUBMIT REPORT (Draft -> Submitted) =====
export const submitReport = async (req, res) => {
  try {
    const { caseId, reportId } = req.params;

    let userId = req.user.userId || req.user.id;
    if (!userId) { userId = 'SYSTEM_ADMIN'; }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify report belongs to case
    if (report.caseId.toString() !== caseId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only creator can submit
    if (report.createdBy.toString() !== userId && userId !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Only the report creator can submit' });
    }

    // Cannot submit already submitted reports
    if (report.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Report already submitted' });
    }

    report.status = 'SUBMITTED';
    report.submittedAt = new Date();
    await report.save();

    // Log activity
    const user = await User.findById(userId);
    await logActivity(
      userId,
      user?.role || 'FORENSIC',
      'SUBMIT_REPORT',
      caseId,
      reportId,
      'Submitted forensic report for review',
      { reportType: report.reportType }
    );

    return res.json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return res.status(500).json({
      message: 'Failed to submit report',
      error: error.message
    });
  }
};

// ===== REVIEW REPORT (Admin/Judge only) =====
export const reviewReport = async (req, res) => {
  try {
    const { caseId, reportId } = req.params;
    const { status, reviewNotes } = req.body;

    let userId = req.user.userId || req.user.id;
    if (!userId) { userId = 'SYSTEM_ADMIN'; }

    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return res.status(400).json({ message: 'Invalid review status' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify report belongs to case
    if (report.caseId.toString() !== caseId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify user is admin/judge/forensic supervisor
    const user = await User.findById(userId);
    if (!user || !['ADMIN', 'JUDGE', 'FORENSIC'].includes(user.role)) {
      return res.status(403).json({ message: 'Only admins, judges, or forensic supervisors can review reports' });
    }

    report.status = status;
    report.reviewedBy = userId;
    report.reviewNotes = reviewNotes || '';
    report.reviewedAt = new Date();
    await report.save();

    // Log activity
    await logActivity(
      userId,
      user.role,
      'REVIEW_REPORT',
      caseId,
      reportId,
      `Report review: ${status}`,
      { status, hasNotes: !!reviewNotes }
    );

    return res.json({
      message: 'Report reviewed successfully',
      report
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    return res.status(500).json({
      message: 'Failed to review report',
      error: error.message
    });
  }
};

// ===== DELETE REPORT (Draft only) =====
export const deleteReport = async (req, res) => {
  try {
    const { caseId, reportId } = req.params;

    let userId = req.user.userId || req.user.id;
    if (!userId) { userId = 'SYSTEM_ADMIN'; }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify report belongs to case
    if (report.caseId.toString() !== caseId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only creator can delete draft reports
    if (report.createdBy.toString() !== userId && userId !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ message: 'Only the report creator can delete draft reports' });
    }

    // Cannot delete submitted reports
    if (report.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Cannot delete submitted reports' });
    }

    await Report.deleteOne({ _id: reportId });

    // Log activity
    const user = await User.findById(userId);
    await logActivity(
      userId,
      user?.role || 'FORENSIC',
      'DELETE_REPORT',
      caseId,
      reportId,
      'Deleted draft report',
      { reportType: report.reportType }
    );

    return res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return res.status(500).json({
      message: 'Failed to delete report',
      error: error.message
    });
  }
};

export default router;
