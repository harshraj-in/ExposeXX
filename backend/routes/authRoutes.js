import express from 'express';
import { authUser, getUserProfile, registerUser } from '../controllers/authController.js';
import { protect, requireAdmin, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', optionalAuth, registerUser);
router.route('/profile').get(protect, getUserProfile);

export default router;
