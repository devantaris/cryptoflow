import React from 'react';

export const ParticleCanvas: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Soft warm paper ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[350px] bg-gradient-to-b from-stone-100/80 via-amber-50/20 to-transparent rounded-full blur-3xl" />
      {/* Subtle fine print grid */}
      <div className="absolute inset-0 opacity-[0.025] bg-[radial-gradient(#1c1917_1px,transparent_1px)] [background-size:24px_24px]" />
    </div>
  );
};
