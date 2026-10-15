import { Request, Response } from 'express';
import { AdGuardService } from '../services/adguardService.js';
import { DeviceService } from '../services/deviceService.js';
import { GlobalRuleModel } from '../db/models/GlobalRule.js';
import { isDbConnected } from '../db/connection.js';

export class RulesController {
  public static async getBlockedServices(_req: Request, res: Response): Promise<void> {
    try {
      const services = await AdGuardService.getBlockedServices();
      let customRules: Array<{ domain: string; name?: string; category: string; enabled: boolean }> = [];

      if (isDbConnected()) {
        try {
          const rules = await GlobalRuleModel.find().lean();
          customRules = rules.map((r) => ({
            domain: r.domain,
            name: r.name || r.domain,
            category: r.category || 'Custom Domain',
            enabled: r.enabled
          }));
        } catch {
          // resilient fallback
        }
      }

      res.json({
        services,
        customWebsites: customRules
      });
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

  public static async addUniversalWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { domain, name, category = 'Custom Domain' } = req.body;
      const cleanDomain = String(domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      if (!cleanDomain) {
        res.status(400).json({ error: 'Valid domain name is required' });
        return;
      }

      if (isDbConnected()) {
        await GlobalRuleModel.findOneAndUpdate(
          { domain: cleanDomain },
          { domain: cleanDomain, name: name || cleanDomain, category, enabled: true },
          { upsert: true, new: true }
        );
      }

      res.json({
        success: true,
        domain: cleanDomain,
        message: `Global block rule applied for: ${cleanDomain}`
      });
    } catch (err) {
      console.error('[RulesController] Error adding universal website:', err);
      res.status(500).json({ error: 'Failed to add universal website' });
    }
  }

  public static async removeUniversalWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { domain } = req.params;
      const cleanDomain = decodeURIComponent(domain).trim().toLowerCase();

      if (isDbConnected()) {
        await GlobalRuleModel.findOneAndDelete({ domain: cleanDomain });
      }

      res.json({
        success: true,
        domain: cleanDomain,
        message: `Universal rule removed for: ${cleanDomain}`
      });
    } catch {
      res.status(500).json({ error: 'Failed to remove universal website' });
    }
  }

  public static async updateDeviceRules(req: Request, res: Response): Promise<void> {
    try {
      const { blockedServices, customRules } = req.body;
      const deviceId = req.params.id;
      const device = await DeviceService.getById(deviceId);

      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }

      const updated = await DeviceService.update(deviceId, {
        blockedServices: Array.isArray(blockedServices) ? blockedServices : device.blockedServices,
        customRules: Array.isArray(customRules) ? customRules : device.customRules
      });

      res.json({
        success: true,
        device: updated,
        message: `Rules updated for ${device.name}`
      });
    } catch {
      res.status(500).json({ error: 'Failed to update device rules' });
    }
  }
}
