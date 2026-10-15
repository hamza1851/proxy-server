import { Request, Response } from 'express';
import { AdGuardService } from '../services/adguardService.js';
import { DeviceService } from '../services/deviceService.js';

export class RulesController {
  public static async getBlockedServices(_req: Request, res: Response): Promise<void> {
    try {
      const services = await AdGuardService.getBlockedServices();
      res.json(services);
    } catch {
      res.status(500).json({ error: 'Failed to retrieve blocked services' });
    }
  }

  public static async updateBlockedServices(req: Request, res: Response): Promise<void> {
    try {
      const { services } = req.body;
      if (!Array.isArray(services)) {
        res.status(400).json({ error: 'Services must be an array of service identifiers' });
        return;
      }
      const success = await AdGuardService.setBlockedServices(services);
      res.json({
        success,
        services,
        message: 'Universal Target matrix updated'
      });
    } catch {
      res.status(500).json({ error: 'Failed to update blocked services' });
    }
  }

  public static updateDeviceRules(req: Request, res: Response): void {
    const { blockedServices, customRules } = req.body;
    const deviceId = req.params.id;
    const device = DeviceService.getById(deviceId);

    if (!device) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const updated = DeviceService.update(deviceId, {
      blockedServices: Array.isArray(blockedServices) ? blockedServices : device.blockedServices,
      customRules: Array.isArray(customRules) ? customRules : device.customRules
    });

    res.json({
      success: true,
      device: updated,
      message: `Rules updated for ${device.name}`
    });
  }
}
