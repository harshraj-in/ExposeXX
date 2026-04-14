import SafeMessage from '../models/SafeMessage.js';
import Report from '../models/Report.js';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// @desc    Get safe messages for a report
// @route   GET /api/safe-messages/:reportId
export const getMessages = async (req, res) => {
    try {
        const { reportId } = req.params;
        
        // Find the associated report to check ownership
        const report = await Report.findOne({ reportId });
        if (!report) return res.status(404).json({ message: 'Associated report not found' });

        // Security check: Only the reporter or staff can view messages
        const isStaff = ['Admin', 'Moderator', 'NGO'].includes(req.user.role);
        const isReporter = report.user && report.user.toString() === req.user._id.toString();

        if (!isStaff && !isReporter) {
            return res.status(403).json({ message: 'Not authorized to view these messages' });
        }

        const messages = await SafeMessage.find({ reportId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Post safe message
// @route   POST /api/safe-messages/:reportId
export const postMessage = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { message } = req.body;

        // Find the associated report to check ownership
        const report = await Report.findOne({ reportId });
        if (!report) return res.status(404).json({ message: 'Associated report not found' });

        // Security check: Only the reporter or staff can send messages
        const isStaff = ['Admin', 'Moderator', 'NGO'].includes(req.user.role);
        const isReporter = report.user && report.user.toString() === req.user._id.toString();

        if (!isStaff && !isReporter) {
            return res.status(403).json({ message: 'Not authorized, you do not own this report' });
        }
        
        const cleanMessage = DOMPurify.sanitize(message);
        if (!cleanMessage) return res.status(400).json({ message: 'Valid message required' });

        const role = isStaff ? 'moderator' : 'citizen';

        const safeMessage = await SafeMessage.create({
            reportId,
            message: cleanMessage,
            senderRole: role
        });

        res.status(201).json(safeMessage);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
