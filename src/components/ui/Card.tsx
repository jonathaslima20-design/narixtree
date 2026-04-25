import { ReactNode, MouseEvent, useRef, useState } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: boolean;
  interactive?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  glow = false,
  interactive = false,
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos({ x: -200, y: -200 })}
      className={`relative glass-panel rounded-2xl ${interactive ? 'hover-lift hover:border-white/20' : ''} ${glow ? 'shadow-glow' : ''} ${paddings[padding]} ${className}`}
    >
      {interactive && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.08), transparent 60%)`,
            opacity: pos.x < 0 ? 0 : 1,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
