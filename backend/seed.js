import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Report from './models/Report.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/corruptionwatch', {});

const seedData = async () => {
    try {
        await User.deleteMany();
        await Report.deleteMany();

        await User.create({
            name: 'Super Admin',
            email: 'admin@corruptionwatch.gov',
            password: 'password123',
            role: 'Admin'
        });

        const sampleReports = [
            {
                reportId: 'CW-2024-000001',
                category: 'Bribery',
                location: { state: 'Maharashtra', district: 'Mumbai', pincode: '400001' },
                description: 'Traffic police demanded 500 Rs for not wearing a helmet near Andheri station.',
                severity: 'Low',
                status: 'Resolved',
                isAnonymous: true,
                evidenceUrls: [],
                aiSuggestion: null,
                timeline: [{ status: 'Submitted', note: 'Created' }, { status: 'Resolved', note: 'Officer suspended.' }]
            },
            {
                reportId: 'CW-2024-000002',
                category: 'Land Fraud',
                location: { state: 'Karnataka', district: 'Bengaluru', pincode: '560001' },
                description: 'Local politicians are encroaching on public park land and building private shops.',
                severity: 'High',
                status: 'Under Review',
                isAnonymous: true,
                evidenceUrls: [],
                aiSuggestion: null,
                timeline: [{ status: 'Submitted', note: 'Created' }]
            }
        ];

        await Report.insertMany(sampleReports);

        console.log('Seed Data Imported successfully.');
        process.exit();
    } catch (error) {
        console.error('Error with data import', error);
        process.exit(1);
    }
};

seedData();
