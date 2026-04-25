import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Pause,
  Play,
  XCircle,
  CheckCircle2,
  Eye,
  Download,
  Clock,
  Users,
  X,
  Type,
  Image,
  Mic,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useCampaignDetail } from '../../lib/useCampaignDetail';
import { CampaignRecipientStatus, CampaignStatus } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-white/70', bg: 'bg-white/[0.06]' },
  scheduled: { label: 'Agendada', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  sending: { label: 'Enviando', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  paused: { label: 'Pausada', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  completed: { label: 'Concluida', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  failed: { label: 'Falhou', color: 'text-red-400', bg: 'bg-red-500/10' },
  cancelled: { label: 'Cancelada', color: 'text-white/55', bg: 'bg-white/[0.04]' },
};

const RECIPIENT_STATUS: Record<CampaignRecipientStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-white/55', bg: 'bg-white/[0.04]' },
  sending: { label: 'Enviando', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  sent: { label: 'Enviado', color: 'text-sky-400', bg: 'bg-sky-500/10' },
  delivered: { label: 'Entregue', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  read: { label: 'Lido', color: 'text-teal-400', bg: 'bg-teal-500/10' },
  failed: { label: 'Falhou', color: 'text-red-400', bg: 'bg-red-500/10' },
  skipped: { label: 'Pulado', color: 'text-white/40', bg: 'bg-white/[0.04]' },
};

const TYPE_ICONS: Record<string, typeof Type> = {
  text: Type,
  image: Image,
  audio: Mic,
  document: FileText,
};

export function CampaignDetail() {
  usePageTitle('Detalhes da Campanha — BrainLead');
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { campaign, recipients, loading, startSending } = useCampaignDetail(id, user?.id);
  const [recipientFilter, setRecipientFilter] = useState<CampaignRecipientStatus | 'all'>('all');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const filteredRecipients = useMemo(() => {
    if (recipientFilter === 'all') return recipients;
    return recipients.filter((r) => r.status === recipientFilter);
  }, [recipients, recipientFilter]);

  const stats = useMemo(() => {
    const total = campaign?.total_recipients || recipients.length;
    const sent = recipients.filter((r) => ['sent', 'delivered', 'read'].includes(r.status)).length;
    const delivered = recipients.filter((r) => ['delivered', 'read'].includes(r.status)).length;
    const read = recipients.filter((r) => r.status === 'read').length;
    const failed = recipients.filter((r) => ['failed', 'skipped'].includes(r.status)).length;
    const pending = recipients.filter((r) => ['pending', 'sending'].includes(r.status)).length;
    return { total, sent, delivered, read, failed, pending };
  }, [campaign, recipients]);

  const progressPercent = stats.total > 0 ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) : 0;

  async function handleStartSend() {
    if (!campaign || sending) return;
    setSending(true);
    setSendError(null);
    if (campaign.status === 'draft' || campaign.status === 'paused') {
      await supabase.from('campaigns').update({
        status: 'sending',
        started_at: campaign.started_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id);
    }
    const error = await startSending();
    if (error) {
      setSendError(error);
      await supabase.from('campaigns').update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      }).eq('id', campaign.id);
    }
    setSending(false);
  }

  async function handlePause() {
    if (!campaign) return;
    await supabase.from('campaigns').update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id);
  }

  async function handleCancel() {
    if (!campaign) return;
    await supabase.from('campaigns').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', campaign.id);
  }

  function exportCSV() {
    if (!recipients.length) return;
    const headers = ['Nome', 'Telefone', 'Status', 'Enviado em', 'Entregue em', 'Lido em', 'Erro'];
    const rows = recipients.map((r) => [
      r.lead_name,
      r.phone,
      RECIPIENT_STATUS[r.status]?.label || r.status,
      r.sent_at || '',
      r.delivered_at || '',
      r.read_at || '',
      r.error_message || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campanha-${campaign?.name || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso: string | null) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  if (loading || !campaign) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[campaign.status];
  const TypeIcon = TYPE_ICONS[campaign.message_type] || Type;

  return (
    <div className="flex-1 overflow-auto bg-surface-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate('/dashboard/campaigns')}
              className="p-2 rounded-xl hover:bg-white/[0.06] transition-all text-white/55 shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">{campaign.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                  {campaign.status === 'sending' && (
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/55 flex-wrap">
                <span className="flex items-center gap-1"><TypeIcon size={12} /> {campaign.message_type === 'text' ? 'Texto' : campaign.message_type === 'image' ? 'Imagem' : campaign.message_type === 'audio' ? 'Áudio' : 'Documento'}</span>
                <span className="hidden sm:inline">Criada em {formatDate(campaign.created_at)}</span>
                {campaign.scheduled_at && <span className="flex items-center gap-1"><Clock size={12} /> Agendada para {formatDate(campaign.scheduled_at)}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 ml-11 sm:ml-0">
            {(campaign.status === 'draft' || campaign.status === 'paused') && (
              <Button onClick={handleStartSend} loading={sending}>
                <Play size={14} />
                <span className="hidden sm:inline">{campaign.status === 'paused' ? 'Retomar' : 'Iniciar envio'}</span>
                <span className="sm:hidden">{campaign.status === 'paused' ? 'Retomar' : 'Enviar'}</span>
              </Button>
            )}
            {campaign.status === 'sending' && (
              <>
                <Button variant="secondary" onClick={handlePause}>
                  <Pause size={14} />
                  <span className="hidden sm:inline">Pausar</span>
                </Button>
                <Button variant="danger" onClick={handleCancel}>
                  <X size={14} />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={exportCSV}>
              <Download size={14} />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {sendError && (
          <div className="mb-4 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-300">Falha ao enviar campanha</p>
              <p className="text-xs text-red-400/80 mt-0.5">{sendError}</p>
            </div>
            <button
              onClick={() => setSendError(null)}
              className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Progress ring + stats */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 mb-6">
          {/* Big progress card */}
          <div className="sm:col-span-2 bg-surface-1 rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={campaign.status === 'completed' ? '#10b981' : campaign.status === 'sending' ? '#f59e0b' : '#6b7280'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progressPercent / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{progressPercent}%</span>
              </div>
            </div>
            <p className="text-sm text-white/55">
              {stats.sent + stats.failed} de {stats.total} processados
            </p>
          </div>

          {/* Stat cards */}
          <div className="sm:col-span-4 grid grid-cols-2 sm:grid-cols-2 gap-3">
            {[
              { label: 'Total', value: stats.total, icon: Users, color: 'text-white', bg: 'bg-white/[0.04]' },
              { label: 'Enviados', value: stats.sent, icon: Send, color: 'text-sky-400', bg: 'bg-sky-500/10' },
              { label: 'Entregues', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Lidos', value: stats.read, icon: Eye, color: 'text-teal-400', bg: 'bg-teal-500/10' },
              { label: 'Falhas', value: stats.failed, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
                <s.icon size={18} className={s.color} />
                <div>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/55">{s.label}</p>
                </div>
                {stats.total > 0 && (
                  <span className="ml-auto text-xs font-medium text-white/40">
                    {Math.round((s.value / stats.total) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message preview */}
        {(campaign.content || campaign.caption) && (
          <div className="bg-surface-1 rounded-2xl border border-white/10 p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">Mensagem</h3>
            <div className="bg-white/[0.06] rounded-xl p-4">
              <p className="text-sm text-white/85 whitespace-pre-wrap">{campaign.content || campaign.caption}</p>
            </div>
          </div>
        )}

        {/* Recipients table */}
        <div className="bg-surface-1 rounded-2xl border border-white/10">
          <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <h3 className="text-sm font-semibold text-white">Destinatários ({recipients.length})</h3>
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 overflow-x-auto">
              {(['all', 'sent', 'delivered', 'read', 'failed', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setRecipientFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    recipientFilter === f ? 'bg-white/[0.10] text-white shadow-sm' : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  {f === 'all' ? 'Todos' : RECIPIENT_STATUS[f]?.label || f}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-2/90 backdrop-blur-sm">
                <tr className="text-left text-xs text-white/55 font-medium">
                  <th className="px-5 py-2.5">Nome</th>
                  <th className="px-5 py-2.5">Telefone</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Enviado</th>
                  <th className="px-5 py-2.5">Entregue</th>
                  <th className="px-5 py-2.5">Lido</th>
                  <th className="px-5 py-2.5">Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <AnimatePresence>
                  {filteredRecipients.map((r) => {
                    const rCfg = RECIPIENT_STATUS[r.status];
                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-white/[0.04] transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-white">{r.lead_name || '-'}</td>
                        <td className="px-5 py-3 text-white/55">{r.phone}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rCfg.bg} ${rCfg.color}`}>
                            {r.status === 'sending' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                            {rCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-white/55">{formatDate(r.sent_at)}</td>
                        <td className="px-5 py-3 text-xs text-white/55">{formatDate(r.delivered_at)}</td>
                        <td className="px-5 py-3 text-xs text-white/55">{formatDate(r.read_at)}</td>
                        <td className="px-5 py-3 text-xs text-red-400 max-w-[200px] truncate">{r.error_message || '-'}</td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filteredRecipients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-white/40">
                      Nenhum destinatário neste filtro
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
