import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { SystemConfigModel } from '../db/models/SystemConfig.js';
import { isDbConnected } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_CONFIG_PATH = path.resolve(__dirname, '../../data/configs.json');

export interface ConfigDTO {
  key: string;
  value: string;
  category: 'Network' | 'WireGuard' | 'DNS' | 'Security' | 'System' | 'General';
  description: string;
  isSecret: boolean;
  isSystem: boolean;
  updatedAt: Date;
}

const DEFAULT_CONFIGS: ConfigDTO[] = [
  {
    key: 'VPS_PUBLIC_IP',
    value: config.vpsPublicIp || '',
    category: 'Network',
    description: 'Public IPv4 address or FQDN domain of your VPS host. Used to generate WireGuard endpoints and encrypted DoH client configurations.',
    isSecret: false,
    isSystem: true,
    updatedAt: new Date()
  },
  {
    key: 'WG_PORT',
    value: String(config.wgPort || 51820),
    category: 'WireGuard',
    description: 'UDP listening port for WireGuard VPN tunnel ingress.',
    isSecret: false,
    isSystem: true,
    updatedAt: new Date()
  },
  {
    key: 'WG_DEFAULT_DNS',
    value: '10.2.0.100',
    category: 'WireGuard',
    description: 'Primary DNS server pushed to connected mobile and desktop VPN peers (AdGuard internal container IP).',
    isSecret: false,
    isSystem: true,
    updatedAt: new Date()
  },
  {
    key: 'DOH_URL',
    value: '',
    category: 'DNS',
    description: 'Custom Encrypted DNS-over-HTTPS endpoint URL. If empty, automatically resolves as https://<VPS_PUBLIC_IP>/dns-query.',
    isSecret: false,
    isSystem: true,
    updatedAt: new Date()
  },
  {
    key: 'DOT_PORT',
    value: '853',
    category: 'DNS',
    description: 'Standard TCP port for DNS-over-TLS (DoT) used by native Android Private DNS configurations.',
    isSecret: false,
    isSystem: true,
    updatedAt: new Date()
  },
  {
    key: 'CURFEW_DEFAULT_START',
    value: '23',
    category: 'Security',
    description: 'Global default curfew freeze start hour (0-23 in 24-hour military format).',
    isSecret: false,
    isSystem: false,
    updatedAt: new Date()
  },
  {
    key: 'CURFEW_DEFAULT_END',
    value: '6',
    category: 'Security',
    description: 'Global default curfew freeze release hour (0-23 in 24-hour military format).',
    isSecret: false,
    isSystem: false,
    updatedAt: new Date()
  },
  {
    key: 'KILLSWITCH_FAILSAFE_MODE',
    value: 'hard-drop',
    category: 'Security',
    description: 'Emergency Master Killswitch behavior: "hard-drop" (null-route all queries) or "sinkhole" (redirect to local block portal).',
    isSecret: false,
    isSystem: false,
    updatedAt: new Date()
  },
  {
    key: 'DATA_RETENTION_DAYS',
    value: '90',
    category: 'System',
    description: 'Monitoring telemetry & DNS query logs retention period in days (default: 90 days / 3 months). Purges records older than this threshold during retention jobs.',
    isSecret: false,
    isSystem: false,
    updatedAt: new Date()
  }
];

