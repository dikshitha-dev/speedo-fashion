import React from 'react';
import { Compass, Scissors, Layers, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

export default function Features() {
  const features = [
    {
      id: '01',
      title: 'Mathematical Fold Engineering',
      subtitle: 'Miura-Ori Kinematics',
      desc: 'Origami fold patterns calculated with aerospace precision. Fabrics accordion outward on movement and snap flush when stationary, delivering unrivaled aerodynamic drape.',
      icon: Compass,
      accent: 'border-l-[#FF6B6B]',
      tagColor: 'bg-[#FF6B6B]/10 text-[#FF6B6B]',
      stat: '0.2mm Fold Precision'
    },
    {
      id: '02',
      title: 'Low-Poly Faceted Tailoring',
      subtitle: '3D Polygonal Architecture',
      desc: 'Rejecting conventional flat seams, our master folders assemble each garment across interlocking geometric planes that catch ambient light like cut diamonds.',
      icon: Scissors,
      accent: 'border-l-[#87CEEB]',
      tagColor: 'bg-[#87CEEB]/15 text-[#2b7294]',
      stat: '36 Laser Cuts / Piece'
    },
    {
      id: '03',
      title: 'Crease-Memory Washi Hybrid',
      subtitle: 'Contemporary Paper Craft meets Digital',
      desc: 'Woven with Japanese washi paper mulberry bark and waterproof tech-nylon. It remembers its geometric crease lines indefinitely, even through heavy rain and washing cycles.',
      icon: Layers,
      accent: 'border-l-[#A8D5BA]',
      tagColor: 'bg-[#A8D5BA]/20 text-[#3d7a55]',
      stat: '100% Shape Retention'
    }
  ];

  return (
    <section id="features" className="py-24 bg-[#FAFAFA] relative border-b border-[#B0B0B0]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-[#B0B0B0]/40">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#1A1A1A] text-xs font-mono font-bold tracking-wider mb-3">
              <span className="w-2 h-2 bg-[#1A1A1A]"></span>
              INNOVATION PILLARS
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-[#1A1A1A] tracking-tight">
              THE ANATOMY OF AN <span className="text-[#FF6B6B]">ORIGAMI</span> SILHOUETTE
            </h2>
          </div>
          <p className="text-sm font-mono text-[#4A4A4A] mt-3 md:mt-0 max-w-sm">
            Mathematical origami principles applied to street couture and luxury apparel storage.
          </p>
        </div>

        {/* 3 Faceted Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id}
                className={`faceted-surface p-8 shadow-origami hover:shadow-origami-bold border-l-4 ${item.accent} flex flex-col justify-between group cursor-pointer`}
              >
                <div>
                  {/* Top Bar with Number & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-black text-[#B0B0B0] group-hover:text-[#1A1A1A] transition-colors">
                      /{item.id}
                    </span>
                    <span className={`text-[11px] font-mono font-bold uppercase px-2.5 py-1 ${item.tagColor} border border-current`}>
                      {item.stat}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 bg-white border border-[#1A1A1A] shadow-sm flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-[#1A1A1A]" />
                  </div>

                  {/* Title & Subtitle */}
                  <p className="text-xs font-mono uppercase text-[#4A4A4A] tracking-wider mb-1">
                    {item.subtitle}
                  </p>
                  <h3 className="text-xl font-display font-bold text-[#1A1A1A] mb-4 leading-snug">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#4A4A4A] leading-relaxed mb-6 font-normal">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Origami Indicator */}
                <div className="pt-4 border-t border-[#B0B0B0]/30 flex items-center justify-between text-xs font-mono text-[#1A1A1A]">
                  <span className="font-semibold uppercase tracking-wider">CREASE CODE: SF-OCTA</span>
                  <span className="text-[#FF6B6B] font-bold">→ 180° FLAT</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

