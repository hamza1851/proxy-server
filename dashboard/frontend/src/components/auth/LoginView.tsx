import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Terminal, ChevronRight, Lock } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { MatrixCanvas } from '../common/MatrixCanvas.js';
import { CrtOverlay } from '../common/CrtOverlay.js';

export const LoginView: React.FC = () => {
  const { login, playBeep } = useDashboard();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    playBeep(900, 0.05);

    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.error || 'Authentication denied. Verify Operator ID and Access Key.');
      }
    } catch (err: any) {
      setError(err?.message || 'Access Denied: Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-cyber-bg font-mono select-none overflow-hidden">
      {/* Background Matrix Rain */}
      <MatrixCanvas />
      {/* CRT Scanline */}
      <CrtOverlay />

      <div className="relative z-10 w-full max-w-md bg-cyber-card/95 border border-cyber-cyan/50 rounded-xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,243,255,0.25)] backdrop-blur-md">
        {/* Terminal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan mb-3 shadow-[0_0_20px_rgba(0,243,255,0.4)]">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>

          <h1 className="font-hud font-extrabold text-xl sm:text-2xl tracking-wider text-white">
            CYBER<span className="text-cyber-cyan">PROXY</span>
          </h1>
          <p className="text-xs font-mono text-cyber-green mt-1 flex items-center justify-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>OPERATOR ACCESS LEVEL 0 REQUIRED</span>
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-cyber-danger/20 border border-cyber-danger rounded text-xs text-cyber-danger flex items-center space-x-2 animate-shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center">
              <Terminal className="w-3.5 h-3.5 mr-1 text-cyber-cyan" />
              Operator ID / Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full bg-black/60 border border-slate-700 focus:border-cyber-cyan text-cyber-cyan px-3 py-2.5 rounded text-xs outline-none font-mono tracking-wider transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center">
              <KeyRound className="w-3.5 h-3.5 mr-1 text-cyber-green" />
              Access Key / Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-black/60 border border-slate-700 focus:border-cyber-green text-cyber-green px-3 py-2.5 rounded text-xs outline-none font-mono tracking-wider transition-colors"
            />
          </div>

          <TacticalButton
            type="submit"
            size="lg"
            variant="cyan"
            disabled={submitting}
            className="w-full mt-2 py-3"
          >
            {submitting ? (
              <span className="flex items-center">AUTHENTICATING...</span>
            ) : (
              <span className="flex items-center">
                INITIALIZE TERMINAL LINK <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            )}
          </TacticalButton>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500 font-mono">
            Default credentials configured via <code className="text-cyber-cyan">.env</code> // PANEL_ADMIN_USER
          </span>
        </div>
      </div>
    </div>
  );
};
