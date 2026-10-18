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
import { Planet } from '../../types';
import type {
  LifeAnalysisViewModel,
  CareerTimingProduct,
  WealthTimingProduct,
  LifeAnalysisQualification
} from '../life-analysis/lifeAnalysisTypes';
import type { AiExplanationResult } from '../../ai';
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
  SpeculativeRiskProduct,
  ProductQualification,
  ProductConfidence,
  ConclusionStatus,
  ProductSelectedPeriodSynthesis,
  ProductSynthesisEvidenceReference,
  ProductSynthesisMissingInput,
  ProductSynthesisProvenance,
  ProductSynthesisDiagnostic,
  ProductSynthesisCareerSection,
  ProductSynthesisCareerExpressionRow,
  ProductSynthesisWealthSection,
  ProductSynthesisWealthDimensionRow
} from './productAnalysisTypes';
import type { CareerProfessionAnalysis } from '../../domain/career/careerProfession/careerProfessionTypes';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
import type {
  SelectedPeriodSynthesisValue
} from '../../domain/synthesis/selectedPeriodSynthesis';

export interface ProductAnalysisMapperInput {
  readonly birthDetails: BirthDetails;
  readonly horoscope: Horoscope;
  readonly lifeAnalysisViewModel: LifeAnalysisViewModel;
  readonly context: AnalysisContext;
  readonly aiExplanation?: AiExplanationResult;
  readonly warnings?: readonly ProductWarning[];
  readonly careerEvidence?: readonly ProductEvidence[];
  readonly wealthEvidence?: readonly ProductEvidence[];
  readonly temporalState?: import('../../core/analysis/AnalysisTemporalState').AnalysisTemporalState;
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
 * Maps direction from effect/role strings.
 */
export function mapDirection(val?: string): ProductDirection {
  if (!val) return 'NEUTRAL';
  const u = val.toUpperCase();
  if (u.includes('SUPPORT') || u.includes('BENEFIC') || u.includes('FAVORABLE') || u.includes('STRONG') || u.includes('HIGH') || u.includes('ACTIVATE')) {
    return 'SUPPORT';
  }
  if (u.includes('CHALLENGE') || u.includes('MALEFIC') || u.includes('OBSTACLE') || u.includes('DIFFICULT') || u.includes('WEAK')) {
    return 'CHALLENGE';
  }
  if (u.includes('MIXED') || u.includes('CONFLICT') || u.includes('MODERATE')) {
    return 'MIXED';
  }
  return 'NEUTRAL';
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
export function mapD2Relationship(val?: string): D2ProductResult['relationship'] {
  if (!val) return 'UNAVAILABLE';
  const u = val.toUpperCase();
  if (u.includes('PARTIAL')) return 'PARTIALLY_CONFIRMS';
  if (u.includes('CONFIRM')) return 'CONFIRMS';
  if (u.includes('MODIFY') || u.includes('MODIFIES')) return 'MODIFIES';
  if (u.includes('CONFLICT')) return 'CONFLICTS';
  return 'UNAVAILABLE';
}

/**
 * Maps speculative risk level.
 */
export function mapSpeculativeRisk(val?: string): SpeculativeRiskProduct['level'] {
  if (!val) return 'UNAVAILABLE';
  const u = val.toUpperCase();
  if (u.includes('EXTREME')) return 'EXTREME';
  if (u.includes('HIGH')) return 'HIGH';
  if (u.includes('MODERATE') || u.includes('AVERAGE')) return 'MODERATE';
  if (u.includes('LOW')) return 'LOW';
  return 'UNAVAILABLE';
}

/**
 * Maps confidence string to ProductConfidence.
 */
export function mapConfidence(val?: string): ProductConfidence {
  if (!val) return 'MEDIUM';
  const u = val.toUpperCase();
  if (u.includes('HIGH')) return 'HIGH';
  if (u.includes('LOW')) return 'LOW';
  return 'MEDIUM';
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
      end: 'end' in md ? md.end : undefined
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
      end: 'end' in ad ? ad.end : undefined
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
      end: 'end' in pd ? pd.end : undefined
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
        ruleId: item.ruleId ? String(item.ruleId) : undefined,
        derivedFromIds: Array.isArray(item.derivedFromIds) ? [...item.derivedFromIds] : undefined
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
      (role === 'CHALLENGING'
        ? 'CHALLENGE'
        : role === 'CONFLICTING'
          ? 'MIXED'
          : 'SUPPORT');

    return {
      id: String(id),
      title: item.title || item.source ? `${item.source || fallbackDomain} Evidence` : String(id),
      statement: String(item.statement || item.description || ''),
      direction,
      role,
      source: String(item.source || fallbackDomain),
      ruleId: item.ruleId ? String(item.ruleId) : undefined,
      derivedFromIds: Array.isArray(item.derivedFromIds) ? [...item.derivedFromIds] : undefined
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

function mapCareer(
  viewModel: LifeAnalysisViewModel,
  explicitEvidence?: readonly ProductEvidence[]
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

  const rawStatus =
    summary?.status ??
    detail?.finalSynthesis?.finalStatus ??
    detail?.finalSynthesis?.status ??
    detail?.status;
  const careerStatus: ConclusionStatus = mapConclusionStatus(
    rawStatus ? String(rawStatus) : undefined
  );

  return {
    status: careerStatus,
    promise: {
      status: careerStatus,
      strength: detail?.status
        ? String(detail.status)
        : detail?.natalPromise
          ? String(detail.natalPromise)
          : 'UNAVAILABLE',
      confidence: mapConfidence(summary?.confidence),
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
        primaryStyle: detail.capacityLevel ? String(detail.capacityLevel) : undefined,
        leadershipPotential: detail.actionableTakeaways?.[0],
        secondaryTraits: detail.actionableTakeaways?.slice(1)
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
        relatedEvidenceIds: c.relatedEvidenceIds,
        ruleId: c.ruleId
      })),
      unresolvedExpressionTypes: detail.profession.unresolvedExpressionTypes,
      mappedTypes: detail.profession.mappedTypes,
      missingInputs: detail.profession.missingInputs,
      d10Status: deriveAggregateD10Status(detail.profession.candidates)
    } : undefined,
    d10: {
      relationship: mapD10Relationship(detail?.d10Relationship ? String(detail.d10Relationship) : undefined),
      statement: detail?.d10Statement
    },
    activation: {
      dasha: {
        status: (dashaPeriods.length > 0 || detail?.timing?.status === 'AVAILABLE' || Boolean(detail?.timing?.currentActivation)) ? 'AVAILABLE' : 'UNAVAILABLE',
        periods: dashaPeriods,
        currentActivation: detail?.timing?.currentActivation || detail?.currentActivation,
        currentPressure: detail?.timing?.currentPressure || detail?.currentPressure
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
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion
    }
  };
}

function mapWealth(
  viewModel: LifeAnalysisViewModel,
  explicitEvidence?: readonly ProductEvidence[]
): WealthProductAnalysis {
  const detail = viewModel.wealthDetail;
  const summary = viewModel.domains.find((d) => d.domain === 'WEALTH');

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
      relationship: mapD2Relationship(detail?.d2Relationship ? String(detail.d2Relationship) : undefined),
      statement: detail?.d2Statement
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
    speculativeRisk: speculationStatus
      ? {
        level: mapSpeculativeRisk(String(speculationStatus)),
        description: speculationStatement
      }
      : undefined,
    qualifications: mapQualifications(detail?.qualifications),
    evidence,
    synthesis: {
      headline: detail?.promiseHeadline || detail?.headline || summary?.headline,
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion
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
          direction: mdActivation ? mapDirection(mdActivation.effect) : 'NEUTRAL',
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
          direction: adActivation ? mapDirection(adActivation.effect) : 'NEUTRAL',
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
          direction: pdActivation ? mapDirection(pdActivation.effect) : 'NEUTRAL',
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
      direction: mapDirection(career.promise.strength),
      statement: career.promise.statement || 'Career promise evaluated from 10th house, Lagna, and lord strength.'
    },
    {
      id: 'node_career_d10',
      label: 'Dasamsa (D10) Varga',
      domain: 'CAREER',
      type: 'VARGA' as const,
      direction: career.d10.relationship === 'CONFIRMS' ? 'SUPPORT' as const : 'NEUTRAL' as const,
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
        )
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
        )
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
        )
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
        )
      })
    }),
    diagnostics: Object.freeze(
      value.wealth.diagnostics.map(d => Object.freeze({
        code: d.code,
        message: d.message
      }))
    )
  });

  return Object.freeze({
    synthesisVersion: value.synthesisVersion,
    period: Object.freeze({
      selectedPeriodId: value.period.selectedPeriodId,
      mahadashaId: value.period.mahadashaId,
      mahadashaPlanet: value.period.mahadashaPlanet,
      antardashaId: value.period.antardashaId,
      antardashaPlanet: value.period.antardashaPlanet,
      interval: Object.freeze({
        start: value.period.interval.start,
        end: value.period.interval.end
      }),
      analysisAsOf: value.period.analysisAsOf,
      temporalRelation: value.period.temporalRelation
    }),
    career,
    wealth,
    evidence,
    missingInputs,
    provenance
  });
}

