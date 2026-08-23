import type {
  DomainEvidence,
  DomainManifestation,
  DomainConflict,
  ManifestationMode
} from '../interpretation';
import {
  createDomainManifestation,
  resolveManifestationStatus
} from '../interpretation/ManifestationMode';

import {
  classifyReasoningEvidence,
  summarizeLayers
} from '../reasoning/reasoningHierarchy';
import {
  resolveNatalPromise
} from '../reasoning/reasoningConclusion';
import {
  resolveDashaHierarchy,
  type DashaTimingEvidence
} from '../reasoning/dashaHierarchy';
import {
  resolveReasoningConflicts,
  resolveFinalDomainStrength,
  resolveGradedCurrentPressure
} from '../reasoning/reasoningConflictResolver';
import { buildReasoningTrace } from '../reasoning/reasoningTrace';
import type {
  DomainStrength,
  HierarchicalDomainResult,
  ReasoningDirection,
  ReasoningTrace,
  TimingHierarchyResult
} from '../reasoning/reasoningTypes';

import { WEALTH_DIMENSION_RULES } from './wealthReasoningRules';
import { calculateManifestationConfidence } from './wealthManifestations';
import type { WealthManifestationMode } from './wealthTypes';

export interface WealthDimensionReasoningResult {
  readonly dimension: WealthManifestationMode;
  readonly natalDirection: ReasoningDirection;
  readonly natalStrength: DomainStrength;
  readonly timingEffect: string;
  readonly evidenceIds: readonly string[];
}

export interface WealthReasoningResult extends HierarchicalDomainResult {
  readonly reasoningTrace: ReasoningTrace;
  readonly manifestations: readonly DomainManifestation[];
  readonly conflicts: readonly DomainConflict[];
  readonly timingHierarchy: TimingHierarchyResult;
  readonly dimensionResults: Readonly<Record<WealthManifestationMode, WealthDimensionReasoningResult>>;
  readonly currentActivation: 'STRONG' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA';
  readonly currentPressure: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'STRONG';
}

export function evaluateWealthDimension(
  dimension: WealthManifestationMode,
  allEvidence: readonly DomainEvidence[],
  dashaTimings?: {
    readonly md?: DashaTimingEvidence;
    readonly ad?: DashaTimingEvidence;
    readonly pd?: DashaTimingEvidence;
  }
): WealthDimensionReasoningResult {
  const rules = new Set(WEALTH_DIMENSION_RULES[dimension] || []);

  const dimEvidence = allEvidence.filter((item) => {
    if (item.dimension === dimension) return true;
    if (item.ruleId) {
      const baseRule = item.ruleId.split(':')[0];
      if (rules.has(item.ruleId) || rules.has(baseRule)) return true;
    }
    return false;
  });

  const weighted = classifyReasoningEvidence(dimEvidence);
  const natalPromise = resolveNatalPromise(weighted);

  const mdTiming: DashaTimingEvidence = dashaTimings?.md ?? {
    level: 'MD',
    effect: 'INSUFFICIENT_DATA',
    evidenceIds: [],
    confidence: 0
  };
  const adTiming: DashaTimingEvidence = dashaTimings?.ad ?? {
    level: 'AD',
    effect: 'INSUFFICIENT_DATA',
    evidenceIds: [],
    confidence: 0
  };
  const pdTiming: DashaTimingEvidence = dashaTimings?.pd ?? {
    level: 'PD',
    effect: 'INSUFFICIENT_DATA',
    evidenceIds: [],
    confidence: 0
  };

  const timing = resolveDashaHierarchy(mdTiming, adTiming, pdTiming);

  return Object.freeze({
    dimension,
    natalDirection: natalPromise.direction,
    natalStrength: natalPromise.strength,
    timingEffect: timing.finalEffect,
    evidenceIds: Object.freeze(dimEvidence.map((e) => e.id))
  });
}

