import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/db.js';


// Load routes
import reportRoutes from './routes/reportRoutes.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import safeMessageRoutes from './routes/safeMessageRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import { startCronJobs } from './cron/reminderCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

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
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // Disabling for local integrated serving; can be refined for production
}));

// Allow both dev ports and the server's own port in CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // 2. Allow specific local dev origins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // 3. Automatically allow any Vercel deployment URL
    if (origin.endsWith('.vercel.app') || origin.endsWith('.now.sh')) {
      return callback(null, true);
    }

    // 4. Fallback: Disallow
    callback(null, false);
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

// Serve Static Frontend Assets (always enable, backend handles it if Vercel doesn't intercept)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// SPA Routing - Serve the React app for all unmatched non-API routes
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
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
