import React, { useState } from 'react';
import { useDashboard } from './context/DashboardContext.js';
import { Header } from './components/layout/Header.js';
import { CliTerminal } from './components/layout/CliTerminal.js';
import { MatrixCanvas } from './components/common/MatrixCanvas.js';
import { CrtOverlay } from './components/common/CrtOverlay.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { LoginView } from './components/auth/LoginView.js';
import { TelemetryPanel } from './components/global/TelemetryPanel.js';
import { TargetMatrix } from './components/global/TargetMatrix.js';
import { LiveStreamTable } from './components/global/LiveStreamTable.js';
import { GlobalRetentionControl } from './components/global/GlobalRetentionControl.js';
import { DeviceRoster } from './components/devices/DeviceRoster.js';
import { DeviceMonitoring } from './components/devices/DeviceMonitoring.js';
import { DeviceServiceMatrix } from './components/devices/DeviceServiceMatrix.js';
import { DeviceCustomRules } from './components/devices/DeviceCustomRules.js';
import { SplashDesigner } from './components/devices/SplashDesigner.js';
import { PhoneMockup } from './components/devices/PhoneMockup.js';
import { ConfigMatrix } from './components/config/ConfigMatrix.js';
import { QrModal } from './components/modals/QrModal.js';

export const AppContent: React.FC = () => {
  const { activeTab, telemetry, isAuthenticated } = useDashboard();
  const [isCliOpen, setIsCliOpen] = useState<boolean>(false);

  // If not authenticated, render the Cyberpunk Login portal
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-cyber-bg text-slate-100 font-mono">
      {/* Background Matrix Rain */}
      <MatrixCanvas />

      {/* CRT Scanline & Vignette Overlay */}
      <CrtOverlay />

      {/* Top Header */}
      <Header
        isCliOpen={isCliOpen}
        onToggleCli={() => setIsCliOpen((prev) => !prev)}
      />

      {/* Slide-out / Collapsible CLI Terminal */}
      <CliTerminal
        isOpen={isCliOpen}
        onClose={() => setIsCliOpen(false)}
      />

      {/* Main View Area guarded with ErrorBoundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 relative z-10">
        <ErrorBoundary fallbackTitle="GLOBAL HUD COMPONENT FAULT">
          {/* GLOBAL HUD TAB */}
          {activeTab === 'global' && (
            <div className="space-y-6 animate-fadeIn">
              <TelemetryPanel />
              <GlobalRetentionControl />
              <TargetMatrix />
              <LiveStreamTable />
            </div>
          )}

          {/* DEVICE OPS TAB */}
          {activeTab === 'devices' && (
            <div className="space-y-6 animate-fadeIn">
              <DeviceRoster />
              <DeviceMonitoring />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DeviceServiceMatrix />
                <DeviceCustomRules />
              </div>
            </div>
          )}

          {/* SPLASH STUDIO TAB */}
          {activeTab === 'splash' && (
            <div className="space-y-6 animate-fadeIn">
              <DeviceRoster />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7">
                  <SplashDesigner />
                </div>
                <div className="lg:col-span-5 flex justify-center sticky top-20">
                  <PhoneMockup />
                </div>
              </div>
            </div>
          )}

          {/* CONFIG MATRIX TAB */}
          {activeTab === 'configs' && (
            <div className="space-y-6 animate-fadeIn">
              <ConfigMatrix />
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* Onboarding QR Modal */}
      <QrModal />

      {/* Tactical Footer */}
      <footer className="border-t border-slate-900 bg-black/60 px-4 py-3 text-[11px] font-mono text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green" />
            <span>PROXY ENGINE // SECURE TLS 1.3 / DOH / WIREGUARD 51820</span>
          </div>
          <div>
            NODE: {telemetry?.system.hostname || 'vps-edge-node'} // ARCH: {telemetry?.system.platform || 'x86_64'}
          </div>
        </div>
      </footer>
    </div>
  );
};
