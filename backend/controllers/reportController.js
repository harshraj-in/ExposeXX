import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';
import { encryptPII, decryptPII } from '../utils/encryption.js';
import { awardBadge } from '../utils/badgeHelper.js';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import User from '../models/User.js';
import mongoose from 'mongoose';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const generateReportId = async () => {
    const year = new Date().getFullYear();
    const count = await Report.countDocuments({ reportId: { $regex: `^EX-${year}` } });
    const sequence = String(count + 1).padStart(6, '0');
    return `EX-${year}-${sequence}`;
};

/**
 * Utility: find a report by either MongoDB _id or public reportId string.
 * This lets every route work regardless of which ID format the frontend sends.
 */
const findReport = async (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        const byId = await Report.findById(id);
        if (byId) return byId;
    }
    return Report.findOne({ reportId: id });
};

// @desc    Create new report
// @route   POST /api/reports
export const createReport = async (req, res) => {
    try {
        console.log('[CREATE REPORT] Body keys:', Object.keys(req.body));
        const { category, department, location, description, severity, isAnonymousMode, isHighRisk, isFaceBlurRequested, reporterContact } = req.body;
        
        if (!category || !description || !severity || !location) {
            return res.status(400).json({ success: false, message: 'Missing required fields: category, description, severity, location' });
        }

        const cleanDescription = DOMPurify.sanitize(description);
        const reportId = await generateReportId();

        const evidenceUrls = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                evidenceUrls.push(file.path);
            });
        }

        let parsedLocation = location;
        try {
            parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid location format' });
        }

        const reportData = {
            reportId,
            category,
            department: department || 'General',
            location: parsedLocation,
            description: cleanDescription,
            severity,
            evidenceUrls,
            isAnonymousMode: isAnonymousMode || 'full-anonymous',
            isHighRisk: isHighRisk === 'true' || isHighRisk === true,
            isFaceBlurRequested: isFaceBlurRequested === 'true' || isFaceBlurRequested === true,
            timeline: [{ status: 'Submitted', note: 'Report submitted successfully by citizen.' }]
        };

        if (reportData.isAnonymousMode !== 'full-anonymous' && reporterContact) {
            let parsedContact = reporterContact;
            try {
                if (typeof reporterContact === 'string') {
                    parsedContact = JSON.parse(reporterContact);
                }
                reportData.reporterContact = {
                    name: encryptPII(parsedContact.name),
                    email: encryptPII(parsedContact.email),
                    phone: encryptPII(parsedContact.phone)
                };
            } catch (e) {
                console.warn('[CREATE REPORT] Failed to parse or encrypt reporterContact:', e.message);
            }
        }

        if (req.user) {
            reportData.user = req.user._id;
            await User.findByIdAndUpdate(req.user._id, { $inc: { totalReports: 1 } });
            await awardBadge(req.user._id, 'First Step');
        }

        const report = await Report.create(reportData);

        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            reportId: report.reportId
        });

    } catch (error) {
        console.error('[CREATE REPORT ERROR]', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get Feed (Public)
// @route   GET /api/reports/feed
export const getFeed = async (req, res) => {
    try {
        const { sort = 'recent', category, department } = req.query;
        let query = {};
        
        if (category) query.category = category;
        if (department) query.department = department;

        let mQuery = Report.find(query).select('reportId category department location.state location.district description severity status upvotes comments createdAt evidenceUrls isFaceBlurRequested isFlagged');

        if (sort === 'top') {
            mQuery = mQuery.sort({ upvotes: -1, createdAt: -1 });
        } else if (sort === 'urgent') {
            mQuery = mQuery.sort({ severity: -1, createdAt: -1 });
        } else {
            mQuery = mQuery.sort({ createdAt: -1 });
        }

        const reports = await mQuery.limit(50);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get live pulse ticker
// @route   GET /api/reports/pulse
export const getPulse = async (req, res) => {
    try {
        const pulse = await Report.find({})
            .select('location.state category createdAt -_id')
            .sort({ createdAt: -1 })
            .limit(5);
        res.json(pulse);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get report by ID (public, by reportId string)
// @route   GET /api/reports/:id
export const getReportById = async (req, res) => {
    try {
        const report = await Report.findOne({ reportId: req.params.id }).select('-reporterContact');

        if (report) {
            const lastUpdated = new Date(report.updatedAt).getTime();
            const daysSinceUpdate = (Date.now() - lastUpdated) / (1000 * 3600 * 24);
            if (daysSinceUpdate > 7 && report.status !== 'Closed' && report.status !== 'Resolved') {
                report.isEscalated = true;
                await report.save();
            }
            res.json(report);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Upvote a report
// @route   POST /api/reports/:id/upvote
export const upvoteReport = async (req, res) => {
    try {
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Not found' });
        
        report.upvotes += 1;
        await report.save();
        res.json({ success: true, upvotes: report.upvotes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add verified witness
// @route   POST /api/reports/:id/witness
export const addWitness = async (req, res) => {
    try {
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Not found' });
        
        if (report.witnesses.includes(req.user._id)) {
            return res.status(400).json({ message: 'Already witnessed' });
        }

        report.witnesses.push(req.user._id);
        await awardBadge(req.user._id, 'Witness');

        if (report.witnesses.length >= 3 && report.severity !== 'Critical') {
            report.severity = 'Critical';
            report.timeline.push({
                status: 'Escalated',
                note: 'Automatically escalated to Critical due to multiple verified witnesses.',
                updatedAt: Date.now()
            });
        }

        await report.save();
        res.json({ success: true, witnessesCount: report.witnesses.length, severity: report.severity });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Submit a comment
// @route   POST /api/reports/:id/comment
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const cleanText = DOMPurify.sanitize(text);
        if (!cleanText) return res.status(400).json({ message: 'Valid text required' });

        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Not found' });

        report.comments.push({ text: cleanText, isOfficial: false });
        await report.save();
        res.json({ success: true, comments: report.comments });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Flag a report for abuse
// @route   POST /api/reports/:id/flag
export const flagReport = async (req, res) => {
    try {
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Not found' });

        report.flags += 1;
        if (report.flags >= 5) {
            report.isFlagged = true;
        }
        await report.save();
        res.json({ success: true, message: 'Report flagged.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Rate a closed resolution
// @route   POST /api/reports/:id/rate
export const rateReport = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Not found' });
        if (report.status !== 'Closed' && report.status !== 'Resolved') {
            return res.status(400).json({ message: 'Cannot rate a case that is not finalized' });
        }
        
        report.rating = Number(rating);
        report.ratingFeedback = DOMPurify.sanitize(feedback);
        await report.save();
        res.json({ success: true, message: 'Rating saved.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all reports (Admin)
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find({}).sort({ createdAt: -1 });

        const decryptedReports = reports.map(r => {
            const reportObj = r.toObject();
            if (reportObj.reporterContact && reportObj.reporterContact.name && reportObj.isAnonymousMode === 'verified-anonymous') {
                try {
                    reportObj.reporterContact.name = decryptPII(reportObj.reporterContact.name);
                    reportObj.reporterContact.email = decryptPII(reportObj.reporterContact.email);
                    reportObj.reporterContact.phone = decryptPII(reportObj.reporterContact.phone);
                } catch (e) {
                    console.warn('[getAllReports] PII decrypt failed:', e.message);
                }
            }
            return reportObj;
        });

        res.json(decryptedReports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update Report Status (accepts both _id and reportId)
export const updateReportStatus = async (req, res) => {
    try {
        const { status, note, isFlagged } = req.body;
        const report = await findReport(req.params.id);

        if (!report) return res.status(404).json({ message: 'Report not found' });

        const oldStatus = report.status;
        if (status) report.status = status;
        if (isFlagged !== undefined) report.isFlagged = isFlagged;

        const timelineEntry = {
            status: status || report.status,
            note: note || `Status updated from ${oldStatus} to ${report.status}`,
            updatedBy: req.user._id,
            updatedAt: Date.now()
        };

        report.timeline.push(timelineEntry);
        report.statusHistory.push({ status: report.status, updatedAt: Date.now() });

        // Reward on verified/resolved
        const isFinal = ['Verified', 'Resolved', 'Action Taken'].includes(status);
        if (isFinal && !report.rewardGiven && report.user) {
            report.rewardGiven = true;
            await User.findByIdAndUpdate(report.user, {
                $inc: { rewardBalance: 1000, verifiedReports: 1 }
            });
        }

        const updatedReport = await report.save();
        
        await AuditLog.create({
            action: `Status Update: ${report.status}`,
            performedBy: req.user._id,
            targetReport: report._id,
            details: note
        });

        res.json(updatedReport);
    } catch (error) {
        console.error('[updateReportStatus ERROR]', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Detailed Report for Admin (accepts both _id and reportId)
export const getAdminReportDetails = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DETAILS LOOKUP] ID: ${id}`);

        let report;
        if (mongoose.Types.ObjectId.isValid(id)) {
            report = await Report.findById(id)
                .populate('user', 'name email totalReports')
                .populate('internalNotes.createdBy', 'name role');
        }
        if (!report) {
            report = await Report.findOne({ reportId: id })
                .populate('user', 'name email totalReports')
                .populate('internalNotes.createdBy', 'name role');
        }

        if (!report) {
            console.error(`[DETAILS LOOKUP] Report not found: ${id}`);
            return res.status(404).json({ message: 'Report not found' });
        }

        const reportObj = report.toObject();
        // Decrypt PII for Admin
        if (reportObj.reporterContact && reportObj.reporterContact.name && reportObj.isAnonymousMode === 'verified-anonymous') {
            try {
                reportObj.reporterContact.name = decryptPII(reportObj.reporterContact.name);
                reportObj.reporterContact.email = decryptPII(reportObj.reporterContact.email);
                reportObj.reporterContact.phone = decryptPII(reportObj.reporterContact.phone);
            } catch (decError) {
                console.warn('PII decryption failed:', decError.message);
            }
        }

        res.json(reportObj);
    } catch (error) {
        console.error('[getAdminReportDetails ERROR]', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get messages for a report (accepts both _id and reportId)
export const getReportMessages = async (req, res) => {
    try {
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        
        // Security check: Only the reporter or an admin/moderator can view messages
        const isStaff = ['Admin', 'Moderator', 'NGO'].includes(req.user.role);
        const isReporter = report.user && report.user.toString() === req.user._id.toString();

        if (!isStaff && !isReporter) {
            return res.status(403).json({ message: 'Not authorized to view these messages' });
        }

        res.json({ success: true, messages: report.messages });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add Message to Case (accepts both _id and reportId)
export const addCaseMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });
        
        // Security check: Only the reporter or an admin/moderator can view messages
        const isStaff = ['Admin', 'Moderator', 'NGO'].includes(req.user.role);
        const isReporter = report.user && report.user.toString() === req.user._id.toString();

        if (!isStaff && !isReporter) {
            return res.status(403).json({ message: 'Not authorized to send messages for this case' });
        }

        const role = req.user.role?.toLowerCase();
        const sender = (role === 'admin' || role === 'moderator') ? 'admin' : 'user';

        report.messages.push({
            sender,
            message: DOMPurify.sanitize(message),
            timestamp: Date.now()
        });

        await report.save();
        res.json({ success: true, messages: report.messages });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Add Internal Note (accepts both _id and reportId)
export const addInternalNote = async (req, res) => {
    try {
        const { note } = req.body;
        const report = await findReport(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.internalNotes.push({
            note: DOMPurify.sanitize(note),
            createdBy: req.user._id,
            timestamp: Date.now()
        });

        await report.save();
        res.json({ success: true, notes: report.internalNotes });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get public map data
export const getMapData = async (req, res) => {
    try {
        const { department } = req.query;
        let query = {};
        if (department && department !== 'All') query.department = department;

        const reports = await Report.find(query).select('reportId category department location severity status isEscalated createdAt -_id');
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get reports for the logged in user
// @route   GET /api/reports/my
// @access  Private
export const getReportsByUserId = async (req, res) => {
    try {
        const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ message: 'Server Error loading tracking reports', error: error.message });
    }
};
