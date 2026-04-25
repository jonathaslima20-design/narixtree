import { useEffect, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { motion } from 'framer-motion';
import { Link2, Save, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

function isValidUrl(str: string) {
  if (!str) return true;
  try { new URL(str); return true; } catch { return false; }
}

export function CheckoutSettings() {
  usePageTitle('Checkout — BrainLead Admin');
  const [linkMensal, setLinkMensal] = useState('');
  const [linkAnual, setLinkAnual] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', ['checkout_link_mensal', 'checkout_link_anual']);

      if (data) {
        data.forEach((row) => {
          if (row.key === 'checkout_link_mensal') setLinkMensal(row.value || '');
          if (row.key === 'checkout_link_anual') setLinkAnual(row.value || '');
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!isValidUrl(linkMensal) || !isValidUrl(linkAnual)) {
      alert('URL invalida. Verifique os links de pagamento.');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        supabase
          .from('admin_settings')
          .update({ value: linkMensal.trim(), updated_at: new Date().toISOString() })
          .eq('key', 'checkout_link_mensal'),
        supabase
          .from('admin_settings')
          .update({ value: linkAnual.trim(), updated_at: new Date().toISOString() })
          .eq('key', 'checkout_link_anual'),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar configuracoes.');
    } finally {
      setSaving(false);
    }
  }

  const mensalValid = isValidUrl(linkMensal);
  const anualValid = isValidUrl(linkAnual);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/[0.10] rounded-2xl flex items-center justify-center">
                <Link2 size={18} className="text-white" />
              </div>
              Configuracoes de Checkout
            </h1>
            <p className="text-sm text-white/55 mt-1.5 ml-[52px]">
              Configure os links de pagamento que serao exibidos na tabela de precos.
            </p>
          </div>

          <Card>
            {loading ? (
              <div className="space-y-4">
                <div className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />
                <div className="h-12 bg-white/[0.04] rounded-xl animate-pulse" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Link de Pagamento -- Plano Mensal (R$49/mes)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={linkMensal}
                      onChange={(e) => setLinkMensal(e.target.value)}
                      placeholder="https://pay.exemplo.com/mensal"
                      className={`w-full px-4 py-3 text-sm border rounded-2xl bg-surface-2 text-white/85 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30 pr-10 ${
                        mensalValid ? 'border-white/10' : 'border-red-500/40'
                      }`}
                    />
                    {linkMensal && (
                      <a
                        href={linkMensal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {!mensalValid && (
                    <p className="text-xs text-red-400 mt-1">URL invalida</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Link de Pagamento -- Plano Anual (R$389/ano)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={linkAnual}
                      onChange={(e) => setLinkAnual(e.target.value)}
                      placeholder="https://pay.exemplo.com/anual"
                      className={`w-full px-4 py-3 text-sm border rounded-2xl bg-surface-2 text-white/85 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/30 pr-10 ${
                        anualValid ? 'border-white/10' : 'border-red-500/40'
                      }`}
                    />
                    {linkAnual && (
                      <a
                        href={linkAnual}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {!anualValid && (
                    <p className="text-xs text-red-400 mt-1">URL invalida</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    {saved && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-emerald-400 font-medium"
                      >
                        Salvo com sucesso
                      </motion.p>
                    )}
                  </div>
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    disabled={!mensalValid || !anualValid}
                  >
                    <Save size={14} />
                    Salvar configuracoes
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/[0.08]">
                  <p className="text-xs text-white/40">
                    Esses links serao utilizados nos botoes "Assinar" da tabela de precos exibida aos usuarios
                    quando o periodo de teste expira. Deixe em branco para desativar o botao correspondente.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
