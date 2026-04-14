import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';

// Load routes
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import safeMessageRoutes from './routes/safeMessageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import { startCronJobs } from './cron/reminderCron.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Background Jobs (only if not on Vercel/Serverless)
if (!process.env.VERCEL) {
  startCronJobs();
} else {
  console.log('Running in Vercel environment - internal cron jobs disabled');
}


// Middleware
app.use(helmet());
// Allow both dev ports in CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman/curl) or from allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // 500 requests per hour per IP
  message: 'Too many requests from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api', limiter);
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/safe-messages', safeMessageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rewards', rewardRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const isMain = import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/'));

if ((isMain || process.env.NODE_ENV !== 'production') && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


export default app;
