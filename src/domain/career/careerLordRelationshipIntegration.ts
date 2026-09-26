import type { CareerStructuralReasoning } from './careerStructuralReasoning';

import {
  interpretCareerLordRelationships,
  type CareerLordRelationshipSemantic
} from './careerLordRelationshipSemantics';

export interface CareerLordRelationshipIntegrationInput {
  readonly structural: CareerStructuralReasoning;
}

/**
 * Builds the canonical C7 lord relationship semantics layer for Career.
 *
 * This function extracts the canonical CareerHouseRelationship[] from the
 * C4 structural reasoning evidence and delegates to the existing
 * interpretCareerLordRelationships semantic engine.
 *
 * C7 does NOT read the Horoscope directly and does NOT re-detect relationships.
 * C7 only interprets what C4 already produced.
 *
 * @param input - The input containing the C4 structural reasoning
 * @returns The frozen array of CareerLordRelationshipSemantic results
 */
export function buildCareerLordRelationships(
  input: CareerLordRelationshipIntegrationInput
): readonly CareerLordRelationshipSemantic[] {
  const { structural } = input;

  // Extract canonical relationships from C4 evidence
  const relationships = structural.evidence.map(
    (evidence) => evidence.relationship
  );

  // Delegate to existing semantic engine
  const semantics = interpretCareerLordRelationships(relationships);

  // Freeze the returned array
  return Object.freeze(semantics);
}
