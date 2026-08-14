import React from 'react';
import { REPORT_NAVIGATION, ReportSectionId } from './reportUtils';

interface ReportNavigationProps {
  readonly activeSectionId: string;
}

export const ReportNavigation: React.FC<ReportNavigationProps> = ({ activeSectionId }) => {
  return (
    <nav
      aria-label="Natal Analysis Report Sections"
      className="print-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto space-y-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md"
    >
      <div className="hidden lg:block px-3 py-2 text-xs font-mono-code font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 mb-2">
        Report Sections (17)
      </div>

      {/* Desktop List */}
      <div className="hidden lg:flex lg:flex-col space-y-0.5">
        {REPORT_NAVIGATION.map((item) => {
          const isActive = activeSectionId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center font-mono-code text-[10px] shrink-0 ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.number}
              </span>
              <span className="truncate">{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* Mobile Horizontal Bar */}
      <div className="lg:hidden flex overflow-x-auto gap-2 no-scrollbar py-1 px-1">
        {REPORT_NAVIGATION.map((item) => {
          const isActive = activeSectionId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="font-mono-code text-[10px] opacity-80">{item.number}.</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
