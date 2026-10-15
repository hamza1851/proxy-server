import React from 'react';
import { cn } from '../../lib/utils.js';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'green' | 'cyan' | 'danger' | 'purple';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'cyan',
  className
}) => {
  const borderColors = {
    green: 'border-cyber-green/30 hover:border-cyber-green/70 group-hover:shadow-[0_0_15px_rgba(0,255,136,0.25)]',
    cyan: 'border-cyber-cyan/30 hover:border-cyber-cyan/70 group-hover:shadow-[0_0_15px_rgba(0,243,255,0.25)]',
    danger: 'border-cyber-danger/30 hover:border-cyber-danger/70 group-hover:shadow-[0_0_15px_rgba(255,0,85,0.25)]',
    purple: 'border-cyber-purple/30 hover:border-cyber-purple/70 group-hover:shadow-[0_0_15px_rgba(157,0,255,0.25)]'
  }[variant];

  const textColors = {
    green: 'text-cyber-green',
    cyan: 'text-cyber-cyan',
    danger: 'text-cyber-danger',
    purple: 'text-cyber-purple'
  }[variant];

  return (
    <div
      className={cn(
        'group relative bg-cyber-card/90 backdrop-blur-md rounded-lg p-4 border transition-all duration-300',
        borderColors,
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono tracking-widest uppercase text-slate-400">
          {label}
        </span>
        {icon && <span className={cn('text-lg opacity-80', textColors)}>{icon}</span>}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className={cn('text-2xl font-hud font-bold tracking-tight', textColors)}>
          {value}
        </span>
        {subValue && (
          <span className="text-xs font-mono text-slate-400 truncate">
            {subValue}
          </span>
        )}
      </div>

      {/* Decorative cyber corner tick */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-slate-600 opacity-60" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-slate-600 opacity-60" />
    </div>
  );
};
