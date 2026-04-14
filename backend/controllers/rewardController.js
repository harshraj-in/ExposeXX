import User from '../models/User.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';

// @desc    Get current user rewards & stats
// @route   GET /api/rewards
// @access  Private
export const getUserRewards = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('totalReports verifiedReports rewardBalance badges');
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving rewards', error: error.message });
    }
};

// @desc    Create Withdrawal Request
// @route   POST /api/rewards/withdraw
// @access  Private
export const createWithdrawalRequest = async (req, res) => {
    try {
        const { amount, method, upiId, bankDetails } = req.body;

        const user = await User.findById(req.user._id);

        if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than zero' });
        if (amount > user.rewardBalance) return res.status(400).json({ message: 'Insufficient balance' });

        // Limit checks could go here (e.g. 1 per week)
        const recentRequest = await WithdrawalRequest.findOne({
            userId: user._id, 
            createdAt: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        if (recentRequest) {
            return res.status(400).json({ message: 'Withdrawal limit reached. Only 1 request allowed per week.' });
        }

        const withdrawal = await WithdrawalRequest.create({
            userId: user._id,
            amount,
            method,
            upiId: method === 'UPI' ? upiId : undefined,
            bankDetails: method === 'BANK' ? bankDetails : undefined,
            status: 'pending'
        });

        // Deduct balance instantly to prevent dual spending (if rejected, we can refund later)
        user.rewardBalance -= amount;
        await user.save();

        res.status(201).json({ success: true, withdrawal, message: 'Withdrawal request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error submitting withdrawal', error: error.message });
    }
};

// @desc    Get My Withdrawal Statuses
// @route   GET /api/rewards/withdraw
// @access  Private
export const getWithdrawalStatus = async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ message: 'Server error loading withdrawals', error: error.message });
    }
};

// @desc    Admin Approve/Reject Withdrawal
// @route   PUT /api/rewards/withdraw/:id
// @access  Private/Admin
export const updateWithdrawalStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await WithdrawalRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        request.status = status;
        await request.save();

        // If rejected, refund the user
        if (status === 'rejected') {
            const user = await User.findById(request.userId);
            if (user) {
                user.rewardBalance += request.amount;
                await user.save();
            }
        }

        res.json({ success: true, request });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating status', error: error.message });
    }
};

// @desc    Get All Withdrawals (Admin)
// @route   GET /api/rewards/admin/withdrawals
// @access  Private/Admin
export const getAllWithdrawals = async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ message: 'Server error loading withdrawals', error: error.message });
    }
};
