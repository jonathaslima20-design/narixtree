interface AmbientBackgroundProps {
  intensity?: 'subtle' | 'medium' | 'hero';
  className?: string;
}

export function AmbientBackground({ intensity = 'subtle', className = '' }: AmbientBackgroundProps) {
  const orbOpacity = {
    subtle: '0.03',
    medium: '0.05',
    hero: '0.08',
  }[intensity];

  const radialOpacity = {
    subtle: '0.04',
    medium: '0.06',
    hero: '0.10',
  }[intensity];

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,${radialOpacity}) 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 80% 100%, rgba(255,255,255,${radialOpacity}) 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute top-[-10%] left-[10%] w-[420px] h-[420px] rounded-full blur-3xl"
        style={{ background: `rgba(255,255,255,${orbOpacity})` }}
      />
      <div
        className="absolute bottom-[-10%] right-[5%] w-[380px] h-[380px] rounded-full blur-3xl"
        style={{ background: `rgba(255,255,255,${orbOpacity})` }}
      />
      {intensity !== 'subtle' && (
        <div className="absolute inset-0 grid-overlay grid-overlay-mask opacity-60" />
      )}
    </div>
  );
}
