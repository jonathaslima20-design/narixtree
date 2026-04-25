import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-white/60 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
