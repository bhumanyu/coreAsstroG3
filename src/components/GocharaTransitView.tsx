import React, { useState, useMemo } from 'react';
import { Horoscope, Planet, Sign, AyanamsaType } from '../types';
import { calculateTransit } from '../engine/transitEngine';
import { calculateCurrentTransitLongitudes } from '../engine/transitEphemeris';
import { PLANETS_METADATA, SIGNS_METADATA } from '../data/astroData';
import { Calendar, Compass, Eye, ShieldAlert, Sparkles, Clock, Layers, Orbit } from 'lucide-react';

interface GocharaTransitViewProps {
  horoscope: Horoscope;
}

export const GocharaTransitView: React.FC<GocharaTransitViewProps> = ({ horoscope }) => {
  const [transitDateStr, setTransitDateStr] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );

  const natalMoonLong =
    horoscope.planetFacts[Planet.MOON]?.position?.eclipticLongitude ??
    horoscope.planetFacts[Planet.MOON]?.position?.longitude ??
    0;
  const natalAscLong =
    horoscope.rasiChart?.ascendantLongitude ??
    horoscope.rasiChart?.ascendant?.longitude ??
    0;

  const transitDate = useMemo(() => {
    return new Date(transitDateStr || Date.now());
  }, [transitDateStr]);

  const transitLongitudes = useMemo(() => {
    return calculateCurrentTransitLongitudes(transitDate, horoscope.birthDetails.ayanamsa);
  }, [transitDate, horoscope.birthDetails.ayanamsa]);

  const transitAnalysis = useMemo(() => {
    return calculateTransit({
      at: transitDate.toISOString(),
      natalMoonLongitude: natalMoonLong,
      natalAscendantLongitude: natalAscLong,
      transitLongitudes
    });
  }, [transitDate, natalMoonLong, natalAscLong, transitLongitudes]);

  const setPresetDate = (monthsOffset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthsOffset);
    setTransitDateStr(d.toISOString().slice(0, 16));
  };

  const keyPlanets = [Planet.SATURN, Planet.JUPITER, Planet.RAHU, Planet.KETU, Planet.MARS];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono-code mb-1">
              <Orbit className="w-4 h-4 animate-spin-slow text-indigo-400" />
              <span>PR-037 • GOCHARA TRANSIT CALCULATOR</span>
            </div>
            <h2 className="text-2xl font-bold font-serif-astro text-slate-100">
              Vedic Planetary Gochara (Transit Analysis)
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Deterministic whole-sign transit positions, house offsets relative to natal Moon (Rasi) and Ascendant (Lagna), and active Graha Drishti aspect beams.
            </p>
          </div>

          {/* Date Picker & Preset Quick Actions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 min-w-[320px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Transit Timestamp
              </span>
              <span className="text-[10px] font-mono-code bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                {horoscope.birthDetails.ayanamsa}
              </span>
            </div>

            <input
              type="datetime-local"
              value={transitDateStr}
              onChange={(e) => setTransitDateStr(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono-code w-full"
            />

            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono-code">
              <button
                onClick={() => setTransitDateStr(new Date().toISOString().slice(0, 16))}
                className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded transition-colors cursor-pointer"
              >
                Now
              </button>
              <button
                onClick={() => setPresetDate(6)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer"
              >
                +6 Mths
              </button>
              <button
                onClick={() => setPresetDate(12)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer"
              >
                +1 Year
              </button>
            </div>
          </div>
        </div>

        {/* Natal Baselines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              🌙
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono-code block">Natal Moon (Janma Rasi)</span>
              <span className="text-sm font-bold text-slate-200 font-serif-astro">
                {transitAnalysis.natalMoonSign}
              </span>
              <span className="text-[11px] text-slate-500 font-mono-code ml-2">
                ({natalMoonLong.toFixed(2)}°)
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              🌅
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono-code block">Natal Ascendant (Lagna)</span>
              <span className="text-sm font-bold text-slate-200 font-serif-astro">
                {transitAnalysis.natalAscendantSign}
              </span>
              <span className="text-[11px] text-slate-500 font-mono-code ml-2">
                ({natalAscLong.toFixed(2)}°)
              </span>
            </div>
          </div>

          {transitAnalysis.results[Planet.SATURN] && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                🪐
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono-code block">Saturn Gochara</span>
                <span className="text-sm font-bold text-purple-300 font-serif-astro">
                  House {transitAnalysis.results[Planet.SATURN]?.housePosition.fromMoon} from Moon
                </span>
                <span className="text-[11px] text-slate-400 font-mono-code block">
                  in {transitAnalysis.results[Planet.SATURN]?.position.sign}
                </span>
              </div>
            </div>
          )}

          {transitAnalysis.results[Planet.JUPITER] && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                ✨
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono-code block">Jupiter Gochara</span>
                <span className="text-sm font-bold text-emerald-300 font-serif-astro">
                  House {transitAnalysis.results[Planet.JUPITER]?.housePosition.fromMoon} from Moon
                </span>
                <span className="text-[11px] text-slate-400 font-mono-code block">
                  in {transitAnalysis.results[Planet.JUPITER]?.position.sign}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Key Transits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {keyPlanets.map((planet) => {
          const meta = PLANETS_METADATA[planet];
          const res = transitAnalysis.results[planet];
          if (!res) return null;
          return (
            <div
              key={planet}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{meta.symbol}</span>
                  <span className="text-sm font-bold text-slate-200">{meta.englishName}</span>
                </div>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {res.position.longitude.toFixed(1)}°
                </span>
              </div>

              <div className="text-xs space-y-1.5 mt-3 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transit Sign:</span>
                  <span className="font-semibold text-slate-200">{res.position.sign}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nakshatra:</span>
                  <span className="font-mono-code text-indigo-300 text-[11px]">
                    {res.position.nakshatraResult.nakshatra} P{res.position.nakshatraResult.padaNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">From Moon:</span>
                  <span className="font-bold text-indigo-400">
                    House {res.housePosition.fromMoon}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">From Lagna:</span>
                  <span className="font-bold text-purple-400">
                    House {res.housePosition.fromAscendant}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Gochara Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 font-serif-astro">
              All Vedic Transit Positions & Graha Drishti Beams
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono-code">
            Whole Sign Gochara Calculations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-sans">
            <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase font-mono-code border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Planet</th>
                <th className="py-3 px-4">Transit Longitude</th>
                <th className="py-3 px-4">Transit Sign</th>
                <th className="py-3 px-4">Nakshatra & Pada</th>
                <th className="py-3 px-4 text-center">House (from Moon)</th>
                <th className="py-3 px-4 text-center">House (from Lagna)</th>
                <th className="py-3 px-4">Active Graha Drishti Targets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code text-[12px]">
              {Object.values(transitAnalysis.results).map((res) => {
                const planet = res.planet;
                const meta = PLANETS_METADATA[planet];

                return (
                  <tr key={planet} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-100 flex items-center space-x-2 font-sans">
                      <span className="text-base">{meta.symbol}</span>
                      <div>
                        <span>{meta.englishName}</span>
                        <span className="block text-[10px] text-slate-500 font-mono-code">{meta.sanskritName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {res.position.longitude.toFixed(2)}°
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-medium">
                        {res.position.sign} ({res.position.signNumber})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <span className="text-indigo-300">
                        {res.position.nakshatraResult.nakshatra}
                      </span>{' '}
                      <span className="text-slate-400">
                        (Pada {res.position.nakshatraResult.padaNumber})
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                        H{res.housePosition.fromMoon}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                        H{res.housePosition.fromAscendant}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {res.aspects.map((asp, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]"
                            title={asp.description}
                          >
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span className="font-semibold text-slate-200">{asp.targetSign}</span>
                            <span className="text-[10px] text-slate-400 font-mono-code">
                              ({asp.targetHouseFromMoon}H Moon / {asp.targetHouseFromAscendant}H Lagna)
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
