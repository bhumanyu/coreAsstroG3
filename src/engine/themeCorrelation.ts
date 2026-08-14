/**
 * Theme Correlation Engine
 *
 * Correlates natal theme evidence with Dasha-transit correlations (PR-039).
 * Pure function: correlateThemes(input)
 *
 * - Does not compute natal analysis, Dasha, or transits.
 * - Requires explicit natal theme evidence provided by the caller.
 * - Never infers a theme without explicit natal theme evidence.
 */

import { Planet } from '../types';
import {
  DashaTransitEvidence,
  DashaTransitCorrelationReport
} from './dashaTransitCorrelation';
import { PLANETS_METADATA } from '../data/astroData';

/**
 * Life themes recognized for correlation.
 */
export enum ThemeType {
  CAREER = 'CAREER',
  WEALTH = 'WEALTH',
  HEALTH = 'HEALTH',
  RELATIONSHIPS = 'RELATIONSHIPS',
  SPIRITUALITY = 'SPIRITUALITY'
}

export const VALID_SOURCES = ['PLANET', 'HOUSE', 'LORDSHIP', 'YOGA', 'CHART'] as const;
export type NatalThemeSource = (typeof VALID_SOURCES)[number];

/**
 * Evidence structure representing a natal theme promise/indicator.
 */
export interface NatalThemeEvidence {
  readonly theme: ThemeType;
  readonly source: NatalThemeSource;
  readonly ruleId: string;
  readonly reason: string;
  readonly activatingPlanets: readonly Planet[];
  readonly planet?: Planet;
  readonly house?: number;
}

/**
 * Correlated theme evidence item containing matched natal evidence and Dasha-transit evidence.
 */
export interface ThemeCorrelationEvidence {
  readonly theme: ThemeType;
  readonly natalEvidence: readonly NatalThemeEvidence[];
  readonly dashaTransitEvidence: readonly DashaTransitEvidence[];
  readonly reason: string;
}

/**
 * Final Theme Correlation Report.
 */
export interface ThemeCorrelationReport {
  readonly transitAt?: string;
  readonly themes: readonly ThemeCorrelationEvidence[];
}

/**
 * Input for the theme correlation engine.
 */
export interface ThemeCorrelationInput {
  readonly natalThemeEvidence: readonly NatalThemeEvidence[];
  readonly transitCorrelation: DashaTransitCorrelationReport;
}

function validateNatalThemeEvidence(evidence: unknown): void {
  if (!evidence || typeof evidence !== 'object') {
    throw new TypeError('Natal theme evidence item must be a non-null object.');
  }
  const ne = evidence as Partial<NatalThemeEvidence>;

  if (!ne.theme || !Object.values(ThemeType).includes(ne.theme)) {
    throw new TypeError(`Invalid theme: ${ne.theme}. Must be a valid ThemeType.`);
  }

  if (!ne.ruleId || typeof ne.ruleId !== 'string' || ne.ruleId.trim() === '') {
    throw new TypeError('ruleId must be a non-empty string.');
  }

  if (!ne.source || !(VALID_SOURCES as readonly string[]).includes(ne.source as string)) {
    throw new TypeError(`Invalid source: ${ne.source}. Must be one of PLANET, HOUSE, LORDSHIP, YOGA, CHART.`);
  }

  if (!ne.activatingPlanets || !Array.isArray(ne.activatingPlanets) || ne.activatingPlanets.length === 0) {
    throw new TypeError('activatingPlanets must be a non-empty array of Planet.');
  }

  for (const p of ne.activatingPlanets) {
    if (!p || !Object.values(Planet).includes(p as Planet)) {
      throw new TypeError(`Invalid activating planet: ${p}. Must be a valid Planet.`);
    }
  }
}

/**
 * Extract natal theme evidence from chart analysis objects.
 *
 * Natal-theme extraction is deferred to a future PR (PR-040B) because the repository
 * currently has no structured natal analysis or rule engine (ChartAnalysis, LordshipAnalysis,
 * YogaAnalysis, or ruleId sources) to adapt from, and fabricating rules is intentionally avoided.
 *
 * Returns an empty array when called.
 */
