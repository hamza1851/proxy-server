import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TelemetryData,
  Device,
  QueryLogEntry,
  DeviceMonitoringStats,
  CustomSplashConfig,
  CustomWebsiteRule,
  OperatorUser,
  TabType,
  AuthResponse
} from '../types/index.js';
import { ApiClient } from '../services/apiClient.js';
import { useAudio } from '../hooks/useAudio.js';

interface DashboardContextType {
  telemetry: TelemetryData | null;
  devices: Device[];
  selectedDevice: Device | null;
  selectedMonitoring: DeviceMonitoringStats | null;
  queries: QueryLogEntry[];
  blockedServices: string[];
  customWebsites: CustomWebsiteRule[];
  activeTab: TabType;
  soundEnabled: boolean;
  crtEnabled: boolean;
  qrModalOpen: boolean;
  loading: boolean;
  error: string | null;

  // Auth State
  isAuthenticated: boolean;
  operator: OperatorUser | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => void;

  // Actions
  setActiveTab: (tab: TabType) => void;
  setSoundEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  setCrtEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  setQrModalOpen: (val: boolean) => void;
  selectDevice: (id: string) => void;
  toggleKillswitch: () => Promise<void>;
  toggleDeviceBypass: (id: string, bypassed: boolean) => Promise<void>;
  freezeDevice: (id: string, minutes: number) => Promise<void>;
  toggleUniversalService: (serviceId: string) => Promise<void>;
  addUniversalWebsite: (domain: string) => Promise<void>;
  removeUniversalWebsite: (domain: string) => Promise<void>;
  toggleDeviceService: (deviceId: string, serviceId: string) => Promise<void>;
  updateDeviceRules: (deviceId: string, services: string[], customRules: string[]) => Promise<void>;
  updateDeviceSplash: (deviceId: string, splash: CustomSplashConfig) => Promise<void>;
  refreshAll: () => Promise<void>;
  playBeep: (freq?: number, duration?: number, type?: OscillatorType) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

const getTabFromHash = (): TabType => {
  if (typeof window === 'undefined') return 'global';
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'devices') return 'devices';
  if (hash === 'splash') return 'splash';
  return 'global';
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(ApiClient.getToken());
  });
  const [operator, setOperator] = useState<OperatorUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('cyber_proxy_operator');
    return stored ? JSON.parse(stored) : null;
  });

  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedMonitoring, setSelectedMonitoring] = useState<DeviceMonitoringStats | null>(null);
  const [queries, setQueries] = useState<QueryLogEntry[]>([]);
  const [blockedServices, setBlockedServices] = useState<string[]>([]);
  const [customWebsites, setCustomWebsites] = useState<CustomWebsiteRule[]>([]);
  const [activeTab, setActiveTabState] = useState<TabType>(getTabFromHash);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { playBeep, playAlarm } = useAudio(soundEnabled);

  // Sync tab state with browser URL hash
  const setActiveTab = (tab: TabType) => {
    playBeep(850, 0.04);
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${tab}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Listen for 401 unauthorized
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setOperator(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const res = await ApiClient.login(username, password);
      if (res.success && res.token) {
        setIsAuthenticated(true);
        setOperator(res.user || { username, role: 'operator' });
        refreshAll();
      }
      return res;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication failed' };
    }
  };

  const logout = () => {
    playBeep(450, 0.08);
    ApiClient.clearToken();
    setIsAuthenticated(false);
    setOperator(null);
  };

  // Poll Telemetry & Queries
  const refreshTelemetry = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await ApiClient.getTelemetry();
      setTelemetry(data);
      if (data.services) setBlockedServices(data.services);
    } catch {
      // Keep resilient
    }
  }, [isAuthenticated]);

  const refreshQueries = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const logs = await ApiClient.getQueries();
      setQueries(logs);
    } catch {
      // Keep resilient
    }
  }, [isAuthenticated]);

  const refreshDevices = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const list = await ApiClient.getDevices();
      setDevices(list);
      if (!selectedDeviceId && list.length > 0) {
        setSelectedDeviceId(list[0].id);
      }
    } catch {
      // Keep resilient
    }
  }, [isAuthenticated, selectedDeviceId]);

  const refreshServices = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await ApiClient.getBlockedServices();
      setBlockedServices(res.services);
      setCustomWebsites(res.customWebsites);
    } catch {
      // Keep resilient
    }
  }, [isAuthenticated]);

  const refreshMonitoring = useCallback(async (devId: string) => {
    if (!isAuthenticated) return;
    try {
      const data = await ApiClient.getDeviceMonitoring(devId);
      setSelectedMonitoring(data);
    } catch {
      // Keep resilient
    }
  }, [isAuthenticated]);

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await Promise.all([
        refreshTelemetry(),
        refreshQueries(),
        refreshDevices(),
        refreshServices()
      ]);
      setError(null);
    } catch {
      setError('Telemetry link offline');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, refreshTelemetry, refreshQueries, refreshDevices, refreshServices]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    }
  }, [isAuthenticated, refreshAll]);

  // Telemetry loop every 3.5s
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      refreshTelemetry();
      refreshQueries();
    }, 3500);
    return () => clearInterval(timer);
  }, [isAuthenticated, refreshTelemetry, refreshQueries]);

  // Refresh monitoring when selected device changes
  useEffect(() => {
    if (selectedDeviceId && isAuthenticated) {
      refreshMonitoring(selectedDeviceId);
    }
  }, [selectedDeviceId, isAuthenticated, refreshMonitoring]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0] || null;

  const selectDevice = (id: string) => {
    playBeep(900, 0.05);
    setSelectedDeviceId(id);
  };

  const toggleKillswitch = async () => {
    const nextState = !telemetry?.emergencyKillswitch;
    if (nextState) {
      playAlarm();
    } else {
      playBeep(1200, 0.1);
    }
    await ApiClient.toggleKillswitch(nextState);
    await refreshTelemetry();
  };

  const toggleDeviceBypass = async (id: string, bypassed: boolean) => {
    playBeep(bypassed ? 500 : 900, 0.08);
    await ApiClient.toggleBypass(id, bypassed);
    await refreshDevices();
  };

  const freezeDevice = async (id: string, minutes: number) => {
    playAlarm();
    await ApiClient.freezeDevice(id, minutes);
    await refreshDevices();
  };

  const toggleUniversalService = async (serviceId: string) => {
    playBeep(850, 0.04);
    const updated = blockedServices.includes(serviceId)
      ? blockedServices.filter((s) => s !== serviceId)
      : [...blockedServices, serviceId];
    setBlockedServices(updated);
    await ApiClient.updateBlockedServices(updated);
    await refreshTelemetry();
  };

  const addUniversalWebsite = async (domain: string) => {
    playBeep(950, 0.05);
    await ApiClient.addUniversalWebsite(domain);
    await refreshServices();
  };

  const removeUniversalWebsite = async (domain: string) => {
    playBeep(650, 0.06);
    await ApiClient.removeUniversalWebsite(domain);
    await refreshServices();
  };

  const toggleDeviceService = async (deviceId: string, serviceId: string) => {
    playBeep(850, 0.04);
    const dev = devices.find((d) => d.id === deviceId);
    if (!dev) return;

    const current = dev.blockedServices || [];
    const updated = current.includes(serviceId)
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];

    await ApiClient.updateDeviceRules(deviceId, updated, dev.customRules || []);
    await refreshDevices();
  };

  const updateDeviceRules = async (deviceId: string, services: string[], customRules: string[]) => {
    playBeep(950, 0.05);
    await ApiClient.updateDeviceRules(deviceId, services, customRules);
    await refreshDevices();
  };

  const updateDeviceSplash = async (deviceId: string, splash: CustomSplashConfig) => {
    playBeep(1000, 0.06);
    await ApiClient.updateSplashConfig(deviceId, splash);
    await refreshDevices();
  };

  return (
    <DashboardContext.Provider
      value={{
        telemetry,
        devices,
        selectedDevice,
        selectedMonitoring,
        queries,
        blockedServices,
        customWebsites,
        activeTab,
        soundEnabled,
        crtEnabled,
        qrModalOpen,
        loading,
        error,
        isAuthenticated,
        operator,
        login,
        logout,
        setActiveTab,
        setSoundEnabled,
        setCrtEnabled,
        setQrModalOpen,
        selectDevice,
        toggleKillswitch,
        toggleDeviceBypass,
        freezeDevice,
        toggleUniversalService,
        addUniversalWebsite,
        removeUniversalWebsite,
        toggleDeviceService,
        updateDeviceRules,
        updateDeviceSplash,
        refreshAll,
        playBeep
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
