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
import { Planet } from '../../types';
import type { LifeAnalysisViewModel } from '../life-analysis/lifeAnalysisTypes';
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
  ProductConfidence
} from './productAnalysisTypes';

export interface ProductAnalysisMapperInput {
  readonly birthDetails: BirthDetails;
  readonly horoscope: Horoscope;
  readonly lifeAnalysisViewModel: LifeAnalysisViewModel;
  readonly aiExplanation?: AiExplanationResult;
  readonly asOf?: string;
  readonly warnings?: readonly ProductWarning[];
  readonly careerEvidence?: readonly ProductEvidence[];
  readonly wealthEvidence?: readonly ProductEvidence[];
}

/**
 * Deterministically constructs an analysis ID from birth details and timestamp.
 * Guaranteed to produce distinct IDs for different births.
 */
export function createAnalysisId(birth: BirthDetails, asOf: string): string {
  const cleanDate = (birth.dateTimeStr || '').replace(/[^0-9]/g, '');
  const lat = Math.round(Number(birth.latitude || 0) * 1000);
  const lon = Math.round(Number(birth.longitude || 0) * 1000);
  const ayanamsa = String(birth.ayanamsa || 'LAHIRI').toLowerCase();
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
  if (u.includes('SUPPORT') || u.includes('BENEFIC') || u.includes('FAVORABLE') || u.includes('STRONG') || u.includes('HIGH')) {
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

function mapMethodology(birth: BirthDetails): ProductMethodology {
  return {
    zodiacSystem: 'SIDEREAL',
    houseSystem: 'WHOLE_SIGN',
    ayanamsa: String(birth.ayanamsa),
    calculationEngine: 'ASTRO_CORE_V1',
    rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
    vargaRules: 'PARASHARA_D10_D2'
  };
}

function mapChartSummary(horoscope: Horoscope): ProductChartSummary {
  const ascSign =
    horoscope.rasiChart?.ascendantSign ??
    horoscope.ascendant?.sign ??
    'ARIES';

  const rawAscLong =
    horoscope.rasiChart?.ascendantLongitude ??
    horoscope.ascendant?.longitude ??
    0;
  const ascendantDegree = rawAscLong % 30;

  const sunSign =
    horoscope.planetFacts?.[Planet.SUN]?.sign ??
    horoscope.planetFacts?.[Planet.SUN]?.position?.sign ??
    'ARIES';

  const moonSign =
    horoscope.planetFacts?.[Planet.MOON]?.sign ??
    horoscope.planetFacts?.[Planet.MOON]?.position?.sign ??
    'ARIES';

  const moonNakshatra =
    horoscope.planetFacts?.[Planet.MOON]?.nakshatraResult?.nakshatra ??
    horoscope.planetFacts?.[Planet.MOON]?.nakshatraMetadata?.name ??
    (horoscope.planetFacts?.[Planet.MOON]?.nakshatraMetadata as any)?.nakshatraName ??
    'Ashwini';

  return {
    ascendantSign: String(ascSign),
    ascendantDegree,
    moonSign: String(moonSign),
    sunSign: String(sunSign),
    moonNakshatra: String(moonNakshatra)
  };
}

function mapDashaPeriods(
  timing?: {
    mahadasha?: any;
    antardasha?: any;
    pratyantardasha?: any;
    currentActivation?: string;
  }
): readonly ProductDashaPeriod[] {
  const periods: ProductDashaPeriod[] = [];

  if (timing?.mahadasha) {
    const md = timing.mahadasha;
    periods.push({
      level: 'MD',
      planet: md.planet ? String(md.planet) : undefined,
      role: 'PRIMARY',
      direction: mapDirection(md.effect),
      effect: md.effect || 'NEUTRAL',
      evidenceIds: Array.isArray(md.evidenceIds) ? [...md.evidenceIds] : [],
      statement: md.statement,
      start: md.start,
      end: md.end
    });
  }

  if (timing?.antardasha) {
    const ad = timing.antardasha;
    periods.push({
      level: 'AD',
      planet: ad.planet ? String(ad.planet) : undefined,
      role: 'MODIFIER',
      direction: mapDirection(ad.effect),
      effect: ad.effect || 'NEUTRAL',
      evidenceIds: Array.isArray(ad.evidenceIds) ? [...ad.evidenceIds] : [],
      statement: ad.statement,
      start: ad.start,
      end: ad.end
    });
  }

  if (timing?.pratyantardasha) {
    const pd = timing.pratyantardasha;
    periods.push({
      level: 'PD',
      planet: pd.planet ? String(pd.planet) : undefined,
      role: 'REFINEMENT',
      direction: mapDirection(pd.effect),
      effect: pd.effect || 'NEUTRAL',
      evidenceIds: Array.isArray(pd.evidenceIds) ? [...pd.evidenceIds] : [],
      statement: pd.statement,
      start: pd.start,
      end: pd.end
    });
  }

  return periods;
}

function mapQualifications(raw?: readonly any[]): readonly ProductQualification[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((q) => ({
    type: String(q.type || 'GENERAL'),
    severity: (q.severity?.toUpperCase() === 'HIGH' || q.severity?.toUpperCase() === 'LOW') ? q.severity.toUpperCase() : 'MEDIUM',
    description: String(q.description || q.statement || '')
  }));
}

function mapEvidenceItems(
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

  const dashaPeriods = mapDashaPeriods(detail?.timing as any);

  return {
    promise: {
      strength: detail?.status
        ? String(detail.status)
        : detail?.natalPromise
        ? String(detail.natalPromise)
        : 'AVERAGE',
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
        effect: detail?.timing?.transitEffect ? String(detail.timing.transitEffect) : (detail?.currentTransitEffect ? String(detail.currentTransitEffect) : 'NEUTRAL'),
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

  const dashaPeriods = mapDashaPeriods(detail?.timing as any);

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
        : 'AVERAGE',
      promise: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion || '',
      confidence: mapConfidence(summary?.confidence),
      headline: detail?.promiseHeadline || detail?.headline || summary?.headline,
      statement: detail?.promiseStatement || detail?.statement || summary?.statement || summary?.conclusion
    },
    dimensions: {
      accumulation: {
        status: accumulationStatus ? String(accumulationStatus) : 'AVERAGE',
        statement: accumulationStatement
      },
      gains: {
        status: gainsStatus ? String(gainsStatus) : 'AVERAGE',
        statement: gainsStatement
      },
      fortune: {
        status: fortuneStatus ? String(fortuneStatus) : 'AVERAGE',
        statement: fortuneStatement
      },
      speculation: {
        status: speculationStatus ? String(speculationStatus) : 'AVERAGE',
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
        effect: detail?.timing?.transitEffect ? String(detail.timing.transitEffect) : (detail?.currentTransitEffect ? String(detail.currentTransitEffect) : 'NEUTRAL'),
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
  asOf: string
): ProductDashaState {
  // Read from career/wealth activation periods or horoscope
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

  const status =
    aiExplanation.status === 'SUCCESS'
      ? 'AVAILABLE'
      : aiExplanation.status === 'PARTIAL'
      ? 'PARTIAL'
      : 'UNAVAILABLE';

  return {
    status: status as any,
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
  asOf: string = new Date().toISOString()
): ProductAnalysis {
  const message = getErrorMessage(error);
  const warning: ProductWarning = {
    code: 'ANALYSIS_FAILED',
    message,
    severity: 'ERROR',
    domain: 'SYSTEM'
  };

  const birth = mapBirth(birthDetails);
  const methodology = mapMethodology(birthDetails);

  return {
    analysisId: createAnalysisId(birthDetails, asOf),
    asOf,
    status: 'ERROR',
    birth,
    methodology,
    chart: {
      ascendantSign: 'ARIES',
      ascendantDegree: 0,
      moonSign: 'ARIES',
      sunSign: 'ARIES'
    },
    career: {
      promise: {
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
 * Main Projection Entry Point:
 * Maps computational engine results and view models into canonical ProductAnalysis.
 */
export function mapProductAnalysis(input: ProductAnalysisMapperInput): ProductAnalysis {
  const asOf = input.asOf || new Date().toISOString();
  const analysisId = createAnalysisId(input.birthDetails, asOf);
  const warnings = input.warnings || [];

  const birth = mapBirth(input.birthDetails);
  const methodology = mapMethodology(input.birthDetails);
  const chart = mapChartSummary(input.horoscope);

  const career = mapCareer(input.lifeAnalysisViewModel, input.careerEvidence);
  const wealth = mapWealth(input.lifeAnalysisViewModel, input.wealthEvidence);

  const dasha = mapDashaState(input.horoscope, career, wealth, asOf);
  const reasoning = mapReasoning(input.lifeAnalysisViewModel, career, wealth, input.aiExplanation);
  const ai = mapAiState(input.aiExplanation);

  const status = deriveProductAnalysisStatus(career, wealth, warnings);

  return {
    analysisId,
    asOf,
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
