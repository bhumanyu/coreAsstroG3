/**
 * Canonical ProductAnalysis Aggregate Mapper (P-UI-02)
 *
 * Translates domain engine results and LifeAnalysisViewModel into
 * the canonical ProductAnalysis aggregate.
 *
 * INVARIANTS:
 * - Pure projection: NO engine objects placed directly on ProductAnalysis.
 * - Evidence provenance preserved: id, title, statement, direction, role, source, ruleId, derivedFromIds.
 * - D10 relationship preserved as semantics (CONFIRMS/MODIFIES/etc.), NEVER as a percentage.
 * - Dasha hierarchy role: MD -> PRIMARY, AD -> MODIFIER, PD -> REFINEMENT.
 */

import type { BirthDetails, Horoscope } from '../../types';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import type { DomainInterpretation } from '../../domain/interpretation/DomainInterpretation';
import { getCareerConclusionData } from '../../domain/interpretation';
import { Planet } from '../../types';
import type {
  LifeAnalysisViewModel,
  CareerTimingProduct,
  WealthTimingProduct,
  LifeAnalysisQualification
} from '../life-analysis/lifeAnalysisTypes';
import type { AiExplanationResult } from '../../ai/browser';
import { validateWealthFinancialDataSet } from '../../domain/wealth/wealthFinancialData';
import { analyzeCareerPathways, type CareerPathwayAnalysis } from '../../domain/career/careerPathway';
import type { WealthFinancialDataSet } from '../../domain/wealth/wealthFinancialData';
import type {
  ProductAnalysis,
  ProductAnalysisStatus,
  ProductBirth,
  ProductMethodology,
  ProductChartSummary,
  ProductEvidence,
  ProductEvidenceRole,
  ProductDirection,
  CareerProductAnalysis,
  WealthProductAnalysis,
  ProductDashaState,
  ProductDashaPeriod,
  ReasoningProductAnalysis,
  AiProductState,
  ProductWarning,
  D10ProductResult,
  D2ProductResult,
  ProductQualification,
  ProductCareerAnalyticalAxes,
  ProductCareerOutcomeAnalysis,
  ProductCareerPathwayAnalysis,
  ProductCareerEventTimeline,
  ProductCareerProfessionRanking,
  ProductCareerPatternQualification,
  ProductConfidence,
  ActivationEffect,
  ConclusionStatus,
  ProductSelectedPeriodSynthesis,
  ProductQualificationStatus,
  ProductSynthesisEvidenceReference,
  ProductSynthesisMissingInput,
  ProductSynthesisProvenance,
  ProductSynthesisDiagnostic,
  ProductSynthesisCareerSection,
  ProductSynthesisCareerExpressionRow,
  ProductSynthesisWealthSection,
  ProductSynthesisWealthDimensionRow,
  ProductDashaPeriodOptions,
  ProductSelectableMahadasha,
  ProductSelectableAntardasha,
  ProductTemporalRelation,
  ProductDomainConfidenceMetadata,
  ProductConfidenceLayerState,
  ProductAnalysisVersionManifest,
  ProductVersionComponent,
  ProductDeterministicVersionManifest,
  ProductAiExplanationVersionManifest
} from './productAnalysisTypes';
import type { CareerAnalyticalAxes } from '../../domain/career/careerFinalSynthesis/careerAnalyticalAxes';
import type { CareerOutcomeAnalysis } from '../../domain/career/careerOutcomeQualification/careerOutcomeTypes';
import type { CareerEventTimelineAnalysis } from '../../domain/career/careerEventTimeline/careerEventTimelineTypes';
import type { CareerProfessionAnalysis, CareerProfessionRanking } from '../../domain/career/careerProfession/careerProfessionTypes';
import type { CanonicalCareerFoundation } from '../../domain/career/orchestration/canonicalCareerContracts';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
import type {
  SelectedPeriodSynthesisValue
} from '../../domain/synthesis/selectedPeriodSynthesis';
import {
  listSelectableMdAdPeriods,
  type SelectablePeriodsResult
} from '../../core/analysis/selectedMdAdPeriod';
import {
  classifyTemporalRelation,
  type TemporalRelation
} from '../../core/analysis/temporalInterval';

export interface ProductAnalysisMapperInput {
  readonly birthDetails: BirthDetails;
  readonly horoscope: Horoscope;
  readonly lifeAnalysisViewModel: LifeAnalysisViewModel;
  readonly context: AnalysisContext;
  readonly aiExplanation?: AiExplanationResult;
  readonly warnings?: readonly ProductWarning[];
  readonly domainInterpretations?: readonly DomainInterpretation[];
  readonly careerEvidence?: readonly ProductEvidence[];
  readonly wealthEvidence?: readonly ProductEvidence[];
  readonly temporalState?: import('../../core/analysis/AnalysisTemporalState').AnalysisTemporalState;
  /** Explicit user-reported or connected-source financial facts; never derived from horoscope. */
  readonly wealthFinancialData?: WealthFinancialDataSet;
  /** Existing C04 result supplied by the domain pipeline; mapper does not calculate lifecycle. */
  readonly wealthLifecycle?: import('../../domain/wealth/wealthLifecycleTypes').WealthLifecycleAnalysis;
  /** Already-derived C11/CW-05 presentation metadata; the mapper never computes confidence. */
  readonly confidenceMetadata?: Readonly<{ career?: ProductDomainConfidenceMetadata; wealth?: ProductDomainConfidenceMetadata }>;
}

/**
 * Deterministically constructs an analysis ID from birth details and timestamp.
 * Guaranteed to produce distinct IDs for different births.
 */
export function createAnalysisId(birth: BirthDetails, asOf: string): string {
  const cleanDate = (birth?.dateTimeStr || '').replace(/[^0-9]/g, '');
  const lat = Math.round(Number(birth?.latitude || 0) * 1000);
  const lon = Math.round(Number(birth?.longitude || 0) * 1000);
  const ayanamsa = String(birth?.ayanamsa || 'LAHIRI').toLowerCase();
  const asOfClean = asOf.replace(/[^0-9]/g, '');
  return `pa_${cleanDate}_${lat}_${lon}_${ayanamsa}_${asOfClean}`;
}

/**
 * Extracts a readable error message from an unknown error value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred during product analysis.';
}

/**
 * Derives overall status based on domain availability and warning severities.
 */
export function deriveProductAnalysisStatus(
  career: CareerProductAnalysis,
  wealth: WealthProductAnalysis,
  warnings: readonly ProductWarning[] = []
): ProductAnalysisStatus {
  if (warnings.some((w) => w.severity === 'ERROR')) {
    return 'ERROR';
  }

  const careerUnavailable = career.promise.strength === 'UNAVAILABLE';
  const wealthUnavailable = wealth.overall.status === 'UNAVAILABLE';

  if (careerUnavailable && wealthUnavailable) {
    return 'ERROR';
  }

  const hasWarning = warnings.some((w) => w.severity === 'WARNING');
  const isPartial =
    hasWarning ||
    careerUnavailable ||
    wealthUnavailable ||
    career.activation.dasha.status === 'UNAVAILABLE' ||
    wealth.activation.dasha.status === 'UNAVAILABLE' ||
    career.activation.dasha.status === 'CONDITIONAL' ||
    wealth.activation.dasha.status === 'CONDITIONAL';

  return isPartial ? 'PARTIAL' : 'READY';
}

/**
 * Direction inputs are limited to ActivationEffect, ConclusionStatus,
 * and ProductDirection. Strength values are not directions. TransitEffect-only literals
 * (TRIGGER, MODIFIER, and NO_MATERIAL_TRIGGER) are intentionally excluded and
 * fail closed to UNAVAILABLE.
 *
 * DOES_NOT_ACTIVATE maps to NEUTRAL because it explicitly reports
 * non-activation, not a neutral outcome.
 */
type ProductDirectionSource = ActivationEffect | ConclusionStatus | ProductDirection;

const PRODUCT_DIRECTION_BY_SOURCE: Readonly<Record<ProductDirectionSource, ProductDirection>> = {
  ACTIVATES: 'SUPPORT',
  PARTIALLY_ACTIVATES: 'MIXED',
  CHALLENGES: 'CHALLENGE',
  DOES_NOT_ACTIVATE: 'NEUTRAL',
  STRONGLY_SUPPORTS: 'SUPPORT',
  SUPPORTS: 'SUPPORT',
  CONTRADICTS: 'CHALLENGE',
  UNKNOWN: 'UNAVAILABLE',
  INSUFFICIENT_DATA: 'UNAVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  STRONGLY_SUPPORTED: 'SUPPORT',
  SUPPORTED: 'SUPPORT',
  MIXED: 'MIXED',
  CHALLENGED: 'CHALLENGE',
  LIMITED: 'UNAVAILABLE',
  SUPPORT: 'SUPPORT',
  CHALLENGE: 'CHALLENGE',
  NEUTRAL: 'NEUTRAL'
};

function isProductDirectionSource(value: string): value is ProductDirectionSource {
  return Object.prototype.hasOwnProperty.call(PRODUCT_DIRECTION_BY_SOURCE, value);
}

/** Maps known domain enums exactly; missing or unknown values fail closed. */
export function mapDirection(val?: string): ProductDirection {
  const normalized = val?.trim().toUpperCase();
  return normalized && isProductDirectionSource(normalized)
    ? PRODUCT_DIRECTION_BY_SOURCE[normalized]
    : 'UNAVAILABLE';
}

/**
 * Derives aggregate D10 status from candidate D10 statuses.
 * D10 status is per-candidate; this derives a sensible aggregate.
 *
 * Derivation rules:
 * - QUALIFIED if any candidate is QUALIFIED (presence of D10 support)
 * - NOT_PROVIDED if all candidates are NOT_PROVIDED (D10 data missing entirely)
 * - UNAVAILABLE otherwise (mixed or unavailable states)
 */
function deriveAggregateD10Status(candidates: readonly { d10Status: string }[]): string {
  if (!candidates || candidates.length === 0) {
    return 'NOT_PROVIDED';
  }

  const hasPartial = candidates.some(c => c.d10Status === 'PARTIAL' || c.d10Status === 'CONFLICTED');
  if (hasPartial) {
    return 'PARTIAL';
  }

  const hasQualified = candidates.some(c => c.d10Status === 'QUALIFIED');
  if (hasQualified) {
    return 'QUALIFIED';
  }

  const allNotProvided = candidates.every(c => c.d10Status === 'NOT_PROVIDED');
  if (allNotProvided) {
    return 'NOT_PROVIDED';
  }

  return 'UNAVAILABLE';
}

/**
 * Compute temporal relation of a period relative to analysis.asOf.
 * Uses the shared classifyTemporalRelation utility for consistency.
 *
 * Maps TemporalRelation to ProductTemporalRelation:
 * - PAST/CURRENT/FUTURE → same
 * - INVALID → UNKNOWN (mapper treats inverted intervals as unknown)
 * - UNKNOWN → UNKNOWN
 */
