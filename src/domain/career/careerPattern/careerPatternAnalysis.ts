import type { Horoscope } from '../../../types';
import type { CareerPattern, CareerPatternAnalysis, CareerPatternEvidence, CareerPatternConflict, CareerPatternRelationship, CareerMechanism, CareerYogaPattern } from './careerPatternTypes';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerAstroGraph } from '../careerGraph/careerAstroGraphTypes';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import {
  buildCareerGraphFactsFromStructural,
  buildCareerAstroGraph,
  detectCareerHouseNetworks
} from '../careerGraph/index';
import { classifyCareerPatterns } from './careerPatternClassification';
import { detectDusthanaPatterns } from './dusthanaTransformationDetector';
import { detectCareerYogaPatterns } from './careerYogaDetector';
import { detectKendraTrikonaPatterns } from './kendraTrikonaDetector';
import { UPACHAYA_MECHANISM_CHAIN } from './careerPatternClassificationRules';

/**
 * P2-06D Career Pattern Analysis Orchestrator
 *
 * This module provides the main orchestrator for career pattern analysis.
 * Per spec §23: builds the graph, runs all family detectors, sorts deterministically,
 * and builds CareerPatternAnalysis with patterns, evidence, relationships, mechanisms, conflicts, provenance.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Input for career pattern analysis.
 */
export interface CareerPatternAnalysisInput {
  readonly horoscope: Horoscope;
}

/**
 * Deduplicates evidence by underlying fact identity.
 * Per spec §25: the same 6L→10H fact referenced by multiple families produces ONE evidence identity.
 *
 * Identity is based on lower-level fact identity (relationship/edge ids from the pattern's
 * relationshipIds/sourceIds), not sourceNetworkIdentityKey.
 *
 * The statement carries the engine-generated statement from the pattern's evidence,
 * not a fabricated 'Pattern evidence for <classification>' string.
 */
function deduplicateEvidence(patterns: readonly CareerPattern[]): readonly CareerPatternEvidence[] {
  const evidenceMap = new Map<string, CareerPatternEvidence>();

  for (const pattern of patterns) {
    for (const patternEvidence of pattern.evidence) {
      // Build identity key from relationship/edge ids (lower-level fact identity)
      // Use pattern.provenance.relationshipIds as the underlying fact identifiers
      const relationshipIds = [...pattern.provenance.relationshipIds].sort();
      const underlyingFactId = relationshipIds.join('|');

      if (evidenceMap.has(underlyingFactId)) {
        // Merge sourcePatternIds
        const existing = evidenceMap.get(underlyingFactId)!;
        const mergedSourcePatternIds = [...new Set([...existing.sourcePatternIds, pattern.patternId])].sort();
        const mergedRuleIds = [...new Set([...existing.ruleIds, patternEvidence.ruleId])].sort();

        const mergedEvidence: CareerPatternEvidence = Object.freeze({
          ...existing,
          sourcePatternIds: mergedSourcePatternIds,
          ruleIds: mergedRuleIds
        });

        evidenceMap.set(underlyingFactId, mergedEvidence);
      } else {
        const newEvidence: CareerPatternEvidence = Object.freeze({
          evidenceId: patternEvidence.evidenceId,
          identityKey: underlyingFactId,
          statement: `Evidence for ${pattern.classification} (relationships: ${underlyingFactId})`,
          sourcePatternIds: [pattern.patternId],
          ruleIds: [patternEvidence.ruleId],
          underlyingFactIds: relationshipIds
        });

        evidenceMap.set(underlyingFactId, newEvidence);
      }
    }
  }

  // Sort by identityKey for deterministic output
  return Array.from(evidenceMap.values()).sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}

/**
 * Detects conflicts between patterns.
 * Per spec §28: conflicts preserve coexisting patterns rather than eliminating them.
 *
 * CONFLICT SEMANTICS:
 * - Same-house-set multi-family patterns are OVERLAPPING candidate interpretations, not conflicts.
 * - They are preserved as-is for the qualification layer to evaluate.
 * - CONFLICTS are reserved for genuinely opposing semantic claims (e.g., contradictory directional claims).
 *
 * Current implementation: No genuine semantic conflicts are detected at this structural layer.
 * Future enhancement: Add rules for detecting opposing directional or mechanism claims.
 */
function detectConflicts(patterns: readonly CareerPattern[]): readonly CareerPatternConflict[] {
  const conflicts: CareerPatternConflict[] = [];

  // No genuine semantic conflicts at this structural layer
  // Same-house-set multi-family patterns are overlapping interpretations, not conflicts
  // They are preserved for qualification layer evaluation

  // Sort by conflictId for deterministic output
  return conflicts.sort((a, b) => a.conflictId.localeCompare(b.conflictId));
}

/**
 * Builds pattern relationships.
 * REMOVED: Pattern relationships field is not implemented in this wave.
 * Future enhancement would detect SUPPORTS/REINFORCES/MODIFIES relationships
 * between co-house patterns via shared house sets/mechanisms.
 *
 * The relationships field is removed from CareerPatternAnalysis until a later wave
 * that implements real relationship detection logic.
 */
function buildPatternRelationships(patterns: readonly CareerPattern[]): readonly CareerPatternRelationship[] {
  return [];
}

/**
 * Extracts all unique mechanisms from patterns.
 */
