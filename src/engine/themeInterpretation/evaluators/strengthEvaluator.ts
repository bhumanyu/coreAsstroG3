import { Planet } from '../../../types';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { ThemeEvidenceEffect, ThemeEvidenceStrength } from '../themeInterpretationTypes';

export interface PlanetaryStrengthFacts {
  readonly planet: Planet;
  readonly available: boolean;
  readonly meetsMinimum?: boolean;
  readonly percentageOfMinimum?: number;
  readonly totalShastiamsa?: number;
  readonly effect: ThemeEvidenceEffect;
  readonly strength: ThemeEvidenceStrength;
  readonly statement: string;
}

export function evaluatePlanetaryStrength(
  context: ThemeInterpretationContext,
  planet: Planet
): PlanetaryStrengthFacts {
  let available = false;
  let meetsMinimum: boolean | undefined = undefined;
  let percentageOfMinimum: number | undefined = undefined;
  let totalShastiamsa: number | undefined = undefined;

  if (context.planetaryStrength?.planets?.[planet]) {
    const ps = context.planetaryStrength.planets[planet];
    if (ps.calculatedTotal !== undefined) {
      totalShastiamsa = ps.calculatedTotal;
      available = true;
    }
    if (ps.shadbala) {
      meetsMinimum = ps.shadbala.isStrengthMet ?? (ps.shadbala as any).meetsMinimum;
      const minRupa = ps.shadbala.minimumRequiredRupa;
      const totRupa = ps.shadbala.totalRupa;
      percentageOfMinimum = (ps.shadbala as any).percentageOfMinimum ??
        (minRupa !== undefined && totRupa !== undefined && minRupa > 0 ? (totRupa / minRupa) * 100 : undefined);
    }
  }

  if (!available && context.planetInterpretation?.planets?.[planet]?.strength) {
    const st = context.planetInterpretation.planets[planet].strength;
    if (st.availability === 'AVAILABLE') {
      available = true;
      meetsMinimum = st.meetsMinimum;
      percentageOfMinimum = st.percentageOfMinimum;
      totalShastiamsa = st.totalShastiamsa;
    }
  }

  if (!available) {
    return Object.freeze({
      planet,
      available: false,
      effect: 'NEUTRAL',
      strength: 'WEAK',
      statement: `Planetary strength data for ${planet} is unavailable or incomplete.`
    });
  }

  let effect: ThemeEvidenceEffect = 'NEUTRAL';
  let strength: ThemeEvidenceStrength = 'WEAK';
  let statement = '';

  if (meetsMinimum === true || (percentageOfMinimum && percentageOfMinimum >= 100)) {
    effect = 'SUPPORT';
    strength = percentageOfMinimum && percentageOfMinimum >= 120 ? 'STRONG' : 'MODERATE';
    statement = `${planet} meets required Shadbala minimum (${percentageOfMinimum ? percentageOfMinimum.toFixed(1) + '%' : '100%+'}).`;
  } else if (meetsMinimum === false || (percentageOfMinimum && percentageOfMinimum < 100)) {
    effect = 'CHALLENGE';
    strength = percentageOfMinimum && percentageOfMinimum < 80 ? 'STRONG' : 'MODERATE';
    statement = `${planet} falls below required Shadbala minimum (${percentageOfMinimum ? percentageOfMinimum.toFixed(1) + '%' : '<100%'}).`;
  } else {
    statement = `${planet} has planetary strength data available (${totalShastiamsa ? totalShastiamsa.toFixed(1) + ' Shastiamsas' : ''}).`;
  }

  return Object.freeze({
    planet,
    available: true,
    meetsMinimum,
    percentageOfMinimum,
    totalShastiamsa,
    effect,
    strength,
    statement
  });
}
