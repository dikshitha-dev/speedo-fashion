import React from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PricingTiers({ onSelectTier }) {
  const tiers = [
    {
      id: 'tier-1',
      name: 'Paper Novice',
      price: '$49',
      period: 'per season',
      desc: 'Essential access for enthusiasts exploring geometric paper-crease streetwear.',
      features: [
        'Early 24h drop access to standard drops',
        'Digital Miura-ori fold care guides',
        'Standard folded packaging',
        '10% off seasonal seasonal lookbooks'
      ],
      isHighlighted: false,
      cta: 'Join Novice'
    },
    {
      id: 'tier-2',
      name: 'Master Folder',
      price: '$129',
      period: 'per season',
      desc: 'Our premier couture guild pass for avant-garde collectors and stylists.',
      features: [
        'Guaranteed reservation for Limited Run outerwear',
        'Complimentary White-Glove Crease restoration',
        'Laser-etched metal origami membership badge',
        'Exclusive invite to Tokyo & Milan private fold ateliers',
        'Free express priority worldwide shipping on all orders',
        'Direct hotline to Speedo Fashions lead couturier'
      ],
      isHighlighted: true,
      cta: 'Claim Master Pass'
    },
    {
      id: 'tier-3',
      name: 'Atelier Bespoke',
      price: '$299',
      period: 'per season',
      desc: 'Made-to-measure 3D polygonal tailoring with custom bespoke fold angles.',
      features: [
        'Custom 3D body-scan bespoke patterning',
        'One-of-one handcrafted origami couture garment',
        'Personalized Japanese Washi mulberry box storage',
        'Unlimited seasonal alterations and crease recalibration'
      ],
      isHighlighted: false,
      cta: 'Inquire Bespoke'
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-tessellation relative border-b border-[#B0B0B0]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#1A1A1A] text-xs font-mono font-bold tracking-wider mb-3 shadow-origami">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
            COUTURE ACCESS GUILD
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-[#1A1A1A] tracking-tight">
            VIP MEMBERSHIP & <span className="text-[#FF6B6B]">COUTURE TIERS</span>
          </h2>
          <p className="text-sm font-mono text-[#4A4A4A] mt-2">
            Unlock exclusive limited-edition origami runs, bespoke tailoring, and white-glove fold preservation.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`faceted-surface p-8 flex flex-col justify-between transition-all duration-300 relative ${
                tier.isHighlighted
                  ? 'border-2 border-[#1A1A1A] shadow-origami-bold bg-white lg:-translate-y-4 ring-2 ring-[#FF6B6B]/20'
                  : 'border border-[#B0B0B0]/60 shadow-origami'
              }`}
            >
              {/* Highlight Ribbon */}
              {tier.isHighlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6B6B] text-white px-4 py-1 text-[11px] font-mono font-bold uppercase tracking-wider clip-origami-badge shadow-sm">
                  ★ MOST POPULAR COUTURE PASS
                </div>
              )}

              <div>
                {/* Tier Name & Desc */}
                <h3 className="font-display font-black text-2xl text-[#1A1A1A] mb-1">
                  {tier.name}
                </h3>
                <p className="text-xs text-[#4A4A4A] mb-6 min-h-[36px]">
                  {tier.desc}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 pb-6 mb-6 border-b border-[#B0B0B0]/40">
                  <span className="font-display font-black text-4xl text-[#1A1A1A]">
                    {tier.price}
                  </span>
                  <span className="text-xs font-mono text-[#4A4A4A]">/{tier.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#1A1A1A]">
                      <div className={`p-0.5 mt-0.5 rounded-none flex-shrink-0 ${tier.isHighlighted ? 'bg-[#FF6B6B] text-white' : 'bg-gray-200 text-[#1A1A1A]'}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectTier(tier)}
                className={`w-full py-3.5 text-xs font-bold uppercase tracking-wider clip-origami-btn transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tier.isHighlighted
                    ? 'bg-[#FF6B6B] hover:bg-[#fa5555] text-white shadow-origami-bold hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-[#1A1A1A] hover:bg-[#333333] text-white shadow-origami hover:-translate-y-0.5 active:translate-y-0'
                }`}
              >
                <span>{tier.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

