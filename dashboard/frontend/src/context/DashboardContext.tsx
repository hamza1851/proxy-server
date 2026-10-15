import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  TelemetryData,
  Device,
  QueryLogEntry,
  DeviceMonitoringStats,
  CustomSplashConfig,
  TabType
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
  activeTab: TabType;
  soundEnabled: boolean;
  crtEnabled: boolean;
  qrModalOpen: boolean;
  loading: boolean;
  error: string | null;

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
  toggleDeviceService: (deviceId: string, serviceId: string) => Promise<void>;
  updateDeviceRules: (deviceId: string, services: string[], customRules: string[]) => Promise<void>;
  updateDeviceSplash: (deviceId: string, splash: CustomSplashConfig) => Promise<void>;
  refreshAll: () => Promise<void>;
  playBeep: (freq?: number, duration?: number, type?: OscillatorType) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedMonitoring, setSelectedMonitoring] = useState<DeviceMonitoringStats | null>(null);
  const [queries, setQueries] = useState<QueryLogEntry[]>([]);
  const [blockedServices, setBlockedServices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { playBeep, playAlarm } = useAudio(soundEnabled);

  // Poll Telemetry & Queries
  const refreshTelemetry = useCallback(async () => {
    try {
      const data = await ApiClient.getTelemetry();
      setTelemetry(data);
      if (data.services) setBlockedServices(data.services);
    } catch {
      // Keep resilient
    }
  }, []);

  const refreshQueries = useCallback(async () => {
    try {
      const logs = await ApiClient.getQueries();
      setQueries(logs);
    } catch {
      // Keep resilient
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const list = await ApiClient.getDevices();
      setDevices(list);
      if (!selectedDeviceId && list.length > 0) {
        setSelectedDeviceId(list[0].id);
      }
    } catch {
      // Keep resilient
    }
  }, [selectedDeviceId]);

  const refreshMonitoring = useCallback(async (devId: string) => {
    try {
      const data = await ApiClient.getDeviceMonitoring(devId);
      setSelectedMonitoring(data);
    } catch {
      // Keep resilient
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshTelemetry(), refreshQueries(), refreshDevices()]);
      setError(null);
    } catch (err) {
      setError('Telemetry link offline');
    } finally {
      setLoading(false);
    }
  }, [refreshTelemetry, refreshQueries, refreshDevices]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Telemetry loop every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      refreshTelemetry();
      refreshQueries();
    }, 3500);
    return () => clearInterval(timer);
  }, [refreshTelemetry, refreshQueries]);

  // Refresh monitoring when selected device changes
  useEffect(() => {
    if (selectedDeviceId) {
      refreshMonitoring(selectedDeviceId);
    }
  }, [selectedDeviceId, refreshMonitoring]);

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
        activeTab,
        soundEnabled,
        crtEnabled,
        qrModalOpen,
        loading,
        error,
        setActiveTab,
        setSoundEnabled,
        setCrtEnabled,
        setQrModalOpen,
        selectDevice,
        toggleKillswitch,
        toggleDeviceBypass,
        freezeDevice,
        toggleUniversalService,
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
