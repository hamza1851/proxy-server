import { Router } from 'express';
import { ConfigController } from '../controllers/configController.js';

const router = Router();

router.get('/config', ConfigController.getAll);
router.get('/config/runtime', ConfigController.getRuntime);
router.post('/config', ConfigController.upsert);
router.put('/config/:key', ConfigController.upsert);
router.delete('/config/:key', ConfigController.delete);

export default router;
