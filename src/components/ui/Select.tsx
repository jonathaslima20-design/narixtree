import { useEffect, useLayoutEffect, useRef, useState, ReactNode, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: ReactNode;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md', { trigger: string; rounded: string; text: string }> = {
  sm: { trigger: 'py-1.5 pl-3 pr-7 text-xs', rounded: 'rounded-lg', text: 'text-xs' },
  md: { trigger: 'py-2.5 pl-3 pr-8 text-sm', rounded: 'rounded-2xl', text: 'text-sm' },
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  leftIcon,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number; placement: 'bottom' | 'top' }>({ top: 0, left: 0, width: 0, placement: 'bottom' });

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const sizeCfg = SIZE_CLASSES[size];

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = Math.min(options.length * 36 + 8, 256);
    const placement = spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    setPanelStyle({
      top: placement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
      left: rect.left,
      width: rect.width,
      placement,
    });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => Math.min(options.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusIndex >= 0 && focusIndex < options.length) {
          onChange(options[focusIndex].value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, focusIndex, options, onChange]);

  const handleToggle = () => {
    if (disabled) return;
    if (!open) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusIndex(idx >= 0 ? idx : 0);
    }
    setOpen((o) => !o);
  };

  const widthCls = fullWidth ? 'w-full' : '';

  return (
    <div className={`relative ${widthCls} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`${widthCls} appearance-none ${sizeCfg.trigger} ${sizeCfg.rounded} bg-surface-2 border border-white/10 text-white/85 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/15 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-left`}
      >
        {leftIcon && <span className="shrink-0 text-white/40 flex items-center">{leftIcon}</span>}
        <span className="flex-1 truncate">
          {selected ? selected.label : <span className="text-white/40">{placeholder ?? 'Selecione'}</span>}
        </span>
        <ChevronDown
          size={size === 'sm' ? 12 : 14}
          className={`shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              role="listbox"
              initial={{ opacity: 0, y: panelStyle.placement === 'bottom' ? -4 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: panelStyle.placement === 'bottom' ? -4 : 4 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: panelStyle.placement === 'bottom' ? panelStyle.top : undefined,
                bottom: panelStyle.placement === 'top' ? window.innerHeight - panelStyle.top : undefined,
                left: panelStyle.left,
                width: panelStyle.width,
                zIndex: 9999,
              }}
              className="bg-surface-2 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
            >
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isFocused = idx === focusIndex;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onMouseEnter={() => setFocusIndex(idx)}
                    className={`w-full ${sizeCfg.text} px-3 py-2 flex items-center gap-2 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : isFocused
                        ? 'bg-white/[0.06] text-white/90'
                        : 'text-white/80 hover:bg-white/[0.06]'
                    }`}
                  >
                    {opt.icon && <span className="shrink-0 flex items-center">{opt.icon}</span>}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {isSelected && <Check size={size === 'sm' ? 12 : 14} className="shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
