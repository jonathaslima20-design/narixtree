import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`relative glass-panel-strong rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${widths[maxWidth]} z-10 max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-white/[0.04] blur-3xl"
            />
            {title && (
              <div className="relative flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 shrink-0">
                <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="relative p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
