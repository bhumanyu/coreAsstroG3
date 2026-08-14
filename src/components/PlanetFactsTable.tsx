import React from 'react';
import { PlanetFacts, DignityStatus, PlanetCondition, Planet } from '../types';
import { PLANETS_METADATA } from '../data/astroData';
import { Flame, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

interface PlanetFactsTableProps {
  planetFacts: Record<Planet, any>;
}

export const PlanetFactsTable: React.FC<PlanetFactsTableProps> = ({ planetFacts }) => {
  const planets = Object.values(Planet);

  const getDignityBadge = (status: DignityStatus) => {
    switch (status) {
      case DignityStatus.EXALTED:
        return (
          <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Exalted
          </span>
        );
      case DignityStatus.DEBILITATED:
        return (
          <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Debilitated
          </span>
        );
      case DignityStatus.MOOLATRIKONA:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full">
            Moolatrikona
          </span>
        );
      case DignityStatus.OWN_SIGN:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full">
            Own Sign
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">Neutral</span>;
    }
  };

  const getCombustionBadge = (condition: PlanetCondition, dist?: number) => {
    switch (condition) {
      case PlanetCondition.DEEPLY_COMBUST:
        return (
          <span className="px-2 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-full inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" /> Deeply Combust ({dist}°)
          </span>
        );
      case PlanetCondition.COMBUST:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" /> Combust ({dist}°)
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">-</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold font-serif-astro text-slate-100">
            Planetary Facts & Dignity Analysis
          </h3>
          <p className="text-xs text-slate-400">
            Computed ecliptic coordinates, signs, nakshatra padas, dignities, and motion states
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider font-mono-code border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Planet</th>
              <th className="px-4 py-3">Longitude (°</th>
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Sign (Rasi)</th>
              <th className="px-4 py-3">Nakshatra & Pada</th>
              <th className="px-4 py-3">Dignity</th>
              <th className="px-4 py-3">Combustion (Asta)</th>
              <th className="px-4 py-3">Motion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {planets.map((planet) => {
              const fact = planetFacts[planet];
              if (!fact) return null;

              const meta = PLANETS_METADATA[planet];
              const degInSign = (fact.position.eclipticLongitude % 30).toFixed(2);
              const isRetro = fact.position.motion.retrograde;

              return (
                <tr key={planet} className="hover:bg-slate-800/40 transition-colors">
                  {/* Planet */}
                  <td className="px-4 py-3 font-medium text-slate-100 flex items-center space-x-2.5">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-xs">
                      {meta.code}
                    </span>
                    <div>
                      <span className="font-bold text-slate-100">{meta.englishName}</span>
                      <span className="text-xs text-slate-400 block font-serif-astro">
                        {meta.sanskritName}
                      </span>
                    </div>
                  </td>

                  {/* Longitude */}
                  <td className="px-4 py-3 font-mono-code text-indigo-300">
                    {(fact.position?.eclipticLongitude ?? fact.position?.longitude ?? 0).toFixed(2)}°
                  </td>

                  {/* House */}
                  <td className="px-4 py-3 font-semibold text-purple-300 font-mono-code">
                    House {fact.house}
                  </td>

                  {/* Sign */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-200">
                      {fact.signMetadata?.englishName || 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400 block font-mono-code">
                      {fact.signMetadata?.sanskritName || ''} ({degInSign}°)
                    </span>
                  </td>

                  {/* Nakshatra & Pada */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-200">
                      {fact.nakshatraMetadata?.englishName || 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400 block font-mono-code">
                      Pada {fact.nakshatraResult?.padaNumber ?? 1} • Lord:{' '}
                      {fact.nakshatraMetadata?.lord && PLANETS_METADATA[fact.nakshatraMetadata.lord as Planet]
                        ? PLANETS_METADATA[fact.nakshatraMetadata.lord as Planet].englishName
                        : 'N/A'}
                    </span>
                  </td>

                  {/* Dignity */}
                  <td className="px-4 py-3">{getDignityBadge(fact.dignity.status)}</td>

                  {/* Combustion */}
                  <td className="px-4 py-3">
                    {getCombustionBadge(fact.state.condition, (fact.state as any)?.combustionDistanceDegrees)}
                  </td>

                  {/* Motion */}
                  <td className="px-4 py-3 font-mono-code text-xs">
                    {isRetro ? (
                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded font-bold">
                        RETROGRADE (R)
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        Direct ({fact.position?.motion?.speed !== undefined ? fact.position.motion.speed.toFixed(2) : '1.00'}°/d)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
