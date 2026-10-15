import React from 'react';
import { Smartphone, Laptop, Tv, ShieldCheck, ShieldAlert, Moon } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { Device } from '../../types/index.js';

export const DeviceRoster: React.FC = () => {
  const { devices, selectedDevice, selectDevice, toggleDeviceBypass, freezeDevice } = useDashboard();

  const getDeviceIcon = (os?: string, name?: string) => {
    const text = `${os || ''} ${name || ''}`.toLowerCase();
    if (text.includes('ios') || text.includes('android') || text.includes('phone')) {
      return <Smartphone className="w-5 h-5 text-cyber-cyan" />;
    }
    if (text.includes('macos') || text.includes('windows') || text.includes('linux') || text.includes('laptop')) {
      return <Laptop className="w-5 h-5 text-cyber-green" />;
    }
    return <Tv className="w-5 h-5 text-cyber-purple" />;
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div>
          <h2 className="font-hud font-bold text-sm tracking-wider text-white">
            PROVISIONED CLIENT ROSTER // TARGETS
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            Select a target to adjust restrictions, curfew freeze, or direct carrier bypass.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {devices.map((device: Device) => {
          const isSelected = selectedDevice?.id === device.id;
          const isBypassed = Boolean(device.bypassed);
          const isCurfewActive = Boolean(device.curfew?.active);
          const deviceName = device.name || 'Client Device';
          const deviceIp = device.ip || '10.8.0.2';
          const deviceOs = device.os || 'device';
          const deviceStatus = device.status || 'online';

          return (
            <div
              key={device.id}
              onClick={() => selectDevice(device.id)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-all duration-200 relative ${
                isSelected
                  ? 'bg-cyber-card border-cyber-cyan shadow-[0_0_15px_rgba(0,243,255,0.25)]'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 rounded bg-black/50 border border-slate-800">
                    {getDeviceIcon(deviceOs, deviceName)}
                  </span>
                  <div>
                    <h3 className="font-hud font-bold text-xs text-white truncate max-w-[140px]">
                      {deviceName}
                    </h3>
                    <div className="text-[10px] font-mono text-slate-400">
                      {deviceIp} // {deviceOs}
                    </div>
                  </div>
                </div>

                <StatusBadge
                  status={deviceStatus}
                  label={deviceStatus}
                />
              </div>

              {/* Status pills row */}
              <div className="flex flex-wrap gap-1.5 my-2.5">
                {isBypassed ? (
                  <StatusBadge status="bypassed" label="CARRIER BYPASS" />
                ) : (
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyber-green/10 text-cyber-green border border-cyber-green/30">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>PROXY SHIELDED</span>
                  </span>
                )}

                {isCurfewActive && (
                  <StatusBadge status="frozen" label="CURFEW LOCKDOWN" />
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                <TacticalButton
                  size="sm"
                  variant={isBypassed ? 'danger' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDeviceBypass(device.id, !isBypassed);
                  }}
                  className="text-[10px]"
                >
                  {isBypassed ? (
                    <span className="flex items-center">
                      <ShieldAlert className="w-3 h-3 mr-1" />
                      RE-SECURE
                    </span>
                  ) : (
                    <span>BYPASS PROXY</span>
                  )}
                </TacticalButton>

                <TacticalButton
                  size="sm"
                  variant={isCurfewActive ? 'danger' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    freezeDevice(device.id, isCurfewActive ? 0 : 30);
                  }}
                  className="text-[10px]"
                >
                  <Moon className="w-3 h-3 mr-1" />
                  {isCurfewActive ? 'UNFREEZE' : 'FREEZE 30M'}
                </TacticalButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
