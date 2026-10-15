import React from 'react';
import { cn } from '../../lib/utils.js';
import { useDashboard } from '../../context/DashboardContext.js';

interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  children,
  className,
  variant = 'cyan',
  size = 'md',
  active = false,
  onClick,
  disabled,
  ...props
}) => {
  const { playBeep } = useDashboard();

  const baseStyles =
    'relative inline-flex items-center justify-center font-mono font-bold tracking-wider uppercase transition-all duration-200 select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 rounded',
    md: 'text-xs px-3.5 py-1.5 rounded',
    lg: 'text-sm px-5 py-2.5 rounded-md'
  }[size];

  const variantStyles = {
    cyan: active
      ? 'bg-cyber-cyan text-cyber-bg shadow-[0_0_15px_rgba(0,243,255,0.6)] border border-cyber-cyan'
      : 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/40 hover:bg-cyber-cyan/25 hover:border-cyber-cyan hover:shadow-[0_0_12px_rgba(0,243,255,0.4)]',
    danger: active
      ? 'bg-cyber-danger text-white shadow-[0_0_15px_rgba(255,0,85,0.7)] border border-cyber-danger'
      : 'bg-cyber-danger/10 text-cyber-danger border border-cyber-danger/40 hover:bg-cyber-danger/25 hover:border-cyber-danger hover:shadow-[0_0_12px_rgba(255,0,85,0.5)]',
    success: active
      ? 'bg-cyber-green text-cyber-bg shadow-[0_0_15px_rgba(0,255,136,0.6)] border border-cyber-green'
      : 'bg-cyber-green/10 text-cyber-green border border-cyber-green/40 hover:bg-cyber-green/25 hover:border-cyber-green hover:shadow-[0_0_12px_rgba(0,255,136,0.4)]',
    outline:
      'bg-transparent text-slate-300 border border-slate-700 hover:border-cyber-cyan hover:text-cyber-cyan',
    ghost:
      'bg-transparent text-slate-400 hover:text-cyber-green hover:bg-cyber-green/5'
  }[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playBeep(variant === 'danger' ? 400 : 900, 0.04);
      onClick?.(e);
    }
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles, variantStyles, className)}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
