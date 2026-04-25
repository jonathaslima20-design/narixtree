import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, ShieldCheck, X, Link2, FileClock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Visão Geral', end: true },
  { to: '/admin/plans', icon: CreditCard, label: 'Planos' },
  { to: '/admin/clients', icon: Users, label: 'Clientes' },
  { to: '/admin/checkout', icon: Link2, label: 'Checkout' },
  { to: '/admin/audit', icon: FileClock, label: 'Auditoria' },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  function handleNav() {
    onClose?.();
  }

  return (
    <aside className="relative w-60 shrink-0 h-screen bg-surface-0/80 backdrop-blur-xl border-r border-white/[0.07] flex flex-col">
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />
      <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm tracking-tight">BrainLead</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={handleNav}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/[0.10] text-white'
                  : 'text-white/55 hover:bg-white/[0.05] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                )}
                <Icon size={16} className={isActive ? 'text-white' : 'text-white/40'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.07]">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-white/80 truncate">
            {profile?.full_name || profile?.email}
          </p>
          <p className="text-xs text-white/40 truncate">{profile?.email}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
        >
          <LogOut size={16} />
          Sair
        </motion.button>
      </div>
    </aside>
  );
}
