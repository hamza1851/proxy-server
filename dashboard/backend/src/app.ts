import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { SplashController } from './controllers/splashController.js';

export const app = express();

app.use(cors());
app.use(express.json());

// API endpoints
app.use('/api', apiRouter);

// Blocked Splash endpoint (rendered when client visits restricted page)
app.get('/blocked', SplashController.renderBlockedPage);

// Serve Frontend Vite Dist in production
if (fs.existsSync(config.frontendDistPath)) {
  app.use(express.static(config.frontendDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(config.frontendDistPath, 'index.html'));
  });
}
