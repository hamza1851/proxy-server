import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService.js';

export class DevicesController {
  public static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const devices = await DeviceService.getAll();
      res.json(devices);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch devices' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const device = await DeviceService.getById(req.params.id);
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json(device);
    } catch {
      res.status(500).json({ error: 'Failed to fetch device' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await DeviceService.update(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'Failed to update device' });
    }
  }

  public static async toggleBypass(req: Request, res: Response): Promise<void> {
    try {
      const { bypassed } = req.body;
      const updated = await DeviceService.toggleBypass(req.params.id, Boolean(bypassed));
      if (!updated) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json({
        success: true,
        device: updated,
        message: updated.bypassed
          ? `Device [${updated.name}] is now in Carrier Direct Bypass. Zero proxy filtering.`
          : `Device [${updated.name}] is re-secured through Private Proxy Shields.`
      });
    } catch {
      res.status(500).json({ error: 'Failed to toggle bypass' });
    }
  }

  public static async freezeDevice(req: Request, res: Response): Promise<void> {
    try {
      const { durationMinutes = 30 } = req.body;
      const updated = await DeviceService.freezeDevice(req.params.id, Number(durationMinutes));
      if (!updated) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }
      res.json({
        success: true,
        device: updated,
        message: Number(durationMinutes) > 0
          ? `Curfew/Freeze enforced on [${updated.name}] for ${durationMinutes} minutes.`
          : `Curfew/Freeze lifted on [${updated.name}].`
      });
    } catch {
      res.status(500).json({ error: 'Failed to enforce freeze' });
    }
  }

  public static async getDeviceMonitoring(req: Request, res: Response): Promise<void> {
    try {
      const device = await DeviceService.getById(req.params.id);
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }

      const mockStats = {
        deviceId: device.id,
        deviceName: device.name,
        bypassed: device.bypassed,
        curfewActive: device.curfew?.active || false,
        totalRequests24h: 3420,
        blockedRequests24h: 890,
        topQueried: [
          { domain: 'api.apple.com', count: 820 },
          { domain: 'google.com', count: 410 },
          { domain: 'github.com', count: 320 },
          { domain: 'reddit.com', count: 190 },
          { domain: 'spotify.com', count: 140 }
        ],
        topBlocked: [
          { domain: 'telemetry.tiktok.com', count: 420 },
          { domain: 'graph.instagram.com', count: 280 },
          { domain: 'doubleclick.net', count: 190 }
        ]
      };

      res.json(mockStats);
    } catch {
      res.status(500).json({ error: 'Failed to fetch monitoring' });
    }
  }
}
