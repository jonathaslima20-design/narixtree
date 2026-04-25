import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { Search, Star, Archive, Smartphone } from 'lucide-react';
import { Select } from '../ui/Select';
import { Lead } from '../../lib/types';
import { leadDisplayName } from '../../lib/leadDisplay';
import { useLeadCategories } from '../../lib/useLeadCategories';
import { resolveIcon } from '../../lib/iconMap';
import { useInstances, instanceDisplayName } from '../../lib/useInstances';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return d.toLocaleDateString('pt-BR', { weekday: 'short' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

interface Props {
  leads: Lead[];
  selectedId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (lead: Lead) => void;
  filter: 'all' | 'unread' | 'archived';
  onFilterChange: (f: 'all' | 'unread' | 'archived') => void;
  instanceFilter?: string;
  onInstanceFilterChange?: (v: string) => void;
}

export function ConversationList({
  leads,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  filter,
  onFilterChange,
  instanceFilter = 'all',
  onInstanceFilterChange,
}: Props) {
  const { categories } = useLeadCategories();
  const { instances } = useInstances();
  const visibleLeads = useMemo(() => {
    if (instanceFilter === 'all' || instances.length <= 1) return leads;
    return leads.filter((l) => l.instance_id === instanceFilter);
  }, [leads, instanceFilter, instances.length]);
  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'unread', label: 'Não lidas' },
    { key: 'archived', label: 'Arquivados' },
  ];

  const activityRef = useRef<Map<string, string | undefined>>(new Map());
  const [flashing, setFlashing] = useState<Set<string>>(new Set());

  useEffect(() => {
    const changed: string[] = [];
    for (const lead of leads) {
      const prev = activityRef.current.get(lead.id);
      const curr = lead.last_activity_at || lead.updated_at;
      if (prev !== undefined && prev !== curr && (lead.unread_count ?? 0) > 0) {
        changed.push(lead.id);
      }
      activityRef.current.set(lead.id, curr);
    }
    if (changed.length > 0) {
      setFlashing((prev) => {
        const next = new Set(prev);
        changed.forEach((id) => next.add(id));
        return next;
      });
      const timeout = window.setTimeout(() => {
        setFlashing((prev) => {
          const next = new Set(prev);
          changed.forEach((id) => next.delete(id));
          return next;
        });
      }, 1800);
      return () => window.clearTimeout(timeout);
    }
  }, [leads]);

  function getCatIcon(lead: Lead) {
    const cat = categories.find((c) => c.key === lead.category);
    if (cat) {
      const Icon = resolveIcon(cat.icon);
      const color = cat.color.split(' ')[1] || 'text-white/55';
      return { Icon, color };
    }
    const fallback = resolveIcon('CircleDot');
    return { Icon: fallback, color: 'text-white/40' };
  }

  return (
    <div className="flex flex-col h-full bg-surface-1 border-r border-white/[0.08]">
      <div className="p-4 border-b border-white/[0.08]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 mt-3 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-white/[0.10] text-white'
                  : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.06]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {instances.length > 1 && onInstanceFilterChange && (
          <div className="mt-2">
            <Select
              size="sm"
              fullWidth
              value={instanceFilter}
              onChange={onInstanceFilterChange}
              leftIcon={<Smartphone size={13} />}
              ariaLabel="Filtrar por instância"
              options={[
                { value: 'all', label: `Todas as instâncias (${instances.length})` },
                ...instances.map((i) => ({ value: i.id, label: instanceDisplayName(i) })),
              ]}
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        {visibleLeads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-white/40">Nenhuma conversa</p>
          </div>
        ) : (
          <Virtuoso
            data={visibleLeads}
            className="absolute inset-0"
            increaseViewportBy={{ top: 400, bottom: 400 }}
            computeItemKey={(_, lead) => lead.id}
            itemContent={(_, lead) => {
              const { Icon: CatIcon, color: catColor } = getCatIcon(lead);
              const active = selectedId === lead.id;
              const unread = (lead.unread_count ?? 0) > 0;
              const isFlashing = flashing.has(lead.id);
              return (
                <motion.button
                  initial={false}
                  animate={{
                    backgroundColor: isFlashing
                      ? 'rgba(16, 185, 129, 0.08)'
                      : active
                      ? 'rgba(255, 255, 255, 0.10)'
                      : 'rgba(255, 255, 255, 0)',
                  }}
                  transition={{ backgroundColor: { duration: 0.6 } }}
                  onClick={() => onSelect(lead)}
                  aria-label={`Conversa com ${leadDisplayName(lead)}${unread ? `, ${lead.unread_count} novas mensagens` : ''}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] text-left transition-colors ${
                    active ? '' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="relative w-11 h-11 shrink-0">
                    {lead.profile_picture_url ? (
                      <img
                        src={lead.profile_picture_url}
                        alt={leadDisplayName(lead)}
                        className={`w-11 h-11 rounded-full object-cover bg-white/[0.06] ${
                          unread ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                        }`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 bg-white/[0.10] rounded-full flex items-center justify-center text-sm font-bold text-white/85 ${
                          unread ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                        }`}
                      >
                        {(leadDisplayName(lead)).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 bg-surface-1 rounded-full p-0.5">
                      <CatIcon size={11} className={catColor} />
                    </div>
                    {unread && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-surface-1" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm truncate flex items-center gap-1 ${
                          unread ? 'font-bold text-white' : 'font-semibold text-white'
                        }`}
                      >
                        {lead.is_favorite && <Star size={11} className="text-amber-400 fill-amber-400" />}
                        {lead.is_archived && <Archive size={11} className="text-white/40" />}
                        {leadDisplayName(lead)}
                      </p>
                      <span
                        className={`text-[10px] shrink-0 ${
                          unread ? 'text-emerald-600 font-semibold' : 'text-white/40'
                        }`}
                      >
                        {formatTime(lead.last_activity_at || lead.updated_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={`text-xs truncate ${
                          unread ? 'font-bold text-white' : 'text-white/55'
                        }`}
                      >
                        {lead.last_message || 'Sem mensagens'}
                      </p>
                      {unread && (
                        <motion.span
                          key={lead.unread_count}
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          className="bg-emerald-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-sm"
                        >
                          {lead.unread_count}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
