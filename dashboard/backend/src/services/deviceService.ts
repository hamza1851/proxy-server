import fs from 'fs';
import { config } from '../config/index.js';
import { Device, CustomSplashConfig } from '../types/index.js';

export class DeviceService {
  private static readStore(): Device[] {
    try {
      if (!fs.existsSync(config.dataPath)) {
        return [];
      }
      const data = fs.readFileSync(config.dataPath, 'utf-8');
      return JSON.parse(data) as Device[];
    } catch (err) {
      console.error('[DeviceService] Failed to read devices:', err);
      return [];
    }
  }

  private static writeStore(devices: Device[]): void {
    try {
      fs.writeFileSync(config.dataPath, JSON.stringify(devices, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DeviceService] Failed to write devices:', err);
    }
  }

  public static getAll(): Device[] {
    const devices = this.readStore();
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

  public static getById(id: string): Device | undefined {
    return this.getAll().find((d) => d.id === id);
  }

  public static update(id: string, updates: Partial<Device>): Device | null {
    const devices = this.readStore();
    const index = devices.findIndex((d) => d.id === id);
    if (index === -1) return null;

    devices[index] = { ...devices[index], ...updates };
    this.writeStore(devices);
    return this.getById(id) || null;
  }

  public static toggleBypass(id: string, bypassed: boolean): Device | null {
    return this.update(id, { bypassed });
  }

  public static freezeDevice(id: string, durationMinutes: number): Device | null {
    const freezeUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const device = this.getById(id);
    if (!device) return null;

    return this.update(id, {
      curfew: {
        ...device.curfew,
        manualFreezeUntil: durationMinutes > 0 ? freezeUntil : null
      }
    });
  }

  public static updateSplashConfig(id: string, splash: CustomSplashConfig): Device | null {
    return this.update(id, { customSplash: splash });
  }
}
