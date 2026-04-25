import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import {
  Brain,
  MessageSquareText,
  KanbanSquare,
  Send,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-lg flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-white/10"
      style={{ width: size, height: size, background: '#111827' }}
    >
      <Brain className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.4} />
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B0E11]/70 backdrop-blur-xl px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <span className="text-white font-bold text-lg tracking-tight">BrainLead</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
          <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
          <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex text-sm text-white/80 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-white text-black hover:bg-white/90 px-4 py-2 rounded-lg transition-all hover:scale-[1.02]"
          >
            Começar Agora
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}

function Hero() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  return (
    <section ref={ref} className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 px-4 sm:px-8 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(255,255,255,0.10) 0%, rgba(11, 14, 17, 0) 70%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 70%)',
        }}
      />

      <motion.div style={{ y, opacity }} className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur text-xs text-white/70 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          Conecte. Organize. Converta.
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="text-[2.75rem] sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]"
        >
          Transforme leads em
          <br />
          <span className="bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
            vendas reais.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="mt-6 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed"
        >
          Organize seus contatos, gerencie conversas e dispare ofertas de forma simples e eficiente.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-2 bg-white text-black hover:bg-white/90 font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-white/10 transition-all hover:scale-[1.02]"
          >
            Começar gratuitamente
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => {
              document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white border border-white/15 hover:border-white/30 bg-white/[0.03] backdrop-blur px-6 py-3.5 rounded-xl transition-all"
          >
            Ver planos
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
        className="relative max-w-6xl mx-auto mt-16 sm:mt-20"
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-3xl rounded-[2.5rem]" />
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-xl p-2 shadow-2xl">
          <div className="rounded-xl overflow-hidden border border-white/5 bg-[#0B0E11]">
            <img
              src="/hero-dashboard.webp"
              alt="Interface do BrainLead"
              className="w-full h-auto object-cover"
              loading="eager"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function BentoGrid() {
  const features = [
    {
      icon: MessageSquareText,
      title: 'Chat Integrado',
      description: 'Conecte seu WhatsApp e centralize sua coleta de leads em um único painel.',
      span: 'lg:col-span-2',
      visual: (
        <div className="flex flex-col gap-2 w-full max-w-sm ml-auto opacity-95">
          <div className="self-end max-w-[80%] bg-white text-black text-xs px-3 py-2 rounded-2xl rounded-br-sm shadow-lg shadow-black/40">
            Olá! Tenho interesse na proposta.
          </div>
          <div className="self-start max-w-[80%] bg-white/10 backdrop-blur text-white text-xs px-3 py-2 rounded-2xl rounded-bl-sm border border-white/10">
            Perfeito! Posso te enviar agora.
          </div>
          <div className="self-end max-w-[80%] bg-white text-black text-xs px-3 py-2 rounded-2xl rounded-br-sm shadow-lg shadow-black/40">
            Vamos fechar.
          </div>
        </div>
      ),
    },
    {
      icon: KanbanSquare,
      title: 'Gestão de Funil',
      description: 'Organize e categorize seus contatos conforme o momento da negociação.',
      span: '',
      visual: (
        <div className="flex gap-1.5 justify-end ml-auto">
          {[
            { label: 'Novo', count: 12, c: 'bg-white/[0.04]' },
            { label: 'Quente', count: 7, c: 'bg-white/[0.08]' },
            { label: 'Fechado', count: 4, c: 'bg-white/[0.14]' },
          ].map((col) => (
            <div
              key={col.label}
              className={`${col.c} border border-white/10 rounded-lg p-2 w-16`}
            >
              <div className="text-[9px] text-white/70 mb-1">{col.label}</div>
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-1.5 bg-white/20 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: Send,
      title: 'Envios Estratégicos',
      description: 'Realize campanhas de massa e alcance seu público com agilidade.',
      span: '',
      visual: (
        <div className="flex items-end justify-end gap-1.5 h-20 ml-auto">
          {[40, 65, 50, 80, 70, 95, 60].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              className="w-3 bg-gradient-to-t from-white/30 to-white rounded-t"
            />
          ))}
        </div>
      ),
    },
    {
      icon: Brain,
      title: 'Inteligência de leads',
      description: 'Categorize automaticamente seus contatos e priorize quem está pronto para comprar.',
      span: 'lg:col-span-2',
      visual: (
        <div className="flex flex-wrap gap-1.5 justify-end ml-auto w-full max-w-sm">
          {['Hot', 'Warm', 'VIP', 'Novo', 'Reativar', 'Cliente'].map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-[10px] px-2 py-1 rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur"
            >
              {t}
            </motion.span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <section id="recursos" className="relative px-4 sm:px-8 py-24 sm:py-32">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.18em] text-white/60 font-semibold">
            Recursos
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Tudo que você precisa
            <br />
            para escalar suas conversas.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-xl p-6 sm:p-7 lg:min-h-[300px] flex flex-col gap-8 ${f.span}`}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.08), transparent 70%)',
                  }}
                />
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed max-w-sm">{f.description}</p>
                </div>
                <div className="relative mt-auto pointer-events-none">{f.visual}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Zap,
      title: 'Conecte em segundos',
      desc: 'Escaneie o QR Code e seu WhatsApp já está integrado ao painel.',
    },
    {
      icon: Users,
      title: 'Organize seus leads',
      desc: 'Categorias inteligentes e funil personalizado para sua operação.',
    },
    {
      icon: Send,
      title: 'Dispare campanhas',
      desc: 'Modelos prontos, mídia rica e envios em massa com poucos cliques.',
    },
  ];

  return (
    <section id="como-funciona" className="relative px-4 sm:px-8 py-20 sm:py-28">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.18em] text-white/60 font-semibold">
            Como funciona
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Três passos para começar.
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6"
              >
                <div className="absolute top-5 right-5 text-5xl font-extrabold text-white/[0.04]">
                  0{i + 1}
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

function Pricing() {
  const navigate = useNavigate();
  const features = [
    'Chat integrado com WhatsApp',
    'Gestão de funil e categorias',
    'Campanhas de massa',
    'Templates personalizados',
    'Categorias personalizadas',
  ];

  const plans = [
    {
      name: 'Trial',
      price: 'R$ 0',
      period: '',
      tagline: '2 dias ou 50 envios',
      cta: 'Começar grátis',
      highlight: false,
    },
    {
      name: 'Mensal Pro',
      price: 'R$ 49',
      period: '/mês',
      tagline: 'Envios ilimitados',
      cta: 'Assinar plano',
      highlight: false,
    },
    {
      name: 'Anual Pro',
      price: 'R$ 389',
      period: '/ano',
      tagline: 'Equivale a ~R$ 32/mês',
      cta: 'Economizar 34%',
      highlight: true,
      badge: 'Economize 34%',
    },
  ];

  return (
    <section id="planos" className="relative px-4 sm:px-8 py-24 sm:py-32">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(11,14,17,0) 70%)',
        }}
      />
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.18em] text-white/60 font-semibold">
            Planos
          </span>
          <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Escolha o plano ideal.
          </h2>
          <p className="mt-4 text-white/55 max-w-xl mx-auto">
            Comece grátis, evolua conforme cresce. Sem fidelidade.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-2xl p-7 backdrop-blur-xl flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-white/[0.10] to-white/[0.02] border-2 border-white shadow-2xl shadow-white/10'
                  : 'bg-white/[0.03] border border-white/10'
              }`}
            >
              {plan.highlight && (
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-60"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 40%)',
                    mask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
                    WebkitMask: 'linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: 1,
                  }}
                />
              )}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-semibold px-3 py-1 rounded-full shadow-lg shadow-black/40">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-white font-bold text-lg">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {plan.price}
                </span>
                {plan.period && <span className="text-white/50 text-sm">{plan.period}</span>}
              </div>
              <p className="mt-2 text-sm text-white/55">{plan.tagline}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/login')}
                className={`mt-7 w-full font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] ${
                  plan.highlight
                    ? 'bg-white hover:bg-white/90 text-black shadow-lg shadow-white/15'
                    : 'bg-black hover:bg-black/80 text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function CTA() {
  const navigate = useNavigate();
  return (
    <section className="px-4 sm:px-8 py-24">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-white/[0.02] backdrop-blur-xl p-10 sm:p-16 text-center"
      >
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              'radial-gradient(50% 80% at 50% 100%, rgba(255,255,255,0.18) 0%, rgba(11,14,17,0) 70%)',
          }}
        />
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Pronto para vender mais?
        </h2>
        <p className="mt-4 text-white/60 max-w-lg mx-auto">
          Crie sua conta gratuita e veja seus leads se transformarem em clientes.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="group mt-8 inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-white/10 transition-all hover:scale-[1.02]"
        >
          Começar Agora
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-4 sm:px-8 py-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-white/80 font-semibold text-sm">BrainLead</span>
        </div>
        <p className="text-xs text-white/40">
          {new Date().getFullYear()} BrainLead. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div
      className="min-h-screen bg-[#0B0E11] text-white antialiased"
      onMouseMove={(e) => {
        const target = e.target as HTMLElement;
        const card = target.closest('[class*="group"]') as HTMLElement | null;
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          card.style.setProperty('--my', `${e.clientY - rect.top}px`);
        }
      }}
    >
      <Navbar />
      <Hero />
      <BentoGrid />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
