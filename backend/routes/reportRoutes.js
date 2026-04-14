import express from 'express';
import { 
    createReport, 
    getReportById, 
    getAllReports, 
    updateReportStatus, 
    getMapData,
    getFeed,
    getPulse,
    upvoteReport,
    addWitness,
    addComment,
    flagReport,
    rateReport,
    getReportsByUserId,
    getAdminReportDetails,
    getReportMessages,
    addCaseMessage,
    addInternalNote
} from '../controllers/reportController.js';
import { protect, adminOrModerator, optionalAuth } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ─── STATIC NAMED ROUTES (must come BEFORE /:id) ──────────────────────────
router.route('/map-data').get(getMapData);
router.route('/pulse').get(getPulse);
router.route('/feed').get(getFeed);
router.route('/my').get(protect, getReportsByUserId);

// ─── ROOT ROUTE ─────────────────────────────────────────────────────────────
// POST: Create report (allows anonymous)
router.route('/').post(
    optionalAuth,
    upload.array('evidence', 5),
    createReport
);
// GET: Admin list all reports (protected)
router.route('/').get(protect, adminOrModerator, getAllReports);

// ─── DYNAMIC :id SUB-ROUTES ──────────────────────────────────────────────────
// Admin investigation detail (protected)
router.route('/:id/details').get(protect, adminOrModerator, getAdminReportDetails);
// Admin status update (uses reportId string)
router.route('/:id/status').patch(protect, adminOrModerator, updateReportStatus);
// Add internal note (admin, uses reportId string)
router.route('/:id/notes').post(protect, adminOrModerator, addInternalNote);
// Case messages — GET to read, POST to send (authenticated citizen or admin)
router.route('/:id/messages').get(protect, getReportMessages).post(protect, addCaseMessage);

// Public social interactions
router.route('/:id/upvote').post(upvoteReport);
router.route('/:id/witness').post(protect, addWitness);
router.route('/:id/comment').post(addComment);
router.route('/:id/flag').post(flagReport);
router.route('/:id/rate').post(rateReport);

// Public report lookup by reportId string
router.route('/:id').get(getReportById);

export default router;
