import type {
  DomainEvidence,
  DomainManifestation,
  DomainConflict,
  VargaConfirmation,
  ConfidenceLevel,
  ManifestationMode
} from '../interpretation';
import { createDomainManifestation } from '../interpretation/ManifestationMode';

import {
  classifyReasoningEvidence,
  summarizeLayers
} from '../reasoning/reasoningHierarchy';
import {
  resolveNatalPromise,
  resolveStrength
} from '../reasoning/reasoningConclusion';
import {
  resolveDashaHierarchy,
  type DashaTimingEvidence
} from '../reasoning/dashaHierarchy';
import {
  resolveReasoningConflicts
} from '../reasoning/reasoningConflictResolver';
import { buildReasoningTrace } from '../reasoning/reasoningTrace';
import type {
  DomainStrength,
  HierarchicalDomainResult,
  ReasoningDirection,
  ReasoningTrace,
  TimingHierarchyResult
} from '../reasoning/reasoningTypes';

import { CAREER_MANIFESTATION_RULES } from './careerReasoningRules';
import { calculateManifestationConfidence } from './careerManifestations';

export interface CareerReasoningResult extends HierarchicalDomainResult {
  readonly reasoningTrace: ReasoningTrace;
  readonly manifestations: readonly DomainManifestation[];
  readonly conflicts: readonly DomainConflict[];
  readonly timingHierarchy: TimingHierarchyResult;
  readonly currentActivation: 'STRONG' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA';
  readonly currentPressure: 'STRONG' | 'MODERATE' | 'LOW' | 'NONE';
}

export function deriveCareerReasoningManifestations(
  evidence: readonly DomainEvidence[]
): readonly DomainManifestation[] {
  const manifestations: DomainManifestation[] = [];

  for (const [modeKey, rules] of Object.entries(CAREER_MANIFESTATION_RULES)) {
    const ruleSet = new Set(rules);
    const supporting = evidence.filter((item) => {
      if (item.polarity !== 'SUPPORTING') return false;
      if (item.ruleId) {
        const baseRule = item.ruleId.split(':')[0];
        if (ruleSet.has(item.ruleId) || ruleSet.has(baseRule)) return true;
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
    const mode = modeKey as ManifestationMode;

    let statement = '';
    if (supporting.length > 0) {
      switch (modeKey) {
        case 'LEADERSHIP':
          statement = 'Strong capacity for executive leadership, institutional standing, and organizational command.';
          break;
        case 'MANAGEMENT':
          statement = 'Robust foundation for administrative oversight, operational stability, and team governance.';
          break;
        case 'TECHNICAL_SPECIALIZATION':
          statement = 'Pronounced aptitude for specialized analytical, engineering, or technical problem solving.';
          break;
        case 'SERVICE_EMPLOYMENT':
        case 'EMPLOYMENT':
          statement = 'Consistent capacity for professional service, organizational employment, and structured execution.';
          break;
        case 'AUTHORITY':
          statement = 'Auspicious markers for authoritative presence, public governance, and decision-making power.';
          break;
        case 'INDEPENDENT_WORK':
          statement = 'Clear inclinations and independent drive toward self-directed professional initiatives.';
          break;
        case 'BUSINESS_ENTREPRENEURSHIP':
        case 'ENTREPRENEURSHIP':
          statement = 'Supportive commercial acumen, business enterprise potential, and trade network leverage.';
          break;
        default:
          statement = `Promising alignment with ${modeKey.toLowerCase().replace(/_/g, ' ')} professional pathways.`;
      }
    } else {
      statement = `Limited or insufficient structural evidence for ${modeKey.toLowerCase().replace(/_/g, ' ')} in available natal factors.`;
    }

    manifestations.push(
      createDomainManifestation({
        mode,
        confidence,
        status: supporting.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_DATA',
        statement,
        evidenceIds: supporting.map((e) => e.id)
      })
    );
  }

  return Object.freeze(manifestations);
}

export function evaluateCareerReasoningHierarchy(params: {
  readonly evidence: readonly DomainEvidence[];
  readonly d10Confirmation?: VargaConfirmation;
  readonly dashaTimings?: {
    readonly md?: DashaTimingEvidence;
    readonly ad?: DashaTimingEvidence;
    readonly pd?: DashaTimingEvidence;
  };
  readonly transitEvidence?: readonly DomainEvidence[];
  readonly rawConflicts?: readonly DomainConflict[];
}): CareerReasoningResult {
  const {
    evidence,
    d10Confirmation,
    dashaTimings,
    transitEvidence = [],
    rawConflicts = []
  } = params;

  // 1. Classify evidence into reasoning layers and build trace
  const weightedEvidence = classifyReasoningEvidence(evidence);
  const reasoningTrace = buildReasoningTrace(weightedEvidence);
  const layerSummaries = summarizeLayers(weightedEvidence);

  // 2. Resolve Natal Promise
  const natalPromiseResult = resolveNatalPromise(weightedEvidence);

  // 3. Resolve D10 Varga Direction
  let vargaDirection: ReasoningDirection = 'UNAVAILABLE';
  if (d10Confirmation) {
    if (d10Confirmation.relationship === 'CONFIRMS') {
      vargaDirection = 'SUPPORT';
    } else if (d10Confirmation.relationship === 'CONFLICTS') {
      vargaDirection = 'CHALLENGE';
    } else if (d10Confirmation.relationship === 'MODIFIES') {
      vargaDirection = 'NEUTRAL';
    } else {
      vargaDirection = 'UNAVAILABLE';
    }
  }

  // 4. Resolve Dasha Timing Hierarchy
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

  // 5. Resolve Transit Trigger Direction
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

  // 6. Conflict Resolution & Final Synthesis
  const conflictRes = resolveReasoningConflicts({
    natalPromise: natalPromiseResult,
    vargaDirection,
    dashaEffect: timingHierarchy.finalEffect,
    transitDirection
  });

  // Calculate final strength:
  // D10 qualifies/confirms, never replaces D1.
  let finalStrength: DomainStrength = natalPromiseResult.strength;
  if (vargaDirection === 'CHALLENGE' && (finalStrength === 'VERY_STRONG' || finalStrength === 'STRONG')) {
    // Downgrade one notch due to divisional friction while preserving supportive direction
    finalStrength = finalStrength === 'VERY_STRONG' ? 'STRONG' : 'MODERATE';
  }

  // Derive current activation and pressure
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

  let currentPressure: 'STRONG' | 'MODERATE' | 'LOW' | 'NONE' = 'NONE';
  if (transitDirection === 'CHALLENGE') {
    currentPressure = 'MODERATE';
  } else if (timingHierarchy.finalEffect === 'CHALLENGES') {
    currentPressure = 'STRONG';
  }

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
  const manifestations = deriveCareerReasoningManifestations(evidence);

  const finalStatement =
    conflictRes.rationale ||
    'Career reasoning hierarchy evaluated across natal promise, varga confirmation, dasha timing, and transit triggers.';

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
    currentActivation,
    currentPressure
  });
}
