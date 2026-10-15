import { Router } from 'express';
import telemetryRoutes from './telemetryRoutes.js';
import deviceRoutes from './deviceRoutes.js';
import ruleRoutes from './ruleRoutes.js';

const apiRouter = Router();

apiRouter.use(telemetryRoutes);
apiRouter.use(deviceRoutes);
apiRouter.use(ruleRoutes);

export default apiRouter;