function computeTemporalRelation(
  start: string,
  end: string,
  analysisAsOf: string
): ProductTemporalRelation {
  const relation = classifyTemporalRelation(start, end, analysisAsOf);

  // Map INVALID to UNKNOWN for product layer (mapper doesn't reject, just labels)
  if (relation === 'INVALID') {
    return 'UNKNOWN';
  }

  // PAST, CURRENT, FUTURE, UNKNOWN map directly
  return relation as ProductTemporalRelation;
}

/**
 * Project listSelectableMdAdPeriods(report) into ProductDashaPeriodOptions.
 *
 * Verbatim IDs/dates are preserved.
 * valid + diagnostics are preserved per entry.
 * temporalRelation is computed at the mapper boundary against analysis.asOf
 * using the same interval semantics as createSelectedPeriodActivationContext.
 */
export function mapDashaPeriodOptions(
  selectablePeriods: SelectablePeriodsResult,
  analysisAsOf: string
): ProductDashaPeriodOptions {
  const mahadashas: ProductSelectableMahadasha[] = selectablePeriods.mahadashas.map(md => {
    const temporalRelation = computeTemporalRelation(md.start, md.end, analysisAsOf);

    // Map antardashas for this mahadasha
    const antardashas: ProductSelectableAntardasha[] = selectablePeriods.antardashas
      .filter(ad => ad.mahadashaId === md.id)
      .map(ad => ({
        id: ad.id,
        planet: ad.planet,
        start: ad.start,
        end: ad.end,
        valid: ad.valid,
        diagnostics: ad.diagnostics,
        temporalRelation: computeTemporalRelation(ad.start, ad.end, analysisAsOf)
      }));

    return {
      id: md.id,
      planet: md.planet,
      start: md.start,
      end: md.end,
      valid: md.valid,
      diagnostics: md.diagnostics,
      temporalRelation,
      antardashas: Object.freeze(antardashas)
    };
  });

  return Object.freeze({
    mahadashas: Object.freeze(mahadashas),
    diagnostics: selectablePeriods.diagnostics
  });
}

/**
 * Maps D10 relationship semantics (never percentage).
 */
export function mapD10Relationship(val?: string): D10ProductResult['relationship'] {
  if (!val) return 'UNAVAILABLE';
  const u = val.toUpperCase();
  if (u.includes('PARTIAL')) return 'PARTIALLY_CONFIRMS';
  if (u.includes('CONFIRM')) return 'CONFIRMS';
  if (u.includes('MODIFY') || u.includes('MODIFIES')) return 'MODIFIES';
  if (u.includes('CONFLICT')) return 'CONFLICTS';
  return 'UNAVAILABLE';
}

/**
 * Maps D2 relationship semantics.
 */
export function mapD2Relationship(_val?: string): D2ProductResult['relationship'] {
  // Downstream product adapters cannot promote D2 before the domain validation gate is approved.
  return 'UNAVAILABLE';
}

/** Maps legacy dimension status to descriptive chart-propensity vocabulary. */
export function mapSpeculativePropensity(val?: string): import('./productAnalysisTypes').AstrologicalSpeculativePropensity {
  const u = (val ?? '').trim().toUpperCase();
  switch (u) {
    case 'VERY_STRONG':
    case 'STRONGLY_SUPPORTED': return 'VERY_STRONG';
    case 'STRONG':
    case 'SUPPORTED': return 'STRONG';
    case 'MODERATE': return 'MODERATE';
    case 'MIXED': return 'MIXED';
    case 'CHALLENGED':
    case 'CHALLENGE':
    case 'WEAK':
    case 'VERY_WEAK':
    case 'LIMITED': return 'CHALLENGED';
    default: return 'INSUFFICIENT_DATA';
  }
}

const PROHIBITED_SPECULATION_OUTPUT = /\b(?:buy|sell|hold|options?|leverage|margin|short(?:ing)?|long(?:ing)?|position\s*size|instrument|expected\s+returns?|higher\s+returns?|returns?|investment\s+advice|stocks?|equity\s+recommendation|profit|loss|stop\s*loss|target\s*price|portfolio\s+allocation|recommend(?:ation|ed)?|trade\s+signal)\b/i;

/** Only retain non-prescriptive chart description text. Untrusted engine prose fails closed. */
export function sanitizeSpeculativePropensityDescription(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  if (PROHIBITED_SPECULATION_OUTPUT.test(value)) return undefined;
  return value.trim();
}

/**
 * Maps confidence string to ProductConfidence.
 */
