import { useState } from 'react';
import { useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Brain, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BrainLoader } from '../components/ui/BrainLoader';
import { AmbientBackground } from '../components/ui/AmbientBackground';

export function AuthPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>(
    location.pathname === '/cadastro' ? 'register' : 'login'
  );
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <BrainLoader size="lg" />
    </div>
  );
  if (user) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.full_name, role: 'user' } },
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        navigate(profileData?.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-surface-0 text-white overflow-hidden">
      <AmbientBackground intensity="hero" />

      <Link
        to="/"
        className="absolute top-6 left-6 z-10 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <div className="relative z-[1] min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center ring-1 ring-white/15 mb-5">
              <Brain size={22} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
            </h1>
            <p className="mt-2 text-sm text-white/60 leading-relaxed max-w-xs">
              {mode === 'login'
                ? 'Entre na sua conta para continuar transformando leads em vendas.'
                : 'Comece gratuitamente e organize seus leads em minutos.'}
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 sm:p-7 shadow-glow">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      label="Nome completo"
                      name="full_name"
                      type="text"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      icon={<User size={15} />}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                icon={<Mail size={15} />}
                required
              />

              <Input
                label="Senha"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                icon={<Lock size={15} />}
                required
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl"
                >
                  {error}
                </motion.p>
              )}

              <Button type="submit" fullWidth loading={submitting} size="lg">
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
                <ArrowRight size={16} />
              </Button>
            </form>
          </div>

          <p className="text-sm text-white/55 text-center mt-6">
            {mode === 'login' ? 'Nao tem uma conta?' : 'Ja tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="font-medium text-white hover:underline underline-offset-4"
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
