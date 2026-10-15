export interface CustomSplashConfig {
  enabled: boolean;
  title: string;
  badge: string;
  message: string;
  imageUrl: string;
}

export interface CurfewConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
  active: boolean;
  manualFreezeUntil: string | null;
}

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  os: string;
  status: 'online' | 'offline';
  bypassed: boolean;
  blockedServices: string[];
  customRules: string[];
  customSplash: CustomSplashConfig;
  curfew: CurfewConfig;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  uptime: number;
  hostname: string;
  platform: string;
}

export interface DnsMetrics {
  totalQueries: number;
  blockedQueries: number;
  blockRate: number;
  avgLatencyMs: number;
}

export interface TelemetryData {
  system: SystemMetrics;
  dns: DnsMetrics;
  services: string[];
  emergencyKillswitch: boolean;
  activeDevicesCount: number;
  totalDevicesCount: number;
  timestamp: string;
}

export interface QueryLogEntry {
  id: string;
  time: string;
  clientIp: string;
  clientName: string;
  question: string;
  status: 'allowed' | 'blocked' | 'bypassed';
  reason?: string;
  elapsedMs: number;
}

export interface DeviceDomainCount {
  domain: string;
  count: number;
}

export interface DeviceMonitoringStats {
  deviceId: string;
  deviceName: string;
  bypassed: boolean;
  curfewActive: boolean;
  totalRequests24h: number;
  blockedRequests24h: number;
  topQueried: DeviceDomainCount[];
  topBlocked: DeviceDomainCount[];
}

export type TabType = 'global' | 'devices' | 'splash' | 'configs';

export interface SystemConfigItem {
  key: string;
  value: string;
  category: 'Network' | 'WireGuard' | 'DNS' | 'Security' | 'System' | 'General';
  description: string;
  isSecret: boolean;
  isSystem: boolean;
  updatedAt?: string;
}

export interface RuntimeConfig {
  vpsIp: string;
  wgPort: number;
  dohUrl: string;
  dotPort: number;
  wireguardDns: string;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  icon: string;
  category: 'social' | 'video' | 'entertainment' | 'danger';
}

export interface CustomWebsiteRule {
  domain: string;
  name?: string;
  category?: string;
  enabled?: boolean;
}

export interface OperatorUser {
  username: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: OperatorUser;
  error?: string;
}

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

export interface PurgeResult {
  success: boolean;
  deletedCount: number;
  target: string;
  cutoffDate: string | null;
  message: string;
}
