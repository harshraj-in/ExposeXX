import User from '../models/User.js';

export const awardBadge = async (userId, badgeName) => {
    if (!userId) return;
    try {
        const user = await User.findById(userId);
        if (user && !user.badges.includes(badgeName)) {
            user.badges.push(badgeName);
            await user.save();
        }
    } catch (err) {
        console.error("Badge award error:", err);
    }
};
