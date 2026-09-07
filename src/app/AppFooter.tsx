import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono-code flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>CoreAstro Engine • Ported to React & TypeScript • v0.1.0-TS</span>
        <span>Vedic Astronomical & Astrological Calculation System</span>
      </div>
    </footer>
  );
};
