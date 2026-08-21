import React from 'react';
import { Compass, Sparkles, Calendar, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BirthDetails, AyanamsaType } from '../types';
import { AppTab } from '../types/appTabs';

interface HeaderProps {
  birthDetails: BirthDetails;
  onOpenBirthForm: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onResetPreset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  birthDetails,
  onOpenBirthForm,
  activeTab,
  setActiveTab,
  onResetPreset
}) => {
  const tabs: readonly { id: AppTab; label: string }[] = [
    { id: 'life-analysis', label: 'Life Analysis' },
    { id: 'report', label: 'Detailed Analysis' },
    { id: 'horoscope', label: 'Horoscope & Charts' },
    { id: 'planets', label: 'Planetary Facts & Dignity' },
    { id: 'transit', label: 'Gochara Transits (PR-037)' },
    { id: 'divisional', label: 'Divisional Vargas (D1, D3, D9, D10)' },
    { id: 'nakshatras', label: '27 Nakshatras Wheel' },
    { id: 'relationships', label: 'Natural Relationships' },
    { id: 'validator', label: 'Golden Vector Test Suite' }
  ];

  const tz = birthDetails.timeZone || 'UTC';
  const isoClean = (birthDetails.dateTimeStr && (birthDetails.dateTimeStr.includes('Z') || birthDetails.dateTimeStr.includes('+') || (birthDetails.dateTimeStr.length > 10 && birthDetails.dateTimeStr.slice(10).includes('-'))))
    ? birthDetails.dateTimeStr
    : (birthDetails.dateTimeStr ? birthDetails.dateTimeStr + 'Z' : new Date().toISOString());
  const formattedDate = new Date(isoClean).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: tz
  });

  const zoneLabel = {
    'UTC': 'UTC',
    'Asia/Kolkata': 'IST',
    'America/New_York': 'EST',
    'Europe/London': 'GMT',
    'Asia/Tokyo': 'JST'
  }[tz] || tz;

  return (
    <header className="bg-slate-900/90 border-b border-indigo-500/20 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-wide font-serif-astro text-slate-100">
                CoreAstro Engine
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full">
                v0.1.0-TS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Vedic Astronomical & Astrological Calculation System
            </p>
          </div>
        </div>

        {/* Current Birth Details Badge & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenBirthForm}
            className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition-all cursor-pointer shadow-sm"
            title="Edit Birth Details & Ayanamsa"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium">{(birthDetails as any).name || 'Birth Chart'}</span>
            {(birthDetails as any).placeOfBirth && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {(birthDetails as any).placeOfBirth}
                </span>
              </>
            )}
            <span className="text-slate-500">•</span>
            <span className="font-mono-code text-slate-400">{formattedDate} {zoneLabel}</span>
            <span className="text-slate-500">•</span>
            <span className="text-purple-400 font-semibold">{birthDetails.ayanamsa}</span>
          </button>

          <button
            onClick={onResetPreset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset to Vedic Epoch Default"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenBirthForm}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Chart</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80 flex overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'validator' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
