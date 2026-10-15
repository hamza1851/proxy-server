import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, Shield, Download } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';

export const QrModal: React.FC = () => {
  const { qrModalOpen, setQrModalOpen, selectedDevice } = useDashboard();
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!qrModalOpen) return null;

  const wireguardConfig = `[Interface]
PrivateKey = aAAA...YOUR_DEVICE_PRIVATE_KEY...
Address = ${selectedDevice?.ip || '10.8.0.2'}/24
DNS = 10.8.0.1

[Peer]
PublicKey = bBBB...SERVER_PUBLIC_KEY...
Endpoint = YOUR_VPS_IP:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25`;

  const dohUrl = 'https://YOUR_VPS_IP/dns-query';

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-cyber-bg border border-cyber-cyan/40 rounded-xl p-5 shadow-[0_0_35px_rgba(0,243,255,0.3)] text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-cyber-cyan font-hud font-bold text-sm tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>CLIENT ONBOARDING // [{selectedDevice?.name || 'NEW DEVICE'}]</span>
          </div>
          <button
            onClick={() => setQrModalOpen(false)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* QR Code Placeholder / SVG */}
          <div className="flex flex-col items-center justify-center p-4 rounded bg-black border border-slate-800">
            <div className="w-44 h-44 bg-white p-2 rounded flex items-center justify-center shadow-lg">
              {/* High-res clean QR simulation */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  wireguardConfig
                )}`}
                alt="WireGuard Setup QR"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-2 text-center">
              Scan via WireGuard mobile application
            </span>
          </div>

          {/* Configuration and copy links */}
          <div className="flex flex-col justify-between space-y-3">
            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Encrypted DNS (DoH / iOS Profile)
              </span>
              <div className="flex items-center justify-between bg-black/60 border border-slate-700 p-2 rounded">
                <span className="truncate text-cyber-green text-[11px] mr-2">
                  {dohUrl}
                </span>
                <button
                  onClick={() => copyToClipboard(dohUrl, 'doh')}
                  className="text-slate-400 hover:text-white"
                  title="Copy DoH"
                >
                  {copiedType === 'doh' ? (
                    <Check className="w-3.5 h-3.5 text-cyber-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                WireGuard Client File
              </span>
              <div className="bg-black/60 border border-slate-700 p-2 rounded text-[10px] text-slate-400 h-24 overflow-y-auto font-mono">
                {wireguardConfig}
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <TacticalButton
                size="sm"
                variant="cyan"
                className="flex-1"
                onClick={() => copyToClipboard(wireguardConfig, 'wg')}
              >
                {copiedType === 'wg' ? (
                  <Check className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                COPY CONFIG
              </TacticalButton>

              <TacticalButton
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const blob = new Blob([wireguardConfig], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedDevice?.name || 'client'}.conf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                DOWNLOAD
              </TacticalButton>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center">
            <Shield className="w-3 h-3 text-cyber-green mr-1" />
            256-bit ChaCha20-Poly1305 End-to-End Encryption
          </span>
          <span className="text-cyber-cyan">Assigned IP: {selectedDevice?.ip || '10.8.0.2'}</span>
        </div>
      </div>
    </div>
  );
};
