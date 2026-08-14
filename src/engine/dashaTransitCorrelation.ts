/**
 * Correlate Dasha state with TransitAnalysisReport (PR-038).
 *
 * - Pure function: correlateDashaAndTransit(input)
 * - Does not compute Dasha or transits; it only correlates provided inputs.
 */

import {
  Planet,
  Sign,
  AspectType,
  TransitCondition,
  TransitEvidence,
  TransitAnalysisResult,
  TransitAnalysisReport
} from '../types';
import { PLANETS_METADATA } from '../data/astroData';

/**
 * Dasha state shape representing the active Dasha periods at a specific point in time.
 */
export interface DashaState {
  readonly mahadashaPlanet: Planet;
  readonly antardashaPlanet?: Planet;
  readonly pratyantardashaPlanet?: Planet;
}

/**
 * Input for the correlation function.
 */
export interface DashaTransitCorrelationInput {
  readonly dasha: DashaState;
  readonly transit: TransitAnalysisReport;
}

/**
 * Correlation types produced by the engine.
 */
export enum DashaTransitCorrelationType {
  MAHADASHA_PLANET_TRANSIT_CONDITION = 'MAHADASHA_PLANET_TRANSIT_CONDITION',
  ANTARDASHA_PLANET_TRANSIT_CONDITION = 'ANTARDASHA_PLANET_TRANSIT_CONDITION',
  PRATYANTARDASHA_PLANET_TRANSIT_CONDITION = 'PRATYANTARDASHA_PLANET_TRANSIT_CONDITION',

  MAHADASHA_PLANET_OVER_NATAL_PLANET = 'MAHADASHA_PLANET_OVER_NATAL_PLANET',
  ANTARDASHA_PLANET_OVER_NATAL_PLANET = 'ANTARDASHA_PLANET_OVER_NATAL_PLANET',
  PRATYANTARDASHA_PLANET_OVER_NATAL_PLANET = 'PRATYANTARDASHA_PLANET_OVER_NATAL_PLANET',

  MAHADASHA_PLANET_ASPECTS_NATAL_PLANET = 'MAHADASHA_PLANET_ASPECTS_NATAL_PLANET',
  ANTARDASHA_PLANET_ASPECTS_NATAL_PLANET = 'ANTARDASHA_PLANET_ASPECTS_NATAL_PLANET',
  PRATYANTARDASHA_PLANET_ASPECTS_NATAL_PLANET = 'PRATYANTARDASHA_PLANET_ASPECTS_NATAL_PLANET'
}

/**
 * Single evidence item produced by correlation.
 */
export interface DashaTransitEvidence {
  readonly type: DashaTransitCorrelationType;
  readonly dashaLevel: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly dashaPlanet: Planet;
  readonly transitPlanet: Planet;
  readonly transitCondition?: TransitCondition;
  readonly natalPlanet?: Planet;
  readonly aspectType?: AspectType;
  readonly targetSign?: Sign;
  readonly referenceHouse?: number;
  readonly targetHouseFromMoon?: number;
  readonly targetHouseFromAscendant?: number;
  readonly reason: string;
  readonly sourceReason?: string;
}

/**
 * Final correlation report.
 */
export interface DashaTransitCorrelationReport {
  readonly transitAt?: string;
  readonly correlations: readonly DashaTransitEvidence[];
}

function validatePlanet(planet: unknown, fieldName: string): void {
  if (planet === undefined || !Object.values(Planet).includes(planet as Planet)) {
    throw new TypeError(`${fieldName} must be a valid Planet.`);
  }
}

function formatPlanetName(planet: Planet): string {
  if (!planet) return '';
  const meta = PLANETS_METADATA[planet];
  if (meta?.englishName) {
    return meta.englishName;
  }
  return planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
}

/**
 * Main correlation function.
 *
 * The supplied DashaState MUST represent the active Dasha at TransitAnalysisReport.at.
 * This function does NOT calculate or validate Dasha period boundaries.
 */
