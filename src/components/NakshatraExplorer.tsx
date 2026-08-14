import React, { useState } from 'react';
import { NAKSHATRAS_METADATA, PLANETS_METADATA } from '../data/astroData';
import { calculateNakshatra, normalizeDegree, calculateSign } from '../engine/astroEngine';
import { Search, Compass, Sparkles, Filter } from 'lucide-react';
import { Planet } from '../types';

export const NakshatraExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLord, setSelectedLord] = useState<string>('ALL');
  const [calcDegree, setCalcDegree] = useState<string>('213.3333333333');

  const parsedDeg = parseFloat(calcDegree) || 0;
  const nakResult = calculateNakshatra(parsedDeg);
  const signResult = calculateSign(parsedDeg);

  const filteredNakshatras = NAKSHATRAS_METADATA.filter((item) => {
    const matchesSearch =
      (item.englishName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sanskritName || '').includes(searchTerm) ||
      (item.deity || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLord = selectedLord === 'ALL' || item.lord === selectedLord;
    return matchesSearch && matchesLord;
  });

  return (
    <div className="space-y-6">
      {/* Interactive Longitude Calculator Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 border border-purple-500/20 rounded-md inline-block">
              Nakshatra Calculator Engine
            </span>
            <h3 className="text-lg font-bold font-serif-astro text-slate-100">
              Calculate Nakshatra & Pada by Longitude
            </h3>
            <p className="text-xs text-slate-400">
              Enter any ecliptic longitude degree [0°, 360°) to test Nakshatra & Pada boundary logic
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <input
                type="number"
                step="0.0000000001"
                value={calcDegree}
                onChange={(e) => setCalcDegree(e.target.value)}
                placeholder="Degree (e.g. 173.33)"
                className="bg-slate-950 border border-indigo-500/50 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm font-mono-code text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full sm:w-48 shadow-inner"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono-code">°</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Nakshatra</span>
                <span className="font-bold text-amber-300 text-sm font-serif-astro">
                  {nakResult.nakshatra}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Pada</span>
                <span className="font-bold text-purple-300 font-mono-code">
                  Pada {nakResult.padaNumber}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-mono-code">Sign</span>
                <span className="font-bold text-slate-200">
                  {signResult}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Nakshatra or Deity..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-slate-400">Vimshottari Lord:</span>
          <select
            value={selectedLord}
            onChange={(e) => setSelectedLord(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-indigo-300 font-semibold focus:outline-none"
          >
            <option value="ALL">All 9 Lords</option>
            {Object.values(Planet).map((p) => (
              <option key={p} value={p}>
                {PLANETS_METADATA[p].englishName} ({PLANETS_METADATA[p].sanskritName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nakshatras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNakshatras.map((nak) => {
          const lordInfo = nak.lord ? PLANETS_METADATA[nak.lord] : undefined;
          return (
            <div
              key={nak.number}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all shadow-md group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono-code font-bold flex items-center justify-center">
                      {nak.number}
                    </span>
                    <h4 className="text-base font-bold font-serif-astro text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {nak.englishName}
                    </h4>
                    <span className="text-xs text-slate-400 font-serif-astro">
                      {nak.sanskritName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Deity: <span className="text-slate-200 font-medium">{nak.deity || 'N/A'}</span>
                  </p>
                </div>

                {lordInfo && (
                  <span className="px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                    Lord: {lordInfo.englishName}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono-code">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Start Degree</span>
                  <span className="text-slate-300">
                    {nak.startDegree !== undefined ? `${nak.startDegree.toFixed(2)}°` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">End Degree</span>
                  <span className="text-slate-300">
                    {nak.endDegree !== undefined ? `${nak.endDegree.toFixed(2)}°` : 'N/A'}
                  </span>
                </div>
                <div className="col-span-2 text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Symbol: {nak.symbol || 'N/A'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
