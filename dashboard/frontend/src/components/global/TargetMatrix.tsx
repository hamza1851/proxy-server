import React from 'react';
import { Shield, Flame, Instagram, Youtube, Ban, Gamepad2, Skull, EyeOff } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
}

const GLOBAL_SERVICES: ServiceItem[] = [
  { id: 'tiktok', name: 'TikTok', category: 'Distraction', icon: <Flame className="w-4 h-4 text-[#ff0050]" /> },
  { id: 'instagram', name: 'Instagram', category: 'Social Feed', icon: <Instagram className="w-4 h-4 text-[#e1306c]" /> },
  { id: 'youtube', name: 'YouTube Shorts', category: 'Video Stream', icon: <Youtube className="w-4 h-4 text-[#ff0000]" /> },
  { id: 'facebook', name: 'Facebook & Meta', category: 'Social Network', icon: <Shield className="w-4 h-4 text-[#1877f2]" /> },
  { id: 'adult', name: 'Adult & NSFW', category: 'Safety Protocol', icon: <Ban className="w-4 h-4 text-[#ff0055]" /> },
  { id: 'gambling', name: 'Gambling & Bets', category: 'Financial Risk', icon: <Skull className="w-4 h-4 text-[#ffaa00]" /> },
  { id: 'gaming', name: 'Online Gaming', category: 'Bandwidth Drain', icon: <Gamepad2 className="w-4 h-4 text-[#00f3ff]" /> },
  { id: 'trackers', name: 'Telemetry & Ads', category: 'Privacy Shields', icon: <EyeOff className="w-4 h-4 text-[#00ff88]" /> }
];

export const TargetMatrix: React.FC = () => {
  const { blockedServices, toggleUniversalService } = useDashboard();

  return (
    <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div>
          <h2 className="font-hud font-bold text-sm tracking-wider text-white">
            UNIVERSAL TARGET MATRIX // GLOBAL ENFORCEMENT
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Rules apply globally to all proxy clients unless an explicit device bypass is granted.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {GLOBAL_SERVICES.map((srv) => {
          const isBlocked = blockedServices.includes(srv.id);

          return (
            <div
              key={srv.id}
              className={`p-3 rounded border transition-all duration-200 flex flex-col justify-between ${
                isBlocked
                  ? 'bg-cyber-danger/10 border-cyber-danger/60 shadow-[0_0_12px_rgba(255,0,85,0.2)]'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded bg-black/40">{srv.icon}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isBlocked
                      ? 'bg-cyber-danger text-white font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isBlocked ? 'BLOCKED' : 'PASS'}
                </span>
              </div>

              <div>
                <div className="font-hud font-semibold text-xs text-white truncate">
                  {srv.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mb-2">
                  {srv.category}
                </div>
              </div>

              <TacticalButton
                size="sm"
                variant={isBlocked ? 'danger' : 'outline'}
                onClick={() => toggleUniversalService(srv.id)}
                className="w-full text-[10px]"
              >
                {isBlocked ? 'UNRESTRICT' : 'RESTRICT'}
              </TacticalButton>
            </div>
          );
        })}
      </div>
    </div>
  );
};
