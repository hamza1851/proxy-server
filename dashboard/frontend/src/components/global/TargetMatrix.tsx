import React, { useState } from 'react';
import {
  Shield,
  Flame,
  Instagram,
  Youtube,
  Ban,
  Gamepad2,
  Skull,
  EyeOff,
  Plus,
  Trash2,
  Globe
} from 'lucide-react';
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
  const {
    blockedServices,
    toggleUniversalService,
    customWebsites,
    addUniversalWebsite,
    removeUniversalWebsite
  } = useDashboard();

  const [newDomain, setNewDomain] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) return;

    setSubmitting(true);
    await addUniversalWebsite(clean);
    setNewDomain('');
    setSubmitting(false);
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-4 border border-cyber-border/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-hud font-bold text-sm tracking-wider text-white">
            UNIVERSAL TARGET MATRIX // GLOBAL ENFORCEMENT
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Rules apply globally to all proxy clients unless an explicit device bypass is granted.
          </p>
        </div>
      </div>

      {/* Preset Service Cards */}
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

      {/* Universal Website Block Form & Custom List */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center space-x-2 mb-2">
          <Globe className="w-4 h-4 text-cyber-cyan" />
          <h3 className="font-hud font-bold text-xs tracking-wider text-white">
            ADD ARBITRARY DOMAIN / WEBSITE TO GLOBAL BLOCKLIST
          </h3>
        </div>

        <form onSubmit={handleAddWebsite} className="flex gap-2 mb-3">
          <input
            type="text"
            required
            placeholder="e.g. reddit.com, twitter.com, steamcommunity.com..."
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1 bg-black/50 border border-slate-700 focus:border-cyber-cyan text-cyber-cyan px-3 py-2 rounded text-xs font-mono outline-none placeholder:text-slate-600 transition-colors"
          />
          <TacticalButton
            type="submit"
            size="sm"
            variant="danger"
            disabled={submitting}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            BLOCK GLOBALLY
          </TacticalButton>
        </form>

        {/* List of Custom Added Blocked Websites */}
        {customWebsites.length > 0 && (
          <div className="bg-black/40 rounded p-2.5 border border-slate-800/80">
            <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              Active Global Custom Website Rules ({customWebsites.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {customWebsites.map((site) => (
                <span
                  key={site.domain}
                  className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-cyber-danger/10 border border-cyber-danger/40 text-cyber-danger text-xs font-mono shadow-[0_0_8px_rgba(255,0,85,0.2)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-danger animate-pulse" />
                  <span className="font-bold">{site.domain}</span>
                  <button
                    type="button"
                    onClick={() => removeUniversalWebsite(site.domain)}
                    className="hover:text-white transition-colors"
                    title="Remove global restriction"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
