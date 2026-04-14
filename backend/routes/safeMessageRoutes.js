import express from 'express';
import { getMessages, postMessage } from '../controllers/safeMessageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:reportId')
    .get(protect, getMessages)
    .post(protect, postMessage);

export default router;
