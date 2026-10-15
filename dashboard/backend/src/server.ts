import { app } from './app.js';
import { config } from './config/index.js';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[CyberProxy Backend] Running at http://0.0.0.0:${config.port}`);
  console.log(`[CyberProxy Backend] Target AdGuard: ${config.adguardHost}`);
});
