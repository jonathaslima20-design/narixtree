import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type PricingReason = 'time_expired' | 'sends_exhausted' | 'both_expired' | 'browse';

interface PricingModalProps {
  open: boolean;
  onClose?: () => void;
  permanent?: boolean;
  reason?: PricingReason;
}

const FEATURES = [
  'Chat integrado com WhatsApp',
  'Gestao e qualificacao de leads',
  'Campanhas de envio em massa',
  'Templates de mensagens',
  'Categorias personalizadas',
];

const REASON_TITLES: Record<PricingReason, string> = {
  time_expired: 'Seu periodo de teste terminou. Escolha um plano para continuar.',
  sends_exhausted: 'Voce utilizou todos os envios de teste. Escolha um plano para continuar.',
  both_expired: 'Seu periodo de teste terminou e os envios foram utilizados. Escolha um plano para continuar.',
  browse: 'Conheca nossos planos e leve seu negocio para o proximo nivel.',
};

export function PricingModal({ open, onClose, permanent, reason = 'browse' }: PricingModalProps) {
  const [checkoutLinks, setCheckoutLinks] = useState({ mensal: '', anual: '' });

  useEffect(() => {
    if (!open) return;
    supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['checkout_link_mensal', 'checkout_link_anual'])
      .then(({ data }) => {
        if (!data) return;
        const links = { mensal: '', anual: '' };
        data.forEach((row) => {
          if (row.key === 'checkout_link_mensal') links.mensal = row.value;
          if (row.key === 'checkout_link_anual') links.anual = row.value;
        });
        setCheckoutLinks(links);
      });
  }, [open]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  function handleSubscribe(link: string) {
    if (link) window.open(link, '_blank', 'noopener');
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={permanent ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative glass-panel-strong rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl z-10 max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              {!permanent && onClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              )}

              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown size={22} className="text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
                  {REASON_TITLES[reason]}
                </h2>
                <p className="text-sm text-white/55">
                  Desbloqueie todas as funcionalidades do BrainLead.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Trial */}
                <div className="border border-white/10 rounded-2xl p-5 bg-white/[0.03] opacity-70">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-white/40" />
                    <span className="text-sm font-semibold text-white/70">Trial</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white/55">Gratis</span>
                  </div>
                  <p className="text-xs text-white/40 mb-4">2 dias ou 50 envios</p>
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-white/[0.06] text-white/40 cursor-not-allowed"
                  >
                    Plano Atual
                  </button>
                  <ul className="mt-4 space-y-2">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-white/40">
                        <Check size={13} className="mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-xs text-white/40">
                      <Check size={13} className="mt-0.5 shrink-0" />
                      Limite: 50 envios
                    </li>
                  </ul>
                </div>

                {/* Mensal */}
                <div className="border border-white/10 rounded-2xl p-5 bg-white/[0.04]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={16} className="text-white" />
                    <span className="text-sm font-semibold text-white">Mensal Pro</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-white">R$49</span>
                    <span className="text-sm text-white/55">/mes</span>
                  </div>
                  <p className="text-xs text-white/55 mb-4">Envios ilimitados</p>
                  <button
                    onClick={() => handleSubscribe(checkoutLinks.mensal)}
                    disabled={!checkoutLinks.mensal}
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assinar Mensal Pro
                  </button>
                  <ul className="mt-4 space-y-2">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-white/70">
                        <Check size={13} className="mt-0.5 text-emerald-300 shrink-0" />
                        {f}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-xs text-white/70">
                      <Check size={13} className="mt-0.5 text-emerald-300 shrink-0" />
                      Envios ilimitados
                    </li>
                  </ul>
                </div>

                {/* Anual */}
                <div className="relative border border-emerald-400/40 rounded-2xl p-5 bg-emerald-500/[0.06] shadow-glow">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown size={16} className="text-emerald-300" />
                    <span className="text-sm font-semibold text-white">Anual Pro</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-white">R$389</span>
                    <span className="text-sm text-white/55">/ano</span>
                  </div>
                  <p className="text-xs text-emerald-300 font-medium mb-4">~R$32/mes - Economize 34%</p>
                  <button
                    onClick={() => handleSubscribe(checkoutLinks.anual)}
                    disabled={!checkoutLinks.anual}
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assinar Anual Pro
                  </button>
                  <ul className="mt-4 space-y-2">
                    {FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-white/70">
                        <Check size={13} className="mt-0.5 text-emerald-300 shrink-0" />
                        {f}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-xs text-white/70">
                      <Check size={13} className="mt-0.5 text-emerald-300 shrink-0" />
                      Envios ilimitados
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
