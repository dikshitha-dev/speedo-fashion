import React from 'react';
import { ArrowRight, Sparkles, Send } from 'lucide-react';

export default function FinalCTA({ onExploreClick }) {
  return (
    <section className="py-20 bg-tessellation-dark text-white relative overflow-hidden">
      {/* Background Origami Facets */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #FF6B6B 10%, transparent 60%)'
        }}></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Origami Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#1A1A1A] border border-[#FF6B6B] text-[#FF6B6B] text-xs font-mono font-bold tracking-wider mb-6 clip-origami-badge">
          <Sparkles className="w-3.5 h-3.5" />
          SPEEDO FASHIONS • 2026 ARCHIVE
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-tight max-w-3xl mx-auto mb-6">
          UNFOLD YOUR PERSONAL <span className="text-[#FF6B6B] underline decoration-4 decoration-white">GEOMETRY.</span>
        </h2>

        {/* Subtext */}
        <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-normal leading-relaxed mb-10">
          Join over 12,000 architectural fashion connoisseurs. Discover new drops, seasonal tessellations, 
          and invite-only private trunk shows.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <a
            href="#catalog"
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 bg-[#FF6B6B] hover:bg-[#fa5555] text-white font-bold text-xs uppercase tracking-wider clip-origami-btn shadow-origami-bold hover:-translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Shop The 2026 Archive</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="#catalog"
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-white hover:bg-white hover:text-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider clip-origami-btn transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Browse Full Catalog</span>
          </a>
        </div>

        {/* Origami Micro-crease notice */}
        <p className="text-[11px] font-mono text-gray-400 mt-8">
          Precision laser folding • Carbon-neutral dispatch • Lifetime structural seam guarantee
        </p>

      </div>
    </section>
  );
}

