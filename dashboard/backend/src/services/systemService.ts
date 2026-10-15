import os from 'os';
import { SystemMetrics } from '../types/index.js';

export class SystemService {
  public static getMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);

    return {
      cpuUsage: Math.max(1, Math.min(100, isNaN(cpuUsage) ? 14 : cpuUsage)),
      memoryUsage: {
        total: Math.round(totalMem / (1024 * 1024)),
        used: Math.round(usedMem / (1024 * 1024)),
        free: Math.round(freeMem / (1024 * 1024)),
        percentage: memPercentage
      },
      uptime: Math.round(os.uptime()),
      hostname: os.hostname(),
      platform: `${os.type()} ${os.arch()}`
    };
  }
}