export function deriveWealthReasoningManifestations(
  evidence: readonly DomainEvidence[]
): readonly DomainManifestation[] {
  const manifestations: DomainManifestation[] = [];
  const modes: readonly WealthManifestationMode[] = [
    'ACCUMULATION',
    'GAINS',
    'FORTUNE',
    'SPECULATION'
  ];

  for (const mode of modes) {
    const rules = new Set(WEALTH_DIMENSION_RULES[mode] || []);
    const supporting = evidence.filter((item) => {
      if (item.polarity !== 'SUPPORTING') return false;
      if (item.dimension === mode) return true;
      if (item.ruleId) {
        const baseRule = item.ruleId.split(':')[0];
        if (rules.has(item.ruleId) || rules.has(baseRule)) return true;
      }
      return false;
    });

    const rawConfidence = calculateManifestationConfidence(supporting);
    const confidence = (
      rawConfidence === 'VERY_HIGH' ||
      rawConfidence === 'HIGH' ||
      rawConfidence === 'MODERATE' ||
      rawConfidence === 'LOW' ||
      rawConfidence === 'VERY_LOW'
    ) ? rawConfidence : 'LOW';

    let statement = '';
    switch (mode) {
      case 'ACCUMULATION':
        statement = supporting.length > 0
          ? 'Strong capacity for capital accumulation, liquid savings preservation, and tangible asset building.'
          : 'Limited or insufficient data for liquid savings and capital accumulation in the available evidence.';
        break;
      case 'GAINS':
        statement = supporting.length > 0
          ? 'Active channels for recurring income, business revenues, and social network monetization.'
          : 'Limited or insufficient data for recurring gains and network monetization in the available evidence.';
        break;
      case 'FORTUNE':
        statement = supporting.length > 0
          ? 'Auspicious indications for long-term prosperity, luck, and hereditary or unearned fortune.'
          : 'Standard financial fortune trajectory without pronounced indicators in the available evidence.';
        break;
      case 'SPECULATION':
        statement = supporting.length > 0
          ? 'The chart contains supportive indicators for speculative activity, though these should be interpreted separately from overall wealth potential.'
          : 'Speculative indicators are comparatively weaker than accumulation and gains.';
        break;
    }

    manifestations.push(
      createDomainManifestation({
        mode: mode as ManifestationMode,
        confidence,
        status: resolveManifestationStatus(supporting),
        statement,
        evidenceIds: supporting.map((e) => e.id)
      })
    );
  }

  return Object.freeze(manifestations);
}

