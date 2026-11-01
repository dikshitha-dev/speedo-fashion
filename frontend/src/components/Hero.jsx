import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  const handleScrollToCatalog = (e) => {
    if (e) e.preventDefault();
    if (onExploreClick) {
      onExploreClick();
    } else {
      const catEl = document.getElementById('catalog');
      if (catEl) catEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full bg-[#0D0D0D] text-white overflow-hidden border-b border-[#222222]">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hero Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative min-h-[580px] lg:min-h-[660px] flex items-center">
        
        {/* Right Side: High-Resolution Male Model Background / Image */}
        <div className="absolute top-0 right-0 w-full lg:w-[62%] h-full pointer-events-none select-none overflow-hidden z-0">
          <img 
            src="/hero-model-clean.jpg"
            alt="Speedo Fashions Model - Wear the Confidence. Live the Style."
            className="w-full h-full object-cover object-top sm:object-center opacity-40 lg:opacity-100"
          />
          {/* Smooth Gradient Overlay for Perfect Legibility on Mobile and Desktop */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/90 lg:via-[#0D0D0D]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent lg:hidden"></div>
        </div>

        {/* Left Side: Crisp HTML Typography, Branding, and Actions */}
        <div className="relative z-10 py-12 lg:py-16 max-w-xl">
          
          {/* Speedo Fashions Custom Brush Logo + Emblem */}
          <div className="mb-4 sm:mb-5">
            <img 
              src="/speedo-hero-logo.png" 
              alt="Speedo Fashions" 
              className="h-16 sm:h-20 md:h-24 w-auto object-contain filter drop-shadow-md"
              onError={(e) => {
                // Graceful fallback if image is loading
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Horizontal Line Accent as seen in reference */}
            <div className="w-14 h-0.5 bg-white/20 mt-3 sm:mt-4"></div>
          </div>

          {/* Sharp Scalable Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-display font-extrabold text-white tracking-tight leading-[1.12]">
            Wear the Confidence.<br />
            Live the <span className="text-[#E53935]">Style.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-gray-300 font-sans mt-3 sm:mt-4 font-normal leading-relaxed">
            Premium men's fashion for every you.
          </p>

          {/* Interactive Calls To Action */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-7 sm:mt-8">
            <a
              href="#catalog"
              onClick={handleScrollToCatalog}
              className="px-7 sm:px-8 py-3.5 sm:py-4 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <span>SHOP NOW</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="#catalog"
              onClick={handleScrollToCatalog}
              className="px-7 sm:px-8 py-3.5 sm:py-4 bg-transparent hover:bg-white/10 text-white border border-white/80 hover:border-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>EXPLORE COLLECTION</span>
            </a>
          </div>

          {/* Bottom Brand Quality Pillars */}
          <div className="flex items-center gap-3 sm:gap-4 mt-10 sm:mt-12 text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] text-gray-400 select-none">
            <span className="w-10 sm:w-16 h-px bg-white/20"></span>
            <span>STYLE</span>
            <span className="text-gray-600 font-sans">•</span>
            <span>COMFORT</span>
            <span className="text-gray-600 font-sans">•</span>
            <span>CONFIDENCE</span>
            <span className="w-10 sm:w-16 h-px bg-white/20"></span>
          </div>

        </div>

      </div>
    </section>
  );
}
