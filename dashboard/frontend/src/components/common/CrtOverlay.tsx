import React from 'react';
import { useDashboard } from '../../context/DashboardContext.js';

export const CrtOverlay: React.FC = () => {
  const { crtEnabled } = useDashboard();
  if (!crtEnabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="crt-scanlines absolute inset-0" />
      <div className="crt-vignette absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
    </div>
  );
};
