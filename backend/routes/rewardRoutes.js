import express from 'express';
import { 
    getUserRewards, 
    createWithdrawalRequest, 
    getWithdrawalStatus, 
    updateWithdrawalStatus, 
    getAllWithdrawals 
} from '../controllers/rewardController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getUserRewards);

router.route('/withdraw')
    .post(protect, createWithdrawalRequest)
    .get(protect, getWithdrawalStatus);

// Admin Routes
router.route('/admin/withdrawals')
    .get(protect, requireAdmin, getAllWithdrawals);

router.route('/withdraw/:id')
    .put(protect, requireAdmin, updateWithdrawalStatus);

export default router;
