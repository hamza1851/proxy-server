import React, { useState } from 'react';
import { Activity, Filter, ShieldAlert } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { TacticalButton } from '../common/TacticalButton.js';

export const LiveStreamTable: React.FC = () => {
  const { queries, devices, selectedDevice, updateDeviceRules } = useDashboard();
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredQueries = queries.filter((q) => {
    if (deviceFilter !== 'all' && q.clientIp !== deviceFilter) {
      return false;
    }
    if (searchTerm && !q.question.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleQuickBlock = async (domain: string) => {
    if (!selectedDevice) return;
    const current = selectedDevice.customRules || [];
    if (!current.includes(domain)) {
      await updateDeviceRules(selectedDevice.id, selectedDevice.blockedServices || [], [...current, domain]);
    }
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyber-green animate-pulse" />
          <div>
            <h2 className="font-hud font-bold text-sm tracking-wider text-white">
              LIVE TELEMETRY STREAM // ENCRYPTED TRAFFIC FEED
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              Real-time query analysis over encrypted DNS tunnel
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 bg-black/40 border border-slate-700 px-2.5 py-1 rounded">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-cyber-cyan outline-none border-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">ALL DEVICES</option>
              {devices.map((d) => (
                <option key={d.id} value={d.ip} className="bg-slate-900 text-white">
                  {d.name} ({d.ip})
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Search domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/40 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-cyber-cyan outline-none placeholder:text-slate-600 w-32 sm:w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <th className="py-2 px-3">Time</th>
              <th className="py-2 px-3">Client</th>
              <th className="py-2 px-3">Domain</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Filter Reason</th>
              <th className="py-2 px-3">Latency</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredQueries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-slate-500 font-mono">
                  No telemetry logged matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredQueries.map((entry) => {
                const formattedTime = new Date(entry.time).toLocaleTimeString();
                const isBlocked = entry.status === 'blocked';

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {formattedTime}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">
                        {entry.clientName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {entry.clientIp}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-cyber-cyan font-bold break-all max-w-xs">
                      {entry.question}
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge
                        status={isBlocked ? 'blocked' : 'allowed'}
                        label={isBlocked ? 'DROPPED' : 'RESOLVED'}
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                      {entry.reason || 'Upstream Root'}
                    </td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {entry.elapsedMs}ms
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {!isBlocked && (
                        <TacticalButton
                          size="sm"
                          variant="danger"
                          onClick={() => handleQuickBlock(entry.question)}
                          title="Block this domain on selected device"
                        >
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          BLOCK
                        </TacticalButton>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
