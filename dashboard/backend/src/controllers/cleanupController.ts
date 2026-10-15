import { Request, Response } from 'express';
import { CleanupService } from '../services/cleanupService.js';

export class CleanupController {
  public static async getStorageStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await CleanupService.getStorageStats();
      res.json(stats);
    } catch (err) {
      console.error('[CleanupController] Error getting storage stats:', err);
      res.status(500).json({ error: 'Failed to retrieve storage statistics' });
    }
  }

  public static async purgeGlobal(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId, clientIp, olderThanDays } = req.body;
      const parsedDays = olderThanDays !== undefined && olderThanDays !== null && olderThanDays !== ''
        ? Number(olderThanDays)
        : undefined;

      const result = await CleanupService.purgeMonitoringData({
        deviceId: deviceId && deviceId !== 'all' ? String(deviceId) : undefined,
        clientIp: clientIp ? String(clientIp) : undefined,
        olderThanDays: parsedDays
      });

      res.json(result);
    } catch (err) {
      console.error('[CleanupController] Error executing global purge:', err);
      res.status(500).json({ error: 'Failed to execute monitoring cleanup job' });
    }
  }

  public static async purgeDevice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { olderThanDays } = req.body;

      const parsedDays = olderThanDays !== undefined && olderThanDays !== null && olderThanDays !== ''
        ? Number(olderThanDays)
        : 0; // Default to dropping all for device-level purge unless specified

      const result = await CleanupService.purgeMonitoringData({
        deviceId: id,
        olderThanDays: parsedDays
      });

      res.json(result);
    } catch (err) {
      console.error('[CleanupController] Error purging device monitoring data:', err);
      res.status(500).json({ error: 'Failed to purge device monitoring telemetry' });
    }
  }
}
