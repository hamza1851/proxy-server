import React from 'react';
import { Cpu, HardDrive, Clock, ShieldX, Radio, AlertOctagon } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { StatCard } from '../common/StatCard.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { formatNumber, formatUptime } from '../../lib/utils.js';

export const TelemetryPanel: React.FC = () => {
  const { telemetry, toggleKillswitch } = useDashboard();

  const isKillswitchActive = Boolean(telemetry?.emergencyKillswitch);

  return (
    <div className="space-y-4">
      {/* Killswitch Alert Banner if engaged */}
      {isKillswitchActive && (
        <div className="bg-cyber-danger/20 border-2 border-cyber-danger text-cyber-danger p-4 rounded-lg flex items-center justify-between animate-pulse shadow-[0_0_25px_rgba(255,0,85,0.4)]">
          <div className="flex items-center space-x-3">
            <AlertOctagon className="w-8 h-8 flex-shrink-0" />
            <div>
              <div className="font-hud font-extrabold text-sm tracking-wider">
                EMERGENCY MASTER KILLSWITCH ENGAGED
              </div>
              <div className="text-xs font-mono text-slate-300">
                All external DNS egress is hard-dropped. Zero traffic passes outside the encrypted perimeter.
              </div>
            </div>
          </div>
          <TacticalButton
            variant="danger"
            size="md"
            onClick={toggleKillswitch}
          >
            DISENGAGE
          </TacticalButton>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="CPU LOAD"
          value={`${telemetry?.system.cpuUsage || 0}%`}
          subValue={telemetry?.system.platform || 'Linux'}
          icon={<Cpu />}
          variant="cyan"
        />

        <StatCard
          label="RAM USAGE"
          value={`${telemetry?.system.memoryUsage.percentage || 0}%`}
          subValue={`${telemetry?.system.memoryUsage.used || 0} MB / ${telemetry?.system.memoryUsage.total || 0} MB`}
          icon={<HardDrive />}
          variant="cyan"
        />

        <StatCard
          label="PROXY UPTIME"
          value={formatUptime(telemetry?.system.uptime || 0)}
          subValue="STABLE // CORE 1"
          icon={<Clock />}
          variant="green"
        />

        <StatCard
          label="TOTAL QUERIES"
          value={formatNumber(telemetry?.dns.totalQueries || 0)}
          subValue={`${telemetry?.dns.avgLatencyMs || 12}ms AVG`}
          icon={<Radio />}
          variant="cyan"
        />

        <StatCard
          label="BLOCKED RATE"
          value={`${telemetry?.dns.blockRate || 0}%`}
          subValue={`${formatNumber(telemetry?.dns.blockedQueries || 0)} DROPPED`}
          icon={<ShieldX />}
          variant="danger"
        />

        {/* Master Killswitch Button Card */}
        <div className="bg-cyber-card/90 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-slate-400">
              KILLSWITCH
            </span>
            <AlertOctagon className={`w-4 h-4 ${isKillswitchActive ? 'text-cyber-danger animate-ping' : 'text-slate-600'}`} />
          </div>

          <div className="my-1">
            <TacticalButton
              variant="danger"
              size="sm"
              active={isKillswitchActive}
              className="w-full text-[11px] py-2"
              onClick={toggleKillswitch}
            >
              {isKillswitchActive ? 'KILLSWITCH ACTIVE' : 'ENGAGE KILLSWITCH'}
            </TacticalButton>
          </div>
          <span className="text-[9px] font-mono text-slate-500 text-center">
            Zero-leak fail-safe
          </span>
        </div>
      </div>
    </div>
  );
};
