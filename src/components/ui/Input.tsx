import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-white/70 tracking-wide">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 text-sm text-white bg-white/[0.04]
              border rounded-xl outline-none transition-all duration-200
              placeholder:text-white/30
              focus:bg-white/[0.06] focus:ring-2 focus:ring-white/20 focus:border-white/20
              disabled:bg-white/[0.02] disabled:text-white/30
              ${error ? 'border-red-400/60 focus:ring-red-500/30' : 'border-white/10 hover:border-white/15'}
              ${icon ? 'pl-10' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-white/40">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
