import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { CustomSplashConfig } from '../../types/index.js';

export const SplashDesigner: React.FC = () => {
  const { selectedDevice, updateDeviceSplash } = useDashboard();

  const [form, setForm] = useState<CustomSplashConfig>({
    enabled: true,
    title: 'ACCESS RESTRICTED BY CYBER OPERATOR',
    badge: '⛔',
    message: 'This domain violates proxy policy. Return to authorized terminals.',
    imageUrl: ''
  });

  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (selectedDevice?.customSplash) {
      setForm(selectedDevice.customSplash);
    }
  }, [selectedDevice]);

  if (!selectedDevice) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDeviceSplash(selectedDevice.id, form);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setForm({
      enabled: true,
      title: 'ACCESS RESTRICTED BY CYBER OPERATOR',
      badge: '⛔',
      message: 'This domain violates proxy policy. Return to authorized terminals.',
      imageUrl: ''
    });
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-5 border border-cyber-border/80">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="font-hud font-bold text-sm tracking-wider text-white flex items-center">
            <Palette className="w-4 h-4 mr-2 text-cyber-cyan" />
            SPLASH DESIGNER // [{selectedDevice.name}]
          </h2>
          <span className="text-[10px] font-mono text-slate-400">
            Configure the lockout screen served when this device attempts to reach blocked nodes.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <TacticalButton
            size="sm"
            variant="outline"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            RESET
          </TacticalButton>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Toggle Enabled */}
        <div className="flex items-center justify-between p-3 rounded bg-black/40 border border-slate-800">
          <div>
            <div className="text-xs font-mono font-bold text-white">
              CUSTOM SPLASH PAGE STATUS
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              When disabled, browser displays generic DNS NXDOMAIN instead of customized portal.
            </div>
          </div>
          <TacticalButton
            type="button"
            size="sm"
            variant={form.enabled ? 'success' : 'danger'}
            onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
          >
            {form.enabled ? 'ACTIVE // SERVING' : 'DISABLED'}
          </TacticalButton>
        </div>

        {/* Emoji Badge & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Badge / Emoji
            </label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="w-full bg-black/50 border border-slate-700 px-3 py-2 rounded text-center text-xl outline-none focus:border-cyber-cyan"
              maxLength={4}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Lockout Header Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-black/50 border border-slate-700 px-3 py-2 rounded text-xs font-mono text-cyber-cyan outline-none focus:border-cyber-cyan"
            />
          </div>
        </div>

        {/* Custom Message */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Enforcement Warning Message
          </label>
          <textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full bg-black/50 border border-slate-700 px-3 py-2 rounded text-xs font-mono text-slate-300 outline-none focus:border-cyber-cyan"
          />
        </div>

        {/* Custom Image URL */}
        <div>
          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
            Optional Image URL (Cyber Badge / Warning Banner)
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/photo-..."
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            className="w-full bg-black/50 border border-slate-700 px-3 py-2 rounded text-xs font-mono text-slate-300 outline-none focus:border-cyber-cyan"
          />
        </div>

        {/* Save & Feedback */}
        <div className="flex items-center justify-between pt-2">
          {savedNotice ? (
            <span className="flex items-center text-xs font-mono text-cyber-green">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              CONFIG DEPLOYED TO EDGE SERVERS
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-500">
              Changes reflect instantly in the mobile preview simulation.
            </span>
          )}

          <TacticalButton type="submit" size="md" variant="cyan">
            <Sparkles className="w-4 h-4 mr-1.5" />
            DEPLOY TO DEVICE
          </TacticalButton>
        </div>
      </form>
    </div>
  );
};
