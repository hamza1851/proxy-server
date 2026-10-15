import React, { useState } from 'react';
import { Plus, X, ShieldAlert } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';

export const DeviceCustomRules: React.FC = () => {
  const { selectedDevice, updateDeviceRules } = useDashboard();
  const [newDomain, setNewDomain] = useState<string>('');

  if (!selectedDevice) return null;

  const currentRules = selectedDevice.customRules || [];

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    if (currentRules.includes(domain)) return;

    await updateDeviceRules(
      selectedDevice.id,
      selectedDevice.blockedServices || [],
      [...currentRules, domain]
    );
    setNewDomain('');
  };

  const handleRemoveDomain = async (domain: string) => {
    await updateDeviceRules(
      selectedDevice.id,
      selectedDevice.blockedServices || [],
      currentRules.filter((d) => d !== domain)
    );
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div>
          <h3 className="font-hud font-bold text-xs tracking-wider text-white">
            CUSTOM BLACKLIST // [{selectedDevice.name}]
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Explicit domains blocked only for this specific client device.
          </span>
        </div>
      </div>

      <form onSubmit={handleAddDomain} className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="e.g. roblox.com, twitch.tv..."
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          className="flex-1 bg-black/50 border border-slate-700 px-3 py-1.5 rounded text-xs font-mono text-cyber-cyan outline-none focus:border-cyber-cyan"
        />
        <TacticalButton type="submit" size="sm" variant="cyan">
          <Plus className="w-3.5 h-3.5 mr-1" />
          ADD TARGET
        </TacticalButton>
      </form>

      <div className="flex flex-wrap gap-2">
        {currentRules.length === 0 ? (
          <span className="text-xs font-mono text-slate-500 py-2">
            No custom domain restrictions configured for this target.
          </span>
        ) : (
          currentRules.map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-mono"
            >
              <ShieldAlert className="w-3 h-3 text-cyber-danger" />
              <span>{domain}</span>
              <button
                type="button"
                onClick={() => handleRemoveDomain(domain)}
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
