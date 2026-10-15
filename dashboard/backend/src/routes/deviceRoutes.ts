import { Router } from 'express';
import { DevicesController } from '../controllers/devicesController.js';
import { SplashController } from '../controllers/splashController.js';

const router = Router();

router.get('/devices', DevicesController.getAll);
router.get('/devices/:id', DevicesController.getById);
router.put('/devices/:id', DevicesController.update);
router.post('/devices/:id/bypass', DevicesController.toggleBypass);
router.post('/devices/:id/freeze', DevicesController.freezeDevice);
router.get('/devices/:id/monitoring', DevicesController.getDeviceMonitoring);
router.post('/devices/:id/splash', SplashController.updateSplash);

export default router;
