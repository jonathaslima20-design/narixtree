import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  const variants = {
    hot: 'bg-red-500/10 text-red-300 border border-red-500/20',
    warm: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    cold: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    warning: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20',
    error: 'bg-red-500/10 text-red-300 border border-red-500/20',
    neutral: 'bg-white/[0.06] text-white/70 border border-white/10',
    info: 'bg-sky-500/10 text-sky-300 border border-sky-500/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
