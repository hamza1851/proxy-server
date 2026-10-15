import fs from 'fs';
import { config } from '../config/index.js';
import { Device, CustomSplashConfig } from '../types/index.js';
import { DeviceModel } from '../db/models/Device.js';
import { isDbConnected } from '../db/connection.js';

export class DeviceService {
  public static getAllFromLocal(): Device[] {
    try {
      if (!fs.existsSync(config.dataPath)) {
        return [];
      }
      const data = fs.readFileSync(config.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(this.normalizeDevice) : [];
    } catch (err) {
      console.error('[DeviceService] Failed to read local devices:', err);
      return [];
    }
  }

  public static writeLocalStore(devices: Device[]): void {
    try {
      fs.writeFileSync(config.dataPath, JSON.stringify(devices, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DeviceService] Failed to write local devices:', err);
    }
  }

  public static normalizeDevice(raw: any): Device {
    const rawCurfew = raw.curfew || {};
    const rawSplash = raw.customSplash || raw.blockPageConfig || {};

    return {
      id: String(raw.id || `dev_${Date.now()}`),
      name: String(raw.name || 'Unnamed Client'),
      ip: String(raw.ip || '10.8.0.2'),
      mac: String(raw.mac || ''),
      os: String(raw.os || (raw.name?.toLowerCase().includes('phone') ? 'ios' : 'device')),
      status: raw.status === 'offline' ? 'offline' : 'online',
      bypassed: Boolean(raw.bypassed),
      blockedServices: Array.isArray(raw.blockedServices) ? raw.blockedServices : [],
      customRules: Array.isArray(raw.customRules) ? raw.customRules : [],
      customSplash: {
        enabled: rawSplash.enabled !== undefined ? Boolean(rawSplash.enabled) : true,
        title: String(rawSplash.title || rawSplash.heading || 'ACCESS RESTRICTED BY CYBER OPERATOR'),
        badge: String(rawSplash.badge || rawSplash.emoji || '⛔'),
        message: String(rawSplash.message || 'This domain violates proxy policy. Return to authorized terminals.'),
        imageUrl: String(rawSplash.imageUrl || '')
      },
      curfew: {
        enabled: Boolean(rawCurfew.enabled),
        startHour: Number(rawCurfew.startHour ?? 23),
        endHour: Number(rawCurfew.endHour ?? 6),
        active: Boolean(rawCurfew.active),
        manualFreezeUntil: rawCurfew.manualFreezeUntil || rawCurfew.pausedUntil || null
      }
    };
  }

  public static async getAll(): Promise<Device[]> {
    let devices: Device[] = [];

    if (isDbConnected()) {
      try {
        const docs = await DeviceModel.find().lean();
        devices = docs.map(this.normalizeDevice);
      } catch (err) {
        console.warn('[DeviceService] Error querying MongoDB, falling back to local file:', err);
        devices = this.getAllFromLocal();
      }
    } else {
      devices = this.getAllFromLocal();
    }

    const now = new Date();
    const currentHour = now.getHours();

    return devices.map((d) => {
      let isCurfewActive = false;
      if (d.curfew?.enabled) {
        if (d.curfew.startHour > d.curfew.endHour) {
          isCurfewActive = currentHour >= d.curfew.startHour || currentHour < d.curfew.endHour;
        } else {
          isCurfewActive = currentHour >= d.curfew.startHour && currentHour < d.curfew.endHour;
        }
      }
      if (d.curfew?.manualFreezeUntil) {
        if (new Date(d.curfew.manualFreezeUntil) > now) {
          isCurfewActive = true;
        }
      }

      return {
        ...d,
        curfew: {
          ...d.curfew,
          active: isCurfewActive
        }
      };
    });
  }

  public static async getById(id: string): Promise<Device | undefined> {
    const all = await this.getAll();
    return all.find((d) => d.id === id);
  }

  public static async update(id: string, updates: Partial<Device>): Promise<Device | null> {
    if (isDbConnected()) {
      try {
        await DeviceModel.findOneAndUpdate({ id }, { $set: updates }, { upsert: true, new: true });
        return await this.getById(id) || null;
      } catch (err) {
        console.error('[DeviceService] Error updating MongoDB device:', err);
      }
    }

    const localDevices = this.getAllFromLocal();
    const index = localDevices.findIndex((d) => d.id === id);
    if (index === -1) return null;

    localDevices[index] = { ...localDevices[index], ...updates };
    this.writeLocalStore(localDevices);
    return (await this.getById(id)) || null;
  }

  public static async toggleBypass(id: string, bypassed: boolean): Promise<Device | null> {
    return this.update(id, { bypassed });
  }

  public static async freezeDevice(id: string, durationMinutes: number): Promise<Device | null> {
    const freezeUntil = durationMinutes > 0
      ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
      : null;
    const device = await this.getById(id);
    if (!device) return null;

    return this.update(id, {
      curfew: {
        ...device.curfew,
        manualFreezeUntil: freezeUntil
      }
    });
  }

  public static async updateSplashConfig(id: string, splash: CustomSplashConfig): Promise<Device | null> {
    return this.update(id, { customSplash: splash });
  }
}
