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

/**
 * Local conflict interface for Career natal analysis.
 * Reuses CareerStructuralConflict shape as a reference for field naming.
 */
export interface CareerNatalConflict {
  readonly identityKey: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
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
export interface CareerNatalAnalysis extends CareerNatalAnalysisInput {}

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
    relevance: input.relevance,
    condition: input.condition,
    lordRelationships: input.lordRelationships,
    direction: input.direction,
    strength: input.strength,
    evidence: [...input.evidence],
    conflicts: [...input.conflicts],
    reasoningTrace: input.reasoningTrace
  });
}

/**
 * Empty constant for Career natal analysis.
 * Uses NEUTRAL direction to represent "no data" without negative inference.
 * Empty arrays indicate missing evidence, not negative evidence.
 */
export const EMPTY_CAREER_NATAL_ANALYSIS: CareerNatalAnalysis = Object.freeze({
  structural: {
    direction: 'NEUTRAL',
    strength: 'UNDETERMINED',
    primarySupport: 0,
    primaryChallenge: 0,
    supportingSupport: 0,
    supportingChallenge: 0,
    challengingSupport: 0,
    challengingChallenge: 0,
    mixedWeight: 0,
    evidence: [],
    primaryEvidenceIds: [],
    supportingEvidenceIds: [],
    challengingEvidenceIds: [],
    conflicts: [],
    statement: 'No structural reasoning data available.'
  },
  relevance: [],
  condition: [],
  lordRelationships: [],
  direction: 'NEUTRAL',
  strength: 'UNDETERMINED',
  evidence: [],
  conflicts: [],
  reasoningTrace: {
    primaryPromise: [],
    secondarySupport: [],
    modifiers: [],
    yogas: [],
    varga: [],
    dasha: [],
    transit: []
  }
});
