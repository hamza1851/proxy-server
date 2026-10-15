import React from 'react';
import { cn } from '../../lib/utils.js';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'bypassed' | 'frozen' | 'allowed' | 'blocked';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const configs = {
    online: {
      text: label || 'ONLINE',
      classes: 'bg-cyber-green/10 text-cyber-green border-cyber-green/40 shadow-[0_0_8px_rgba(0,255,136,0.2)]',
      dot: 'bg-cyber-green animate-pulse'
    },
    offline: {
      text: label || 'OFFLINE',
      classes: 'bg-slate-800 text-slate-400 border-slate-700',
      dot: 'bg-slate-500'
    },
    bypassed: {
      text: label || 'CARRIER BYPASS',
      classes: 'bg-cyber-danger/10 text-cyber-danger border-cyber-danger/40 shadow-[0_0_8px_rgba(255,0,85,0.25)]',
      dot: 'bg-cyber-danger'
    },
    frozen: {
      text: label || 'CURFEW ACTIVE',
      classes: 'bg-cyber-purple/15 text-cyber-purple border-cyber-purple/50 shadow-[0_0_8px_rgba(157,0,255,0.3)]',
      dot: 'bg-cyber-purple animate-ping'
    },
    allowed: {
      text: label || 'ALLOWED',
      classes: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30',
      dot: 'bg-cyber-cyan'
    },
    blocked: {
      text: label || 'BLOCKED',
      classes: 'bg-cyber-danger/10 text-cyber-danger border-cyber-danger/40',
      dot: 'bg-cyber-danger'
    }
  }[status];

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border',
        configs.classes,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', configs.dot)} />
      <span>{configs.text}</span>
    </span>
  );
};
