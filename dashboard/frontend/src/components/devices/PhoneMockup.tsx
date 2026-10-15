import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';

export const PhoneMockup: React.FC = () => {
  const { selectedDevice } = useDashboard();

  const splash = selectedDevice?.customSplash || {
    enabled: true,
    title: 'ACCESS RESTRICTED BY CYBER OPERATOR',
    badge: '⛔',
    message: 'This domain violates proxy policy. Return to authorized terminals.',
    imageUrl: ''
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-mono uppercase text-slate-400 mb-2 flex items-center">
        <span className="w-2 h-2 rounded-full bg-cyber-green mr-2 animate-ping" />
        LIVE TARGET PHONE VIEWPORT // [{selectedDevice?.name || 'SIMULATOR'}]
      </div>

      {/* Cyber Smartphone Bezel */}
      <div className="relative w-[300px] sm:w-[320px] h-[580px] bg-black border-4 border-slate-700 rounded-[38px] shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_15px_rgba(0,243,255,0.2)] p-3 flex flex-col justify-between overflow-hidden">
        {/* Dynamic Island / Speaker Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
          <div className="w-8 h-1 rounded-full bg-slate-800" />
        </div>

        {/* Smartphone Screen Content */}
        <div className="relative w-full h-full bg-[#030712] rounded-[28px] overflow-hidden flex flex-col border border-slate-800/80">
          {/* iOS Top Status Bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 text-[10px] font-mono text-slate-400 select-none z-10">
            <span>09:41</span>
            <div className="flex items-center space-x-1.5">
              <Signal className="w-3 h-3 text-cyber-green" />
              <Wifi className="w-3 h-3 text-cyber-cyan" />
              <BatteryMedium className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>

          {/* Browser Address Bar */}
          <div className="px-4 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span className="text-cyber-green">🔒</span>
            <span className="text-slate-300 truncate">https://restricted-node.local</span>
          </div>

          {/* Splash Content Viewport */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-center relative">
            {/* Background subtle grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {!splash.enabled ? (
              <div className="text-slate-500 font-mono text-xs">
                [NXDOMAIN // GENERIC LOOKUP FAILURE]
              </div>
            ) : (
              <div className="relative z-10 w-full space-y-3">
                <span className="text-4xl block animate-bounce">
                  {splash.badge || '⛔'}
                </span>

                <h2 className="font-hud font-bold text-xs text-cyber-danger tracking-wider leading-snug">
                  {splash.title || 'SECURITY LOCKOUT'}
                </h2>

                <div className="inline-block bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-[10px] px-2 py-0.5 rounded font-mono">
                  TARGET: tiktok.com
                </div>

                {splash.imageUrl && (
                  <div className="w-full h-24 rounded overflow-hidden border border-slate-800 my-2">
                    <img
                      src={splash.imageUrl}
                      alt="Restricted notice"
                      className="w-full h-full object-cover"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  </div>
                )}

                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  {splash.message || 'Access denied by network policy.'}
                </p>

                <div className="pt-3 border-t border-slate-800/80 text-[9px] font-mono text-slate-600 flex justify-between">
                  <span>DEV: {selectedDevice?.name || 'PHONE'}</span>
                  <span>IP: {selectedDevice?.ip || '10.8.0.2'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Home Indicator Bar */}
          <div className="py-2 flex justify-center">
            <div className="w-28 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
