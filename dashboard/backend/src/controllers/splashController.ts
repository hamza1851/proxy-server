import { Request, Response } from 'express';
import { DeviceService } from '../services/deviceService.js';

export class SplashController {
  public static async updateSplash(req: Request, res: Response): Promise<void> {
    try {
      const { splash } = req.body;
      const deviceId = req.params.id;

      const device = await DeviceService.getById(deviceId);
      if (!device) {
        res.status(404).json({ error: 'Device not found' });
        return;
      }

      const updated = await DeviceService.updateSplashConfig(deviceId, splash);
      res.json({
        success: true,
        device: updated,
        message: `Custom block screen updated for ${device.name}`
      });
    } catch {
      res.status(500).json({ error: 'Failed to update splash' });
    }
  }

  public static async renderBlockedPage(req: Request, res: Response): Promise<void> {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '').replace('::ffff:', '');
      const devices = await DeviceService.getAll();
      const matchedDevice = devices.find((d) => d.ip === clientIp) || devices[0];
      const splash = matchedDevice?.customSplash || {
        enabled: true,
        title: 'ACCESS RESTRICTED BY CYBER OPERATOR',
        badge: '⛔',
        message: 'This domain violates proxy policy. Return to authorized terminals.',
        imageUrl: ''
      };

      const targetDomain = req.query.domain || 'restricted-node.local';

      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CYBER PROXY // RESTRICTED ACCESS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #030712;
      color: #00ff88;
      font-family: 'Share Tech Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .crt::after {
      content: "";
      position: absolute;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
      background-size: 100% 4px;
      pointer-events: none;
    }
    .card {
      position: relative;
      background: rgba(3, 7, 18, 0.95);
      border: 1px solid rgba(255, 0, 85, 0.4);
      box-shadow: 0 0 35px rgba(255, 0, 85, 0.2);
      max-width: 480px;
      width: 100%;
      padding: 2.5rem 2rem;
      text-align: center;
      border-radius: 8px;
      z-index: 10;
    }
    .badge {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      display: block;
      animation: pulse 2s infinite ease-in-out;
    }
    h1 {
      font-family: 'Orbitron', sans-serif;
      color: #ff0055;
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
      letter-spacing: 1.5px;
    }
    .domain-tag {
      display: inline-block;
      background: rgba(255, 0, 85, 0.1);
      border: 1px solid rgba(255, 0, 85, 0.3);
      padding: 0.35rem 0.85rem;
      border-radius: 4px;
      color: #ff4d8d;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }
    p {
      color: #94a3b8;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 1.75rem;
    }
    .img-wrap {
      margin-bottom: 1.5rem;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #1e293b;
    }
    .img-wrap img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      display: block;
    }
    .hud-meta {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #1e293b;
      padding-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>
</head>
<body class="crt">
  <div class="card">
    <span class="badge">${splash.badge || '⛔'}</span>
    <h1>${splash.title || 'SECURITY LOCKOUT'}</h1>
    <div class="domain-tag">TARGET: ${targetDomain}</div>
    ${splash.imageUrl ? `<div class="img-wrap"><img src="${splash.imageUrl}" alt="Restricted Notice" /></div>` : ''}
    <p>${splash.message || 'Access to this target has been denied by your network administrator.'}</p>
    <div class="hud-meta">
      <span>DEVICE: ${matchedDevice?.name || 'TERMINAL'}</span>
      <span>IP: ${clientIp}</span>
    </div>
  </div>
</body>
</html>`);
    } catch (err) {
      res.status(500).send('Security error rendering lockout portal.');
    }
  }
}
