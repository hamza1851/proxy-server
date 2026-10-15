import React, { useState, useMemo } from 'react';
import {
  Database,
  Trash2,
  Search,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { StatCard } from '../common/StatCard.js';
import { formatNumber } from '../../lib/utils.js';
import { PurgeConfirmModal } from '../modals/PurgeConfirmModal.js';

export const GlobalRetentionControl: React.FC = () => {
  const {
    devices,
    monitoringStorageStats,
    refreshMonitoringStats,
    purgeGlobalLogs,
    setActiveTab
  } = useDashboard();

  const [selectedTargetId, setSelectedTargetId] = useState<string>('all');
  const [deviceSearchQuery, setDeviceSearchQuery] = useState<string>('');
  const [timeframeOption, setTimeframeOption] = useState<string>('policy'); // 'policy', '30', '7', 'all'
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const retentionDays = monitoringStorageStats?.retentionDays || 90;

  // Filtered devices based on search query
  const filteredDevices = useMemo(() => {
    if (!deviceSearchQuery.trim()) return devices;
    const query = deviceSearchQuery.toLowerCase();
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.ip.toLowerCase().includes(query) ||
        d.os.toLowerCase().includes(query)
    );
  }, [devices, deviceSearchQuery]);

  const targetDevice = useMemo(() => {
    if (selectedTargetId === 'all') return null;
    return devices.find((d) => d.id === selectedTargetId) || null;
  }, [devices, selectedTargetId]);

  const targetName = targetDevice
    ? `${targetDevice.name} [${targetDevice.ip}]`
    : 'ALL DEVICES (GLOBAL WIPE / RETENTION CYCLE)';

  const getOlderThanDays = (): number => {
    if (timeframeOption === 'all') return 0; // Wipe all
    if (timeframeOption === '30') return 30;
    if (timeframeOption === '7') return 7;
    return retentionDays; // Default configured policy
  };

  const timeframeLabel = useMemo(() => {
    if (timeframeOption === 'all') return 'ALL HISTORICAL MONITORING LOGS (COMPLETE WIPE)';
    if (timeframeOption === '30') return 'RECORDS OLDER THAN 30 DAYS (1 MONTH)';
    if (timeframeOption === '7') return 'RECORDS OLDER THAN 7 DAYS (1 WEEK)';
    return `RECORDS OLDER THAN CONFIGURED POLICY (${retentionDays} DAYS / ~3 MONTHS)`;
  }, [timeframeOption, retentionDays]);

  const recordEstimate = useMemo(() => {
    if (selectedTargetId === 'all') {
      return monitoringStorageStats?.totalRecords || 0;
    }
    const devStat = monitoringStorageStats?.devices.find((d) => d.deviceId === selectedTargetId);
    return devStat ? devStat.recordCount : 0;
  }, [selectedTargetId, monitoringStorageStats]);

  const handleExecutePurge = async () => {
    setIsExecuting(true);
    try {
      const olderThan = getOlderThanDays();
      const result = await purgeGlobalLogs({
        deviceId: selectedTargetId !== 'all' ? selectedTargetId : undefined,
        olderThanDays: olderThan
      });

      setStatusFeedback(result.message);
      setIsConfirmModalOpen(false);
      setTimeout(() => setStatusFeedback(null), 9000);
    } catch (err: any) {
      setStatusFeedback(`Execution Failed: ${err?.message || 'Server communication error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleQuickDevicePurge = (devId: string) => {
    setSelectedTargetId(devId);
    setTimeframeOption('0'); // All records for that device
    setIsConfirmModalOpen(true);
  };

  const calculateDaysAgo = (isoDate: string | null): string => {
    if (!isoDate) return 'No records stored';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const days = Math.floor(diffMs / 86400000);
    return `${days} days ago (${isoDate.slice(0, 10)})`;
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-5 border border-cyber-border/90 space-y-5">
      {/* Header & Retention Policy Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyber-cyan" />
            <span className="font-hud font-extrabold text-sm tracking-wider text-white">
              DATA RETENTION & STORAGE MANAGEMENT // DB PURGE ENGINE
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Configure automated DB retention cycles and trigger on-demand cleanup jobs across devices.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Active Retention Policy Chip */}
          <button
            onClick={() => setActiveTab('configs')}
            title="Click to modify DATA_RETENTION_DAYS in Config Matrix"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all text-xs font-mono group"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>POLICY: {retentionDays} DAYS (3 MO)</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <TacticalButton
            size="sm"
            variant="outline"
            onClick={refreshMonitoringStats}
            title="Refresh database retention metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </TacticalButton>
        </div>
      </div>

      {/* Success / Error Feedback Banner */}
      {statusFeedback && (
        <div className="p-3 bg-cyber-green/15 border border-cyber-green/50 rounded flex items-center justify-between text-cyber-green text-xs font-mono animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusFeedback}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Retention Storage Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="TOTAL RETAINED LOGS"
          value={formatNumber(monitoringStorageStats?.totalRecords || 0)}
          subValue="IN DB QUERYLOG TABLE"
          icon={<HardDrive />}
          variant="cyan"
        />

        <StatCard
          label="RETENTION POLICY"
          value={`${retentionDays} DAYS`}
          subValue="DEFAULT 3 MONTHS (EDITABLE)"
          icon={<Clock />}
          variant="green"
        />

        <StatCard
          label="EXPIRED RECORDS"
          value={formatNumber(monitoringStorageStats?.expiredRecordsCount || 0)}
          subValue={`OLDER THAN ${retentionDays} DAYS`}
          icon={<AlertTriangle />}
          variant={monitoringStorageStats?.expiredRecordsCount ? 'danger' : 'green'}
        />

        <StatCard
          label="OLDEST STORED RECORD"
          value={monitoringStorageStats?.oldestRecord ? monitoringStorageStats.oldestRecord.slice(0, 10) : 'N/A'}
          subValue={calculateDaysAgo(monitoringStorageStats?.oldestRecord || null)}
          icon={<Server />}
          variant="cyan"
        />
      </div>

      {/* Interactive Cleanup Job Console */}
      <div className="p-4 bg-black/50 border border-slate-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-hud font-bold text-xs tracking-wider text-cyber-danger flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" />
            TARGETED RETENTION PURGE RUNNER
          </h4>
          <span className="text-[11px] font-mono text-slate-500">
            Select device scope and retention horizon to execute job
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Device Search & Selection */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>TARGET DEVICE FILTER:</span>
              <span className="text-[10px] text-cyber-cyan">{filteredDevices.length} available</span>
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search device by name or IP..."
                value={deviceSearchQuery}
                onChange={(e) => setDeviceSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded pl-8 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan"
              />
            </div>

            {/* Device Dropdown Selector */}
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan mt-1"
            >
              <option value="all">⚡ ALL CONNECTED DEVICES (GLOBAL SWEEP)</option>
              {filteredDevices.map((d) => {
                const count = monitoringStorageStats?.devices.find((s) => s.deviceId === d.id)?.recordCount || 0;
                return (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip}) — {count} logs
                  </option>
                );
              })}
            </select>
          </div>

          {/* Retention Timeframe Action Selector */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-mono text-slate-400">
              RETENTION HORIZON / EXPIRY:
            </label>
            <select
              value={timeframeOption}
              onChange={(e) => setTimeframeOption(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
            >
              <option value="policy">
                Older than Configured Retention ({retentionDays} Days) [Default]
              </option>
              <option value="30">Older than 30 Days (1 Month)</option>
              <option value="7">Older than 7 Days (1 Week)</option>
              <option value="all">⚠️ PURGE ALL DATA (Complete Wipe for Target)</option>
            </select>
          </div>

          {/* Execution Button */}
          <div className="md:col-span-3">
            <TacticalButton
              variant="danger"
              size="md"
              className="w-full py-2.5 shadow-[0_0_15px_rgba(255,0,85,0.3)] flex items-center justify-center font-bold"
              onClick={() => setIsConfirmModalOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              EXECUTE PURGE JOB
            </TacticalButton>
          </div>
        </div>
      </div>

      {/* Per-Device Storage Breakdown Matrix */}
      <div className="space-y-2">
        <h4 className="font-hud font-bold text-xs tracking-wider text-slate-300 flex items-center">
          <HardDrive className="w-3.5 h-3.5 mr-2 text-cyber-cyan" />
          DEVICE RETENTION STORAGE BREAKDOWN
        </h4>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Device Name</th>
                <th className="py-2.5 px-3">Assigned IP</th>
                <th className="py-2.5 px-3">Retained Logs</th>
                <th className="py-2.5 px-3">Storage Status</th>
                <th className="py-2.5 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-black/30">
              {(monitoringStorageStats?.devices || []).map((devStat) => (
                <tr key={devStat.deviceId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 px-3 font-semibold text-white">
                    {devStat.deviceName}
                  </td>
                  <td className="py-2 px-3 text-slate-400">
                    {devStat.clientIp}
                  </td>
                  <td className="py-2 px-3 font-bold text-cyber-cyan">
                    {formatNumber(devStat.recordCount)} records
                  </td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyber-green/10 text-cyber-green border border-cyber-green/30">
                      RETAINED &bull; 3 MO POLICY
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <TacticalButton
                      size="sm"
                      variant="outline"
                      className="text-[10px] py-1 border-cyber-danger/40 text-cyber-danger hover:bg-cyber-danger/10"
                      onClick={() => handleQuickDevicePurge(devStat.deviceId)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      DROP DATA
                    </TacticalButton>
                  </td>
                </tr>
              ))}
              {(monitoringStorageStats?.devices || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 font-mono text-xs">
                    No device storage records found in database tables.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <PurgeConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecutePurge}
        targetName={targetName}
        timeframeLabel={timeframeLabel}
        isTotalWipe={timeframeOption === 'all'}
        isExecuting={isExecuting}
        recordEstimate={recordEstimate}
      />
    </div>
  );
};
