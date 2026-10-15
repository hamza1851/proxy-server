import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QueryLogModel } from '../db/models/QueryLog.js';
import { isDbConnected } from '../db/connection.js';
import { ConfigService } from './configService.js';
import { DeviceService } from './deviceService.js';
import { QueryLogEntry } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_LOGS_PATH = path.resolve(__dirname, '../../data/query_logs.json');

export interface DeviceStorageStat {
  deviceId: string;
  deviceName: string;
  clientIp: string;
  recordCount: number;
}

export interface MonitoringStorageStats {
  totalRecords: number;
  retentionDays: number;
  oldestRecord: string | null;
  newestRecord: string | null;
  expiredRecordsCount: number;
  devices: DeviceStorageStat[];
}

export interface PurgeOptions {
  deviceId?: string;
  clientIp?: string;
  olderThanDays?: number; // 0 means purge ALL for this target; undefined means use retentionDays
}

export interface PurgeResult {
  success: boolean;
  deletedCount: number;
  target: string;
  cutoffDate: string | null;
  message: string;
}

export class CleanupService {
  private static readLocalLogs(): any[] {
    try {
      if (!fs.existsSync(LOCAL_LOGS_PATH)) {
        return [];
      }
      const raw = fs.readFileSync(LOCAL_LOGS_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private static writeLocalLogs(logs: any[]): void {
    try {
      const dir = path.dirname(LOCAL_LOGS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOCAL_LOGS_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (err) {
      console.error('[CleanupService] Failed to write local query logs:', err);
    }
  }

  public static async getRetentionDays(): Promise<number> {
    try {
      const configs = await ConfigService.getAll();
      const retentionItem = configs.find((c) => c.key === 'DATA_RETENTION_DAYS');
      if (retentionItem && retentionItem.value) {
        const val = parseInt(retentionItem.value, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (err) {
      console.error('[CleanupService] Error reading retention config:', err);
    }
    return 90; // Default 3 months
  }

  /**
   * Seeds realistic sample historical logs if DB / local store is empty,
   * simulating records spanning today up to 120 days ago (past the 90-day threshold).
   */
  public static async ensureSeedData(): Promise<void> {
    const devices = await DeviceService.getAll();
    const count = isDbConnected() ? await QueryLogModel.countDocuments() : this.readLocalLogs().length;

    if (count > 0) return;

    const sampleDomains = [
      { q: 'api.apple.com', s: 'allowed', r: 'DNS-over-HTTPS' },
      { q: 'telemetry.tiktok.com', s: 'blocked', r: 'Blocked by Rule' },
      { q: 'graph.instagram.com', s: 'blocked', r: 'Blocked by Rule' },
      { q: 'github.com', s: 'allowed', r: 'Upstream Cloudflare' },
      { q: 'doubleclick.net', s: 'blocked', r: 'AdGuard Adware Filter' },
      { q: 'reddit.com', s: 'allowed', r: 'Encrypted DoH' },
      { q: 'metrics.analytics.com', s: 'blocked', r: 'Tracker Shield' }
    ];

    const records: any[] = [];
    // Generate dates: today, 10 days ago, 35 days ago, 75 days ago, 95 days ago (older than 3 months), 115 days ago
    const dayOffsets = [0, 2, 5, 12, 25, 45, 60, 80, 95, 105, 120];

    devices.forEach((dev) => {
      dayOffsets.forEach((offset, idx) => {
        const logDate = new Date(Date.now() - offset * 86400000 - (idx * 3600000));
        const sample = sampleDomains[idx % sampleDomains.length];
        records.push({
          id: `log-${dev.id}-${offset}-${idx}`,
          time: logDate.toISOString(),
          clientIp: dev.ip,
          clientName: dev.name,
          question: sample.q,
          status: sample.s,
          reason: sample.r,
          elapsedMs: 0.015,
          createdAt: logDate,
          updatedAt: logDate
        });
      });
    });

    if (isDbConnected()) {
      try {
        await QueryLogModel.insertMany(records);
        console.log(`[CleanupService] Seeded ${records.length} sample monitoring logs in MongoDB.`);
      } catch (err) {
        console.warn('[CleanupService] MongoDB seed insert failed, saving locally:', err);
        this.writeLocalLogs(records);
      }
    } else {
      this.writeLocalLogs(records);
      console.log(`[CleanupService] Seeded ${records.length} sample monitoring logs locally.`);
    }
  }

  public static async getStorageStats(): Promise<MonitoringStorageStats> {
    await this.ensureSeedData();
    const retentionDays = await this.getRetentionDays();
    const cutoffDate = new Date(Date.now() - retentionDays * 86400000);
    const devices = await DeviceService.getAll();

    if (isDbConnected()) {
      try {
        const totalRecords = await QueryLogModel.countDocuments();
        const oldestDoc = await QueryLogModel.findOne().sort({ createdAt: 1 }).lean() as any;
        const newestDoc = await QueryLogModel.findOne().sort({ createdAt: -1 }).lean() as any;
        const expiredRecordsCount = await QueryLogModel.countDocuments({ createdAt: { $lt: cutoffDate } });

        const deviceStats: DeviceStorageStat[] = await Promise.all(
          devices.map(async (dev) => {
            const count = await QueryLogModel.countDocuments({ clientIp: dev.ip });
            return {
              deviceId: dev.id,
              deviceName: dev.name,
              clientIp: dev.ip,
              recordCount: count
            };
          })
        );

        return {
          totalRecords,
          retentionDays,
          oldestRecord: oldestDoc?.createdAt ? new Date(oldestDoc.createdAt).toISOString() : null,
          newestRecord: newestDoc?.createdAt ? new Date(newestDoc.createdAt).toISOString() : null,
          expiredRecordsCount,
          devices: deviceStats
        };
      } catch (err) {
        console.error('[CleanupService] Error reading storage stats from MongoDB:', err);
      }
    }

    // Local file fallback
    const localLogs = this.readLocalLogs();
    const totalRecords = localLogs.length;
    let oldest: string | null = null;
    let newest: string | null = null;
    let expiredCount = 0;

    localLogs.forEach((log) => {
      const logDate = new Date(log.createdAt || log.time);
      if (!oldest || logDate < new Date(oldest)) oldest = logDate.toISOString();
      if (!newest || logDate > new Date(newest)) newest = logDate.toISOString();
      if (logDate < cutoffDate) expiredCount++;
    });

    const deviceStats: DeviceStorageStat[] = devices.map((dev) => {
      const count = localLogs.filter((l) => l.clientIp === dev.ip).length;
      return {
        deviceId: dev.id,
        deviceName: dev.name,
        clientIp: dev.ip,
        recordCount: count
      };
    });

    return {
      totalRecords,
      retentionDays,
      oldestRecord: oldest,
      newestRecord: newest,
      expiredRecordsCount: expiredCount,
      devices: deviceStats
    };
  }

  public static async purgeMonitoringData(options: PurgeOptions): Promise<PurgeResult> {
    const retentionDays = await this.getRetentionDays();
    let targetIp = options.clientIp;
    let targetLabel = 'Global (All Devices)';

    if (options.deviceId) {
      const device = await DeviceService.getById(options.deviceId);
      if (device) {
        targetIp = device.ip;
        targetLabel = `${device.name} [${device.ip}]`;
      } else {
        targetLabel = `Device ID: ${options.deviceId}`;
      }
    } else if (targetIp) {
      targetLabel = `IP: ${targetIp}`;
    }

    // Calculate cutoff date
    // If olderThanDays is undefined -> use configured retentionDays
    // If olderThanDays is 0 -> purge ALL for this target (no cutoff)
    // If olderThanDays > 0 -> purge records older than olderThanDays
    let cutoffDate: Date | null = null;
    let daysToUse = options.olderThanDays !== undefined ? options.olderThanDays : retentionDays;

    if (daysToUse > 0) {
      cutoffDate = new Date(Date.now() - daysToUse * 86400000);
    }

    let deletedCount = 0;

    if (isDbConnected()) {
      try {
        const filter: any = {};
        if (targetIp) {
          filter.clientIp = targetIp;
        }
        if (cutoffDate) {
          filter.createdAt = { $lt: cutoffDate };
        }

        const deleteRes = await QueryLogModel.deleteMany(filter);
        deletedCount = deleteRes.deletedCount || 0;
      } catch (err) {
        console.error('[CleanupService] MongoDB deletion error:', err);
      }
    } else {
      // Local fallback
      const localLogs = this.readLocalLogs();
      const initialCount = localLogs.length;

      const filtered = localLogs.filter((log) => {
        const matchesIp = !targetIp || log.clientIp === targetIp;
        if (!matchesIp) return true; // keep log for other devices

        if (!cutoffDate) {
          // Purge all for this target
          return false;
        }
        const logDate = new Date(log.createdAt || log.time);
        return logDate >= cutoffDate; // keep logs newer than cutoff
      });

      deletedCount = initialCount - filtered.length;
      this.writeLocalLogs(filtered);
    }

    const timeframeMsg = cutoffDate
      ? `older than ${daysToUse} days (prior to ${cutoffDate.toISOString().slice(0, 10)})`
      : 'ALL historical logs';

    const message = `Retention Cleanup Executed: Purged ${deletedCount} monitoring query logs for ${targetLabel} (${timeframeMsg}).`;

    console.log(`[CleanupService] ${message}`);

    return {
      success: true,
      deletedCount,
      target: targetLabel,
      cutoffDate: cutoffDate ? cutoffDate.toISOString() : null,
      message
    };
  }

  public static async persistQueryEntries(entries: QueryLogEntry[]): Promise<void> {
    if (!entries || entries.length === 0) return;

    if (isDbConnected()) {
      try {
        const ops = entries.map((entry) => ({
          updateOne: {
            filter: { id: entry.id },
            update: {
              $setOnInsert: {
                ...entry,
                createdAt: new Date(entry.time || Date.now()),
                updatedAt: new Date()
              }
            },
            upsert: true
          }
        }));
        await QueryLogModel.bulkWrite(ops);
      } catch (err) {
        console.warn('[CleanupService] Failed to persist queries to MongoDB:', err);
      }
    }
  }

  /**
   * Initializes background 24h cron/timer to enforce DATA_RETENTION_DAYS policy
   */
  public static initScheduledRetentionJob(): void {
    const runCycle = async () => {
      try {
        const retentionDays = await this.getRetentionDays();
        console.log(`[RetentionEngine] Enforcing automated ${retentionDays}-day retention policy...`);
        const result = await this.purgeMonitoringData({ olderThanDays: retentionDays });
        console.log(`[RetentionEngine] Auto-cycle completed: ${result.deletedCount} expired records purged.`);
      } catch (err) {
        console.error('[RetentionEngine] Error in retention cycle:', err);
      }
    };

    // Run once after 10 seconds of startup, then every 24 hours
    setTimeout(runCycle, 10000);
    setInterval(runCycle, 24 * 60 * 60 * 1000);
  }
}
