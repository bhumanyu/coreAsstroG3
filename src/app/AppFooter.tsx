import React from 'react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-100/90 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 py-5 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 font-mono-code flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <span>CoreAstro Engine • Ported to React & TypeScript • v0.1.0-TS</span>
        <span>Vedic Astronomical & Astrological Calculation System</span>
      </div>
    </footer>
  );
};
