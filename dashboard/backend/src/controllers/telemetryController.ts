import { Request, Response } from 'express';
import { SystemService } from '../services/systemService.js';
import { AdGuardService } from '../services/adguardService.js';
import { DeviceService } from '../services/deviceService.js';
import { CleanupService } from '../services/cleanupService.js';

let emergencyKillswitchActive = false;

export class TelemetryController {
  public static async getTelemetry(_req: Request, res: Response): Promise<void> {
    try {
      const system = SystemService.getMetrics();
      const stats = await AdGuardService.getStats();
      const devices = await DeviceService.getAll();
      const blockedServices = await AdGuardService.getBlockedServices();

      const totalQueries = stats.num_dns_queries || 0;
      const blockedQueries = (stats.num_blocked_filtering || 0) + (stats.num_replaced_safebrowsing || 0);
      const blockRate = totalQueries > 0 ? Math.round((blockedQueries / totalQueries) * 100) : 0;

      res.json({
        system,
        dns: {
          totalQueries,
          blockedQueries,
          blockRate,
          avgLatencyMs: Math.round((stats.avg_processing_time || 0.012) * 1000)
        },
        services: blockedServices,
        emergencyKillswitch: emergencyKillswitchActive,
        activeDevicesCount: devices.filter((d) => d.status === 'online').length,
        totalDevicesCount: devices.length,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[TelemetryController] Error:', err);
      res.status(500).json({ error: 'Internal telemetry error' });
    }
  }

  public static async getQueries(_req: Request, res: Response): Promise<void> {
    try {
      const queries = await AdGuardService.getQueryLog();
      CleanupService.persistQueryEntries(queries).catch(() => {});
      res.json(queries);
    } catch (err) {
      console.error('[TelemetryController] Error:', err);
      res.status(500).json({ error: 'Failed to fetch query telemetry' });
    }
  }

  public static async toggleKillswitch(req: Request, res: Response): Promise<void> {
    try {
      const { active } = req.body;
      emergencyKillswitchActive = Boolean(active);
      await AdGuardService.setEmergencyKillswitch(emergencyKillswitchActive);
      res.json({
        success: true,
        emergencyKillswitch: emergencyKillswitchActive,
        message: emergencyKillswitchActive
          ? 'EMERGENCY PROTOCOL ENGAGED: ALL EXTERNAL DNS TRAFFIC DROPPED'
          : 'NORMALCY RESTORED: FILTRATION SHIELDS ACTIVE'
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to toggle killswitch' });
    }
  }
}
