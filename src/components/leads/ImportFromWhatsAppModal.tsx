import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Check,
  Plus,
  WifiOff,
  User,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useLeadCategories, LeadCategoryRow } from '../../lib/useLeadCategories';
import { resolveIcon } from '../../lib/iconMap';
import { useInstances } from '../../lib/useInstances';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const COLOR_PRESETS = [
  { label: 'Cinza', value: 'bg-white/[0.06] text-white/85' },
  { label: 'Azul', value: 'bg-sky-100 text-sky-700' },
  { label: 'Amarelo', value: 'bg-amber-100 text-amber-700' },
  { label: 'Verde', value: 'bg-emerald-100 text-emerald-700' },
  { label: 'Laranja', value: 'bg-orange-100 text-orange-700' },
  { label: 'Teal', value: 'bg-teal-100 text-teal-700' },
  { label: 'Vermelho', value: 'bg-red-100 text-red-700' },
  { label: 'Rosa', value: 'bg-pink-100 text-pink-700' },
  { label: 'Cyan', value: 'bg-cyan-100 text-cyan-700' },
];

interface ChatEntry {
  jid: string;
  phone: string;
  name: string;
  profile_pic: string;
  last_activity: string;
  last_message_preview: string;
  already_imported: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

async function getFreshToken(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;
  if (session?.expires_at) {
    const expiresInMs = session.expires_at * 1000 - Date.now();
    if (expiresInMs < 60_000) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) session = refreshed.session;
    }
  }
  return session?.access_token ?? null;
}

