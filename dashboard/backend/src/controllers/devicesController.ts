import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService.js';

export class DevicesController {
  public static getAll(_req: Request, res: Response): void {
    const devices = DeviceService.getAll();
    res.json(devices);
  }

  public static getById(req: Request, res: Response): void {
    const device = DeviceService.getById(req.params.id);
    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(device);
  }

  public static update(req: Request, res: Response): void {
    const updated = DeviceService.update(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json(updated);
  }

  public static toggleBypass(req: Request, res: Response): void {
    const { bypassed } = req.body;
    const updated = DeviceService.toggleBypass(req.params.id, Boolean(bypassed));
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
  }

  public static freezeDevice(req: Request, res: Response): void {
    const { durationMinutes = 30 } = req.body;
    const updated = DeviceService.freezeDevice(req.params.id, Number(durationMinutes));
    if (!updated) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }
    res.json({
      success: true,
      device: updated,
      message: durationMinutes > 0
        ? `Curfew/Freeze enforced on [${updated.name}] for ${durationMinutes} minutes.`
        : `Curfew/Freeze lifted on [${updated.name}].`
    });
  }

  public static getDeviceMonitoring(req: Request, res: Response): void {
    const device = DeviceService.getById(req.params.id);
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
  }
}