export function extractNatalThemeEvidence(
  _chartAnalysis?: unknown
): readonly NatalThemeEvidence[] {
  return Object.freeze([]);
}

/**
 * Correlates explicit natal theme evidence with Dasha-transit correlation results.
 *
 * Pure function. A theme is emitted ONLY when explicit natal theme evidence names an activating planet
 * AND PR-039 has a correlation for that same planet.
 */
export function correlateThemes(
  input: ThemeCorrelationInput
): ThemeCorrelationReport {
  if (!input) {
    throw new TypeError('Input is required.');
  }
  if (!input.transitCorrelation) {
    throw new TypeError('input.transitCorrelation is required.');
  }
  if (!input.natalThemeEvidence || !Array.isArray(input.natalThemeEvidence)) {
    throw new TypeError('input.natalThemeEvidence must be an array.');
  }

  for (const ne of input.natalThemeEvidence) {
    validateNatalThemeEvidence(ne);
  }

  const transitAt = input.transitCorrelation.transitAt;

  // Group natal theme evidence by theme
  const natalByTheme = new Map<ThemeType, NatalThemeEvidence[]>();
  for (const ne of input.natalThemeEvidence) {
    const list = natalByTheme.get(ne.theme) ?? [];
    list.push(ne);
    natalByTheme.set(ne.theme, list);
  }

  const resultThemes: ThemeCorrelationEvidence[] = [];

  for (const [theme, natalList] of natalByTheme.entries()) {
    const matchedNatal: NatalThemeEvidence[] = [];
    const matchedDashaTransit: DashaTransitEvidence[] = [];
    const dtDedupeSet = new Set<string>();
    const natalDedupeSet = new Set<string>();

    for (const ne of natalList) {
      const matchingDtEv = input.transitCorrelation.correlations.filter((dt) =>
        ne.activatingPlanets.includes(dt.dashaPlanet)
      );

      if (matchingDtEv.length > 0) {
        const natalKey = [
          ne.theme,
          ne.ruleId,
          ne.source,
          ne.reason,
          ne.planet ?? '',
          ne.house ?? '',
          [...ne.activatingPlanets].sort().join(',')
        ].join('|');

        if (!natalDedupeSet.has(natalKey)) {
          natalDedupeSet.add(natalKey);
          matchedNatal.push(
            Object.freeze({
              ...ne,
              activatingPlanets: Object.freeze([...ne.activatingPlanets])
            })
          );
        }

        for (const dt of matchingDtEv) {
          const dtKey = [
            dt.type,
            dt.dashaLevel,
            dt.dashaPlanet,
            dt.transitPlanet,
            dt.transitCondition ?? '',
            dt.natalPlanet ?? '',
            dt.aspectType ?? '',
            dt.targetSign ?? '',
            dt.referenceHouse ?? '',
            dt.targetHouseFromMoon ?? '',
            dt.targetHouseFromAscendant ?? '',
            dt.sourceReason,
            dt.reason
          ].join('|');

          if (!dtDedupeSet.has(dtKey)) {
            dtDedupeSet.add(dtKey);
            matchedDashaTransit.push(dt);
          }
        }
      }
    }

    if (matchedNatal.length > 0 && matchedDashaTransit.length > 0) {
      const planetsMentioned = Array.from(
        new Set(matchedDashaTransit.map((dt) => dt.dashaPlanet))
      )
        .map((p) => PLANETS_METADATA[p]?.englishName || p)
        .join(', ');

      const themeEvidence: ThemeCorrelationEvidence = Object.freeze({
        theme,
        natalEvidence: Object.freeze(matchedNatal),
        dashaTransitEvidence: Object.freeze(matchedDashaTransit),
        reason: `Theme ${theme} is supported by explicit natal evidence and a matching Dasha-transit correlation for ${planetsMentioned}.`
      });

      resultThemes.push(themeEvidence);
    }
  }

  const frozenThemes = Object.freeze(resultThemes);
  const report: ThemeCorrelationReport = Object.freeze({
    transitAt,
    themes: frozenThemes
  });

  return report;
}
