import express from 'express';
import { getAiSuggestion, generateRtiLetter, evaluateDraft, getAiInsights, parseWhatsapp } from '../controllers/aiController.js';
import { protect, adminOrModerator, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/suggest').post(getAiSuggestion);
router.route('/generate-rti').post(optionalAuth, generateRtiLetter);
router.route('/evaluate-draft').post(evaluateDraft);
router.route('/insights').get(protect, adminOrModerator, getAiInsights);
router.route('/parse-whatsapp').post(parseWhatsapp);

export default router;