export class ConfigService {
  private static readLocal(): ConfigDTO[] {
    try {
      if (!fs.existsSync(LOCAL_CONFIG_PATH)) {
        this.writeLocal(DEFAULT_CONFIGS);
        return DEFAULT_CONFIGS;
      }
      const data = fs.readFileSync(LOCAL_CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return DEFAULT_CONFIGS;
    }
  }

  private static writeLocal(configs: ConfigDTO[]): void {
    try {
      const dir = path.dirname(LOCAL_CONFIG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(LOCAL_CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ConfigService] Error writing local configs:', err);
    }
  }

  public static async seedDefaults(): Promise<void> {
    if (!isDbConnected()) {
      this.readLocal();
      return;
    }

    try {
      for (const item of DEFAULT_CONFIGS) {
        const exists = await SystemConfigModel.findOne({ key: item.key });
        if (!exists) {
          await SystemConfigModel.create(item);
        }
      }
    } catch (err) {
      console.error('[ConfigService] Error seeding default configs into DB:', err);
    }
  }

  public static async getAll(): Promise<ConfigDTO[]> {
    if (isDbConnected()) {
      try {
        const docs = await SystemConfigModel.find().sort({ category: 1, key: 1 }).lean();
        if (docs.length > 0) {
          return docs.map((d) => ({
            key: d.key,
            value: d.value,
            category: d.category,
            description: d.description,
            isSecret: d.isSecret,
            isSystem: d.isSystem,
            updatedAt: d.updatedAt
          }));
        }
      } catch (err) {
        console.warn('[ConfigService] DB query failed, using local storage fallback:', err);
      }
    }
    return this.readLocal();
  }

  public static async upsert(
    key: string,
    value: string,
    category: ConfigDTO['category'] = 'General',
    description = '',
    isSecret = false
  ): Promise<ConfigDTO> {
    const cleanKey = key.trim().toUpperCase();

    if (isDbConnected()) {
      try {
        const updated = (await SystemConfigModel.findOneAndUpdate(
          { key: cleanKey },
          {
            $set: {
              value: String(value),
              category,
              description,
              isSecret,
              updatedAt: new Date()
            }
          },
          { upsert: true, new: true }
        ).lean()) as any;

        if (updated) {
          return {
            key: updated.key,
            value: updated.value,
            category: updated.category,
            description: updated.description,
            isSecret: Boolean(updated.isSecret),
            isSystem: Boolean(updated.isSystem),
            updatedAt: updated.updatedAt || new Date()
          };
        }
      } catch (err) {
        console.error('[ConfigService] Error updating DB config:', err);
      }
    }

    const localList = this.readLocal();
    const idx = localList.findIndex((c) => c.key === cleanKey);
    const updatedItem: ConfigDTO = {
      key: cleanKey,
      value: String(value),
      category,
      description: description || (idx >= 0 ? localList[idx].description : 'User custom configuration'),
      isSecret,
      isSystem: idx >= 0 ? localList[idx].isSystem : false,
      updatedAt: new Date()
    };

    if (idx >= 0) {
      localList[idx] = updatedItem;
    } else {
      localList.push(updatedItem);
    }
    this.writeLocal(localList);
    return updatedItem;
  }

  public static async delete(key: string): Promise<boolean> {
    const cleanKey = key.trim().toUpperCase();

    if (isDbConnected()) {
      try {
        const item = await SystemConfigModel.findOne({ key: cleanKey });
        if (item && item.isSystem) {
          throw new Error(`Cannot delete core system configuration: ${cleanKey}`);
        }
        const res = await SystemConfigModel.findOneAndDelete({ key: cleanKey, isSystem: { $ne: true } });
        return Boolean(res);
      } catch (err) {
        console.error('[ConfigService] Error deleting DB config:', err);
        throw err;
      }
    }

    const localList = this.readLocal();
    const target = localList.find((c) => c.key === cleanKey);
    if (target?.isSystem) {
      throw new Error(`Cannot delete core system configuration: ${cleanKey}`);
    }

    const filtered = localList.filter((c) => c.key !== cleanKey);
    this.writeLocal(filtered);
    return true;
  }

  public static async getRuntimeConfig(): Promise<{
    vpsIp: string;
    wgPort: number;
    dohUrl: string;
    dotPort: number;
    wireguardDns: string;
  }> {
    const all = await this.getAll();
    const getVal = (k: string, fallback: string) => {
      const found = all.find((c) => c.key === k);
      return (found && found.value.trim()) ? found.value.trim() : fallback;
    };

    const vpsIp = getVal('VPS_PUBLIC_IP', config.vpsPublicIp || '');
    const wgPort = Number(getVal('WG_PORT', String(config.wgPort || 51820)));
    const customDoh = getVal('DOH_URL', '');
    const dohUrl = customDoh || (vpsIp ? `https://${vpsIp}/dns-query` : '');
    const dotPort = Number(getVal('DOT_PORT', '853'));
    const wireguardDns = getVal('WG_DEFAULT_DNS', '10.2.0.100');

    return {
      vpsIp,
      wgPort,
      dohUrl,
      dotPort,
      wireguardDns
    };
  }
}