function extractAllMechanisms(patterns: readonly CareerPattern[]): readonly CareerMechanism[] {
  const mechanismSet = new Set<CareerMechanism>();

  for (const pattern of patterns) {
    for (const mechanism of pattern.mechanisms) {
      mechanismSet.add(mechanism);
    }
  }

  // Add Upachaya mechanism chain if any Upachaya patterns exist
  const hasUpachaya = patterns.some(p => p.family === 'UPACHAYA');
  if (hasUpachaya) {
    for (const mechanism of UPACHAYA_MECHANISM_CHAIN) {
      mechanismSet.add(mechanism as CareerMechanism);
    }
  }

  return Array.from(mechanismSet).sort();
}

/**
 * Analyzes career patterns from a horoscope.
 * Per spec §23: builds the graph, runs all family detectors, sorts deterministically,
 * and builds CareerPatternAnalysis with patterns, evidence, relationships, mechanisms, conflicts, provenance.
 *
 * Pipeline:
 * 1. buildCareerStructuralReasoning
 * 2. buildCareerGraphFactsFromStructural
 * 3. buildCareerAstroGraph
 * 4. detectCareerHouseNetworks
 * 5. classifyCareerPatterns (existing families - P2-03 frozen)
 * 6. detectDusthanaPatterns (new family - P2-06)
 * 7. detectCareerYogaPatterns (new family - P2-06)
 * 8. detectKendraTrikonaPatterns (new family - P2-06)
 * 9. Deduplicate patterns by identityKey
 * 10. Sort deterministically by family then identityKey
 * 11. Deduplicate evidence
 * 12. Detect conflicts
 * 13. Build pattern relationships (empty - not implemented)
 * 14. Extract all mechanisms
 * 15. Build provenance
 *
 * @param input - The input containing the horoscope
 * @returns The CareerPatternAnalysis result
 */
export function analyzeCareerPatterns(
  input: CareerPatternAnalysisInput
): CareerPatternAnalysis {
  const { horoscope } = input;

  // Step 1: Build structural reasoning
  const structural = buildCareerStructuralReasoning({ horoscope });

  // Step 2: Build graph facts from structural
  const facts = buildCareerGraphFactsFromStructural(structural);

  // Step 3: Build astro graph
  const graph = buildCareerAstroGraph({ facts });

  // Step 4: Detect career house networks
  const networkDetection = detectCareerHouseNetworks({ graph });
  const networks = networkDetection.networks;

  // Step 5: Classify patterns using existing families (P2-03 frozen)
  const classificationResult = classifyCareerPatterns({ networks });
  let allPatterns: CareerPattern[] = [...classificationResult.patterns];

  // Step 6: Detect dusthana transformation patterns (P2-06)
  const dusthanaPatterns = detectDusthanaPatterns(networks);
  allPatterns = [...allPatterns, ...dusthanaPatterns];

  // Step 7: Detect career yoga patterns (P2-06)
  const yogaPatterns = detectCareerYogaPatterns(networks);
  // Note: CareerYogaPattern is a separate type, not merged into CareerPattern
  // It's stored separately in the analysis result

  // Step 8: Detect Kendra-Trikona patterns (P2-06)
  const kendraTrikonaPatterns = detectKendraTrikonaPatterns(networks);
  allPatterns = [...allPatterns, ...kendraTrikonaPatterns];

  // Step 9: Deduplicate patterns by identityKey
  const patternMap = new Map<string, CareerPattern>();
  for (const pattern of allPatterns) {
    const existing = patternMap.get(pattern.identityKey);
    if (existing) {
      // Merge mechanisms (sorted-unique)
      const mergedMechanisms = [...new Set([...existing.mechanisms, ...pattern.mechanisms])].sort();
      const mergedPattern: CareerPattern = Object.freeze({
        ...existing,
        mechanisms: mergedMechanisms
      });
      patternMap.set(pattern.identityKey, mergedPattern);
    } else {
      patternMap.set(pattern.identityKey, pattern);
    }
  }

  const deduplicatedPatterns = Array.from(patternMap.values());

  // Step 10: Sort deterministically by family then identityKey
  deduplicatedPatterns.sort((a, b) => {
    if (a.family !== b.family) {
      return a.family.localeCompare(b.family);
    }
    return a.identityKey.localeCompare(b.identityKey);
  });

  // Step 11: Deduplicate evidence
  const evidence = deduplicateEvidence(deduplicatedPatterns);

  // Step 12: Detect conflicts
  const conflicts = detectConflicts(deduplicatedPatterns);

  // Step 13: Build pattern relationships (empty - not implemented in this wave)
  const relationships = buildPatternRelationships(deduplicatedPatterns);

  // Step 14: Extract all mechanisms
  const mechanisms = extractAllMechanisms(deduplicatedPatterns);

  // Step 15: Build provenance
  const provenance = Object.freeze({
    sourceNetworkIds: networks.map(n => n.networkId).sort(),
    totalPatterns: deduplicatedPatterns.length,
    totalCareerYogaPatterns: yogaPatterns.length,
    totalEvidence: evidence.length,
    totalConflicts: conflicts.length
  });

  // Step 16: Build final analysis result
  const analysis: CareerPatternAnalysis = Object.freeze({
    patterns: Object.freeze(deduplicatedPatterns),
    careerYogaPatterns: Object.freeze(yogaPatterns),
    evidence: Object.freeze(evidence),
    relationships: Object.freeze(relationships),
    mechanisms: Object.freeze(mechanisms),
    conflicts: Object.freeze(conflicts),
    provenance
  });

  return analysis;
}
