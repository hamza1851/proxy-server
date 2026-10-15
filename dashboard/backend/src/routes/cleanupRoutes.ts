import { Router } from 'express';
import { CleanupController } from '../controllers/cleanupController.js';

const router = Router();

router.get('/monitoring/stats', CleanupController.getStorageStats);
router.post('/monitoring/cleanup', CleanupController.purgeGlobal);
router.post('/devices/:id/monitoring/cleanup', CleanupController.purgeDevice);

export default router;
