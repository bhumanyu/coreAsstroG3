import React, { useState } from 'react';
import { Chart, Planet, Sign, DignityStatus } from '../types';
import { SIGNS_METADATA, SIGNS_ORDER, PLANETS_METADATA } from '../data/astroData';
import { calculateSign, calculateDignity } from '../engine/astroEngine';

interface KundaliChartProps {
  chart: Chart;
  title?: string;
  subtitle?: string;
}

export const KundaliChart: React.FC<KundaliChartProps> = ({ chart, title, subtitle }) => {
  const [style, setStyle] = useState<'NORTH' | 'SOUTH'>('NORTH');

  const ascSign = (chart as any).ascendantSign || (chart as any).ascendant?.sign || Sign.ARIES;
  if (!chart || !chart.positions) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-300">{title || 'Chart'}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtitle || 'Chart data is unavailable.'}</p>
      </div>
    );
  }

  const ascSignMeta = SIGNS_METADATA[ascSign as Sign] || SIGNS_METADATA[Sign.ARIES];
  const ascNumber = ascSignMeta.number ?? 1; // 1..12

  // Map each sign (1..12) to list of planets occupying it in this chart
  const signPlanetsMap: Record<number, { planet: Planet; code: string; dignity: DignityStatus; degree: number }[]> = {};
  for (let i = 1; i <= 12; i++) {
    signPlanetsMap[i] = [];
  }

  Object.entries(chart.positions).forEach(([pKey, pos]) => {
    const planet = pKey as Planet;
    const longVal = pos.eclipticLongitude ?? pos.longitude ?? 0;
    const sign = calculateSign(longVal);
    const signNum = SIGNS_METADATA[sign]?.number ?? 1;
    const degInSign = longVal % 30;
    const dignity = calculateDignity(planet, sign, degInSign).status;

    if (signPlanetsMap[signNum]) {
      signPlanetsMap[signNum].push({
        planet,
        code: PLANETS_METADATA[planet]?.code || 'PL',
        dignity,
        degree: degInSign
      });
    }
  });

  const getDignityBadgeClass = (dignity: DignityStatus) => {
    switch (dignity) {
      case DignityStatus.EXALTED:
        return 'text-amber-300 font-bold border-b border-amber-400/60';
      case DignityStatus.DEBILITATED:
        return 'text-rose-400 font-bold line-through';
      case DignityStatus.MOOLATRIKONA:
        return 'text-emerald-300 font-semibold';
      case DignityStatus.OWN_SIGN:
        return 'text-indigo-300 font-semibold';
      default:
        return 'text-slate-200';
    }
  };

  // South Indian Chart Grid (Fixed signs: 12 Aries top-left.. Pisces)
  // Standard South Indian 4x4 Grid Layout:
  // Row 0: Pisces (12), Aries (1), Taurus (2), Gemini (3)
  // Row 1: Aquarius (11), [CENTER], [CENTER], Cancer (4)
  // Row 2: Capricorn (10), [CENTER], [CENTER], Leo (5)
  // Row 3: Sagittarius (9), Scorpio (8), Libra (7), Virgo (6)
  const southIndianSignLayout = [
    [12, 1, 2, 3],
    [11, null, null, 4],
    [10, null, null, 5],
    [9, 8, 7, 6]
  ];

  // North Indian Chart: 12 Houses fixed positions in diamond grid
  // House 1 (Top Center Diamond) = Ascendant Sign Number
  // House 2 = (Asc + 1) % 12, etc.
  const getHouseSign = (houseNum: number) => {
    let s = (ascNumber + houseNum - 1) % 12;
    return s === 0 ? 12 : s;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      {/* Header & Style Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold font-serif-astro text-slate-100 flex items-center space-x-2">
            <span>{title || ((chart as any).type ? `${(chart as any).type} Divisional Chart` : 'Divisional Chart')}</span>
            <span className="px-2 py-0.5 text-[10px] font-mono-code bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
              ASC: {ascSignMeta.englishName} ({ascSignMeta.sanskritName})
            </span>
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setStyle('NORTH')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              style === 'NORTH'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            North Indian
          </button>
          <button
            onClick={() => setStyle('SOUTH')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              style === 'SOUTH'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            South Indian
          </button>
        </div>
      </div>

      {/* Chart Canvas Renders */}
      {style === 'SOUTH' ? (
        /* South Indian Grid Renders */
        <div className="aspect-square max-w-md mx-auto grid grid-cols-4 grid-rows-4 gap-1 bg-indigo-950/40 border-2 border-indigo-500/40 p-1.5 rounded-xl shadow-inner">
          {southIndianSignLayout.map((row, rIdx) =>
            row.map((signNum, cIdx) => {
              if (signNum === null) {
                // Center Box
                if (rIdx === 1 && cIdx === 1) {
                  return (
                    <div
                      key="center"
                      className="col-span-2 row-span-2 bg-slate-950/90 border border-indigo-500/20 rounded-lg flex flex-col items-center justify-center p-3 text-center"
                    >
                      <span className="text-lg font-bold font-serif-astro text-indigo-300">
                        {(chart as any).type || 'D1'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono-code mt-1">
                        Lagna: {ascSignMeta.sanskritName}
                      </span>
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Exalted
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Debilitated
                      </div>
                    </div>
                  );
                }
                return null;
              }

              const isLagna = signNum === ascNumber;
              const signMeta = SIGNS_METADATA[SIGNS_ORDER[signNum - 1]];
              const planets = signPlanetsMap[signNum];

              return (
                <div
                  key={signNum}
                  className={`relative p-2 rounded-lg border flex flex-col justify-between transition-all overflow-hidden ${
                    isLagna
                      ? 'bg-indigo-950/80 border-indigo-400/80 ring-1 ring-indigo-400/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Sign Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono-code text-slate-400">
                      {(signMeta?.englishName || '').slice(0, 3).toUpperCase()} ({signNum})
                    </span>
                    {isLagna && (
                      <span className="px-1 py-0.2 text-[9px] font-bold bg-indigo-500 text-white rounded font-mono-code">
                        ASC
                      </span>
                    )}
                  </div>

                  {/* Planets List */}
                  <div className="my-1 flex flex-wrap gap-1 text-[11px] font-mono-code">
                    {planets.length === 0 ? (
                      <span className="text-[10px] text-slate-700 font-sans italic">empty</span>
                    ) : (
                      planets.map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className={`px-1 py-0.5 bg-slate-900/90 rounded border border-slate-800 ${getDignityBadgeClass(
                            p.dignity
                          )}`}
                          title={`${PLANETS_METADATA[p.planet].englishName} in ${signMeta.englishName} @ ${p.degree.toFixed(1)}° (${p.dignity})`}
                        >
                          {p.code}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* North Indian Diamond Grid (Classic Vedic Layout) */
        <div className="aspect-square max-w-md mx-auto relative bg-slate-950 border-2 border-indigo-500/40 rounded-xl overflow-hidden p-3 shadow-inner">
          {/* Outer Border & Diagonal Lines SVG Background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-indigo-500/30" strokeWidth="1.5">
            {/* Outer Box */}
            <rect x="0" y="0" width="100%" height="100%" fill="none" />
            {/* Diagonals */}
            <line x1="0" y1="0" x2="100%" y2="100%" />
            <line x1="100%" y1="0" x2="0" y2="100%" />
            {/* Inner Diamond */}
            <line x1="50%" y1="0" x2="100%" y2="50%" />
            <line x1="100%" y1="50%" x2="50%" y2="100%" />
            <line x1="50%" y1="100%" x2="0" y2="50%" />
            <line x1="0" y1="50%" x2="50%" y2="0" />
          </svg>

          {/* 12 House Nodes in North Indian Positions */}
          <div className="relative w-full h-full grid grid-cols-4 grid-rows-4 gap-1 z-10 text-[11px]">
            {/* House 1 (Top Center Diamond) */}
            <HouseBox
              houseNum={1}
              signNum={getHouseSign(1)}
              planets={signPlanetsMap[getHouseSign(1)]}
              isLagna={true}
              className="col-start-2 col-span-2 row-start-1 row-span-1 border border-indigo-500/30 rounded bg-indigo-950/40 p-2 flex flex-col items-center justify-center text-center"
            />

            {/* House 2 (Top Left Triangle) */}
            <HouseBox
              houseNum={2}
              signNum={getHouseSign(2)}
              planets={signPlanetsMap[getHouseSign(2)]}
              className="col-start-1 col-span-1 row-start-1 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-start text-center"
            />

            {/* House 3 (Upper Left Diamond Side) */}
            <HouseBox
              houseNum={3}
              signNum={getHouseSign(3)}
              planets={signPlanetsMap[getHouseSign(3)]}
              className="col-start-1 col-span-1 row-start-2 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-center text-center"
            />

            {/* House 4 (Left Middle Diamond) */}
            <HouseBox
              houseNum={4}
              signNum={getHouseSign(4)}
              planets={signPlanetsMap[getHouseSign(4)]}
              className="col-start-1 col-span-2 row-start-2 row-span-2 border border-slate-800 rounded bg-slate-950/80 p-2 flex flex-col items-center justify-center text-center"
            />

            {/* House 12 (Top Right Triangle) */}
            <HouseBox
              houseNum={12}
              signNum={getHouseSign(12)}
              planets={signPlanetsMap[getHouseSign(12)]}
              className="col-start-4 col-span-1 row-start-1 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-start text-center"
            />

            {/* House 11 (Upper Right Diamond Side) */}
            <HouseBox
              houseNum={11}
              signNum={getHouseSign(11)}
              planets={signPlanetsMap[getHouseSign(11)]}
              className="col-start-4 col-span-1 row-start-2 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-center text-center"
            />

            {/* House 10 (Right Middle Diamond) */}
            <HouseBox
              houseNum={10}
              signNum={getHouseSign(10)}
              planets={signPlanetsMap[getHouseSign(10)]}
              className="col-start-3 col-span-2 row-start-2 row-span-2 border border-slate-800 rounded bg-slate-950/80 p-2 flex flex-col items-center justify-center text-center"
            />

            {/* House 5 (Bottom Left Triangle) */}
            <HouseBox
              houseNum={5}
              signNum={getHouseSign(5)}
              planets={signPlanetsMap[getHouseSign(5)]}
              className="col-start-1 col-span-1 row-start-4 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-end text-center"
            />

            {/* House 6 (Lower Left Diamond Side) */}
            <HouseBox
              houseNum={6}
              signNum={getHouseSign(6)}
              planets={signPlanetsMap[getHouseSign(6)]}
              className="col-start-1 col-span-1 row-start-3 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-center text-center"
            />

            {/* House 7 (Bottom Center Diamond) */}
            <HouseBox
              houseNum={7}
              signNum={getHouseSign(7)}
              planets={signPlanetsMap[getHouseSign(7)]}
              className="col-start-2 col-span-2 row-start-4 row-span-1 border border-slate-800 rounded bg-slate-950/80 p-2 flex flex-col items-center justify-center text-center"
            />

            {/* House 8 (Lower Right Diamond Side) */}
            <HouseBox
              houseNum={8}
              signNum={getHouseSign(8)}
              planets={signPlanetsMap[getHouseSign(8)]}
              className="col-start-4 col-span-1 row-start-3 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-center text-center"
            />

            {/* House 9 (Bottom Right Triangle) */}
            <HouseBox
              houseNum={9}
              signNum={getHouseSign(9)}
              planets={signPlanetsMap[getHouseSign(9)]}
              className="col-start-4 col-span-1 row-start-4 row-span-1 border border-slate-800 rounded bg-slate-950/70 p-1.5 flex flex-col items-center justify-end text-center"
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface HouseBoxProps {
  houseNum: number;
  signNum: number;
  planets: { planet: Planet; code: string; dignity: DignityStatus; degree: number }[];
  isLagna?: boolean;
  className: string;
}

const HouseBox: React.FC<HouseBoxProps> = ({ houseNum, signNum, planets, isLagna, className }) => {
  const getDignityBadgeClass = (dignity: DignityStatus) => {
    switch (dignity) {
      case DignityStatus.EXALTED:
        return 'text-amber-300 font-bold border-b border-amber-400/60';
      case DignityStatus.DEBILITATED:
        return 'text-rose-400 font-bold line-through';
      case DignityStatus.MOOLATRIKONA:
        return 'text-emerald-300 font-semibold';
      case DignityStatus.OWN_SIGN:
        return 'text-indigo-300 font-semibold';
      default:
        return 'text-slate-200';
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-1">
        <span className="text-[10px] font-bold font-mono-code text-indigo-400">
          {signNum}
        </span>
        {isLagna && (
          <span className="text-[9px] font-bold text-amber-400 font-mono-code">ASC</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
        {planets.map((p, idx) => (
          <span
            key={idx}
            className={`font-mono-code text-[11px] ${getDignityBadgeClass(p.dignity)}`}
            title={`${p.code} @ ${p.degree.toFixed(1)}° (${p.dignity})`}
          >
            {p.code}
          </span>
        ))}
      </div>
    </div>
  );
};