export function evaluateWealthReasoningHierarchy(params: {
  readonly evidence: readonly DomainEvidence[];
  readonly dashaTimings?: {
    readonly md?: DashaTimingEvidence;
    readonly ad?: DashaTimingEvidence;
    readonly pd?: DashaTimingEvidence;
  };
  readonly transitEvidence?: readonly DomainEvidence[];
  readonly rawConflicts?: readonly DomainConflict[];
}): WealthReasoningResult {
  const {
    evidence,
    dashaTimings,
    transitEvidence = [],
    rawConflicts = []
  } = params;

  // 1. Classify evidence into reasoning layers and build trace
  const weightedEvidence = classifyReasoningEvidence(evidence);
  const reasoningTrace = buildReasoningTrace(weightedEvidence);
  const layerSummaries = summarizeLayers(weightedEvidence);

  // 2. Evaluate 4 dimensions independently
  const accumulationResult = evaluateWealthDimension('ACCUMULATION', evidence, dashaTimings);
  const gainsResult = evaluateWealthDimension('GAINS', evidence, dashaTimings);
  const fortuneResult = evaluateWealthDimension('FORTUNE', evidence, dashaTimings);
  const speculationResult = evaluateWealthDimension('SPECULATION', evidence, dashaTimings);

  const dimensionResults: Readonly<Record<WealthManifestationMode, WealthDimensionReasoningResult>> = Object.freeze({
    ACCUMULATION: accumulationResult,
    GAINS: gainsResult,
    FORTUNE: fortuneResult,
    SPECULATION: speculationResult
  });

  // 3. Resolve Natal Promise (Overall)
  // Excludes speculation from weakening core accumulation/gains
  const natalPromiseResult = resolveNatalPromise(weightedEvidence);

  // 4. D2 Varga Confirmation is explicitly UNAVAILABLE (per CW-01 §22)
  const vargaDirection: ReasoningDirection = 'UNAVAILABLE';

  // 5. Resolve Dasha Timing Hierarchy
  // TODO(CW-01 Follow-up Issue #2): Implement true per-planet Dasha domain synthesis across karaka and lordships.
  const mdTiming: DashaTimingEvidence = dashaTimings?.md ?? {
    level: 'MD',
    effect: 'INSUFFICIENT_DATA',
    evidenceIds: [],
    confidence: 0
  };
  const adTiming: DashaTimingEvidence = dashaTimings?.ad ?? {
    level: 'AD',
    effect: 'INSUFFICIENT_DATA',
    evidenceIds: [],
    confidence: 0
  };
  const pdTiming: DashaTimingEvidence = dashaTimings?.pd ?? {
    level: 'PD',
    effect: 'INSUFFICIENT_DATA',
    evidenceIds: [],
    confidence: 0
  };

  const timingHierarchy = resolveDashaHierarchy(mdTiming, adTiming, pdTiming);

  // 6. Resolve Transit Trigger Direction
  // TODO(CW-01 Follow-up Issue #6): Implement rich transit target/strength/role modeling beyond binary polarity checks.
  let transitDirection: ReasoningDirection = 'NEUTRAL';
  if (transitEvidence.length > 0) {
    const hasTransitChallenge = transitEvidence.some((e) => e.polarity === 'CHALLENGING');
    const hasTransitSupport = transitEvidence.some((e) => e.polarity === 'SUPPORTING');
    if (hasTransitChallenge && hasTransitSupport) {
      transitDirection = 'MIXED';
    } else if (hasTransitChallenge) {
      transitDirection = 'CHALLENGE';
    } else if (hasTransitSupport) {
      transitDirection = 'SUPPORT';
    }
  }

  // 7. Conflict Resolution & Final Synthesis
  const conflictRes = resolveReasoningConflicts({
    natalPromise: natalPromiseResult,
    vargaDirection,
    dashaEffect: timingHierarchy.finalEffect,
    transitDirection
  });

  // Calculate final strength using centralized resolver (consumes full hierarchy)
  const finalStrength: DomainStrength = resolveFinalDomainStrength({
    natalStrength: natalPromiseResult.strength,
    natalDirection: natalPromiseResult.direction,
    vargaDirection,
    dashaEffect: timingHierarchy.finalEffect,
    transitDirection,
    conflicts: conflictRes.conflicts
  });

  // Derive current activation
  let currentActivation: 'STRONG' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
  if (timingHierarchy.finalEffect === 'ACTIVATES') {
    currentActivation = 'STRONG';
  } else if (timingHierarchy.finalEffect === 'PARTIALLY_ACTIVATES') {
    currentActivation = 'MODERATE';
  } else if (
    timingHierarchy.finalEffect === 'CHALLENGES' ||
    timingHierarchy.finalEffect === 'DOES_NOT_ACTIVATE'
  ) {
    currentActivation = 'LOW';
  }

  // Derive graded current pressure
  const currentPressure = resolveGradedCurrentPressure({
    transitEvidence,
    transitDirection,
    timingHierarchy,
    dashaEffect: timingHierarchy.finalEffect,
    conflicts: conflictRes.conflicts
  });

  // Collect evidence IDs
  const primaryEvidenceIds = weightedEvidence
    .filter((e) => e.layer === 'PRIMARY_PROMISE')
    .map((e) => e.evidenceId);

  const supportingEvidenceIds = weightedEvidence
    .filter((e) => e.direction === 'SUPPORT')
    .map((e) => e.evidenceId);

  const challengingEvidenceIds = weightedEvidence
    .filter((e) => e.direction === 'CHALLENGE')
    .map((e) => e.evidenceId);

  const unresolvedEvidenceIds = weightedEvidence
    .filter((e) => e.direction === 'NEUTRAL' || e.direction === 'UNAVAILABLE')
    .map((e) => e.evidenceId);

  // Derive manifestations
  const manifestations = deriveWealthReasoningManifestations(evidence);

  const finalStatement =
    conflictRes.rationale ||
    'Wealth reasoning hierarchy evaluated independently across accumulation, gains, fortune, and speculation dimensions.';

  return Object.freeze({
    natalDirection: natalPromiseResult.direction,
    natalStrength: natalPromiseResult.strength,
    layerSummaries,
    dasha: timingHierarchy,
    vargaDirection,
    transitDirection,
    finalStrength,
    finalStatement,
    primaryEvidenceIds: Object.freeze(primaryEvidenceIds),
    supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
    challengingEvidenceIds: Object.freeze(challengingEvidenceIds),
    unresolvedEvidenceIds: Object.freeze(unresolvedEvidenceIds),
    reasoningTrace,
    manifestations,
    conflicts: rawConflicts,
    timingHierarchy,
    dimensionResults,
    currentActivation,
    currentPressure
  });
}
