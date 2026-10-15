import React from 'react';
import { Flame, Instagram, Youtube, Shield, Ban, Skull, Gamepad2, EyeOff } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';

const DEVICE_SERVICES = [
  { id: 'tiktok', name: 'TikTok', icon: <Flame className="w-4 h-4 text-[#ff0050]" /> },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4 text-[#e1306c]" /> },
  { id: 'youtube', name: 'YouTube Shorts', icon: <Youtube className="w-4 h-4 text-[#ff0000]" /> },
  { id: 'facebook', name: 'Meta / Facebook', icon: <Shield className="w-4 h-4 text-[#1877f2]" /> },
  { id: 'adult', name: 'Adult / NSFW', icon: <Ban className="w-4 h-4 text-[#ff0055]" /> },
  { id: 'gambling', name: 'Gambling', icon: <Skull className="w-4 h-4 text-[#ffaa00]" /> },
  { id: 'gaming', name: 'Online Games', icon: <Gamepad2 className="w-4 h-4 text-[#00f3ff]" /> },
  { id: 'trackers', name: 'Telemetry Filters', icon: <EyeOff className="w-4 h-4 text-[#00ff88]" /> }
];

export const DeviceServiceMatrix: React.FC = () => {
  const { selectedDevice, toggleDeviceService } = useDashboard();

  if (!selectedDevice) return null;

  const currentBlocked = selectedDevice.blockedServices || [];

  return (
    <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div>
          <h3 className="font-hud font-bold text-xs tracking-wider text-white">
            TARGET-SPECIFIC RESTRICTION MATRIX // [{selectedDevice.name}]
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Rules applied exclusively to this device. Overrides global defaults.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {DEVICE_SERVICES.map((srv) => {
          const isBlocked = currentBlocked.includes(srv.id);

          return (
            <div
              key={srv.id}
              className={`p-2.5 rounded border transition-colors flex items-center justify-between ${
                isBlocked
                  ? 'bg-cyber-danger/10 border-cyber-danger/50 text-white'
                  : 'bg-black/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2">
                {srv.icon}
                <span className="text-xs font-hud truncate max-w-[90px]">
                  {srv.name}
                </span>
              </div>

              <TacticalButton
                size="sm"
                variant={isBlocked ? 'danger' : 'outline'}
                onClick={() => toggleDeviceService(selectedDevice.id, srv.id)}
                className="text-[9px] px-2 py-0.5"
              >
                {isBlocked ? 'BLOCK' : 'ALLOW'}
              </TacticalButton>
            </div>
          );
        })}
      </div>
    </div>
  );
};
