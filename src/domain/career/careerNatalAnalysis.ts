import type {
  CareerStructuralReasoning
} from './careerStructuralReasoning';

import type {
  CareerPlanetaryRelevance
} from './careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from './careerPlanetaryCondition';

import type {
  CareerLordRelationshipSemantic
} from './careerLordRelationshipSemantics';

import type {
  ReasoningDirection,
  DomainStrength,
  WeightedReasoningEvidence,
  ReasoningTrace
} from '../reasoning/reasoningTypes';

import { buildReasoningTrace } from '../reasoning/reasoningTrace';

/**
 * Local conflict interface for Career natal analysis.
 * Reuses CareerStructuralConflict shape as a reference for field naming.
 */
export interface CareerNatalConflict {
  readonly identityKey: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly supportWeight: number;
  readonly challengeWeight: number;
  readonly ratio: number;
  readonly statement: string;
}

/**
 * Input interface for Career natal analysis aggregate.
 * Contains all C4-C7 natal boundary components.
 */
export interface CareerNatalAnalysisInput {
  readonly structural: CareerStructuralReasoning;
  readonly relevance: readonly CareerPlanetaryRelevance[];
  readonly condition: readonly CareerPlanetaryConditionResult[];
  readonly lordRelationships: readonly CareerLordRelationshipSemantic[];
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;
  readonly evidence: readonly WeightedReasoningEvidence[];
  readonly conflicts: readonly CareerNatalConflict[];
  readonly reasoningTrace: ReasoningTrace;
}

/**
 * Canonical natal-boundary aggregate type for Career domain.
 * Aggregates C4-C7 natal promise components into an immutable boundary.
 * 
 * This is a D1/C4-C7 natal boundary ONLY — it does NOT contain:
 * - C8 expression/manifestation
 * - C9 Dasha activation
 * - C10 D10 qualification
 * - Timing/transit layers
 * - C11 final synthesis
 */
export interface CareerNatalAnalysis extends CareerNatalAnalysisInput { }

/**
 * Factory function to create an immutable CareerNatalAnalysis aggregate.
 * 
 * This function:
 * - Returns an Object.freeze'd object to prevent mutation
 * - Copies array fields to prevent downstream mutation
 * - Does NOT recalculate any C4-C7 semantics (pure aggregation)
 * 
 * @param input - The input containing all C4-C7 natal components
 * @returns An immutable CareerNatalAnalysis aggregate
 */
export function createCareerNatalAnalysis(
  input: CareerNatalAnalysisInput
): CareerNatalAnalysis {
  return Object.freeze({
    structural: input.structural,
    relevance: Object.freeze([...input.relevance]),
    condition: Object.freeze([...input.condition]),
    lordRelationships: Object.freeze([...input.lordRelationships]),
    direction: input.direction,
    strength: input.strength,
    evidence: Object.freeze([...input.evidence]),
    conflicts: Object.freeze([...input.conflicts]),
    reasoningTrace: Object.freeze({
      primaryPromise: Object.freeze([...input.reasoningTrace.primaryPromise]),
      secondarySupport: Object.freeze([...input.reasoningTrace.secondarySupport]),
      modifiers: Object.freeze([...input.reasoningTrace.modifiers]),
      yogas: Object.freeze([...input.reasoningTrace.yogas]),
      varga: Object.freeze([...input.reasoningTrace.varga]),
      dasha: Object.freeze([...input.reasoningTrace.dasha]),
      transit: Object.freeze([...input.reasoningTrace.transit])
    })
    // structural is passed by reference - C4 already returns a frozen aggregate
  });
}

/**
 * Empty constant for Career natal analysis.
 * Uses NEUTRAL direction to represent "no data" without negative inference.
 * Empty arrays indicate missing evidence, not negative evidence.
 */
const EMPTY_STRUCTURAL_REASONING: CareerStructuralReasoning = Object.freeze({
  direction: 'NEUTRAL',
  strength: 'UNDETERMINED',
  primarySupport: 0,
  primaryChallenge: 0,
  supportingSupport: 0,
  supportingChallenge: 0,
  challengingSupport: 0,
  challengingChallenge: 0,
  mixedWeight: 0,
  evidence: Object.freeze([]),
  primaryEvidenceIds: Object.freeze([]),
  supportingEvidenceIds: Object.freeze([]),
  challengingEvidenceIds: Object.freeze([]),
  conflicts: Object.freeze([]),
  statement: 'No structural reasoning data available.'
});

export const EMPTY_CAREER_NATAL_ANALYSIS: CareerNatalAnalysis = Object.freeze({
  structural: EMPTY_STRUCTURAL_REASONING,
  relevance: Object.freeze([]),
  condition: Object.freeze([]),
  lordRelationships: Object.freeze([]),
  direction: 'NEUTRAL',
  strength: 'UNDETERMINED',
  evidence: Object.freeze([]),
  conflicts: Object.freeze([]),
  reasoningTrace: buildReasoningTrace([])
});
