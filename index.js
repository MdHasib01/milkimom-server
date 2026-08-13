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
import flavourRoutes from './routes/flavourRoutes.js';
import path from 'path';
import customizationRoutes from './routes/customizationRoutes.js';
import { initCronJobs } from './utils/cronJobs.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Behind a reverse proxy in production, so X-Forwarded-For carries the real
// customer IP. Without this every order records the proxy's address, which
// then goes to Meta as client_ip_address — a match key for attribution.
// TRUST_PROXY accepts a hop count ("1") or an express trust-proxy expression
// ("loopback", a subnet list). Numeric strings must be passed as numbers, or
// express reads them as an IP list instead of a hop count.
const trustProxy = process.env.TRUST_PROXY || '1';
app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);

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

// Serve static uploaded assets
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', version: '26080809', uptime: process.uptime() });
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
app.use('/api/flavours', flavourRoutes);
app.use('/api/customization', customizationRoutes);

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