export function correlateDashaAndTransit(
  input: DashaTransitCorrelationInput
): DashaTransitCorrelationReport {
  if (!input) {
    throw new TypeError('Input is required.');
  }
  if (!input.transit) {
    throw new TypeError('input.transit is required.');
  }
  if (!input.dasha) {
    throw new TypeError('input.dasha is required.');
  }

  validatePlanet(input.dasha.mahadashaPlanet, 'input.dasha.mahadashaPlanet');

  const transitAt = input.transit.at;

  const activeLevels: Array<{
    level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
    planet: Planet;
  }> = [
    { level: 'MAHADASHA', planet: input.dasha.mahadashaPlanet }
  ];

  if (input.dasha.antardashaPlanet !== undefined) {
    validatePlanet(input.dasha.antardashaPlanet, 'input.dasha.antardashaPlanet');
    activeLevels.push({ level: 'ANTARDASHA', planet: input.dasha.antardashaPlanet });
  }

  if (input.dasha.pratyantardashaPlanet !== undefined) {
    validatePlanet(input.dasha.pratyantardashaPlanet, 'input.dasha.pratyantardashaPlanet');
    activeLevels.push({ level: 'PRATYANTARDASHA', planet: input.dasha.pratyantardashaPlanet });
  }

  const correlations: DashaTransitEvidence[] = [];
  const dedupe = new Set<string>();

  for (const { level: dashaLevel, planet: dashaPlanet } of activeLevels) {
    const transitResult: TransitAnalysisResult | undefined = input.transit.results?.[dashaPlanet];
    if (!transitResult) continue;

    const evidenceList: readonly TransitEvidence[] = transitResult.evidence ?? [];

    for (const ev of evidenceList) {
      if (!ev) continue;

      // Correlate ONLY when the evidence's planet equals the dasha planet (same-planet rule)
      const transitPlanet = ev.planet;
      if (transitPlanet !== dashaPlanet) continue;

      let type: DashaTransitCorrelationType;
      let transitCondition: TransitCondition | undefined;
      let natalPlanet: Planet | undefined;
      let aspectType: AspectType | undefined;
      let targetSign: Sign | undefined;
      let reason: string;

      const levelLabel =
        dashaLevel === 'MAHADASHA'
          ? 'Mahadasha'
          : dashaLevel === 'ANTARDASHA'
          ? 'Antardasha'
          : 'Pratyantardasha';

      const formattedDashaPlanet = formatPlanetName(dashaPlanet);

      if (ev.condition === TransitCondition.TRANSIT_OVER_NATAL_PLANET) {
        type =
          dashaLevel === 'MAHADASHA'
            ? DashaTransitCorrelationType.MAHADASHA_PLANET_OVER_NATAL_PLANET
            : dashaLevel === 'ANTARDASHA'
            ? DashaTransitCorrelationType.ANTARDASHA_PLANET_OVER_NATAL_PLANET
            : DashaTransitCorrelationType.PRATYANTARDASHA_PLANET_OVER_NATAL_PLANET;

        natalPlanet = ev.natalPlanet;
        const formattedNatalPlanet = natalPlanet ? formatPlanetName(natalPlanet) : '';
        reason = `${formattedDashaPlanet} ${levelLabel} is active while transiting ${formattedDashaPlanet} occupies the same sign as natal ${formattedNatalPlanet}.`;
      } else if (ev.condition === TransitCondition.TRANSIT_ASPECTS_NATAL_PLANET) {
        type =
          dashaLevel === 'MAHADASHA'
            ? DashaTransitCorrelationType.MAHADASHA_PLANET_ASPECTS_NATAL_PLANET
            : dashaLevel === 'ANTARDASHA'
            ? DashaTransitCorrelationType.ANTARDASHA_PLANET_ASPECTS_NATAL_PLANET
            : DashaTransitCorrelationType.PRATYANTARDASHA_PLANET_ASPECTS_NATAL_PLANET;

        natalPlanet = ev.natalPlanet;
        aspectType = ev.aspectType;
        targetSign = ev.targetSign;
        const formattedNatalPlanet = natalPlanet ? formatPlanetName(natalPlanet) : '';
        reason = `${formattedDashaPlanet} ${levelLabel} is active while transiting ${formattedDashaPlanet} casts aspect on natal ${formattedNatalPlanet}.`;
      } else {
        type =
          dashaLevel === 'MAHADASHA'
            ? DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION
            : dashaLevel === 'ANTARDASHA'
            ? DashaTransitCorrelationType.ANTARDASHA_PLANET_TRANSIT_CONDITION
            : DashaTransitCorrelationType.PRATYANTARDASHA_PLANET_TRANSIT_CONDITION;

        transitCondition = ev.condition;
        reason = `${formattedDashaPlanet} ${levelLabel} is active while transiting ${formattedDashaPlanet} shows ${transitCondition}.`;
      }

      const dedupeKey = [
        type,
        dashaLevel,
        dashaPlanet,
        transitPlanet,
        transitCondition ?? '',
        natalPlanet ?? '',
        aspectType ?? '',
        targetSign ?? ''
      ].join('|');

      if (dedupe.has(dedupeKey)) continue;
      dedupe.add(dedupeKey);

      const evidenceItem: DashaTransitEvidence = Object.freeze({
        type,
        dashaLevel,
        dashaPlanet,
        transitPlanet,
        ...(transitCondition ? { transitCondition } : {}),
        ...(natalPlanet ? { natalPlanet } : {}),
        ...(aspectType ? { aspectType } : {}),
        ...(targetSign ? { targetSign } : {}),
        ...((ev as any).referenceHouse !== undefined ? { referenceHouse: (ev as any).referenceHouse } : {}),
        ...((ev as any).targetHouseFromMoon !== undefined ? { targetHouseFromMoon: (ev as any).targetHouseFromMoon } : {}),
        ...((ev as any).targetHouseFromAscendant !== undefined ? { targetHouseFromAscendant: (ev as any).targetHouseFromAscendant } : {}),
        reason,
        sourceReason: ev.reason
      });

      correlations.push(evidenceItem);
    }
  }

  const frozenCorrelations = Object.freeze(correlations);
  const report: DashaTransitCorrelationReport = Object.freeze({
    transitAt,
    correlations: frozenCorrelations
  });

  return report;
}
