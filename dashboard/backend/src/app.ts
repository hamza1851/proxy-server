import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { SplashController } from './controllers/splashController.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { connectDatabase } from './db/connection.js';
import { CleanupService } from './services/cleanupService.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection (resilient with local fallback)
connectDatabase()
  .then(() => {
    CleanupService.initScheduledRetentionJob();
  })
  .catch((err) => {
    console.warn('[Database] Initial connection attempt error:', err);
    CleanupService.initScheduledRetentionJob();
  });

// API endpoints (with auth protection)
app.use('/api', authMiddleware as any, apiRouter);

// Blocked Splash endpoint (rendered when client visits restricted page)
app.get('/blocked', SplashController.renderBlockedPage);

// Serve Frontend Vite Dist in production
if (fs.existsSync(config.frontendDistPath)) {
  app.use(express.static(config.frontendDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(config.frontendDistPath, 'index.html'));
  });
}
