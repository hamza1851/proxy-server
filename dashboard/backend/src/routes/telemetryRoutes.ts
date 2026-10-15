import { Router } from 'express';
import { TelemetryController } from '../controllers/telemetryController.js';

const router = Router();

router.get('/telemetry', TelemetryController.getTelemetry);
router.get('/queries', TelemetryController.getQueries);
router.post('/killswitch', TelemetryController.toggleKillswitch);

export default router;
