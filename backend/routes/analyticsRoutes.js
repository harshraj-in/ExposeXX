import express from 'express';
import { getHeatmapData, getCorruptionIndex, getTrends, getMapInsights } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/heatmap', getHeatmapData);
router.get('/index', getCorruptionIndex);
router.get('/trends', getTrends);
router.get('/insights', getMapInsights);

export default router;
