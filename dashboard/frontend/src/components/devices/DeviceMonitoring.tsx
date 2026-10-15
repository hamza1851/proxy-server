import React from 'react';
import { Eye, ShieldAlert, Moon, Clock, TrendingUp } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { StatCard } from '../common/StatCard.js';
import { formatNumber } from '../../lib/utils.js';

export const DeviceMonitoring: React.FC = () => {
  const { selectedDevice, selectedMonitoring, freezeDevice } = useDashboard();

  if (!selectedDevice) {
    return (
      <div className="bg-cyber-card/90 rounded-lg p-6 border border-cyber-border text-center text-slate-500 font-mono text-xs">
        SELECT A TARGET DEVICE FROM THE ROSTER TO VIEW TELEMETRY
      </div>
    );
  }

  const isCurfewActive = selectedDevice.curfew?.active;

  return (
    <div className="space-y-4">
      {/* Target Header & Curfew Control */}
      <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyber-cyan font-bold">TARGET MONITOR:</span>
            <span className="font-hud font-extrabold text-white text-base">
              {selectedDevice.name}
            </span>
            <span className="text-xs font-mono text-slate-400">({selectedDevice.ip})</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Individual user-level telemetry and enforcement controls.
          </p>
        </div>

        {/* Curfew Freeze Actions */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 flex items-center">
            <Moon className="w-3.5 h-3.5 mr-1 text-cyber-purple" />
            CURFEW:
          </span>
          <TacticalButton
            size="sm"
            variant={isCurfewActive ? 'danger' : 'outline'}
            onClick={() => freezeDevice(selectedDevice.id, 15)}
          >
            15M
          </TacticalButton>
          <TacticalButton
            size="sm"
            variant={isCurfewActive ? 'danger' : 'outline'}
            onClick={() => freezeDevice(selectedDevice.id, 30)}
          >
            30M
          </TacticalButton>
          <TacticalButton
            size="sm"
            variant={isCurfewActive ? 'danger' : 'outline'}
            onClick={() => freezeDevice(selectedDevice.id, 60)}
          >
            1H
          </TacticalButton>
          {isCurfewActive && (
            <TacticalButton
              size="sm"
              variant="cyan"
              onClick={() => freezeDevice(selectedDevice.id, 0)}
            >
              LIFT FREEZE
            </TacticalButton>
          )}
        </div>
      </div>

      {/* Target Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="24H REQUESTS"
          value={formatNumber(selectedMonitoring?.totalRequests24h || 3420)}
          subValue="DNS RESOLUTIONS"
          icon={<Eye />}
          variant="cyan"
        />

        <StatCard
          label="24H BLOCKED"
          value={formatNumber(selectedMonitoring?.blockedRequests24h || 890)}
          subValue="THREATS / RULES"
          icon={<ShieldAlert />}
          variant="danger"
        />

        <StatCard
          label="PROXY MODE"
          value={selectedDevice.bypassed ? 'CARRIER DIRECT' : 'PROXY SECURED'}
          subValue={selectedDevice.bypassed ? 'Zero Filtration' : 'Encrypted DoH'}
          icon={<TrendingUp />}
          variant={selectedDevice.bypassed ? 'danger' : 'green'}
        />

        <StatCard
          label="LOCKDOWN STATUS"
          value={isCurfewActive ? 'ACTIVE FREEZE' : 'UNRESTRICTED'}
          subValue={
            selectedDevice.curfew?.manualFreezeUntil
              ? `Until ${new Date(selectedDevice.curfew.manualFreezeUntil).toLocaleTimeString()}`
              : 'Curfew Schedule: 23:00 - 06:00'
          }
          icon={<Clock />}
          variant={isCurfewActive ? 'purple' : 'green'}
        />
      </div>

      {/* Top Queried & Top Blocked Domains Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Queried Domains */}
        <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
          <h3 className="font-hud font-bold text-xs tracking-wider text-cyber-cyan mb-2.5 flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyber-cyan mr-2" />
            TOP QUERIED DOMAINS // 24H
          </h3>
          <div className="space-y-1.5">
            {(selectedMonitoring?.topQueried || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-mono p-2 rounded bg-black/40 border border-slate-800/80"
              >
                <span className="text-slate-300 truncate max-w-[220px]">
                  {item.domain}
                </span>
                <span className="text-cyber-cyan font-bold">
                  {formatNumber(item.count)} queries
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Blocked Domains */}
        <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
          <h3 className="font-hud font-bold text-xs tracking-wider text-cyber-danger mb-2.5 flex items-center">
            <span className="w-2 h-2 rounded-full bg-cyber-danger mr-2" />
            TOP BLOCKED DOMAINS // 24H
          </h3>
          <div className="space-y-1.5">
            {(selectedMonitoring?.topBlocked || []).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs font-mono p-2 rounded bg-cyber-danger/5 border border-cyber-danger/30"
              >
                <span className="text-slate-300 truncate max-w-[220px]">
                  {item.domain}
                </span>
                <span className="text-cyber-danger font-bold">
                  {formatNumber(item.count)} blocked
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
