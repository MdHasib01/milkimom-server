import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import orderRoutes from './routes/orderRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import fraudRoutes from './routes/fraudRoutes.js';
import unfinishedOrderRoutes from './routes/unfinishedOrderRoutes.js';
import { initCronJobs } from './utils/cronJobs.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Private-Network', 'true');
  next();
});

app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  })
);

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin-users', adminUserRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/unfinished-orders', unfinishedOrderRoutes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

// Start
connectDB().then(() => {
  initCronJobs();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Milkimom API running on http://localhost:${PORT}`);
  });
});