/**
 * Main Projection Entry Point:
 * Maps computational engine results and view models into canonical ProductAnalysis.
 */
export function mapProductAnalysis(input: ProductAnalysisMapperInput): ProductAnalysis {
  const asOf = input.context.asOf;
  const analysisId = createAnalysisId(input.birthDetails, asOf);
  const warnings = input.warnings || [];

  const birth = mapBirth(input.birthDetails);
  const methodology = input.context.methodology;
  const engineVersion = input.context.engineVersion;
  const rulesVersion = input.context.rulesVersion;
  const chart = mapChartSummary(input.horoscope);

  const career = mapCareer(input.lifeAnalysisViewModel, input.careerEvidence);
  const wealth = mapWealth(input.lifeAnalysisViewModel, input.wealthEvidence);

  const dasha = mapDashaState(input.horoscope, career, wealth, asOf, input.temporalState);
  const reasoning = mapReasoning(input.lifeAnalysisViewModel, career, wealth, input.aiExplanation);
  const ai = mapAiState(input.aiExplanation);

  const status = deriveProductAnalysisStatus(career, wealth, warnings);

  return {
    analysisId,
    asOf,
    engineVersion,
    rulesVersion,
    status,
    birth,
    methodology,
    chart,
    career,
    wealth,
    dasha,
    reasoning,
    ai,
    warnings
  };
}