export function mapConfidence(val?: string): ProductConfidence {
  if (!val) return 'MEDIUM';
  const u = val.toUpperCase();
  if (u === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (u.includes('HIGH')) return 'HIGH';
  if (u.includes('LOW')) return 'LOW';
  return 'MEDIUM';
}

/**
 * Maps Career C11 confidence metadata to ProductDomainConfidenceMetadata.
 * Returns undefined if canonical C11 metadata is not available (fail-closed).
 */
export function mapCareerConfidenceMetadata(
  conclusionData?: import('../../domain/career/careerTypes').CareerConclusionData
): ProductDomainConfidenceMetadata | undefined {
  const canonicalC11 = conclusionData?.canonicalCareerFinalSynthesis;
  if (!canonicalC11) return undefined;

  const coverage = canonicalC11.confidenceCoverage;
  const reasons = canonicalC11.confidenceReasons;

  return Object.freeze({
    confidence: mapConfidence(canonicalC11.confidence),
    coverage: (() => {
      switch (coverage.status) {
        case 'COMPLETE': return 'COMPLETE' as const;
        case 'PARTIAL': return 'PARTIAL' as const;
        case 'INSUFFICIENT': return 'INSUFFICIENT' as const;
        default: return 'UNAVAILABLE' as const;
      }
    })(),
    layers: Object.freeze(coverage.layers.map(layer => Object.freeze({
      id: layer.layer,
      state: ((): ProductConfidenceLayerState => {
        switch (layer.availability) {
          case 'AVAILABLE': return 'AVAILABLE';
          case 'UNAVAILABLE': return 'UNAVAILABLE';
          default: return 'UNAVAILABLE';
        }
      })(),
      required: layer.requirement === 'REQUIRED',
      reason: undefined,
      evidenceIds: undefined
    } as const))),
    reasons: Object.freeze(reasons.map(r => r.message)),
    diagnostics: Object.freeze([]),
    evidenceIds: Object.freeze(canonicalC11.evidenceIds),
    ruleIds: Object.freeze(canonicalC11.ruleIds),
    owner: 'C11' as const,
    metadataSource: 'DOMAIN_CANONICAL' as const
  });
}

/**
 * Maps Wealth CW-05 confidence metadata to ProductDomainConfidenceMetadata.
 * Returns undefined if CW-05 confidenceBreakdown is not available (fail-closed).
 */
export function mapWealthConfidenceMetadata(
  conclusionData?: import('../../domain/wealth/wealthTypes').WealthConclusionData
): ProductDomainConfidenceMetadata | undefined {
  const wealthFinalSynthesis = conclusionData?.wealthFinalSynthesis;
  if (!wealthFinalSynthesis || !wealthFinalSynthesis.confidenceBreakdown) return undefined;

  const breakdown = wealthFinalSynthesis.confidenceBreakdown;

  return Object.freeze({
    confidence: (() => {
      switch (breakdown.final) {
        case 'HIGH': return 'HIGH' as const;
        case 'MEDIUM': return 'MEDIUM' as const;
        case 'LOW': return 'LOW' as const;
        default: return 'MEDIUM' as const;
      }
    })(),
    coverage: (() => {
      switch (breakdown.evidenceCoverage) {
        case 'HIGH': return 'COMPLETE' as const;
        case 'MEDIUM': return 'PARTIAL' as const;
        case 'LOW': return 'INSUFFICIENT' as const;
        default: return 'UNAVAILABLE' as const;
      }
    })(),
    layers: Object.freeze([
      { id: 'NATAL_PROMISE', state: 'AVAILABLE' as const, required: true, reason: undefined, evidenceIds: wealthFinalSynthesis.natalEvidenceIds },
      { id: 'DASHA', state: 'AVAILABLE' as const, required: true, reason: undefined, evidenceIds: [] },
      { id: 'D2', state: 'UNAVAILABLE' as const, required: false, reason: 'D2 calculation and interpretation have not passed independent validation.', evidenceIds: [] },
      { id: 'TRANSIT', state: 'UNAVAILABLE' as const, required: false, reason: 'Transit layer not included in CW-05 confidence breakdown.', evidenceIds: [] }
    ]),
    reasons: Object.freeze(breakdown.reasons),
    diagnostics: Object.freeze([]),
    evidenceIds: Object.freeze(wealthFinalSynthesis.evidenceIds),
    ruleIds: Object.freeze(wealthFinalSynthesis.ruleIds),
    owner: 'CW-05' as const,
    metadataSource: 'DOMAIN_CANONICAL' as const
  });
}

function mapBirth(birth: BirthDetails): ProductBirth {
  return {
    name: birth.name,
    placeOfBirth: birth.placeOfBirth,
    dateTime: birth.dateTimeStr,
    timezone: birth.timeZone,
    latitude: birth.latitude,
    longitude: birth.longitude,
    ayanamsa: String(birth.ayanamsa)
  };
}

export function mapMethodology(birth: BirthDetails): ProductMethodology {
  return {
    zodiacSystem: 'SIDEREAL',
    houseSystem: 'WHOLE_SIGN',
    ayanamsa: String(birth.ayanamsa),
    calculationEngine: 'ASTRO_CORE_V1',
    rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
    vargaRules: 'PARASHARA_D10_D2',
    dashaSystem: 'VIMSHOTTARI'
  };
}

function mapChartSummary(horoscope: Horoscope): ProductChartSummary {
  const ascSign =
    horoscope.rasiChart?.ascendantSign ??
    horoscope.ascendant?.sign;

  const rawAscLong =
    horoscope.rasiChart?.ascendantLongitude ??
    horoscope.ascendant?.longitude;
  const ascendantDegree = typeof rawAscLong === 'number' ? rawAscLong % 30 : undefined;

  const sunSign =
    horoscope.planetFacts?.[Planet.SUN]?.sign ??
    horoscope.planetFacts?.[Planet.SUN]?.position?.sign;

  const moonSign =
    horoscope.planetFacts?.[Planet.MOON]?.sign ??
    horoscope.planetFacts?.[Planet.MOON]?.position?.sign;

  const moonNakshatra =
    horoscope.planetFacts?.[Planet.MOON]?.nakshatraResult?.nakshatra ??
    horoscope.planetFacts?.[Planet.MOON]?.nakshatraMetadata?.name;

  const isAvailable = Boolean(ascSign && sunSign && moonSign);

  return {
    ascendantSign: ascSign ? String(ascSign) : 'UNAVAILABLE',
    ascendantDegree,
    moonSign: moonSign ? String(moonSign) : 'UNAVAILABLE',
    sunSign: sunSign ? String(sunSign) : 'UNAVAILABLE',
    moonNakshatra: moonNakshatra ? String(moonNakshatra) : 'UNAVAILABLE',
    isAvailable
  };
}

function mapDashaPeriods(
  timing?: CareerTimingProduct | WealthTimingProduct
): readonly ProductDashaPeriod[] {
  const periods: ProductDashaPeriod[] = [];

  if (timing?.mahadasha) {
    const md = timing.mahadasha;
    periods.push({
      level: 'MD',
      planet: md.planet ? String(md.planet) : undefined,
      role: 'PRIMARY',
      direction: mapDirection(md.effect),
      effect: md.effect || 'UNAVAILABLE',
      evidenceIds: Array.isArray(md.evidenceIds) ? [...md.evidenceIds] : [],
      statement: md.statement,
      start: 'start' in md ? md.start : undefined,
      end: 'end' in md ? md.end : undefined,
      ...('conditionAssessment' in md && md.conditionAssessment !== undefined
        ? { conditionAssessment: md.conditionAssessment }
        : {}),
      ...('afflictionAssessed' in md && md.afflictionAssessed !== undefined
        ? { afflictionAssessed: md.afflictionAssessed }
        : {}),
      ...('expressionAnalysisStatus' in md && md.expressionAnalysisStatus !== undefined
        ? { expressionAnalysisStatus: md.expressionAnalysisStatus }
        : {}),
      ...('diagnostics' in md && md.diagnostics !== undefined
        ? { diagnostics: [...md.diagnostics] }
        : {}),
      ...('evidenceTally' in md && md.evidenceTally !== undefined
        ? { evidenceTally: md.evidenceTally }
        : {})
    });
  }

  if (timing?.antardasha) {
    const ad = timing.antardasha;
    periods.push({
      level: 'AD',
      planet: ad.planet ? String(ad.planet) : undefined,
      role: 'MODIFIER',
      direction: mapDirection(ad.effect),
      effect: ad.effect || 'UNAVAILABLE',
      evidenceIds: Array.isArray(ad.evidenceIds) ? [...ad.evidenceIds] : [],
      statement: ad.statement,
      start: 'start' in ad ? ad.start : undefined,
      end: 'end' in ad ? ad.end : undefined,
      ...('conditionAssessment' in ad && ad.conditionAssessment !== undefined
        ? { conditionAssessment: ad.conditionAssessment }
        : {}),
      ...('afflictionAssessed' in ad && ad.afflictionAssessed !== undefined
        ? { afflictionAssessed: ad.afflictionAssessed }
        : {}),
      ...('expressionAnalysisStatus' in ad && ad.expressionAnalysisStatus !== undefined
        ? { expressionAnalysisStatus: ad.expressionAnalysisStatus }
        : {}),
      ...('diagnostics' in ad && ad.diagnostics !== undefined
        ? { diagnostics: [...ad.diagnostics] }
        : {}),
      ...('evidenceTally' in ad && ad.evidenceTally !== undefined
        ? { evidenceTally: ad.evidenceTally }
        : {})
    });
  }

  if (timing?.pratyantardasha) {
    const pd = timing.pratyantardasha;
    periods.push({
      level: 'PD',
      planet: pd.planet ? String(pd.planet) : undefined,
      role: 'REFINEMENT',
      direction: mapDirection(pd.effect),
      effect: pd.effect || 'UNAVAILABLE',
      evidenceIds: Array.isArray(pd.evidenceIds) ? [...pd.evidenceIds] : [],
      statement: pd.statement,
      start: 'start' in pd ? pd.start : undefined,
      end: 'end' in pd ? pd.end : undefined,
      ...('conditionAssessment' in pd && pd.conditionAssessment !== undefined
        ? { conditionAssessment: pd.conditionAssessment }
        : {}),
      ...('afflictionAssessed' in pd && pd.afflictionAssessed !== undefined
        ? { afflictionAssessed: pd.afflictionAssessed }
        : {}),
      ...('expressionAnalysisStatus' in pd && pd.expressionAnalysisStatus !== undefined
        ? { expressionAnalysisStatus: pd.expressionAnalysisStatus }
        : {}),
      ...('diagnostics' in pd && pd.diagnostics !== undefined
        ? { diagnostics: [...pd.diagnostics] }
        : {}),
      ...('evidenceTally' in pd && pd.evidenceTally !== undefined
        ? { evidenceTally: pd.evidenceTally }
        : {})
    });
  }

  return periods;
}

function mapQualifications(raw?: readonly LifeAnalysisQualification[]): readonly ProductQualification[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((q) => ({
    type: String(q.type || 'GENERAL'),
    severity: (q.severity?.toUpperCase() === 'HIGH' || q.severity?.toUpperCase() === 'LOW') ? q.severity.toUpperCase() : 'MEDIUM',
    description: String(q.description || q.statement || '')
  }));
}

export function mapEvidenceItems(
  rawList?: readonly any[],
  fallbackDomain: string = 'GENERAL'
): readonly ProductEvidence[] {
  if (!rawList || !Array.isArray(rawList)) return [];

  return rawList.map((item, idx) => {
    // If already a ProductEvidence object with id, title, statement, etc., preserve it fully!
    if (item && typeof item === 'object' && 'id' in item && 'direction' in item && 'role' in item) {
      return {
        id: String(item.id),
        title: String(item.title || item.id),
        statement: String(item.statement || ''),
        direction: item.direction,
        role: item.role,
        source: String(item.source || fallbackDomain),
        sourceType: typeof item.sourceType === 'string' ? item.sourceType : undefined,
        phase: typeof item.phase === 'string' ? item.phase : undefined,
        dimension: typeof item.dimension === 'string' ? item.dimension : undefined,
        house: Number.isInteger(item.house) ? item.house : undefined,
        houses: Array.isArray(item.houses)
          ? item.houses.filter((house: unknown): house is number => Number.isInteger(house))
          : undefined,
        planet: typeof item.planet === 'string' ? item.planet : undefined,
        ruleId: item.ruleId ? String(item.ruleId) : undefined,
        derivedFromIds: Array.isArray(item.derivedFromIds)
          ? [...item.derivedFromIds]
          : Array.isArray(item.provenance?.derivedFromIds)
            ? [...item.provenance.derivedFromIds]
            : Array.isArray(item.relatedEvidenceIds)
              ? [...item.relatedEvidenceIds]
              : undefined
      };
    }

    const id = item.id || `ev_${fallbackDomain.toLowerCase()}_${idx + 1}`;
    const role: ProductEvidenceRole =
      item.role === 'PRIMARY' ||
        item.role === 'SUPPORTING' ||
        item.role === 'CHALLENGING' ||
        item.role === 'MODIFIER' ||
        item.role === 'REFINEMENT' ||
        item.role === 'CONFLICTING'
        ? item.role
        : 'SUPPORTING';

    const direction: ProductDirection =
      item.direction ||
      (item.provenance?.effect === 'CHALLENGE' || item.polarity === 'CHALLENGING'
        ? 'CHALLENGE'
        : item.provenance?.effect === 'MIXED' || item.polarity === 'CONFLICTING'
          ? 'MIXED'
          : item.provenance?.effect === 'NEUTRAL' || item.polarity === 'NEUTRAL'
            ? 'NEUTRAL'
            : item.provenance?.effect === 'SUPPORT' || item.polarity === 'SUPPORTING'
              ? 'SUPPORT'
              : role === 'CHALLENGING'
                ? 'CHALLENGE'
                : role === 'CONFLICTING'
                  ? 'MIXED'
                  : 'SUPPORT');

    return {
      id: String(id),
      title: typeof item.title === 'string' ? item.title : '',
      statement: String(item.statement || item.description || ''),
      direction,
      role,
      source: String(item.source || fallbackDomain),
      sourceType: typeof item.sourceType === 'string' ? item.sourceType : undefined,
      phase: typeof item.phase === 'string' ? item.phase : undefined,
      dimension: typeof item.dimension === 'string' ? item.dimension : undefined,
      house: Number.isInteger(item.house) ? item.house : undefined,
      houses: Array.isArray(item.houses)
        ? item.houses.filter((house: unknown): house is number => Number.isInteger(house))
        : undefined,
      planet: typeof item.planet === 'string' ? item.planet : undefined,
      ruleId: item.ruleId ? String(item.ruleId) : undefined,
      derivedFromIds: Array.isArray(item.derivedFromIds)
        ? [...item.derivedFromIds]
        : Array.isArray(item.provenance?.derivedFromIds)
          ? [...item.provenance.derivedFromIds]
          : Array.isArray(item.relatedEvidenceIds)
            ? [...item.relatedEvidenceIds]
            : undefined
    };
  });
}

/**
 * Normalizes a domain status signal into canonical ConclusionStatus.
 * Exhaustive mapping boundary with no unsafe casting.
 */
export function mapConclusionStatus(val?: string): ConclusionStatus {
  if (!val) return 'UNAVAILABLE';
  const u = val.trim().toUpperCase();
  switch (u) {
    case 'STRONGLY_SUPPORTED':
    case 'VERY_STRONG':
    case 'FAVORABLE':
      return 'STRONGLY_SUPPORTED';
    case 'SUPPORTED':
    case 'STRONG':
      return 'SUPPORTED';
    case 'MIXED':
    case 'MODERATE':
      return 'MIXED';
    case 'CHALLENGED':
    case 'UNFAVORABLE':
      return 'CHALLENGED';
    case 'LIMITED':
    case 'WEAK':
    case 'VERY_WEAK':
      return 'LIMITED';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

function mapCareerAnalyticalAxes(
  axes: CareerAnalyticalAxes
): ProductCareerAnalyticalAxes {
  const mapAxis = <T, TAxis extends ProductCareerAnalyticalAxes['promise']['axis']>(axis: {
    readonly status: ProductCareerAnalyticalAxes['promise']['status'];
    readonly result: T | null;
    readonly supportingEvidenceOccurrenceIds: readonly string[];
    readonly conflictingEvidenceOccurrenceIds: readonly string[];
    readonly ruleIds: readonly string[];
    readonly coverage: ProductCareerAnalyticalAxes['promise']['coverage'];
    readonly confidence: ProductCareerAnalyticalAxes['promise']['confidence'];
    readonly methodVersion: string;
    readonly unavailableReason?: string;
    readonly diagnostic?: string;
    readonly diagnostics?: readonly string[];
    readonly axis: TAxis;
  }) => ({
    ...axis,
    supportingEvidenceOccurrenceIds: [...axis.supportingEvidenceOccurrenceIds],
    conflictingEvidenceOccurrenceIds: [...axis.conflictingEvidenceOccurrenceIds],
    ruleIds: [...axis.ruleIds],
    coverage: {
      ...axis.coverage,
      availableSources: [...axis.coverage.availableSources],
      missingSources: [...axis.coverage.missingSources]
    },
    confidence: { ...axis.confidence },
    diagnostics: axis.diagnostics ? [...axis.diagnostics] : undefined
  });

  return {
    version: axes.version,
    promise: {
      ...mapAxis(axes.promise),
      result: axes.promise.result ? { ...axes.promise.result } : null
    },
    activation: {
      ...mapAxis(axes.activation),
      result: axes.activation.result ? { ...axes.activation.result } : null
    },
    sustainability: {
      ...mapAxis(axes.sustainability),
      result: axes.sustainability.result ? { ...axes.sustainability.result } : null
    },
    risk: {
      ...mapAxis(axes.risk),
      result: axes.risk.result ? { ...axes.risk.result } : null
    },
    timing: {
      ...mapAxis(axes.timing),
      result: axes.timing.result
        ? {
            ...axes.timing.result,
            candidateWindows: axes.timing.result.candidateWindows.map(window => ({
              ...window,
              activatedPromiseEvidenceIds: [...window.activatedPromiseEvidenceIds],
              supportingEvidenceOccurrenceIds: [...window.supportingEvidenceOccurrenceIds],
              ruleIds: [...window.ruleIds]
            })),
            untimedLevels: [...axes.timing.result.untimedLevels]
          }
        : null
    }
  };
}

function mapCareerOutcomeAnalysis(value: CareerOutcomeAnalysis): ProductCareerOutcomeAnalysis {
  return {
    reasoningVersion: value.reasoningVersion,
    methodVersion: value.methodVersion,
    status: value.status,
    candidateOutcomes: value.candidateOutcomes.map(candidate => ({
      ...candidate,
      timing: { ...candidate.timing },
      supportingEvidence: {
        natalPromiseOccurrenceIds: [...candidate.supportingEvidence.natalPromiseOccurrenceIds],
        activationOccurrenceIds: [...candidate.supportingEvidence.activationOccurrenceIds],
        candidateEventEvidenceIds: [...candidate.supportingEvidence.candidateEventEvidenceIds],
        ruleIds: [...candidate.supportingEvidence.ruleIds]
      },
      executionConditions: {
        ...candidate.executionConditions,
        requiredChecks: [...candidate.executionConditions.requiredChecks]
      },
      counterIndications: {
        ...candidate.counterIndications,
        evidenceOccurrenceIds: [...candidate.counterIndications.evidenceOccurrenceIds],
        conflicts: candidate.counterIndications.conflicts.map(conflict => ({
          ...conflict,
          evidenceIdentityIds: [...conflict.evidenceIdentityIds]
        }))
      }
    })),
    observedOutcomes: value.observedOutcomes.map(outcome => ({ ...outcome })),
    diagnostics: [...value.diagnostics],
    guaranteedOutcomeAvailable: false,
    numericProbabilityAvailable: false,
    statement: value.statement
  };
}


function mapCareerProfessionRanking(value?: CareerProfessionRanking): ProductCareerProfessionRanking {
  if (!value) {
    return {
      policyVersion: 'B04-PROFESSION-RANKING-v1',
      status: 'UNAVAILABLE',
      rankedCandidates: [],
      diagnostics: ['PROFESSION_RANKING_NOT_AVAILABLE_FROM_LEGACY_INPUT']
    };
  }
  return {
    policyVersion: value.policyVersion,
    status: value.status,
    rankedCandidates: value.rankedCandidates.map(candidate => ({
      candidateId: candidate.candidateId,
      domain: candidate.domain,
      family: candidate.family,
      rank: candidate.rank,
      score: candidate.score,
      scoreContributions: candidate.scoreContributions.map(contribution => ({ ...contribution })),
      confidence: candidate.confidence,
      confidenceReasons: [...candidate.confidenceReasons],
      evidenceCoverage: { ...candidate.evidenceCoverage },
      supportingCandidateIds: [...candidate.supportingCandidateIds],
      ruleIds: [...candidate.ruleIds],
      supportingEvidenceOccurrenceIds: [...candidate.supportingEvidenceOccurrenceIds],
      d10EvidenceOccurrenceIds: [...candidate.d10EvidenceOccurrenceIds],
      d10Direction: candidate.d10Direction,
      counterEvidenceOccurrenceIds: [...candidate.counterEvidenceOccurrenceIds],
      semanticIdentityKeys: [...candidate.semanticIdentityKeys],
      rootIdentityKeys: [...candidate.rootIdentityKeys],
      d10Status: candidate.d10Status,
      reasons: [...candidate.reasons],
      counterEvidenceReasons: [...candidate.counterEvidenceReasons],
      alternativeExplanation: candidate.alternativeExplanation
    })),
    diagnostics: [...value.diagnostics]
  };
}

function mapCareerEventTimeline(value: CareerEventTimelineAnalysis): ProductCareerEventTimeline {
  return {
    reasoningVersion: value.reasoningVersion,
    methodVersion: value.methodVersion,
    status: value.status,
    taxonomy: value.taxonomy.map(item => ({
      eventType: item.eventType,
      validationStatus: item.validationStatus,
      requiredEvidence: [...item.requiredEvidence],
      validationGap: item.validationGap,
      releaseEnabled: false
    })),
    eventCandidates: value.eventCandidates.map(candidate => ({
      candidateId: candidate.candidateId,
      eventType: candidate.eventType,
      status: candidate.status,
      sourceWindowId: candidate.sourceWindowId,
      timing: { ...candidate.timing },
      evidenceOccurrenceIds: [...candidate.evidenceOccurrenceIds],
      semanticIdentityIds: [...candidate.semanticIdentityIds],
      rootIdentityKeys: [...candidate.rootIdentityKeys],
      ruleIds: [...candidate.ruleIds],
      counterEvidenceOccurrenceIds: [...candidate.counterEvidenceOccurrenceIds],
      limitations: [...candidate.limitations],
      guarantee: 'NONE',
      numericProbabilityAvailable: false
    })),
    genericWindows: value.genericWindows.map(window => ({
      windowId: window.windowId,
      sourceEventId: window.sourceEventId,
      genericType: window.genericType,
      status: window.status,
      specificEventInference: window.specificEventInference,
      timing: { ...window.timing },
      opportunityId: window.opportunityId,
      activationId: window.activationId,
      qualificationBasis: window.qualificationBasis,
      conditions: [...window.conditions],
      counterEvidenceOccurrenceIds: [...window.counterEvidenceOccurrenceIds],
      evidence: {
        semanticIdentityIds: [...window.evidence.semanticIdentityIds],
        occurrenceIds: [...window.evidence.occurrenceIds],
        rootIdentityKeys: [...window.evidence.rootIdentityKeys],
        ruleIds: [...window.evidence.ruleIds]
      },
      limitations: [...window.limitations]
    })),
    observedOutcomeReportIds: [...value.observedOutcomeReportIds],
    diagnostics: [...value.diagnostics],
    guaranteedEventsAvailable: false,
    numericProbabilityAvailable: false,
    statement: value.statement
  };
}

function mapCareerPathwayAnalysis(source: CareerPathwayAnalysis): ProductCareerPathwayAnalysis {
  const mapMode = (mode: CareerPathwayAnalysis['employment']): ProductCareerPathwayAnalysis['employment'] => ({
    mode: mode.mode,
    status: mode.status,
    candidates: mode.candidates.map(candidate => ({
      candidateId: candidate.candidateId,
      qualification: candidate.qualification,
      sourceEventId: candidate.sourceEventId,
      opportunityId: candidate.opportunityId,
      activationId: candidate.activationId,
      timing: { ...candidate.timing },
      supportingEvidenceOccurrenceIds: [...candidate.supportingEvidenceOccurrenceIds],
      ruleIds: [...candidate.ruleIds],
      counterEvidenceOccurrenceIds: [...candidate.counterEvidenceOccurrenceIds],
      counterIndicationSeverity: candidate.counterIndicationSeverity
    })),
    candidateCount: mode.candidateCount,
    supportedCandidateCount: mode.supportedCandidateCount,
    conditionalCandidateCount: mode.conditionalCandidateCount,
    supportingEvidenceOccurrenceIds: [...mode.supportingEvidenceOccurrenceIds],
    ruleIds: [...mode.ruleIds],
    counterEvidenceOccurrenceIds: [...mode.counterEvidenceOccurrenceIds],
    practicalExecution: mode.practicalExecution,
    financialReadiness: mode.financialReadiness,
    personalPreference: mode.personalPreference
  });

  return {
    reasoningVersion: source.reasoningVersion,
    methodVersion: source.methodVersion,
    sourceReasoningVersion: source.sourceReasoningVersion,
    sourceMethodVersion: source.sourceMethodVersion,
    status: source.status,
    verdict: source.verdict,
    employment: mapMode(source.employment),
    independent: mapMode(source.independent),
    confidence: { ...source.confidence },
    guaranteedOutcomeAvailable: source.guaranteedOutcomeAvailable,
    numericProbabilityAvailable: source.numericProbabilityAvailable,
    suitabilityAvailable: source.suitabilityAvailable,
    diagnostics: [...source.diagnostics],
    statement: source.statement,
    limitations: [...source.limitations]
  };
}

function mapCareer(
  viewModel: LifeAnalysisViewModel,
  explicitEvidence?: readonly ProductEvidence[],
  canonicalCareerFoundation?: CanonicalCareerFoundation
): CareerProductAnalysis {
  const detail = viewModel.careerDetail;
  const summary = viewModel.domains.find((d) => d.domain === 'CAREER');

  const evidence =
    explicitEvidence && explicitEvidence.length > 0
      ? explicitEvidence
      : viewModel.careerWhy?.factors
        ? mapEvidenceItems(viewModel.careerWhy.factors, 'CAREER')
        : viewModel.careerWhy?.evidence
          ? mapEvidenceItems(viewModel.careerWhy.evidence, 'CAREER')
          : mapEvidenceItems(viewModel.evidence.filter((e) => e.domain === 'CAREER'), 'CAREER');

  const dashaPeriods = mapDashaPeriods(detail?.timing);
  const quarantinedPatternIds = new Set(
    canonicalCareerFoundation?.quarantineRecords.map(record => record.patternId) ?? []
  );
  const patternQualifications: readonly ProductCareerPatternQualification[] | undefined =
    canonicalCareerFoundation
      ? canonicalCareerFoundation.patternQualifications
          .filter(({ qualifiedPattern }) => !quarantinedPatternIds.has(qualifiedPattern.patternId))
          .map(({ qualifiedPattern }) => ({
            patternId: qualifiedPattern.patternId,
            classification: qualifiedPattern.classification,
            name: qualifiedPattern.name,
            status: qualifiedPattern.status,
            decisionBlockingReasons: qualifiedPattern.decisionBlockingReasons,
            deferredDimensions: qualifiedPattern.deferredDimensions,
            participants: qualifiedPattern.participants.map(participant => {
              const conditionSource = participant.conditionSource;
              return {
                planet: participant.planet,
                relevance: participant.relevance,
                condition: participant.condition,
                conditionAssessment: conditionSource?.assessment,
                combustion: conditionSource?.combustion,
                affliction: conditionSource?.affliction,
                dignity: conditionSource?.dignity,
                positiveFactorLabels: conditionSource?.positiveFactors.map(factor => factor.type) ?? [],
                negativeFactorLabels: conditionSource?.negativeFactors.map(factor => factor.type) ?? []
              };
            })
          }))
      : undefined;

  const rawStatus =
    detail?.canonicalFinalSynthesis?.finalStatus ??
    summary?.status ??
    detail?.finalSynthesis?.finalStatus ??
    detail?.finalSynthesis?.status ??
    detail?.status;
  const careerStatus: ConclusionStatus = mapConclusionStatus(
    rawStatus ? String(rawStatus) : undefined
  );

  return {
    status: careerStatus,
    analyticalAxes: detail?.analyticalAxes
      ? mapCareerAnalyticalAxes(detail.analyticalAxes)
      : undefined,
    outcomeQualification: detail?.careerOutcomeAnalysis
      ? mapCareerOutcomeAnalysis(detail.careerOutcomeAnalysis)
      : undefined,
    pathwayPotential: detail?.careerOutcomeAnalysis
      ? mapCareerPathwayAnalysis(analyzeCareerPathways({ outcomeAnalysis: detail.careerOutcomeAnalysis }))
      : undefined,
    eventTimeline: detail?.careerEventTimeline
      ? mapCareerEventTimeline(detail.careerEventTimeline)
      : undefined,
    ...(detail?.careerOrchestrationQuarantineRecords
      ? {
          quarantineRecords: detail.careerOrchestrationQuarantineRecords.map(record => ({
            patternId: record.patternId,
            stage: record.stage,
            reason: record.reason,
            rejectedRecordCount: record.rejectedRecordCount,
            differingFields: [...record.differingFields],
            relatedIds: [...record.relatedIds]
          }))
        }
      : {}),
    promise: {
      status: careerStatus,
      strength: detail?.canonicalFinalSynthesis?.natalStrength
        ? String(detail.canonicalFinalSynthesis.natalStrength)
        : detail?.status
        ? String(detail.status)
        : detail?.natalPromise
          ? String(detail.natalPromise)
          : 'UNAVAILABLE',
      confidence: detail?.canonicalFinalSynthesis
        ? detail.canonicalFinalSynthesis.confidence
          ? mapConfidence(detail.canonicalFinalSynthesis.confidence)
          : 'UNAVAILABLE'
        : mapConfidence(summary?.confidence),
      headline: detail?.promiseHeadline || detail?.headline || summary?.headline,
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion,
      dominantManifestations: detail?.dominantManifestations
        ? [...detail.dominantManifestations]
        : detail?.manifestations
          ? [...detail.manifestations]
          : []
    },
    expression: detail
      ? {
        analysisStatus: detail.canonicalExpressionAnalysis ? 'EXECUTED' as const : 'ABSENT' as const,
        primaryStyle: detail.capacityLevel ? String(detail.capacityLevel) : undefined,
        leadershipPotential: detail.actionableTakeaways?.[0],
        secondaryTraits: detail.actionableTakeaways?.slice(1),
        ...(detail.c8ExpressionCoverage ? { coverageSummary: detail.c8ExpressionCoverage } : {}),
        candidates: detail.canonicalExpressionAnalysis?.expressions.map(candidate => ({
          expressionId: candidate.expressionId,
          expressionType: candidate.expressionType,
          qualificationStatus: candidate.qualificationStatus
        }))
      }
      : undefined,
    profession: detail?.profession ? {
      available: detail.profession.status !== 'INSUFFICIENT_DATA',
      status: detail.profession.status,
      candidates: detail.profession.candidates.map(c => ({
        candidateId: c.candidateId,
        domain: c.domain,
        family: c.family,
        basis: c.basis,
        expressionTypes: c.expressionTypes,
        mechanismTypes: c.mechanismTypes,
        patternIds: c.patternIds,
        d10Status: c.d10Status,
        evidenceOccurrenceIds: [...(c.evidenceOccurrenceIds ?? [])],
        semanticIdentityKeys: [...(c.semanticIdentityKeys ?? [])],
        rootIdentityKeys: [...(c.rootIdentityKeys ?? [])],
        d10Qualification: c.d10Qualification ? {
          status: c.d10Qualification.status,
          direction: c.d10Qualification.direction,
          effects: [...c.d10Qualification.effects],
          evidenceOccurrenceIds: [...c.d10Qualification.evidenceOccurrenceIds],
          counterEvidenceOccurrenceIds: [...c.d10Qualification.counterEvidenceOccurrenceIds],
          rootIdentityKeys: [...c.d10Qualification.rootIdentityKeys]
        } : undefined,
        evidence: c.evidence.map(e => ({
          evidenceId: e.evidenceId,
          basis: e.basis,
          sourceIds: e.sourceIds,
          ruleId: e.ruleId,
          statement: e.statement,
          linkage: e.linkage,
          resolvedMechanismIds: e.resolvedMechanismIds,
          unresolvedMechanismIds: e.unresolvedMechanismIds
        })),
        domainEvidenceIds: c.domainEvidenceIds,
        relatedEvidenceIds: c.relatedEvidenceIds ?? [],
        ruleId: c.ruleId
      })),
      unresolvedExpressionTypes: detail.profession.unresolvedExpressionTypes,
      mappedTypes: detail.profession.mappedTypes,
      missingInputs: detail.profession.missingInputs,
      diagnostics: detail.profession.diagnostics ?? [],
      d10Status: deriveAggregateD10Status(detail.profession.candidates),
      stageCounts: detail.profession.stageCounts,
      ...(patternQualifications !== undefined ? { patternQualifications } : {}),
      ranking: mapCareerProfessionRanking(detail.profession.ranking)
    } : undefined,
    d10: {
      relationship: mapD10Relationship(detail?.d10Relationship ? String(detail.d10Relationship) : undefined),
      statement: detail?.d10Statement
    },
    activation: {
      dasha: {
        status: (dashaPeriods.length > 0 || detail?.timing?.status === 'AVAILABLE') ? 'AVAILABLE' : 'UNAVAILABLE',
        periods: dashaPeriods,
        currentActivation: detail?.timing?.status === 'AVAILABLE'
          ? detail.timing.currentActivation || detail.currentActivation
          : undefined,
        currentPressure: detail?.timing?.status === 'AVAILABLE'
          ? detail.timing.currentPressure || detail.currentPressure
          : undefined
      },
      transit: {
        status: (detail?.timing?.transitEffect || detail?.currentTransitEffect) ? 'AVAILABLE' : 'UNAVAILABLE',
        effect: detail?.timing?.transitEffect ? String(detail.timing.transitEffect) : (detail?.currentTransitEffect ? String(detail.currentTransitEffect) : 'UNAVAILABLE'),
        statement: detail?.timing?.transitStatement
      }
    },
    qualifications: mapQualifications(detail?.qualifications),
    evidence,
    synthesis: {
      headline: detail?.promiseHeadline || detail?.headline || summary?.headline,
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion,
      ...(detail?.canonicalFinalSynthesis?.statement
        ? { canonicalTraceStatement: detail.canonicalFinalSynthesis.statement }
        : {}),
      ...(detail?.canonicalFinalSynthesis ? {
        finalStatus: detail.canonicalFinalSynthesis.finalStatus,
        finalDirection: detail.canonicalFinalSynthesis.finalDirection,
        finalStrength: detail.canonicalFinalSynthesis.finalStrength,
        confidence: detail.canonicalFinalSynthesis.confidence,
        natalDirection: detail.canonicalFinalSynthesis.natalDirection,
        natalStrength: detail.canonicalFinalSynthesis.natalStrength,
        dashaDirection: detail.canonicalFinalSynthesis.dashaDirection,
        timingStatus: detail.canonicalFinalSynthesis.timingStatus
      } : {})
    }
  };
}

function mapWealth(
  viewModel: LifeAnalysisViewModel,
  explicitEvidence?: readonly ProductEvidence[],
  financialData?: WealthFinancialDataSet,
  lifecycle?: import('../../domain/wealth/wealthLifecycleTypes').WealthLifecycleAnalysis
): WealthProductAnalysis {
  const detail = viewModel.wealthDetail;
  const summary = viewModel.domains.find((d) => d.domain === 'WEALTH');
  const validatedFinancialData = financialData && validateWealthFinancialDataSet(financialData)
    ? financialData
    : undefined;
  const hasExplicitFinancialSource = (concept: 'TRADING_EXPOSURE' | 'TRADING_HISTORY'): boolean =>
    Boolean(validatedFinancialData?.data.some((datum) =>
      datum.concept === concept &&
      datum.availability === 'AVAILABLE' &&
      (datum.sourceClassification === 'USER_REPORTED_FINANCIAL_FACT' ||
        datum.sourceClassification === 'CONNECTED_FINANCIAL_SOURCE')
    ));


  const evidence =
    explicitEvidence && explicitEvidence.length > 0
      ? explicitEvidence
      : viewModel.wealthWhy?.factors
        ? mapEvidenceItems(viewModel.wealthWhy.factors, 'WEALTH')
        : viewModel.wealthWhy?.evidence
          ? mapEvidenceItems(viewModel.wealthWhy.evidence, 'WEALTH')
          : mapEvidenceItems(viewModel.evidence.filter((e) => e.domain === 'WEALTH'), 'WEALTH');

  const dashaPeriods = mapDashaPeriods(detail?.timing);

  const accumulationStatus = detail?.accumulation?.status ?? detail?.accumulationStatus;
  const accumulationStatement = detail?.accumulation?.statement;

  const gainsStatus = detail?.gains?.status ?? detail?.gainsStatus;
  const gainsStatement = detail?.gains?.statement;

  const fortuneStatus = detail?.fortune?.status ?? detail?.fortuneStatus;
  const fortuneStatement = detail?.fortune?.statement;

  const speculationStatus = detail?.speculation?.status ?? detail?.speculationStatus;
  const speculationStatement = detail?.speculation?.statement;

  return {
    ...(financialData ? { financialData } : {}),
    ...(lifecycle ? { lifecycle } : {}),
    overall: {
      status: detail?.status
        ? String(detail.status)
        : detail?.overallStatus
          ? String(detail.overallStatus)
          : detail?.natalPromise
            ? String(detail.natalPromise)
            : 'UNAVAILABLE',
      promise: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion || '',
      confidence: mapConfidence(summary?.confidence),
      headline: detail?.promiseHeadline || detail?.headline || summary?.headline,
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion
    },
    dimensions: {
      accumulation: {
        status: accumulationStatus ? String(accumulationStatus) : 'UNAVAILABLE',
        statement: accumulationStatement
      },
      gains: {
        status: gainsStatus ? String(gainsStatus) : 'UNAVAILABLE',
        statement: gainsStatement
      },
      fortune: {
        status: fortuneStatus ? String(fortuneStatus) : 'UNAVAILABLE',
        statement: fortuneStatement
      },
      speculation: {
        status: speculationStatus ? String(speculationStatus) : 'UNAVAILABLE',
        statement: speculationStatement
      }
    },
    d2: {
      relationship: 'UNAVAILABLE',
      statement: 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.'
    },
    activation: {
      dasha: {
        status:
          (dashaPeriods.length > 0 ||
            detail?.timing?.status === 'AVAILABLE' ||
            Boolean(detail?.timing?.currentActivation) ||
            Boolean(detail?.currentDashaEffect) ||
            Boolean(detail?.timing) ||
            Boolean(viewModel.careerDetail?.timing?.currentActivation))
            ? 'AVAILABLE'
            : 'UNAVAILABLE',
        periods: dashaPeriods,
        statement: detail?.timing?.currentActivation || (detail?.currentDashaEffect ? String(detail.currentDashaEffect) : undefined)
      },
      transit: {
        status: (detail?.timing?.transitEffect || detail?.currentTransitEffect) ? 'AVAILABLE' : 'UNAVAILABLE',
        effect: detail?.timing?.transitEffect ? String(detail.timing.transitEffect) : (detail?.currentTransitEffect ? String(detail.currentTransitEffect) : 'UNAVAILABLE'),
        statement: detail?.timing?.transitStatement
      }
    },
    speculativePropensity: {
      source: 'ASTROLOGICAL_INDICATION',
      status: speculationStatus ? mapSpeculativePropensity(String(speculationStatus)) : 'INSUFFICIENT_DATA',
      description: sanitizeSpeculativePropensityDescription(speculationStatement),
      evidenceIds: evidence
        .filter((item) =>
          item.source.toUpperCase().includes('SPECULATION') ||
          (item.ruleId ?? '').toUpperCase().includes('SPECULATION')
        )
        .map((item) => item.id),
      adviceAvailable: false
    },
    riskAndSuitability: {
      actualExposure: hasExplicitFinancialSource('TRADING_EXPOSURE') ? 'AVAILABLE' : 'UNAVAILABLE',
      tradingHistory: hasExplicitFinancialSource('TRADING_HISTORY') ? 'AVAILABLE' : 'UNAVAILABLE',
      suitability: 'UNAVAILABLE',
      suitabilityReason: 'Suitability requires a separately governed assessment and cannot be inferred from astrology or exposure facts.'
    },
    qualifications: mapQualifications(detail?.qualifications),
    evidence,
    synthesis: {
      headline: detail?.promiseHeadline || detail?.headline || summary?.headline,
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion,
      ...(detail?.finalSynthesis ? {
        overallStatus: detail.finalSynthesis.finalStatus,
        dimensionStatuses: detail.finalSynthesis.dimensions ? {
          ACCUMULATION: detail.finalSynthesis.dimensions.ACCUMULATION.finalStatus,
          GAINS: detail.finalSynthesis.dimensions.GAINS.finalStatus,
          FORTUNE: detail.finalSynthesis.dimensions.FORTUNE.finalStatus,
          SPECULATION: detail.finalSynthesis.dimensions.SPECULATION.finalStatus
        } : undefined,
        promiseStatus: detail.finalSynthesis.promiseStatus,
        confidence: detail.finalSynthesis.confidence,
        natalStrength: detail.finalSynthesis.primaryStrength,
        dashaDirection: detail.finalSynthesis.activationStatus,
        timingStatus: detail.finalSynthesis.timingStatus
      } : {})
    }
  };
}

function mapDashaState(
  horoscope: Horoscope,
  career: CareerProductAnalysis,
  wealth: WealthProductAnalysis,
  asOf: string,
  temporalState?: import('../../core/analysis/AnalysisTemporalState').AnalysisTemporalState
): ProductDashaState {
  // PBA-07: Source dasha.current from temporalState.dashaInterpretation.current (canonical MD/AD/PD identity)
  // Note: The DashaInterpretation types don't have effect/evidenceIds/statement on the period nodes
  // We preserve what's available and derive the rest from activation periods
  if (temporalState?.dashaInterpretation?.current) {
    const current = temporalState.dashaInterpretation.current;
    const summary = [
      current.mahadasha ? `Mahadasha: ${current.mahadasha.planet}` : undefined,
      current.antardasha ? `Antardasha: ${current.antardasha.planet}` : undefined,
      current.pratyantardasha ? `Pratyantardasha: ${current.pratyantardasha.planet}` : undefined
    ].filter(Boolean).join(' • ');

    // Get activation periods for effect/evidenceIds/statement
    const periods = career.activation.dasha.periods.length > 0
      ? career.activation.dasha.periods
      : wealth.activation.dasha.periods;

    const mdActivation = periods.find((p) => p.level === 'MD');
    const adActivation = periods.find((p) => p.level === 'AD');
    const pdActivation = periods.find((p) => p.level === 'PD');

    return {
      current: {
        mahadasha: current.mahadasha ? {
          level: 'MD',
          planet: current.mahadasha.planet,
          role: 'PRIMARY',
          direction: mdActivation ? mapDirection(mdActivation.effect) : 'UNAVAILABLE',
          effect: mdActivation?.effect || 'UNAVAILABLE',
          evidenceIds: mdActivation?.evidenceIds || [],
          statement: mdActivation?.statement,
          start: current.mahadasha.start,
          end: current.mahadasha.end
        } : undefined,
        antardasha: current.antardasha ? {
          level: 'AD',
          planet: current.antardasha.planet,
          role: 'MODIFIER',
          direction: adActivation ? mapDirection(adActivation.effect) : 'UNAVAILABLE',
          effect: adActivation?.effect || 'UNAVAILABLE',
          evidenceIds: adActivation?.evidenceIds || [],
          statement: adActivation?.statement,
          start: current.antardasha.start,
          end: current.antardasha.end
        } : undefined,
        pratyantardasha: current.pratyantardasha ? {
          level: 'PD',
          planet: current.pratyantardasha.planet,
          role: 'REFINEMENT',
          direction: pdActivation ? mapDirection(pdActivation.effect) : 'UNAVAILABLE',
          effect: pdActivation?.effect || 'UNAVAILABLE',
          evidenceIds: pdActivation?.evidenceIds || [],
          statement: pdActivation?.statement,
          start: current.pratyantardasha.start,
          end: current.pratyantardasha.end
        } : undefined
      },
      asOf,
      summary: summary || undefined
    };
  }

  // Fallback: Read from career/wealth activation periods
  const periods = career.activation.dasha.periods.length > 0
    ? career.activation.dasha.periods
    : wealth.activation.dasha.periods;

  const md = periods.find((p) => p.level === 'MD');
  const ad = periods.find((p) => p.level === 'AD');
  const pd = periods.find((p) => p.level === 'PD');

  const summary = [
    md ? `Mahadasha: ${md.planet ?? 'Active'} (${md.effect})` : undefined,
    ad ? `Antardasha: ${ad.planet ?? 'Active'} (${ad.effect})` : undefined,
    pd ? `Pratyantardasha: ${pd.planet ?? 'Active'} (${pd.effect})` : undefined
  ].filter(Boolean).join(' • ');

  return {
    current: {
      mahadasha: md,
      antardasha: ad,
      pratyantardasha: pd
    },
    asOf,
    summary: summary || undefined
  };
}

function mapReasoning(
  viewModel: LifeAnalysisViewModel,
  career: CareerProductAnalysis,
  wealth: WealthProductAnalysis,
  aiExplanation?: AiExplanationResult
): ReasoningProductAnalysis {
  const nodes = [
    {
      id: 'node_career_promise',
      label: 'Career Natal Promise',
      domain: 'CAREER',
      type: 'PROMISE' as const,
      direction: mapDirection(career.promise.status),
      statement: career.promise.statement || 'Career promise evaluated from 10th house, Lagna, and lord strength.'
    },
    {
      id: 'node_career_d10',
      label: 'Dasamsa (D10) Varga',
      domain: 'CAREER',
      type: 'VARGA' as const,
      direction: career.d10.relationship === 'CONFIRMS'
        ? 'SUPPORT' as const
        : career.d10.relationship === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : 'NEUTRAL' as const,
      statement: career.d10.statement || 'Dasamsa relationship evaluated against D1 vocational indicators.'
    },
    {
      id: 'node_wealth_overall',
      label: 'Wealth Overall Potential',
      domain: 'WEALTH',
      type: 'PROMISE' as const,
      direction: mapDirection(wealth.overall.status),
      statement: wealth.overall.statement || 'Wealth potential evaluated across 2nd and 11th houses.'
    },
    {
      id: 'node_overall_synthesis',
      label: 'Overall Life Domain Synthesis',
      domain: 'SYNTHESIS',
      type: 'SYNTHESIS' as const,
      direction: 'SUPPORT' as const,
      statement: viewModel.overall.statement || 'Deterministic multi-domain synthesis across all active life vectors.'
    }
  ];

  const primaryConclusions = [
    { domain: 'CAREER', conclusion: career.promise.statement || '' },
    { domain: 'WEALTH', conclusion: wealth.overall.statement || '' },
    { domain: 'SYNTHESIS', conclusion: viewModel.overall.statement || '' }
  ];

  return {
    nodes,
    primaryConclusions,
    unresolvedQuestions:
      aiExplanation && aiExplanation.kind === 'SUCCESS' && aiExplanation.unresolvedQuestions
        ? [...aiExplanation.unresolvedQuestions]
        : []
  };
}

function mapAiState(aiExplanation?: AiExplanationResult): AiProductState {
  if (!aiExplanation) {
    return {
      status: 'UNAVAILABLE'
    };
  }

  if (aiExplanation.kind === 'ERROR') {
    return {
      status: 'FAILED',
      error: aiExplanation.message
    };
  }

  const status: AiProductState['status'] =
    aiExplanation.status === 'SUCCESS' || aiExplanation.status === 'PARTIAL'
      ? 'AVAILABLE'
      : 'UNAVAILABLE';

  return {
    status,
    explanation: aiExplanation.conclusion,
    conclusion: aiExplanation.conclusion,
    providerInfo: {
      name: aiExplanation.providerName,
      mode: aiExplanation.routingMode
    },
    error: undefined
  };
}


export function buildAiVersionManifest(aiExplanation?: AiExplanationResult): readonly ProductAiExplanationVersionManifest[] {
  if (!aiExplanation || aiExplanation.kind !== 'SUCCESS') return Object.freeze([]);
  const component = (value: string | undefined, reason: string): ProductVersionComponent =>
    value && value.trim()
      ? Object.freeze({ status: 'RECORDED', version: value.trim(), source: 'AI_EXPLANATION_RESULT' })
      : Object.freeze({ status: 'NOT_RECORDED', reason, source: 'AI_EXPLANATION_RESULT' });
  return Object.freeze([Object.freeze({
    manifestVersion: 'D02-AI-v1' as const,
    providerId: component(aiExplanation.providerId, 'PROVIDER_ID_NOT_RETURNED'),
    providerVersion: component(aiExplanation.providerVersion, 'PROVIDER_VERSION_NOT_RETURNED'),
    model: component(aiExplanation.model, 'MODEL_NOT_RETURNED'),
    promptTemplate: component(aiExplanation.promptVersion, 'PROMPT_VERSION_NOT_RETURNED'),
    outputSchema: component(undefined, 'AI_OUTPUT_SCHEMA_VERSION_NOT_EXPOSED'),
    routingMode: component(aiExplanation.routingMode, 'ROUTING_MODE_NOT_RETURNED'),
    generatedAt: aiExplanation.generatedAt,
    task: aiExplanation.task
  })]);
}

function buildDeterministicVersionManifest(context: AnalysisContext): ProductDeterministicVersionManifest {
  const config = context.versionConfiguration;
  const make = (value: string | undefined, source: string, reason: string): ProductVersionComponent =>
    value && value.trim()
      ? Object.freeze({ status: 'RECORDED', version: value.trim(), source })
      : Object.freeze({ status: 'NOT_RECORDED', reason, source });
  const referenceDatasets = Object.freeze(Object.fromEntries(
    Object.entries(config?.referenceDatasets ?? {}).map(([key, version]) => [
      key,
      make(version, 'ANALYSIS_CONTEXT', 'REFERENCE_DATASET_VERSION_NOT_SUPPLIED')
    ])
  ));
  const replayReasons: string[] = [];
  const inputRetention = config?.inputRetention ?? 'UNKNOWN';
  const requiredCodeAvailable = config?.requiredCodeAvailable ?? null;
  const requiredDatasetsAvailable = config?.requiredDatasetsAvailable ?? null;
  const retainedInputSnapshotRef = config?.retainedInputSnapshotRef?.trim();
  const requiredInputsRetained = inputRetention === 'NOT_RETAINED' ? false
    : inputRetention === 'RETAINED_BY_CALLER' && retainedInputSnapshotRef ? true : null;
  if (requiredInputsRetained !== true) replayReasons.push(retainedInputSnapshotRef
    ? 'REQUIRED_INPUT_SNAPSHOT_NOT_CONFIRMED_RETAINED' : 'RETAINED_INPUT_SNAPSHOT_REFERENCE_MISSING');
  if (requiredCodeAvailable !== true) replayReasons.push('REQUIRED_CODE_NOT_CONFIRMED_AVAILABLE');
  if (requiredDatasetsAvailable !== true) replayReasons.push('REQUIRED_DATASETS_NOT_CONFIRMED_AVAILABLE');
  const completeRequiredVersions = [
    context.engineVersion, context.rulesVersion,
    ...Object.values(referenceDatasets).map(component => component.status === 'RECORDED' ? component.version : undefined),
    config?.careerLogic, config?.wealthLogic,
    config?.careerSynthesis, config?.wealthSynthesis,
    config?.outputSchema
  ].every(value => typeof value === 'string' && value.trim().length > 0);
  if (!completeRequiredVersions) replayReasons.push('VERSION_MANIFEST_INCOMPLETE');
  const replayable = replayReasons.length === 0;
  return Object.freeze({
    manifestVersion: 'D02-v1',
    calculationEngine: make(context.engineVersion, 'ANALYSIS_CONTEXT', 'ENGINE_VERSION_NOT_SUPPLIED'),
    referenceDatasets: Object.freeze(Object.keys(referenceDatasets).length > 0 ? referenceDatasets : {
      DEFAULT: make(undefined, 'ANALYSIS_CONTEXT', 'REFERENCE_DATASET_VERSIONS_NOT_SUPPLIED')
    }),
    ruleCatalogue: make(context.rulesVersion, 'ANALYSIS_CONTEXT', 'RULE_CATALOGUE_VERSION_NOT_SUPPLIED'),
    careerLogic: make(config?.careerLogic, 'ANALYSIS_CONTEXT', 'CAREER_LOGIC_VERSION_NOT_SUPPLIED'),
    wealthLogic: make(config?.wealthLogic, 'ANALYSIS_CONTEXT', 'WEALTH_LOGIC_VERSION_NOT_SUPPLIED'),
    careerSynthesis: make(config?.careerSynthesis, 'ANALYSIS_CONTEXT', 'C11_VERSION_NOT_SUPPLIED'),
    wealthSynthesis: make(config?.wealthSynthesis, 'ANALYSIS_CONTEXT', 'CW05_VERSION_NOT_SUPPLIED'),
    outputSchema: make(config?.outputSchema, 'ANALYSIS_CONTEXT', 'OUTPUT_SCHEMA_VERSION_NOT_SUPPLIED'),
    methodology: Object.freeze({
      zodiacSystem: context.methodology.zodiacSystem,
      houseSystem: context.methodology.houseSystem,
      ayanamsa: context.methodology.ayanamsa,
      vargaRules: context.methodology.vargaRules,
      dashaSystem: context.methodology.dashaSystem
    }),
    configuration: Object.freeze({ ...(config?.configuration ?? {}) }),
    inputRetention,
    ...(retainedInputSnapshotRef ? { retainedInputSnapshotRef } : {}),
    replay: Object.freeze({
      status: replayable ? 'REPLAYABLE_WITH_RETAINED_INPUTS' : 'NOT_REPLAYABLE',
      requiredInputsRetained,
      requiredCodeAvailable,
      requiredDatasetsAvailable,
      reasonCodes: Object.freeze(replayReasons)
    })
  });
}

function buildAnalysisVersionManifest(context: AnalysisContext, aiExplanation?: AiExplanationResult): ProductAnalysisVersionManifest {
  return Object.freeze({
    deterministic: buildDeterministicVersionManifest(context),
    aiExplanations: buildAiVersionManifest(aiExplanation)
  });
}

export function appendAiExplanationVersion(
  manifest: ProductAnalysisVersionManifest,
  aiExplanation?: AiExplanationResult
): ProductAnalysisVersionManifest {
  if (!aiExplanation || aiExplanation.kind !== 'SUCCESS') return manifest;
  return Object.freeze({
    ...manifest,
    aiExplanations: Object.freeze([
      ...manifest.aiExplanations,
      ...buildAiVersionManifest(aiExplanation)
    ])
  });
}

/**
 * Builds a fallback ProductAnalysis for pipeline or engine errors.
 */
export function buildFailedProductAnalysis(
  birthDetails: BirthDetails,
  error: unknown,
  context: AnalysisContext
): ProductAnalysis {
  const resolvedAsOf = context.asOf;
  const methodology = context.methodology;
  const engineVersion = context.engineVersion;
  const rulesVersion = context.rulesVersion;
  const message = getErrorMessage(error);
  const warning: ProductWarning = {
    code: 'ANALYSIS_FAILED',
    message,
    severity: 'ERROR',
    domain: 'SYSTEM'
  };

  const birth = mapBirth(birthDetails);

  return {
    analysisId: createAnalysisId(birthDetails, resolvedAsOf),
    asOf: resolvedAsOf,
    engineVersion,
    rulesVersion,
    status: 'ERROR',
    birth,
    methodology,
    versionManifest: buildAnalysisVersionManifest(context),
    chart: {
      ascendantSign: 'UNAVAILABLE',
      ascendantDegree: undefined,
      moonSign: 'UNAVAILABLE',
      sunSign: 'UNAVAILABLE',
      moonNakshatra: 'UNAVAILABLE',
      isAvailable: false
    },
    career: {
      status: 'UNAVAILABLE',
      promise: {
        status: 'UNAVAILABLE',
        strength: 'UNAVAILABLE',
        confidence: 'LOW',
        statement: message
      },
      d10: {
        relationship: 'UNAVAILABLE',
        statement: 'D10 analysis unavailable due to computation failure.'
      },
      activation: {
        dasha: {
          status: 'UNAVAILABLE',
          periods: []
        },
        transit: {
          status: 'UNAVAILABLE',
          effect: 'UNAVAILABLE'
        }
      },
      evidence: []
    },
    wealth: {
      overall: {
        status: 'UNAVAILABLE',
        promise: message,
        confidence: 'LOW',
        statement: message
      },
      dimensions: {
        accumulation: { status: 'UNAVAILABLE' },
        gains: { status: 'UNAVAILABLE' },
        fortune: { status: 'UNAVAILABLE' },
        speculation: { status: 'UNAVAILABLE' }
      },
      d2: {
        relationship: 'UNAVAILABLE',
        statement: 'D2 analysis unavailable due to computation failure.'
      },
      activation: {
        dasha: {
          status: 'UNAVAILABLE',
          periods: []
        },
        transit: {
          status: 'UNAVAILABLE',
          effect: 'UNAVAILABLE'
        }
      },
      evidence: []
    },
    dasha: {
      current: {}
    },
    reasoning: {
      nodes: [],
      primaryConclusions: []
    },
    ai: {
      status: 'FAILED',
      error: message
    },
    warnings: [warning]
  };
}

/**
 * Maps selected-period synthesis from domain layer to product DTO.
 *
 * Pure field-by-field projection:
 * - Preserves all ID/provenance fields verbatim
 * - Preserves all diagnostics
 * - Preserves missing inputs
 * - Deterministic array order
 * - No ID regeneration
 * - No dropping UNRESOLVED refs
 * - No flattening RULE refs into evidence
 */
export function mapSelectedPeriodSynthesis(
  value: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData>
): ProductSelectedPeriodSynthesis {
  // Map evidence references verbatim
  const evidence: readonly ProductSynthesisEvidenceReference[] = Object.freeze(
    value.evidence.map(ref => Object.freeze({
      classification: ref.classification,
      evidenceId: ref.evidenceId,
      identityKey: ref.identityKey,
      dimension: ref.dimension,
      polarity: ref.polarity,
      source: ref.source,
      ruleId: ref.ruleId,
      level: ref.level,
      stage: ref.stage,
      provenanceStage: ref.provenanceStage,
      referenceKind: ref.referenceKind
    }))
  );

  // Map missing inputs verbatim
  const missingInputs: readonly ProductSynthesisMissingInput[] = Object.freeze(
    value.missingInputs.map(input => Object.freeze({
      domain: input.domain,
      code: input.code,
      description: input.description
    }))
  );

  // Map provenance verbatim
  const provenance: ProductSynthesisProvenance = Object.freeze({
    career: Object.freeze({
      status: value.provenance.career.status,
      version: value.provenance.career.version,
      qualificationBasis: value.provenance.career.qualificationBasis
    }),
    wealth: Object.freeze({
      status: value.provenance.wealth.status,
      version: value.provenance.wealth.version
    })
  });

  // Map career section verbatim
  const career: ProductSynthesisCareerSection = Object.freeze({
    qualificationBasis: value.career.qualificationBasis,
    expressions: Object.freeze(
      value.career.expressions.map(expr => Object.freeze({
        expressionRefKey: expr.expressionRefKey,
        status: expr.status,
        linkedLevels: Object.freeze([...expr.linkedLevels]),
        qualificationBasis: expr.qualificationBasis,
        matchBasis: expr.matchBasis,
        diagnostics: Object.freeze(
          expr.diagnostics.map(d => Object.freeze({
            code: d.code,
            message: d.message
          }))
        ),
        expressionEvidenceIds: Object.freeze([...expr.expressionEvidenceIds]),
        qualifiedEvidenceIds: Object.freeze([...expr.qualifiedEvidenceIds]),
        unqualifiedEvidenceIds: Object.freeze([...expr.unqualifiedEvidenceIds]),
        mdDashaEvidenceIds: Object.freeze([...expr.mdDashaEvidenceIds]),
        adDashaEvidenceIds: Object.freeze([...expr.adDashaEvidenceIds]),
        expressionSource: expr.expressionSource
      }))
    ),
    diagnostics: Object.freeze(
      value.career.diagnostics.map(d => Object.freeze({
        code: d.code,
        message: d.message
      }))
    )
  });

  // Map wealth section verbatim
  const wealth: ProductSynthesisWealthSection = Object.freeze({
    dimensions: Object.freeze({
      ACCUMULATION: Object.freeze({
        dimension: value.wealth.dimensions.ACCUMULATION.dimension,
        effect: value.wealth.dimensions.ACCUMULATION.effect,
        dataStatus: value.wealth.dimensions.ACCUMULATION.dataStatus,
        linkedLevels: Object.freeze([...value.wealth.dimensions.ACCUMULATION.linkedLevels]),
        diagnostics: Object.freeze(
          value.wealth.dimensions.ACCUMULATION.diagnostics.map(d => Object.freeze({
            code: d.code,
            message: d.message
          }))
        ),
        promiseEvidenceIds: Object.freeze([...value.wealth.dimensions.ACCUMULATION.promiseEvidenceIds]),
        dashaRuleReferences: Object.freeze(
          value.wealth.dimensions.ACCUMULATION.dashaRuleReferences.map(ref => Object.freeze({
            ruleId: ref.ruleId,
            source: ref.source,
            level: ref.level
          }))
        ),
        linkageTrace: Object.freeze(value.wealth.dimensions.ACCUMULATION.linkageTrace.map(trace => Object.freeze({
          promiseEvidenceId: trace.promiseEvidenceId,
          dashaRuleReference: Object.freeze({
            ruleId: trace.dashaRuleReference.ruleId,
            source: trace.dashaRuleReference.source,
            level: trace.dashaRuleReference.level
          }),
          level: trace.level,
          matchedHouse: trace.matchedHouse
        }))),
        insufficientReason: value.wealth.dimensions.ACCUMULATION.insufficientReason
      }),
      GAINS: Object.freeze({
        dimension: value.wealth.dimensions.GAINS.dimension,
        effect: value.wealth.dimensions.GAINS.effect,
        dataStatus: value.wealth.dimensions.GAINS.dataStatus,
        linkedLevels: Object.freeze([...value.wealth.dimensions.GAINS.linkedLevels]),
        diagnostics: Object.freeze(
          value.wealth.dimensions.GAINS.diagnostics.map(d => Object.freeze({
            code: d.code,
            message: d.message
          }))
        ),
        promiseEvidenceIds: Object.freeze([...value.wealth.dimensions.GAINS.promiseEvidenceIds]),
        dashaRuleReferences: Object.freeze(
          value.wealth.dimensions.GAINS.dashaRuleReferences.map(ref => Object.freeze({
            ruleId: ref.ruleId,
            source: ref.source,
            level: ref.level
          }))
        ),
        linkageTrace: Object.freeze(value.wealth.dimensions.GAINS.linkageTrace.map(trace => Object.freeze({
          promiseEvidenceId: trace.promiseEvidenceId,
          dashaRuleReference: Object.freeze({
            ruleId: trace.dashaRuleReference.ruleId,
            source: trace.dashaRuleReference.source,
            level: trace.dashaRuleReference.level
          }),
          level: trace.level,
          matchedHouse: trace.matchedHouse
        }))),
        insufficientReason: value.wealth.dimensions.GAINS.insufficientReason
      }),
      FORTUNE: Object.freeze({
        dimension: value.wealth.dimensions.FORTUNE.dimension,
        effect: value.wealth.dimensions.FORTUNE.effect,
        dataStatus: value.wealth.dimensions.FORTUNE.dataStatus,
        linkedLevels: Object.freeze([...value.wealth.dimensions.FORTUNE.linkedLevels]),
        diagnostics: Object.freeze(
          value.wealth.dimensions.FORTUNE.diagnostics.map(d => Object.freeze({
            code: d.code,
            message: d.message
          }))
        ),
        promiseEvidenceIds: Object.freeze([...value.wealth.dimensions.FORTUNE.promiseEvidenceIds]),
        dashaRuleReferences: Object.freeze(
          value.wealth.dimensions.FORTUNE.dashaRuleReferences.map(ref => Object.freeze({
            ruleId: ref.ruleId,
            source: ref.source,
            level: ref.level
          }))
        ),
        linkageTrace: Object.freeze(value.wealth.dimensions.FORTUNE.linkageTrace.map(trace => Object.freeze({
          promiseEvidenceId: trace.promiseEvidenceId,
          dashaRuleReference: Object.freeze({
            ruleId: trace.dashaRuleReference.ruleId,
            source: trace.dashaRuleReference.source,
            level: trace.dashaRuleReference.level
          }),
          level: trace.level,
          matchedHouse: trace.matchedHouse
        }))),
        insufficientReason: value.wealth.dimensions.FORTUNE.insufficientReason
      }),
      SPECULATION: Object.freeze({
        dimension: value.wealth.dimensions.SPECULATION.dimension,
        effect: value.wealth.dimensions.SPECULATION.effect,
        dataStatus: value.wealth.dimensions.SPECULATION.dataStatus,
        linkedLevels: Object.freeze([...value.wealth.dimensions.SPECULATION.linkedLevels]),
        diagnostics: Object.freeze(
          value.wealth.dimensions.SPECULATION.diagnostics.map(d => Object.freeze({
            code: d.code,
            message: d.message
          }))
        ),
        promiseEvidenceIds: Object.freeze([...value.wealth.dimensions.SPECULATION.promiseEvidenceIds]),
        dashaRuleReferences: Object.freeze(
          value.wealth.dimensions.SPECULATION.dashaRuleReferences.map(ref => Object.freeze({
            ruleId: ref.ruleId,
            source: ref.source,
            level: ref.level
          }))
        ),
        linkageTrace: Object.freeze(value.wealth.dimensions.SPECULATION.linkageTrace.map(trace => Object.freeze({
          promiseEvidenceId: trace.promiseEvidenceId,
          dashaRuleReference: Object.freeze({
            ruleId: trace.dashaRuleReference.ruleId,
            source: trace.dashaRuleReference.source,
            level: trace.dashaRuleReference.level
          }),
          level: trace.level,
          matchedHouse: trace.matchedHouse
        }))),
        insufficientReason: value.wealth.dimensions.SPECULATION.insufficientReason
      })
    }),
    diagnostics: Object.freeze(
      value.wealth.diagnostics.map(d => Object.freeze({
        code: d.code,
        message: d.message
      }))
    )
  });

  // Compute qualification status from career.qualificationBasis and provenance.career.status
  // Product contract (compatibility contract per Finding 5):
  // - CANONICAL: career used canonical qualification mechanisms
  // - PROVISIONAL: career used proxy direction
  // - UNAVAILABLE: canonical qualification could not be determined OR career activation missing
  const qualificationStatus: import('./productAnalysisTypes').ProductQualificationStatus =
    value.provenance.career.status === 'MISSING'
      ? 'UNAVAILABLE'
      : value.career.qualificationBasis === 'CANONICAL_STATUS'
        ? 'CANONICAL'
        : value.career.qualificationBasis === 'UNAVAILABLE'
          ? 'UNAVAILABLE'
          : 'PROVISIONAL';

  return Object.freeze({
    synthesisVersion: value.synthesisVersion,
    period: Object.freeze({
      selectedPeriodId: value.period.selectedPeriodId,
      mahadashaId: value.period.mahadashaId,
      mahadashaPlanet: value.period.mahadashaPlanet,
      antardashaId: value.period.antardashaId,
      antardashaPlanet: value.period.antardashaPlanet,
      interval: Object.freeze({ ...value.period.interval }),
      analysisAsOf: value.period.analysisAsOf,
      temporalRelation: value.period.temporalRelation // Preserved verbatim from domain synthesis
    }),
    natalBaseline: value.natalBaseline,
    career,
    wealth,
    evidence,
    missingInputs,
    provenance,
    qualificationStatus,
    aiExplanationStatus: 'NOT_REQUESTED'
  });
}

/**
 * Main Projection Entry Point:
 * Maps computational engine results and view models into canonical ProductAnalysis.
 */
export function mapProductAnalysis(input: ProductAnalysisMapperInput): ProductAnalysis {
  const asOf = input.context.asOf;
  const analysisId = createAnalysisId(input.birthDetails, asOf);
  const domainWarnings = (input.domainInterpretations ?? []).flatMap(interpretation =>
    (interpretation.diagnostics ?? []).map(diagnostic => ({
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity,
      domain: interpretation.domain
    }))
  );
  const warnings = [...(input.warnings ?? []), ...domainWarnings];

  const birth = mapBirth(input.birthDetails);
  const methodology = input.context.methodology;
  const engineVersion = input.context.engineVersion;
  const rulesVersion = input.context.rulesVersion;
  const chart = mapChartSummary(input.horoscope);

  const careerInterpretation = input.domainInterpretations?.find(
    interpretation => interpretation.domain === 'CAREER'
  );
  const careerFoundation = getCareerConclusionData(careerInterpretation)?.canonicalCareerFoundation;
  const career = mapCareer(input.lifeAnalysisViewModel, input.careerEvidence, careerFoundation);
  const wealth = mapWealth(input.lifeAnalysisViewModel, input.wealthEvidence, input.wealthFinancialData, input.wealthLifecycle);

  const dasha = mapDashaState(input.horoscope, career, wealth, asOf, input.temporalState);
  const reasoning = mapReasoning(input.lifeAnalysisViewModel, career, wealth, input.aiExplanation);
  const ai = mapAiState(input.aiExplanation);

  // Project dasha period options from temporalState.dashaInterpretation
  let dashPeriodOptions: ProductDashaPeriodOptions | undefined;
  try {
    if (input.temporalState?.dashaInterpretation) {
      dashPeriodOptions = mapDashaPeriodOptions(
        listSelectableMdAdPeriods(input.temporalState.dashaInterpretation),
        asOf
      );
    }
  } catch {
    // If projection fails, leave dashPeriodOptions undefined rather than failing the entire analysis
    dashPeriodOptions = undefined;
  }

  const status = deriveProductAnalysisStatus(career, wealth, warnings);

  return {
    analysisId,
    asOf,
    engineVersion,
    rulesVersion,
    status,
    birth,
    methodology,
    versionManifest: buildAnalysisVersionManifest(input.context, input.aiExplanation),
    chart,
    career,
    wealth,
    dasha,
    reasoning,
    ai,
    warnings,
    dashPeriodOptions,
    confidenceMetadata: input.confidenceMetadata
  };
}
