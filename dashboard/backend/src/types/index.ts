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
