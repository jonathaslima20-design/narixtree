import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Card } from '../../components/ui/Card';
import { Lead } from '../../lib/types';
import { leadDisplayName, leadPhoneLabel } from '../../lib/leadDisplay';
import { useLeadCategories } from '../../lib/useLeadCategories';
import { resolveIcon } from '../../lib/iconMap';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

export function DashboardHome() {
  const { profile } = useAuth();
  const { categories } = useLeadCategories();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (data) {
        setAllLeads(data as Lead[]);
        setRecentLeads((data as Lead[]).slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, []);

  const name = profile?.full_name?.split(' ')[0] || 'Usuario';

  const statCards = [
    { label: 'Total de Leads', value: allLeads.length, iconName: 'Users', color: 'text-white', bg: 'bg-white/[0.08]' },
    ...categories.map((cat) => {
      const count = allLeads.filter((l) => l.category === cat.key).length;
      const palette = cat.color.match(/text-(\w+)-(\d+)/);
      const colorClass = palette ? `text-${palette[1]}-300` : 'text-white/70';
      const bgClass = palette ? `bg-${palette[1]}-500/15` : 'bg-white/[0.06]';
      return { label: cat.label, value: count, iconName: cat.icon, color: colorClass, bg: bgClass };
    }),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto">
        <motion.div variants={item} className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Olá, {name}</h1>
          <p className="text-white/55 text-sm mt-1.5">Aqui esta um resumo dos seus leads hoje.</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {statCards.slice(0, 8).map((card) => {
            const Icon = card.iconName === 'Users' ? Users : resolveIcon(card.iconName);
            return (
              <motion.div
                key={card.label}
                whileHover={{ y: -2, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.10)' }}
                transition={{ duration: 0.18 }}
              >
                <Card className="flex flex-col gap-3 h-full">
                  <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                    <Icon size={18} className={card.color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white tracking-tight">
                      {loading ? <span className="w-8 h-6 bg-white/[0.06] rounded animate-pulse inline-block" /> : card.value}
                    </p>
                    <p className="text-xs text-white/55 mt-0.5">{card.label}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white/[0.06] rounded-lg flex items-center justify-center">
                  <TrendingUp size={14} className="text-white/70" />
                </div>
                <h2 className="text-sm font-semibold text-white">Leads Recentes</h2>
              </div>
              <Link
                to="/dashboard/leads"
                className="flex items-center gap-1 text-xs font-medium text-white/40 hover:text-white transition-colors"
              >
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/[0.04] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users size={24} className="text-white/30" />
                </div>
                <p className="text-sm font-medium text-white/55">Nenhum lead ainda.</p>
                <p className="text-xs text-white/30 mt-1">Conecte seu WhatsApp para comecar a capturar leads.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentLeads.map((lead) => {
                  const cat = categories.find((c) => c.key === lead.category);
                  const CatIcon = cat ? resolveIcon(cat.icon) : Users;
                  const catColor = cat?.color.split(' ')[1] || 'text-white/40';
                  const catLabel = cat?.label || lead.category || '';
                  return (
                    <motion.div
                      key={lead.id}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06]/80 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-3">
                        {lead.profile_picture_url ? (
                          <img
                            src={lead.profile_picture_url}
                            alt={leadDisplayName(lead)}
                            className="w-8 h-8 rounded-full object-cover bg-white/[0.06]"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                          />
                        ) : null}
                        <div className={`w-8 h-8 bg-white/[0.10] rounded-full flex items-center justify-center text-xs font-semibold text-white/70${lead.profile_picture_url ? ' hidden' : ''}`}>
                          {leadDisplayName(lead).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{leadDisplayName(lead)}</p>
                          <p className="text-xs text-white/40">{leadPhoneLabel(lead)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white border border-white/10 px-2 py-1 rounded-lg">
                        <CatIcon size={11} className={catColor} />
                        <span className="text-xs text-white/55">{catLabel}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
