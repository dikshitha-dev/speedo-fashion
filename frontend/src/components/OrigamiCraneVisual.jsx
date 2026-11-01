import React, { useState } from 'react';

export default function OrigamiCraneVisual() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 25, y: -y * 25 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div 
      className="relative w-full max-w-[420px] aspect-square mx-auto flex items-center justify-center cursor-pointer select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Origami Compass Crease Rings */}
      <div className="absolute inset-0 border border-[#B0B0B0]/40 rounded-full scale-90 animate-spin" style={{ animationDuration: '45s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FF6B6B] transform rotate-45"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#87CEEB] transform rotate-45"></div>
      </div>
      <div className="absolute inset-4 border border-dashed border-[#B0B0B0]/30 transform rotate-12"></div>
      <div className="absolute inset-8 border border-[#B0B0B0]/20 transform -rotate-6"></div>

      {/* Floating 3D Folded Geometry */}
      <div 
        className="w-72 h-72 relative transition-transform duration-300 ease-out"
        style={{
          perspective: '900px',
          transform: `rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`
        }}
      >
        <div className="origami-stage">
          {/* Main Paper Fold Facets */}
          <div 
            className="origami-face"
            style={{
              background: 'linear-gradient(135deg, #FAFAFA 0%, #D4D4D4 100%)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              transform: 'rotateY(0deg) translateZ(65px)',
              boxShadow: '4px 4px 20px rgba(0,0,0,0.12)'
            }}
          >
            <div className="absolute inset-0 flex items-end justify-center pb-3 text-[10px] font-bold text-[#1A1A1A]/60 tracking-widest uppercase">
              FOLD 01
            </div>
          </div>

          <div 
            className="origami-face"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #D93838 100%)',
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 70%)',
              transform: 'rotateY(75deg) translateZ(55px)',
            }}
          >
            <div className="absolute top-2 right-2 text-[9px] font-black text-white/90">
              CORAL CREASE
            </div>
          </div>

          <div 
            className="origami-face"
            style={{
              background: 'linear-gradient(135deg, #87CEEB 0%, #5EAAD4 100%)',
              clipPath: 'polygon(0% 0%, 100% 30%, 50% 100%)',
              transform: 'rotateY(-75deg) translateZ(55px)',
            }}
          />

          <div 
            className="origami-face"
            style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
              clipPath: 'polygon(100% 0%, 0% 50%, 80% 100%)',
              transform: 'rotateX(75deg) translateZ(50px)',
            }}
          />

          <div 
            className="origami-face"
            style={{
              background: 'linear-gradient(135deg, #A8D5BA 0%, #7CB994 100%)',
              clipPath: 'polygon(30% 0%, 100% 50%, 0% 100%)',
              transform: 'rotateX(-75deg) translateZ(50px)',
            }}
          />

          <div 
            className="origami-face"
            style={{
              background: 'linear-gradient(135deg, #F0C987 0%, #DEAC57 100%)',
              clipPath: 'polygon(50% 15%, 100% 85%, 0% 85%)',
              transform: 'rotateY(180deg) translateZ(60px)',
            }}
          />
        </div>
      </div>

      {/* Interactive Tag Pill */}
      <div className="absolute -bottom-4 bg-white border border-[#1A1A1A] px-4 py-1.5 shadow-origami font-mono text-xs flex items-center gap-2">
        <span className="w-2 h-2 bg-[#FF6B6B] inline-block animate-ping"></span>
        <span className="font-bold text-[#1A1A1A]">PRECISION 3D MESH</span>
        <span className="text-[#B0B0B0]">|</span>
        <span className="text-[#4A4A4A]">800px TILT</span>
      </div>
    </div>
  );
}

