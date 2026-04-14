import cron from 'node-cron';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';

// Run every day at 8 AM ('0 8 * * *')
export const startCronJobs = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log("Running Daily Resolution Reminder Cron Job");
        
        try {
            // Find reports submitted more than 15 days ago that are NOT closed or resolved
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            const staleReports = await Report.find({
                status: { $nin: ['Resolved', 'Closed'] },
                createdAt: { $lte: fifteenDaysAgo }
            });

            if (staleReports.length > 0) {
                const admins = await User.find({ role: { $in: ['Admin', 'Moderator'] } });
                const adminEmails = admins.map(u => u.email).join(',');

                if (adminEmails) {
                    const html = `
                        <h2>CorruptionWatch Alerts</h2>
                        <p>You have <strong>${staleReports.length}</strong> incidents that have been pending resolution for over 15 days.</p>
                        <p>Timely resolutions build public trust. Please log in to the moderation queue and investigate these stale cases.</p>
                        <a href="http://localhost:5173/admin/dashboard">Go to Dashboard</a>
                    `;

                    await sendEmail({
                        to: adminEmails,
                        subject: 'Action Required: Several Incidents Pending Resolution',
                        html
                    });
                }
            }
        } catch (error) {
            console.error("Cron Job Error:", error);
        }
    });
};
