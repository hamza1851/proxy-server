import {
  TelemetryData,
  Device,
  QueryLogEntry,
  DeviceMonitoringStats,
  CustomSplashConfig,
  CustomWebsiteRule,
  AuthResponse,
  OperatorUser,
  SystemConfigItem,
  RuntimeConfig,
  MonitoringStorageStats,
  PurgeResult
} from '../types/index.js';

const API_BASE = '/api';

export class ApiClient {
  public static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('cyber_proxy_token');
  }

  public static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cyber_proxy_token', token);
    }
  }

  public static clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cyber_proxy_token');
      localStorage.removeItem('cyber_proxy_operator');
    }
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (res.status === 401 && endpoint !== '/auth/login') {
        this.clearToken();
        if (typeof window !== 'undefined' && !window.location.hash.includes('login')) {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      console.error(`[ApiClient] Request to ${endpoint} failed:`, err);
      throw err;
    }
  }

  public static async login(username: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      this.setToken(res.token);
      if (res.user) {
        localStorage.setItem('cyber_proxy_operator', JSON.stringify(res.user));
      }
    }
    return res;
  }

  public static async getMe(): Promise<OperatorUser> {
    const res = await this.request<{ success: boolean; user: OperatorUser }>('/auth/me');
    return res.user;
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

  public static async getBlockedServices(): Promise<{ services: string[]; customWebsites: CustomWebsiteRule[] }> {
    const res = await this.request<any>('/services');
    if (Array.isArray(res)) {
      return { services: res, customWebsites: [] };
    }
    return {
      services: res.services || [],
      customWebsites: res.customWebsites || []
    };
  }

  public static async updateBlockedServices(services: string[]): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/services', {
      method: 'POST',
      body: JSON.stringify({ services })
    });
    return res.success;
  }

  public static async addUniversalWebsite(domain: string, name?: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/rules/universal', {
      method: 'POST',
      body: JSON.stringify({ domain, name })
    });
    return res.success;
  }

  public static async removeUniversalWebsite(domain: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/rules/universal/${encodeURIComponent(domain)}`, {
      method: 'DELETE'
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

  public static async getConfigs(): Promise<{ configs: SystemConfigItem[]; runtime: RuntimeConfig }> {
    return this.request<{ configs: SystemConfigItem[]; runtime: RuntimeConfig }>('/config');
  }

  public static async getRuntimeConfig(): Promise<RuntimeConfig> {
    return this.request<RuntimeConfig>('/config/runtime');
  }

  public static async upsertConfig(
    item: Partial<SystemConfigItem>
  ): Promise<{ success: boolean; item: SystemConfigItem; runtime: RuntimeConfig }> {
    return this.request<{ success: boolean; item: SystemConfigItem; runtime: RuntimeConfig }>('/config', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  public static async deleteConfig(key: string): Promise<{ success: boolean; runtime: RuntimeConfig }> {
    return this.request<{ success: boolean; runtime: RuntimeConfig }>(`/config/${encodeURIComponent(key)}`, {
      method: 'DELETE'
    });
  }

  public static async getMonitoringStats(): Promise<MonitoringStorageStats> {
    return this.request<MonitoringStorageStats>('/monitoring/stats');
  }

  public static async purgeGlobalMonitoring(params: {
    deviceId?: string;
    clientIp?: string;
    olderThanDays?: number;
  }): Promise<PurgeResult> {
    return this.request<PurgeResult>('/monitoring/cleanup', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  public static async purgeDeviceMonitoring(deviceId: string, olderThanDays?: number): Promise<PurgeResult> {
    return this.request<PurgeResult>(`/devices/${deviceId}/monitoring/cleanup`, {
      method: 'POST',
      body: JSON.stringify({ olderThanDays })
    });
  }
}
