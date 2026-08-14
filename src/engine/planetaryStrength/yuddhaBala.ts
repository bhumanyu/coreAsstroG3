import {
  Planet,
  PlanetFact,
  StrengthComponentStatus,
  YuddhaBalaPair,
  YuddhaBalaResult
} from '../../types';
import { normalizeDegree } from '../nakshatraUtils';

export const YUDDHA_PLANETS: readonly Planet[] = Object.freeze([
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN
]);

export function calculateYuddhaBala(
  planetFacts: Readonly<Record<Planet, PlanetFact>>
): Readonly<Record<Planet, YuddhaBalaResult>> {
  if (!planetFacts || typeof planetFacts !== 'object') {
    throw new Error('calculateYuddhaBala: planetFacts input is required and must be an object.');
  }

  for (const p of YUDDHA_PLANETS) {
    const pf = planetFacts[p];
    if (!pf) {
      throw new Error(`calculateYuddhaBala: missing required planet facts for ${p}.`);
    }
    if (!pf.position || typeof pf.position.eclipticLongitude !== 'number' || !Number.isFinite(pf.position.eclipticLongitude)) {
      throw new Error(`calculateYuddhaBala: eclipticLongitude for planet ${p} is missing or invalid.`);
    }
  }

  const allPairs: YuddhaBalaPair[] = [];

  for (let i = 0; i < YUDDHA_PLANETS.length; i++) {
    for (let j = i + 1; j < YUDDHA_PLANETS.length; j++) {
      const planetA = YUDDHA_PLANETS[i];
      const planetB = YUDDHA_PLANETS[j];

      const longitudeA = planetFacts[planetA]?.position?.eclipticLongitude ?? 0;
      const longitudeB = planetFacts[planetB]?.position?.eclipticLongitude ?? 0;

      const raw = normalizeDegree(longitudeA - longitudeB);
      const separation = Math.min(raw, 360 - raw);

      const isYuddha = separation > 0 && separation < 1;

      const ruleId = isYuddha ? 'YUDDHA_BALA_001' : 'YUDDHA_BALA_NO_WAR';
      const reason = isYuddha
        ? `Planetary war detected between ${planetA} and ${planetB}: angular separation is ${separation.toFixed(4)}° (< 1°).`
        : `No planetary war between ${planetA} and ${planetB}: angular separation is ${separation.toFixed(4)}° (not in (0°, 1°)).`;

      const pair: YuddhaBalaPair = Object.freeze({
        planetA,
        planetB,
        longitudeA,
        longitudeB,
        separation,
        isYuddha,
        winner: undefined,
        loser: undefined,
        ruleId,
        reason
      });

      allPairs.push(pair);
    }
  }

  const resultRecord: Partial<Record<Planet, YuddhaBalaResult>> = {};

  const allPlanets = Object.values(Planet);
  for (const p of allPlanets) {
    if (YUDDHA_PLANETS.includes(p)) {
      const planetPairs = allPairs.filter(
        pair => pair.planetA === p || pair.planetB === p
      );
      const hasWar = planetPairs.some(pair => pair.isYuddha);

      const reason = hasWar
        ? `Planetary war detected for ${p}: participating in Yuddha Bala war relationship(s). Numeric Yuddha Bala is deferred due to lack of validated winner rule and Bimba Parimana data.`
        : `No planetary war detected for ${p}. Numeric Yuddha Bala is deferred due to lack of validated winner rule and Bimba Parimana data.`;

      resultRecord[p] = Object.freeze({
        planet: p,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        value: undefined,
        pairs: Object.freeze(planetPairs),
        reason
      });
    } else {
      resultRecord[p] = Object.freeze({
        planet: p,
        status: StrengthComponentStatus.NOT_APPLICABLE,
        value: undefined,
        pairs: Object.freeze([]),
        reason: `${p} is outside classical planetary war (Yuddha Bala applies only to Mars, Mercury, Jupiter, Venus, Saturn).`
      });
    }
  }

  return Object.freeze(resultRecord as Record<Planet, YuddhaBalaResult>);
}
