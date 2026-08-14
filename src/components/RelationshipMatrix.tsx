import React from 'react';
import { Planet, Relationship } from '../types';
import { PLANETS_METADATA } from '../data/astroData';
import { calculateNaturalRelationship } from '../engine/astroEngine';
import { Heart, ShieldAlert, Minus } from 'lucide-react';

export const RelationshipMatrix: React.FC = () => {
  const classicalPlanets = [
    Planet.SUN,
    Planet.MOON,
    Planet.MARS,
    Planet.MERCURY,
    Planet.JUPITER,
    Planet.VENUS,
    Planet.SATURN
  ];

  const getRelBadge = (rel: Relationship) => {
    switch (rel) {
      case Relationship.FRIEND:
        return (
          <span className="px-2 py-1 text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-md inline-flex items-center gap-1 justify-center w-full">
            <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400/30" /> Friend
          </span>
        );
      case Relationship.ENEMY:
        return (
          <span className="px-2 py-1 text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-md inline-flex items-center gap-1 justify-center w-full">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Enemy
          </span>
        );
      case Relationship.NEUTRAL:
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/60 rounded-md inline-flex items-center gap-1 justify-center w-full">
            <Minus className="w-3 h-3 text-slate-500" /> Neutral
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-lg font-bold font-serif-astro text-slate-100">
          Natural Relationships (Naisargika Sambandha)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Classical Vedic friendship and enmity rules tabulated between the 7 primary planets
        </p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono-code uppercase">
                <th className="p-3 text-left">Planet ↓ \ Towards →</th>
                {classicalPlanets.map((p) => (
                  <th key={p} className="p-3">
                    <span className="block font-bold text-slate-200">{PLANETS_METADATA[p].code}</span>
                    <span className="text-[10px] text-slate-500 font-sans">
                      {PLANETS_METADATA[p].englishName}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {classicalPlanets.map((p1) => (
                <tr key={p1} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-left font-bold text-slate-200 font-mono-code flex items-center space-x-2">
                    <span className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                      {PLANETS_METADATA[p1].code}
                    </span>
                    <div>
                      <span className="block">{PLANETS_METADATA[p1].englishName}</span>
                      <span className="text-[10px] text-slate-400 font-serif-astro font-normal">
                        {PLANETS_METADATA[p1].sanskritName}
                      </span>
                    </div>
                  </td>

                  {classicalPlanets.map((p2) => {
                    if (p1 === p2) {
                      return (
                        <td key={p2} className="p-2 bg-slate-950/60">
                          <span className="text-slate-600 font-mono-code font-bold">Self</span>
                        </td>
                      );
                    }

                    const rel = calculateNaturalRelationship(p1, p2);
                    return (
                      <td key={p2} className="p-2">
                        {getRelBadge(rel)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
