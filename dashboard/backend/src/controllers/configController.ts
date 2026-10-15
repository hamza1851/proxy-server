import { Request, Response } from 'express';
import { ConfigService } from '../services/configService.js';

export class ConfigController {
  public static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const [configs, runtime] = await Promise.all([
        ConfigService.getAll(),
        ConfigService.getRuntimeConfig()
      ]);
      res.json({
        configs,
        runtime
      });
    } catch (err: any) {
      console.error('[ConfigController] Error getting configs:', err);
      res.status(500).json({ error: 'Failed to retrieve system configurations' });
    }
  }

  public static async getRuntime(_req: Request, res: Response): Promise<void> {
    try {
      const runtime = await ConfigService.getRuntimeConfig();
      res.json(runtime);
    } catch {
      res.status(500).json({ error: 'Failed to retrieve runtime configuration' });
    }
  }

  public static async upsert(req: Request, res: Response): Promise<void> {
    try {
      const { key, value, category, description, isSecret } = req.body;
      if (!key) {
        res.status(400).json({ error: 'Configuration key is required' });
        return;
      }

      const item = await ConfigService.upsert(
        key,
        value ?? '',
        category,
        description,
        Boolean(isSecret)
      );

      const runtime = await ConfigService.getRuntimeConfig();

      res.json({
        success: true,
        item,
        runtime,
        message: `Configuration [${item.key}] applied successfully`
      });
    } catch (err: any) {
      console.error('[ConfigController] Error updating config:', err);
      res.status(500).json({ error: err.message || 'Failed to update configuration' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const success = await ConfigService.delete(key);
      const runtime = await ConfigService.getRuntimeConfig();

      res.json({
        success,
        runtime,
        message: `Configuration [${key}] removed`
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete configuration' });
    }
  }
}
