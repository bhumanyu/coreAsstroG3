import React from 'react';

export const ResearchChunkFallback: React.FC = () => (
  <div role="status" aria-live="polite" className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 text-sm text-slate-300">
    Loading research tool...
  </div>
);
