import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Tv,
  QrCode,
  Terminal,
  Activity,
  Layers,
  Smartphone,
  LogOut,
  UserCheck,
  Sliders
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { TabType } from '../../types/index.js';

interface HeaderProps {
  onToggleCli: () => void;
  isCliOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleCli, isCliOpen }) => {
  const {
    activeTab,
    setActiveTab,
    soundEnabled,
    setSoundEnabled,
    crtEnabled,
    setCrtEnabled,
    setQrModalOpen,
    telemetry,
    operator,
    logout
  } = useDashboard();

  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { tab: TabType; label: string; icon: React.ReactNode }[] = [
    { tab: 'global', label: 'GLOBAL HUD', icon: <Activity className="w-3.5 h-3.5 mr-1.5" /> },
    { tab: 'devices', label: 'DEVICE OPS', icon: <Layers className="w-3.5 h-3.5 mr-1.5" /> },
    { tab: 'splash', label: 'SPLASH STUDIO', icon: <Smartphone className="w-3.5 h-3.5 mr-1.5" /> },
    { tab: 'configs', label: 'CONFIG MATRIX', icon: <Sliders className="w-3.5 h-3.5 mr-1.5" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-cyber-bg/90 backdrop-blur-md border-b border-cyber-border px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-cyber-cyan animate-pulse" />
            <div>
              <span className="font-hud font-extrabold text-base tracking-wider text-white">
                CYBER<span className="text-cyber-cyan">PROXY</span>
              </span>
              <span className="text-[10px] font-mono block text-cyber-green leading-none">
                v2.4 // GOD-LEVEL OMNI-CONTROL
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-400 pl-4 border-l border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping" />
            <span>
              {telemetry?.activeDevicesCount || 0}/{telemetry?.totalDevicesCount || 0} NODES SECURED
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1.5 bg-cyber-card p-1 rounded border border-cyber-border/70">
          {navItems.map((item) => (
            <TacticalButton
              key={item.tab}
              size="sm"
              variant="cyan"
              active={activeTab === item.tab}
              onClick={() => setActiveTab(item.tab)}
            >
              <span className="flex items-center">
                {item.icon}
                {item.label}
              </span>
            </TacticalButton>
          ))}
        </div>

        {/* Tactical Controls & Operator Auth */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="hidden xl:inline text-[11px] font-mono text-slate-400 mr-2">
            {utcTime}
          </span>

          {/* Operator Badge */}
          {operator && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2 py-1 rounded bg-black/60 border border-slate-800 text-[10px] font-mono text-cyber-cyan">
              <UserCheck className="w-3 h-3 text-cyber-green" />
              <span className="truncate max-w-[80px]">{operator.username}</span>
            </div>
          )}

          <TacticalButton
            size="sm"
            variant="outline"
            onClick={() => setQrModalOpen(true)}
            title="WireGuard & DNS Connect QR"
          >
            <QrCode className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">QR SYNC</span>
          </TacticalButton>

          <TacticalButton
            size="sm"
            variant={isCliOpen ? 'cyan' : 'outline'}
            active={isCliOpen}
            onClick={onToggleCli}
            title="HUD Command Shell"
          >
            <Terminal className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">CLI</span>
          </TacticalButton>

          <TacticalButton
            size="sm"
            variant="ghost"
            onClick={() => setSoundEnabled((prev: boolean) => !prev)}
            title="Toggle Synthesizer Audio"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyber-green" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </TacticalButton>

          <TacticalButton
            size="sm"
            variant="ghost"
            onClick={() => setCrtEnabled((prev: boolean) => !prev)}
            title="Toggle CRT Scanlines"
          >
            <Tv className={`w-4 h-4 ${crtEnabled ? 'text-cyber-cyan' : 'text-slate-500'}`} />
          </TacticalButton>

          <TacticalButton
            size="sm"
            variant="danger"
            onClick={logout}
            title="Terminate Operator Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline ml-1">EXIT</span>
          </TacticalButton>
        </div>
      </div>
    </header>
  );
};
