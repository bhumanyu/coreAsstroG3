/** READ-ONLY FULL NATAL ANALYSIS REPORT LAYER. MUST NOT RECALCULATE ASTROLOGY OR PRODUCE NUMERIC SCORES/PROBABILITIES/PREDICTIONS. */

import { Planet } from '../../types';
import { CHART_SYNTHESIS_THEME_ORDER } from '../chartSynthesis/chartSynthesisMetadata';

export const METHODOLOGY = Object.freeze({
  zodiac: 'SIDEREAL',
  ayanamsa: 'LAHIRI',
  houseSystem: 'WHOLE_SIGN',
  dashaSystem: 'VIMSHOTTARI',
  aspectSystem: 'PARASHARI',
  divisionalCharts: Object.freeze(['D1', 'D9', 'D10']),
  limitations: Object.freeze([
    'Engine output represents a configured canonical baseline, not externally validated ephemeris truth.',
    'Shadbala aggregation status may be partial based on calculated subcomponents.'
  ])
} as const);

export const EXPECTED_PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
]);

export const EXPECTED_THEME_ORDER = CHART_SYNTHESIS_THEME_ORDER;
