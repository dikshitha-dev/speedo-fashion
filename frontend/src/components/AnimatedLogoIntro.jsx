import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedLogoIntro
 * 
 * Cinematic, racing-inspired logo reveal for Speedo Fashions.
 * - Total duration: ~3.2 seconds (at least 2s as specified).
 * - Plays once per browser session (persisted via sessionStorage).
 * - Respects prefers-reduced-motion.
 * - Seamlessly dissolves into the already-loaded homepage.
 * - Leaves 0 DOM overhead once completed.
 */
export default function AnimatedLogoIntro({ onComplete }) {
  // 'playing' -> 'dissolving' -> 'complete'
  const [stage, setStage] = useState(() => {
    if (typeof window === 'undefined') return 'complete';
    try {
      if (sessionStorage.getItem('speedo_intro_shown') === 'true') {
        return 'complete';
      }
    } catch (e) {
      // sessionStorage unavailable
    }
    return 'playing';
  });

  const timerRef1 = useRef(null);
  const timerRef2 = useRef(null);

  useEffect(() => {
    // If already marked complete or running server-side, do nothing
    if (stage === 'complete') return;

    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        try {
          sessionStorage.setItem('speedo_intro_shown', 'true');
        } catch (e) {}
        setStage('complete');
        onComplete?.();
        return;
      }
    }

    // Lock body scroll only while the intro animation is actively playing
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Phase 6 begins: Start smooth dissolve at 2550ms
    timerRef1.current = setTimeout(() => {
      setStage('dissolving');
    }, 2550);

    // Intro complete: Fully remove from DOM at 3200ms
    timerRef2.current = setTimeout(() => {
      try {
        sessionStorage.setItem('speedo_intro_shown', 'true');
      } catch (e) {}
      document.body.style.overflow = prevBodyOverflow || '';
      setStage('complete');
      onComplete?.();
    }, 3200);

    return () => {
      if (timerRef1.current) clearTimeout(timerRef1.current);
      if (timerRef2.current) clearTimeout(timerRef2.current);
      document.body.style.overflow = prevBodyOverflow || '';
    };
  }, []);

  const handleSkip = (e) => {
    if (e) e.stopPropagation();
    try {
      sessionStorage.setItem('speedo_intro_shown', 'true');
    } catch (err) {}
    document.body.style.overflow = '';
    setStage('dissolving');
    setTimeout(() => {
      setStage('complete');
      onComplete?.();
    }, 250);
  };

  // Keyboard shortcut: Space, Escape, or Enter to skip
  useEffect(() => {
    if (stage === 'complete') return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage]);

  // If complete, unmount completely from DOM
  if (stage === 'complete') return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-700 ease-out ${
        stage === 'dissolving' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ willChange: 'opacity' }}
      aria-label="Speedo Fashions Introduction"
      role="banner"
    >
      {/* Embedded High-Performance Animation Keyframes */}
      <style>{`
        /* Phase 1 & 4: Deep ambient red glow */
        @keyframes speedoIntroAmbientGlow {
          0% {
            opacity: 0;
            transform: scale(0.65);
          }
          15% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          40% {
            opacity: 0.55;
            transform: scale(1.05);
          }
          65% {
            opacity: 0.75;
            transform: scale(1.15);
          }
          85% {
            opacity: 0.5;
            transform: scale(1.05);
          }
          100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
        }

        /* Phase 2: Aerodynamic racing laser streak */
        @keyframes speedoLaserStreak {
          0% {
            transform: translateX(-120%) scaleX(0.4);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateX(-35%) scaleX(1);
          }
          70% {
            opacity: 1;
            transform: translateX(55%) scaleX(1.2);
          }
          100% {
            transform: translateX(135%) scaleX(0.6);
            opacity: 0;
          }
        }

        /* Phase 2b: Secondary racing streak accent */
        @keyframes speedoLaserStreakSecondary {
          0% {
            transform: translateX(-110%) scaleX(0.3);
            opacity: 0;
          }
          25% {
            opacity: 0.85;
            transform: translateX(-15%) scaleX(0.85);
          }
          75% {
            opacity: 0.85;
            transform: translateX(70%) scaleX(1.1);
          }
          100% {
            transform: translateX(125%) scaleX(0.5);
            opacity: 0;
          }
        }

        /* Phase 3: Logo Reveal (opacity 0->1, subtle scale 94%->100%) */
        @keyframes speedoLogoReveal {
          0% {
            opacity: 0;
            transform: scale(0.94);
            filter: brightness(0.5) drop-shadow(0 0 0px rgba(229, 57, 53, 0));
          }
          55% {
            opacity: 0.95;
            transform: scale(0.985);
            filter: brightness(1.08) drop-shadow(0 0 24px rgba(229, 57, 53, 0.45));
          }
          100% {
            opacity: 1;
            transform: scale(1.0);
            filter: brightness(1.0) drop-shadow(0 0 35px rgba(229, 57, 53, 0.4));
          }
        }

        /* Phase 4: Light sweep shimmer across the logo surface */
        @keyframes speedoLightSweep {
          0% {
            transform: translateX(-160%) skewX(-25deg);
            opacity: 0;
          }
          25% {
            opacity: 0.9;
          }
          75% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(200%) skewX(-25deg);
            opacity: 0;
          }
        }

        /* Phase 4b: SF Emblem focus pulse */
        @keyframes speedoEmblemPulse {
          0% {
            opacity: 0;
            transform: scale(0.7);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(1.3);
          }
        }

        /* Phase 5: Tagline reveal (opacity 0->1, gentle upward float) */
        @keyframes speedoTaglineFadeUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
            letter-spacing: 0.2em;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0.3em;
          }
        }
      `}</style>

      {/* Skip Button (top-right corner, non-intrusive) */}
      <button 
        type="button"
        onClick={handleSkip}
        className="absolute top-5 right-5 sm:top-7 sm:right-8 z-30 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white/40 hover:text-white px-3 py-1.5 rounded border border-white/10 hover:border-white/30 transition-all cursor-pointer bg-black/40 backdrop-blur-xs"
        aria-label="Skip Introduction"
      >
        SKIP
      </button>

      {/* PHASE 1 & 4: Deep ambient red glow in center */}
      <div 
        className="absolute w-[280px] h-[280px] sm:w-[460px] sm:h-[460px] md:w-[540px] md:h-[540px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(229, 57, 53, 0.35) 0%, rgba(200, 16, 16, 0.12) 42%, rgba(0, 0, 0, 0) 72%)',
          animation: 'speedoIntroAmbientGlow 3.0s ease-in-out forwards',
          willChange: 'transform, opacity',
        }}
      />

      {/* Faint white reflection behind central area for depth */}
      <div 
        className="absolute w-[180px] h-[180px] sm:w-[280px] sm:h-[280px] rounded-full pointer-events-none opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.45) 0%, transparent 65%)',
        }}
      />

      {/* PHASE 2: Aerodynamic Racing Red Light Streak */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-24 flex flex-col justify-center">
        {/* Main Laser Streak */}
        <div 
          className="h-[2px] sm:h-[3px] w-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(229, 57, 53, 0.15) 25%, #E53935 75%, #FFFFFF 96%, #FFFFFF 100%)',
            boxShadow: '0 0 16px 2px #E53935, 0 0 32px 6px rgba(229, 57, 53, 0.65)',
            animation: 'speedoLaserStreak 0.52s cubic-bezier(0.2, 0.8, 0.25, 1) 0.38s both',
            willChange: 'transform',
          }}
        />
        {/* Secondary Laser Accent */}
        <div 
          className="h-[1px] w-full mt-2 sm:mt-2.5"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(229, 57, 53, 0.3) 35%, #E53935 85%, #FFFFFF 100%)',
            boxShadow: '0 0 10px 1px rgba(229, 57, 53, 0.8)',
            animation: 'speedoLaserStreakSecondary 0.48s cubic-bezier(0.2, 0.8, 0.25, 1) 0.46s both',
            willChange: 'transform',
          }}
        />
      </div>

      {/* PHASE 3 & 4: Logo Reveal & Light Sweep Container */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center px-4"
        style={{
          animation: 'speedoLogoReveal 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both',
          willChange: 'transform, opacity, filter',
        }}
      >
        {/* Logo Image Frame - Pure 1024x1024 square, scaled proportionally */}
        <div className="relative w-[68vw] max-w-[280px] sm:w-[350px] md:w-[400px] aspect-square flex items-center justify-center overflow-hidden">
          <img 
            src="/speedo-brand-logo.jpg" 
            alt="Speedo Fashions Logo"
            className="w-full h-full object-contain select-none"
            style={{
              mixBlendMode: 'screen',
            }}
            onError={(e) => {
              // Graceful fallback to existing logo if needed
              e.currentTarget.src = '/logo.jpg';
            }}
          />

          {/* PHASE 4: Refined Light Sweep across logo */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(110deg, transparent 25%, rgba(255, 255, 255, 0.18) 46%, rgba(255, 255, 255, 0.8) 50%, rgba(229, 57, 53, 0.45) 54%, transparent 75%)',
              mixBlendMode: 'screen',
              animation: 'speedoLightSweep 0.65s cubic-bezier(0.25, 1, 0.5, 1) 1.5s both',
              willChange: 'transform',
            }}
          />

          {/* PHASE 4b: SF Emblem Highlight Accent at the bottom */}
          <div 
            className="absolute bottom-6 sm:bottom-8 w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(229, 57, 53, 0.55) 0%, rgba(229, 57, 53, 0.15) 45%, transparent 70%)',
              animation: 'speedoEmblemPulse 0.55s ease-out 1.7s both',
              willChange: 'transform, opacity',
            }}
          />
        </div>

        {/* PHASE 5: Brand Tagline */}
        <div 
          className="mt-4 sm:mt-5 text-center px-4 max-w-md"
          style={{
            animation: 'speedoTaglineFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) 2.0s both',
            willChange: 'transform, opacity',
          }}
        >
          <p className="font-sans font-normal text-[11px] sm:text-xs md:text-sm text-gray-200 tracking-[0.24em] sm:tracking-[0.32em] uppercase leading-relaxed">
            Beyond Fashion, One Look at a Time
          </p>
        </div>
      </div>
    </div>
  );
}
