import {
  TelemetryData,
  Device,
  QueryLogEntry,
  DeviceMonitoringStats,
  CustomSplashConfig
} from '../types/index.js';

const API_BASE = '/api';

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      console.error(`[ApiClient] Request to ${endpoint} failed:`, err);
      throw err;
    }
  }

  public static async getTelemetry(): Promise<TelemetryData> {
    return this.request<TelemetryData>('/telemetry');
  }

  public static async getQueries(): Promise<QueryLogEntry[]> {
    return this.request<QueryLogEntry[]>('/queries');
  }

  public static async toggleKillswitch(active: boolean): Promise<{ success: boolean; emergencyKillswitch: boolean }> {
    return this.request('/killswitch', {
      method: 'POST',
      body: JSON.stringify({ active })
    });
  }

  public static async getDevices(): Promise<Device[]> {
    return this.request<Device[]>('/devices');
  }

  public static async getDevice(id: string): Promise<Device> {
    return this.request<Device>(`/devices/${id}`);
  }

  public static async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    return this.request<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public static async toggleBypass(id: string, bypassed: boolean): Promise<{ success: boolean; device: Device }> {
    return this.request(`/devices/${id}/bypass`, {
      method: 'POST',
      body: JSON.stringify({ bypassed })
    });
  }

  public static async freezeDevice(id: string, durationMinutes: number): Promise<{ success: boolean; device: Device }> {
    return this.request(`/devices/${id}/freeze`, {
      method: 'POST',
      body: JSON.stringify({ durationMinutes })
    });
  }

  public static async getDeviceMonitoring(id: string): Promise<DeviceMonitoringStats> {
    return this.request<DeviceMonitoringStats>(`/devices/${id}/monitoring`);
  }

  public static async getBlockedServices(): Promise<string[]> {
    return this.request<string[]>('/services');
  }

  public static async updateBlockedServices(services: string[]): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/services', {
      method: 'POST',
      body: JSON.stringify({ services })
    });
    return res.success;
  }

  public static async updateDeviceRules(id: string, blockedServices: string[], customRules: string[]): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/devices/${id}/rules`, {
      method: 'PUT',
      body: JSON.stringify({ blockedServices, customRules })
    });
    return res.success;
  }

  public static async updateSplashConfig(id: string, splash: CustomSplashConfig): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/devices/${id}/splash`, {
      method: 'POST',
      body: JSON.stringify({ splash })
    });
    return res.success;
  }
}
