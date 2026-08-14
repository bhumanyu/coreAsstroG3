import React, { useState } from 'react';
import { GOLDEN_TEST_VECTORS, PLANETS_METADATA } from '../data/astroData';
import { calculateNakshatra, calculateSign, calculateDignity, normalizeDegree } from '../engine/astroEngine';
import { calculateTransit } from '../engine/transitEngine';
import { CheckCircle2, XCircle, Play, ShieldCheck, Cpu, Orbit } from 'lucide-react';
import { Planet, Sign, DignityStatus } from '../types';

export const EngineValidator: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    total: number;
    passed: number;
    failed: number;
    details: { longitude: number; expectedNak: string; actualNak: string; expectedPada: string; actualPada: string; pass: boolean }[];
    dignityTests: { planet: Planet; sign: Sign; degree: number; expectedDignity: DignityStatus; actualDignity: DignityStatus; pass: boolean }[];
    transitTests: { name: string; expectedSign: Sign; actualSign: Sign; expectedFromMoon: number; actualFromMoon: number; expectedFromAsc: number; actualFromAsc: number; pass: boolean }[];
  } | null>(null);

  const runTests = () => {
    setIsRunning(true);

    const nakDetails: { longitude: number; expectedNak: string; actualNak: string; expectedPada: string; actualPada: string; pass: boolean }[] = [];
    let nakPassed = 0;

    GOLDEN_TEST_VECTORS.forEach((vector) => {
      if (vector.longitude === undefined) return;
      const res = calculateNakshatra(vector.longitude);
      const actualNak = NAKSHATRA_KEY_TO_NAME[res.nakshatra] || res.nakshatra;
      const expectedNak = vector.expectedNakshatra || '';
      const passNak = actualNak.toLowerCase() === expectedNak.toLowerCase();
      const passPada = res.pada === (vector.expectedPada || '');
      const pass = passNak && passPada;

      if (pass) nakPassed++;

      nakDetails.push({
        longitude: vector.longitude,
        expectedNak,
        actualNak,
        expectedPada: vector.expectedPada || '',
        actualPada: res.pada,
        pass
      });
    });

    // Dignity Golden Tests
    const dignityCases = [
      { planet: Planet.SUN, sign: Sign.ARIES, degree: 10, expected: DignityStatus.EXALTED },
      { planet: Planet.SUN, sign: Sign.LIBRA, degree: 10, expected: DignityStatus.DEBILITATED },
      { planet: Planet.SUN, sign: Sign.LEO, degree: 5, expected: DignityStatus.MOOLATRIKONA },
      { planet: Planet.MOON, sign: Sign.TAURUS, degree: 3, expected: DignityStatus.EXALTED },
      { planet: Planet.MOON, sign: Sign.SCORPIO, degree: 3, expected: DignityStatus.DEBILITATED },
      { planet: Planet.MOON, sign: Sign.CANCER, degree: 15, expected: DignityStatus.OWN_SIGN },
      { planet: Planet.MARS, sign: Sign.CAPRICORN, degree: 28, expected: DignityStatus.EXALTED },
      { planet: Planet.MARS, sign: Sign.CANCER, degree: 28, expected: DignityStatus.DEBILITATED },
      { planet: Planet.MERCURY, sign: Sign.VIRGO, degree: 15, expected: DignityStatus.EXALTED },
      { planet: Planet.JUPITER, sign: Sign.CANCER, degree: 5, expected: DignityStatus.EXALTED },
      { planet: Planet.VENUS, sign: Sign.PISCES, degree: 27, expected: DignityStatus.EXALTED },
      { planet: Planet.SATURN, sign: Sign.LIBRA, degree: 20, expected: DignityStatus.EXALTED }
    ];

    const dignityResults = dignityCases.map((c) => {
      const actual = calculateDignity(c.planet, c.sign, c.degree).status;
      return {
        planet: c.planet,
        sign: c.sign,
        degree: c.degree,
        expectedDignity: c.expected,
        actualDignity: actual,
        pass: actual === c.expected
      };
    });

    // PR-037 Gochara Transit Test Vectors
    const transitCases = [
      {
        name: 'PR-037 Golden Vector: Saturn Gochara in Pisces',
        natalMoonLong: 45.0, // Taurus
        natalAscLong: 270.0, // Capricorn
        planet: Planet.SATURN,
        transitLong: 345.0, // Pisces
        expectedSign: Sign.PISCES,
        expectedFromMoon: 11,
        expectedFromAsc: 3
      },
      {
        name: 'PR-037 Wrap Vector: Mars Gochara in Aries from Sagittarius Moon',
        natalMoonLong: 240.0, // Sagittarius
        natalAscLong: 0.0, // Aries
        planet: Planet.MARS,
        transitLong: 10.0, // Aries
        expectedSign: Sign.ARIES,
        expectedFromMoon: 5,
        expectedFromAsc: 1
      }
    ];

    const transitResults = transitCases.map((tc) => {
      const analysis = calculateTransit({
        at: '2026-08-08T12:00:00Z',
        natalMoonLongitude: tc.natalMoonLong,
        natalAscendantLongitude: tc.natalAscLong,
        transitLongitudes: { [tc.planet]: tc.transitLong } as Record<Planet, number>
      });

      const res = analysis.results[tc.planet];
      const passSign = res?.position.sign === tc.expectedSign;
      const passMoon = res?.housePosition.fromMoon === tc.expectedFromMoon;
      const passAsc = res?.housePosition.fromAscendant === tc.expectedFromAsc;
      const pass = Boolean(res && passSign && passMoon && passAsc);

      return {
        name: tc.name,
        expectedSign: tc.expectedSign,
        actualSign: res?.position.sign || tc.expectedSign,
        expectedFromMoon: tc.expectedFromMoon,
        actualFromMoon: res?.housePosition.fromMoon || 0,
        expectedFromAsc: tc.expectedFromAsc,
        actualFromAsc: res?.housePosition.fromAscendant || 0,
        pass
      };
    });

    setTimeout(() => {
      setTestResults({
        total: nakDetails.length + dignityResults.length + transitResults.length,
        passed: nakPassed + dignityResults.filter((d) => d.pass).length + transitResults.filter((t) => t.pass).length,
        failed: (nakDetails.length - nakPassed) + dignityResults.filter((d) => !d.pass).length + transitResults.filter((t) => !t.pass).length,
        details: nakDetails,
        dignityTests: dignityResults,
        transitTests: transitResults
      });
      setIsRunning(false);
    }, 200);
  };

  const NAKSHATRA_KEY_TO_NAME: Record<string, string> = {
    ASHWINI: 'Ashwini',
    BHARANI: 'Bharani',
    KRITTIKA: 'Krittika',
    ROHINI: 'Rohini',
    MRIGASHIRA: 'Mrigashira',
    ARDRA: 'Ardra',
    PUNARVASU: 'Punarvasu',
    PUSHYA: 'Pushya',
    ASHLESHA: 'Ashlesha',
    MAGHA: 'Magha',
    PURVA_PHALGUNI: 'Purva Phalguni',
    UTTARA_PHALGUNI: 'Uttara Phalguni',
    HASTA: 'Hasta',
    CHITRA: 'Chitra',
    SWATI: 'Swati',
    VISHAKHA: 'Vishakha',
    ANURADHA: 'Anuradha',
    JYESHTHA: 'Jyeshtha',
    MULA: 'Mula',
    PURVA_ASHADHA: 'Purva Ashadha',
    UTTARA_ASHADHA: 'Uttara Ashadha',
    SHRAVANA: 'Shravana',
    DHANISHTA: 'Dhanishta',
    SHATABHISHA: 'Shatabhisha',
    PURVA_BHADRAPADA: 'Purva Bhadrapada',
    UTTARA_BHADRAPADA: 'Uttara Bhadrapada',
    REVATI: 'Revati'
  };

  return (
    <div className="space-y-6">
      {/* Banner & Trigger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold font-serif-astro text-slate-100">
              Golden Vector Engine Validation
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validates coreAstro Engine algorithms against original Java test vectors (nakshatra-test-vectors.csv & dignity tables)
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'Running Validation...' : 'Run Golden Vector Suite'}</span>
        </button>
      </div>

      {/* Results Summary */}
      {testResults && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-mono-code uppercase">Total Tests</span>
              <span className="text-2xl font-bold font-mono-code text-slate-100">{testResults.total}</span>
            </div>
            <ShieldCheck className="w-8 h-8 text-indigo-400 opacity-60" />
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 block font-mono-code uppercase">Tests Passed</span>
              <span className="text-2xl font-bold font-mono-code text-emerald-300">{testResults.passed}</span>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
          </div>

          <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-400 block font-mono-code uppercase">Tests Failed</span>
              <span className="text-2xl font-bold font-mono-code text-rose-300">{testResults.failed}</span>
            </div>
            <XCircle className="w-8 h-8 text-rose-400 opacity-80" />
          </div>
        </div>
      )}

      {/* Test Vectors Table */}
      {testResults && (
        <div className="space-y-6">
          {/* PR-037 Gochara Transit Test Vectors */}
          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Orbit className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold font-serif-astro text-slate-200">
                PR-037 Gochara Transit Engine Validation Vectors
              </h4>
            </div>
            <div className="space-y-3">
              {testResults.transitTests.map((t, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-indigo-300 block text-sm">
                      {t.name}
                    </span>
                    <span className="text-slate-400 font-mono-code text-[11px]">
                      Sign: {t.actualSign} (Expected: {t.expectedSign}) • From Moon: H{t.actualFromMoon} (Exp: H{t.expectedFromMoon}) • From Lagna: H{t.actualFromAsc} (Exp: H{t.expectedFromAsc})
                    </span>
                  </div>
                  {t.pass ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100% VERIFIED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                      <XCircle className="w-4 h-4" />
                      <span>FAILED</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dignity Tests */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-bold font-serif-astro text-slate-200 mb-3">
              Planetary Dignity Golden Test Cases
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {testResults.dignityTests.map((d, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200">
                      {PLANETS_METADATA[d.planet].englishName} in {d.sign} ({d.degree}°)
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono-code">
                      Expected: {d.expectedDignity}
                    </span>
                  </div>
                  {d.pass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nakshatra Vector Suite */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-sm font-bold font-serif-astro text-slate-200">
                Nakshatra & Pada Golden Vectors (nakshatra-test-vectors.csv)
              </h4>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono-code">
                <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Longitude (°</th>
                    <th className="p-3">Expected Nakshatra</th>
                    <th className="p-3">Actual Nakshatra</th>
                    <th className="p-3">Expected Pada</th>
                    <th className="p-3">Actual Pada</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {testResults.details.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 text-indigo-300">{item.longitude.toFixed(4)}°</td>
                      <td className="p-3 text-slate-300">{item.expectedNak}</td>
                      <td className="p-3 text-slate-200">{item.actualNak}</td>
                      <td className="p-3 text-slate-300">{item.expectedPada}</td>
                      <td className="p-3 text-slate-200">{item.actualPada}</td>
                      <td className="p-3 text-right">
                        {item.pass ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PASS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>FAIL</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
