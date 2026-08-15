import { useEffect, useState } from 'react';

/**
 * Indian-themed celebration overlay shown briefly when an order is placed.
 * Features a diya lamp glow, radiating mandala rings, floating marigold petals,
 * and a warm "Shubh!" blessing with a checkmark stamp.
 */
export default function CelebrationOverlay() {
  const [petals, setPetals] = useState<
    Array<{ id: number; x: number; delay: number; duration: number; size: number; rotate: number; color: string; sway: number }>
  >([]);

  useEffect(() => {
    const colors = ['#E3A72B', '#F59E0B', '#FBBF24', '#F97316', '#EAB308', '#D97706'];
    const newPetals = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: (i / 28) * 100 + (Math.random() - 0.5) * 6,
      delay: Math.random() * 0.8,
      duration: 2.2 + Math.random() * 1.5,
      size: 10 + Math.random() * 16,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      sway: 20 + Math.random() * 40,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Warm radial backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(193,68,14,0.25) 0%, rgba(42,32,24,0.55) 70%)',
        }}
      />

      {/* Falling marigold petals */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            animation: `petalFall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: p.size,
              height: p.size * 0.55,
              background: p.color,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              transform: `rotate(${p.rotate}deg)`,
              opacity: 0.9,
              boxShadow: '0 0 6px rgba(227,167,43,0.4)',
              animation: `petalSway ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        </div>
      ))}

      {/* Center content */}
      <div className="relative flex flex-col items-center">
        {/* Diya glow */}
        <div
          className="absolute -top-20 h-64 w-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(227,167,43,0.35) 0%, rgba(193,68,14,0.15) 40%, transparent 70%)',
            animation: 'glowPulse 2s ease-in-out infinite',
          }}
        />

        {/* Mandala rings */}
        <div className="relative flex h-44 w-44 items-center justify-center">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-saffron/50"
            style={{ animation: 'mandalaSpin 6s linear infinite' }}
          />
          {/* Dashed ring */}
          <div
            className="absolute inset-2 rounded-full border-2 border-dashed border-primary/40"
            style={{ animation: 'mandalaSpinReverse 5s linear infinite' }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-5 rounded-full border border-saffron/30"
            style={{ animation: 'mandalaSpin 4s linear infinite' }}
          />

          {/* Mandala petals (12 dots) */}
          {[...Array(12)].map((_, i) => {
            const angle = (i / 12) * 360;
            return (
              <div
                key={i}
                className="absolute h-2.5 w-2.5 rounded-full bg-saffron"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-78px)`,
                  animation: `dotPulse 1.6s ease-in-out infinite`,
                  animationDelay: `${i * 0.05}s`,
                  boxShadow: '0 0 8px rgba(227,167,43,0.6)',
                }}
              />
            );
          })}

          {/* Inner dots (8) */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 360 + 22.5;
            return (
              <div
                key={`inner-${i}`}
                className="absolute h-1.5 w-1.5 rounded-full bg-primary"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-58px)`,
                  opacity: 0.6,
                }}
              />
            );
          })}

          {/* Center stamp */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cardamom to-cardamom/80 shadow-2xl"
            style={{ animation: 'stampIn 0.6s cubic-bezier(0.2, 1.4, 0.4, 1) both' }}
          >
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-surface" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="mt-8 text-center" style={{ animation: 'textRise 0.5s ease 0.3s both' }}>
          <p className="font-display text-4xl font-bold text-surface" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            Shubh!
          </p>
          <p className="mt-2 font-mono text-sm tracking-wider text-saffron">
            Your order has been placed
          </p>
        </div>
      </div>

      <style>{`
        @keyframes petalFall {
          0% { transform: translateY(-30px); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.7; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes petalSway {
          0% { margin-left: 0px; }
          100% { margin-left: 30px; }
        }
        @keyframes mandalaSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mandalaSpinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes stampIn {
          from { opacity: 0; transform: scale(1.5) rotate(-12deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes textRise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