async function callEdgeFunction(fn: string, body: Record<string, unknown>) {
  const token = await getFreshToken();
  if (!token) throw new Error('Sessao expirada.');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = typeof data.error === 'string' ? data.error : `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function formatRelativeDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function ImportFromWhatsAppModal({ open, onClose, onComplete }: Props) {
  const { user } = useAuth();
  const { instances, loading: instancesLoading } = useInstances();
  const { categories, addCategory } = useLeadCategories();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [fetchingChats, setFetchingChats] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0].value);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultCreated, setResultCreated] = useState(0);
  const [resultUpdated, setResultUpdated] = useState(0);
  const [resultSkipped, setResultSkipped] = useState(0);
  const [pictureStatus, setPictureStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [pictureCount, setPictureCount] = useState(0);

  const connectedInstances = instances.filter((i) => i.status === 'connected');
  const activeInstance =
    connectedInstances.find((i) => i.id === selectedInstanceId) ||
    connectedInstances[0];
  const connectedInstance = !!activeInstance;

  useEffect(() => {
    if (!selectedInstanceId && activeInstance) {
      setSelectedInstanceId(activeInstance.id);
    }
  }, [selectedInstanceId, activeInstance]);
  const effectiveCategory = selectedCategory || categories[0]?.key || 'cold';

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.last_message_preview.toLowerCase().includes(q),
    );
  }, [chats, search]);

  const selectedCount = useMemo(() => {
    return filtered.filter((c) => selected.has(c.jid)).length;
  }, [filtered, selected]);

  const totalSelected = useMemo(() => {
    return chats.filter((c) => selected.has(c.jid)).length;
  }, [chats, selected]);

  function resetAll() {
    setStep(1);
    setChats([]);
    setSelected(new Set());
    setSearch('');
    setFetchingChats(false);
    setFetchError('');
    setSelectedCategory('');
    setShowNewCategory(false);
    setNewCatLabel('');
    setNewCatColor(COLOR_PRESETS[0].value);
    setImporting(false);
    setProgress(0);
    setResultCreated(0);
    setResultUpdated(0);
    setResultSkipped(0);
    setPictureStatus('idle');
    setPictureCount(0);
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  const fetchChats = useCallback(async () => {
    if (!activeInstance) return;
    setFetchingChats(true);
    setFetchError('');
    try {
      const data = await callEdgeFunction('whatsapp-list-chats', {
        instance_id: activeInstance.id,
      });
      const chatsList = (data.chats ?? []) as ChatEntry[];
      setChats(chatsList);
      setSelected(new Set(chatsList.map((c) => c.jid)));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao buscar chats');
    } finally {
      setFetchingChats(false);
    }
  }, [activeInstance]);

  useEffect(() => {
    if (open && connectedInstance && step === 1 && chats.length === 0 && !fetchingChats && !fetchError) {
      fetchChats();
    }
  }, [open, connectedInstance, step, chats.length, fetchingChats, fetchError, fetchChats]);

  const toggleChat = useCallback((jid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(jid)) next.delete(jid);
      else next.add(jid);
      return next;
    });
  }, []);

  function selectAll() {
    setSelected(new Set(chats.map((c) => c.jid)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  async function handleCreateCategory() {
    if (!newCatLabel.trim()) return;
    await addCategory(newCatLabel.trim(), newCatColor, 'CircleDot');
    const key = newCatLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setSelectedCategory(key);
    setShowNewCategory(false);
    setNewCatLabel('');
    setNewCatColor(COLOR_PRESETS[0].value);
  }

  async function executeImport() {
    if (!user) return;
    setImporting(true);
    setProgress(10);
    setStep(2);

    try {
      const selectedChats = chats
        .filter((c) => selected.has(c.jid))
        .map((c) => ({
          jid: c.jid,
          phone: c.phone,
          name: c.name,
          profile_pic: c.profile_pic,
          last_activity: c.last_activity,
          last_message_preview: c.last_message_preview,
        }));

      setProgress(20);

      const batchSize = 50;
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (let i = 0; i < selectedChats.length; i += batchSize) {
        const batch = selectedChats.slice(i, i + batchSize);
        const result = await callEdgeFunction('whatsapp-import-selected-chats', {
          chats: batch,
          category: effectiveCategory,
          instance_id: activeInstance?.id,
        });
        created += (result.created as number) || 0;
        updated += (result.updated as number) || 0;
        skipped += (result.skipped as number) || 0;
        setProgress(20 + Math.round(((i + batch.length) / selectedChats.length) * 60));
      }

      setResultCreated(created);
      setResultUpdated(updated);
      setResultSkipped(skipped);
      setProgress(85);

      if (created + updated > 0) {
        await triggerPictureBackfill();
      }

      setProgress(100);
      setImporting(false);
      setStep(3);
      onComplete?.();
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao importar');
      setImporting(false);
      setStep(1);
    }
  }

  async function triggerPictureBackfill() {
    setPictureStatus('loading');
    try {
      const result = await callEdgeFunction('whatsapp-backfill-pictures', { force: false });
      setPictureCount((result.found_pictures as number) ?? 0);
      setPictureStatus('done');
    } catch {
      setPictureStatus('error');
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar do WhatsApp" maxWidth="xl">
      {step === 1 && (
        <StepSelectChats
          connectedInstances={connectedInstances}
          activeInstanceId={activeInstance?.id ?? ''}
          onInstanceChange={(id) => {
            setSelectedInstanceId(id);
            setChats([]);
            setSelected(new Set());
            setFetchError('');
          }}
          instancesLoading={instancesLoading}
          connectedInstance={!!connectedInstance}
          fetchingChats={fetchingChats}
          fetchError={fetchError}
          onRetry={fetchChats}
          chats={filtered}
          totalChats={chats.length}
          selected={selected}
          selectedCount={selectedCount}
          totalSelected={totalSelected}
          search={search}
          onSearchChange={setSearch}
          onToggle={toggleChat}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          categories={categories}
          selectedCategory={effectiveCategory}
          onCategoryChange={setSelectedCategory}
          showNewCategory={showNewCategory}
          onToggleNewCategory={() => setShowNewCategory((v) => !v)}
          newCatLabel={newCatLabel}
          onNewCatLabelChange={setNewCatLabel}
          newCatColor={newCatColor}
          onNewCatColorChange={setNewCatColor}
          onCreateCategory={handleCreateCategory}
          onImport={executeImport}
        />
      )}

      {step === 2 && (
        <StepImporting progress={progress} />
      )}

      {step === 3 && (
        <StepResult
          resultCreated={resultCreated}
          resultUpdated={resultUpdated}
          resultSkipped={resultSkipped}
          pictureStatus={pictureStatus}
          pictureCount={pictureCount}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 -- Select Chats                                             */
/* ------------------------------------------------------------------ */

interface StepSelectChatsProps {
  connectedInstances: ReturnType<typeof useInstances>['instances'];
  activeInstanceId: string;
  onInstanceChange: (id: string) => void;
  instancesLoading: boolean;
  connectedInstance: boolean;
  fetchingChats: boolean;
  fetchError: string;
  onRetry: () => void;
  chats: ChatEntry[];
  totalChats: number;
  selected: Set<string>;
  selectedCount: number;
  totalSelected: number;
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (jid: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  categories: LeadCategoryRow[];
  selectedCategory: string;
  onCategoryChange: (key: string) => void;
  showNewCategory: boolean;
  onToggleNewCategory: () => void;
  newCatLabel: string;
  onNewCatLabelChange: (v: string) => void;
  newCatColor: string;
  onNewCatColorChange: (v: string) => void;
  onCreateCategory: () => void;
  onImport: () => void;
}

function StepSelectChats({
  connectedInstances,
  activeInstanceId,
  onInstanceChange,
  instancesLoading,
  connectedInstance,
  fetchingChats,
  fetchError,
  onRetry,
  chats,
  totalChats,
  selected,
  selectedCount,
  totalSelected,
  search,
  onSearchChange,
  onToggle,
  onSelectAll,
  onDeselectAll,
  categories,
  selectedCategory,
  onCategoryChange,
  showNewCategory,
  onToggleNewCategory,
  newCatLabel,
  onNewCatLabelChange,
  newCatColor,
  onNewCatColorChange,
  onCreateCategory,
  onImport,
}: StepSelectChatsProps) {
  if (instancesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <RefreshCw size={24} className="text-white/40 animate-spin" />
        <p className="text-sm text-white/55">Verificando instancias...</p>
      </div>
    );
  }

  if (!connectedInstance) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
          <WifiOff size={24} className="text-amber-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white mb-1">WhatsApp nao conectado</h3>
          <p className="text-sm text-white/55 max-w-xs mx-auto leading-relaxed">
            Para importar leads das suas conversas, primeiro conecte o WhatsApp na pagina de configuracoes.
          </p>
        </div>
      </div>
    );
  }

  if (fetchingChats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <RefreshCw size={24} className="text-white/40 animate-spin" />
        <p className="text-sm text-white/55">Buscando conversas do WhatsApp...</p>
        <p className="text-xs text-white/35">Isso pode levar ate 1 minuto</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white mb-1">Erro ao buscar conversas</h3>
          <p className="text-sm text-white/55 max-w-sm mx-auto">{fetchError}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw size={14} /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (totalChats === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <MessageCircle size={24} className="text-white/40" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma conversa encontrada</h3>
          <p className="text-sm text-white/55">Nao foram encontradas conversas individuais no seu WhatsApp.</p>
        </div>
      </div>
    );
  }

  const allSelected = totalSelected === totalChats;

  return (
    <div className="space-y-4">
      {connectedInstances.length > 1 && (
        <div>
          <label className="text-xs font-medium text-white/55 block mb-1.5">
            Instancia do WhatsApp
          </label>
          <div className="flex flex-wrap gap-2">
            {connectedInstances.map((inst) => {
              const isActive = inst.id === activeInstanceId;
              const label =
                inst.label?.trim() || inst.phone_number || inst.instance_name;
              return (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => onInstanceChange(inst.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    isActive
                      ? 'border-emerald-400/40 bg-emerald-500/[0.10] text-white'
                      : 'border-white/10 bg-surface-2 text-white/85 hover:border-white/15'
                  }`}
                >
                  <MessageCircle size={12} /> {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + bulk actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-9 pr-3 py-2 text-sm text-white bg-surface-2 border border-white/10 rounded-xl outline-none transition-all placeholder:text-white/30 focus:ring-2 focus:ring-white/20 focus:border-transparent"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={12} /> {totalSelected} de {totalChats} selecionado{totalSelected !== 1 ? 's' : ''}
        </span>
        {search.trim() && chats.length !== totalChats && (
          <span className="text-xs text-white/45">
            Mostrando {chats.length} resultado{chats.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Chat list */}
      <div className="border border-white/10 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
        {chats.map((chat) => {
          const isSelected = selected.has(chat.jid);
          return (
            <button
              key={chat.jid}
              type="button"
              onClick={() => onToggle(chat.jid)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/[0.06] last:border-b-0 ${
                isSelected
                  ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10]'
                  : 'bg-transparent hover:bg-white/[0.04]'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="accent-emerald-600 shrink-0 pointer-events-none"
              />
              <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
                {chat.profile_pic ? (
                  <img
                    src={chat.profile_pic}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<span class="text-white/40"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>';
                    }}
                  />
                ) : (
                  <User size={16} className="text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {chat.name || chat.phone}
                  </span>
                  {chat.last_activity && (
                    <span className="text-[11px] text-white/40 shrink-0">
                      {formatRelativeDate(chat.last_activity)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {chat.name && (
                    <span className="text-[11px] text-white/40 font-mono">{chat.phone}</span>
                  )}
                  {chat.last_message_preview && (
                    <span className="text-xs text-white/35 truncate">
                      {chat.last_message_preview.length > 50
                        ? chat.last_message_preview.slice(0, 50) + '...'
                        : chat.last_message_preview}
                    </span>
                  )}
                </div>
              </div>
              {chat.already_imported && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
                  Ja importado
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category selector */}
      <div>
        <label className="text-sm font-medium text-white/85 block mb-1.5">
          Categoria para os novos leads
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = resolveIcon(cat.icon);
            const isActive =
              selectedCategory === cat.key ||
              (!selectedCategory && categories[0]?.key === cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onCategoryChange(cat.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  isActive
                    ? 'border-white/20 bg-white/[0.10] text-white shadow-sm'
                    : 'border-white/10 bg-surface-2 text-white/85 hover:border-white/15 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={12} /> {cat.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onToggleNewCategory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-dashed border-white/15 text-white/55 hover:border-white/20 hover:text-white/85 transition-colors"
          >
            <Plus size={12} /> Nova categoria
          </button>
        </div>

        {showNewCategory && (
          <div className="mt-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
            <input
              value={newCatLabel}
              onChange={(e) => onNewCatLabelChange(e.target.value)}
              placeholder="Nome da categoria"
              className="w-full px-3 py-2 text-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-white/55 mr-1">Cor:</span>
              {COLOR_PRESETS.map((preset) => {
                const dotBg = preset.value.split(' ')[0] || 'bg-white/[0.06]';
                const isSelected = newCatColor === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onNewCatColorChange(preset.value)}
                    className={`w-6 h-6 rounded-full ${dotBg} transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1 ring-white/20 scale-110'
                        : 'hover:scale-110'
                    }`}
                    title={preset.label}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onCreateCategory} disabled={!newCatLabel.trim()}>
                <Check size={12} /> Criar
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggleNewCategory}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex justify-end pt-2">
        <Button onClick={onImport} disabled={totalSelected === 0}>
          Importar {totalSelected} lead{totalSelected !== 1 ? 's' : ''} <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 -- Importing                                                */
/* ------------------------------------------------------------------ */

function StepImporting({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <RefreshCw size={28} className="text-white/40 animate-spin" />
      <div className="text-center">
        <h3 className="text-base font-semibold text-white mb-1">Importando leads...</h3>
        <p className="text-sm text-white/55">Aguarde enquanto os leads sao criados</p>
      </div>
      <div className="w-64 space-y-2">
        <div className="flex items-center justify-between text-xs text-white/55">
          <span>{progress < 85 ? 'Importando contatos...' : 'Buscando fotos de perfil...'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 -- Results                                                  */
/* ------------------------------------------------------------------ */

interface StepResultProps {
  resultCreated: number;
  resultUpdated: number;
  resultSkipped: number;
  pictureStatus: 'idle' | 'loading' | 'done' | 'error';
  pictureCount: number;
  onClose: () => void;
}

function StepResult({
  resultCreated,
  resultUpdated,
  resultSkipped,
  pictureStatus,
  pictureCount,
  onClose,
}: StepResultProps) {
  const total = resultCreated + resultUpdated;

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center py-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-white">
          {total > 0 ? 'Importacao concluida' : 'Nenhum lead importado'}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {resultCreated > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-2xl font-bold text-emerald-800">{resultCreated}</p>
            <p className="text-xs text-emerald-600">Novos leads adicionados</p>
          </div>
        )}
        {resultUpdated > 0 && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-center">
            <p className="text-2xl font-bold text-sky-800">{resultUpdated}</p>
            <p className="text-xs text-sky-600">Leads atualizados</p>
          </div>
        )}
        {resultSkipped > 0 && (
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl text-center">
            <p className="text-2xl font-bold text-white/85">{resultSkipped}</p>
            <p className="text-xs text-white/55">Ignorados</p>
          </div>
        )}
      </div>

      {pictureStatus !== 'idle' && (
        <div className="p-3 border border-white/10 rounded-xl flex items-center gap-3">
          {pictureStatus === 'loading' && (
            <>
              <RefreshCw size={16} className="text-white/40 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-white/85">Buscando fotos de perfil...</p>
                <p className="text-xs text-white/55">Isso pode levar alguns segundos</p>
              </div>
            </>
          )}
          {pictureStatus === 'done' && (
            <>
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-white/85">
                {pictureCount > 0
                  ? `${pictureCount} foto${pictureCount !== 1 ? 's' : ''} de perfil encontrada${pictureCount !== 1 ? 's' : ''}`
                  : 'Nenhuma foto de perfil encontrada'}
              </p>
            </>
          )}
          {pictureStatus === 'error' && (
            <>
              <AlertTriangle size={16} className="text-amber-500 shrink-0" />
              <p className="text-sm text-white/70">
                Nao foi possivel buscar fotos. Verifique se o WhatsApp esta conectado.
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}
