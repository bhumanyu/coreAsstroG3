import React from 'react';
import { FullNatalAnalysisReport } from '../../types';
import { Printer, ShieldCheck, Sparkles, ScrollText } from 'lucide-react';

interface ReportHeaderProps {
  readonly report: FullNatalAnalysisReport;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ report }) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const birthName = (report.birthInformation?.details as any)?.name || 'Subject Chart';
  const version = report.version || 'P-21-v1';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              {version}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Contract Grounded Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-astro text-slate-100 flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-indigo-400 shrink-0" />
            Full Natal Analysis Report
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Presentation of the deterministic P-21 natal analysis report.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 print-hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono-code">
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Ayanamsa</span>
          <span className="text-slate-200 font-bold">{report.methodology?.ayanamsa}</span>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Zodiac</span>
          <span className="text-slate-200 font-bold">{report.methodology?.zodiac}</span>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">House System</span>
          <span className="text-slate-200 font-bold">{report.methodology?.houseSystem}</span>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Dasha System</span>
          <span className="text-slate-200 font-bold">{report.methodology?.dashaSystem}</span>
        </div>
      </div>
    </div>
  );
};
