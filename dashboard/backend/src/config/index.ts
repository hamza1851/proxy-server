import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveDataPath = (): string => {
  if (process.env.DATA_PATH) return process.env.DATA_PATH;
  const candidates = [
    path.resolve(__dirname, '../../data/devices.json'),
    path.resolve(process.cwd(), 'data/devices.json'),
    path.resolve(process.cwd(), 'backend/data/devices.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
};

const resolveFrontendDist = (): string => {
  if (process.env.FRONTEND_DIST_PATH) return process.env.FRONTEND_DIST_PATH;
  const candidates = [
    path.resolve(__dirname, '../../../frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(process.cwd(), 'frontend/dist'),
    '/app/frontend/dist'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
};

export const config = {
  port: Number(process.env.PORT) || Number(process.env.DASHBOARD_PORT) || 8000,
  adguardHost: process.env.ADGUARD_HOST || 'http://adguard:80',
  adguardUser: process.env.ADGUARD_USER || 'admin',
  adguardPass: process.env.ADGUARD_PASS || 'ProxyMaster2025!',
  dataPath: resolveDataPath(),
  frontendDistPath: resolveFrontendDist(),
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'cyber-proxy-super-secret-key-2025',
  adminUser: process.env.PANEL_ADMIN_USER || 'admin',
  adminPassword: process.env.PANEL_ADMIN_PASSWORD || 'ProxyMaster2025!'
} as const;
