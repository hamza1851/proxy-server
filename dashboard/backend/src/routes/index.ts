import { Router } from 'express';
import authRoutes from './authRoutes.js';
import telemetryRoutes from './telemetryRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import ruleRoutes from './ruleRoutes.js';
import configRoutes from './configRoutes.js';

const apiRouter = Router();

apiRouter.use(authRoutes);
apiRouter.use(telemetryRoutes);
apiRouter.use(deviceRoutes);
apiRouter.use(ruleRoutes);
apiRouter.use(configRoutes);

export default apiRouter;
