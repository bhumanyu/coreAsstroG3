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
 */
function deduplicateEvidence(patterns: readonly CareerPattern[]): readonly CareerPatternEvidence[] {
  const evidenceMap = new Map<string, CareerPatternEvidence>();

  for (const pattern of patterns) {
    for (const patternEvidence of pattern.evidence) {
      // Build identity key from underlying fact (sourceNetworkIdentityKey)
      const underlyingFactId = patternEvidence.sourceNetworkIdentityKey;

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
          statement: `Pattern evidence for ${pattern.classification}`,
          sourcePatternIds: [pattern.patternId],
          ruleIds: [patternEvidence.ruleId],
          underlyingFactIds: [underlyingFactId]
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
 */
function detectConflicts(patterns: readonly CareerPattern[]): readonly CareerPatternConflict[] {
  const conflicts: CareerPatternConflict[] = [];

  // Group patterns by house set
  const patternsByHouseSet = new Map<string, CareerPattern[]>();
  for (const pattern of patterns) {
    const houseKey = [...pattern.houses].sort((a, b) => a - b).join(',');
    if (!patternsByHouseSet.has(houseKey)) {
      patternsByHouseSet.set(houseKey, []);
    }
    patternsByHouseSet.get(houseKey)!.push(pattern);
  }

  // Check for conflicts within same house set but different families
  for (const [houseKey, housePatterns] of patternsByHouseSet) {
    if (housePatterns.length > 1) {
      const families = new Set(housePatterns.map(p => p.family));

      // If multiple families classify the same house set, mark as semantic conflict
      if (families.size > 1) {
        const conflictId = `CONFLICT:${houseKey}:SEMANTIC`;
        const conflict: CareerPatternConflict = Object.freeze({
          conflictId,
          patternIds: housePatterns.map(p => p.patternId).sort(),
          conflictType: 'SEMANTIC_CONFLICT',
          description: `Multiple pattern families classify the same house set: ${Array.from(families).join(', ')}`,
          resolution: 'Preserve all patterns for qualification layer evaluation'
        });

        conflicts.push(conflict);
      }
    }
  }

  // Check for mechanism conflicts
  const patternsByMechanism = new Map<CareerMechanism, CareerPattern[]>();
  for (const pattern of patterns) {
    for (const mechanism of pattern.mechanisms) {
      if (!patternsByMechanism.has(mechanism)) {
        patternsByMechanism.set(mechanism, []);
      }
      patternsByMechanism.get(mechanism)!.push(pattern);
    }
  }

  // If the same mechanism appears in conflicting semantic patterns, mark as mechanism conflict
  for (const [mechanism, mechPatterns] of patternsByMechanism) {
    if (mechPatterns.length > 1) {
      const families = new Set(mechPatterns.map(p => p.family));

      if (families.size > 1) {
        const conflictId = `CONFLICT:MECHANISM:${mechanism}`;
        const conflict: CareerPatternConflict = Object.freeze({
          conflictId,
          patternIds: mechPatterns.map(p => p.patternId).sort(),
          conflictType: 'MECHANISM_CONFLICT',
          description: `Same mechanism ${mechanism} appears in multiple pattern families: ${Array.from(families).join(', ')}`,
          resolution: 'Preserve all patterns for qualification layer evaluation'
        });

        conflicts.push(conflict);
      }
    }
  }

  // Sort by conflictId for deterministic output
  return conflicts.sort((a, b) => a.conflictId.localeCompare(b.conflictId));
}

/**
 * Builds pattern relationships.
 * For now, this is a placeholder - future enhancements would detect SUPPORTS/REINFORCES/MODIFIES relationships.
 */
function buildPatternRelationships(patterns: readonly CareerPattern[]): readonly CareerPatternRelationship[] {
  // Placeholder: no relationships detected in this implementation
  // Future enhancement would analyze inter-pattern dependencies
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
 * 5. classifyCareerPatterns (existing families)
 * 6. detectDusthanaPatterns (new family)
 * 7. detectCareerYogaPatterns (new family)
 * 8. Deduplicate evidence
 * 9. Detect conflicts
 * 10. Build relationships
 * 11. Extract mechanisms
 * 12. Sort deterministically by family then identityKey
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

  // Step 5: Classify patterns using existing families
  const classificationResult = classifyCareerPatterns({ networks });
  let allPatterns: CareerPattern[] = [...classificationResult.patterns];

  // Step 6: Detect dusthana transformation patterns
  const dusthanaPatterns = detectDusthanaPatterns(networks);
  allPatterns = [...allPatterns, ...dusthanaPatterns];

  // Step 7: Detect career yoga patterns
  const yogaPatterns = detectCareerYogaPatterns(networks);
  // Note: CareerYogaPattern is a separate type, not merged into CareerPattern
  // It's stored separately in the analysis result

  // Step 8: Deduplicate patterns by identityKey
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

  // Step 9: Sort deterministically by family then identityKey
  deduplicatedPatterns.sort((a, b) => {
    if (a.family !== b.family) {
      return a.family.localeCompare(b.family);
    }
    return a.identityKey.localeCompare(b.identityKey);
  });

  // Step 10: Deduplicate evidence
  const evidence = deduplicateEvidence(deduplicatedPatterns);

  // Step 11: Detect conflicts
  const conflicts = detectConflicts(deduplicatedPatterns);

  // Step 12: Build pattern relationships
  const relationships = buildPatternRelationships(deduplicatedPatterns);

  // Step 13: Extract all mechanisms
  const mechanisms = extractAllMechanisms(deduplicatedPatterns);

  // Step 14: Build provenance
  const provenance = Object.freeze({
    sourceNetworkIds: networks.map(n => n.networkId).sort(),
    totalPatterns: deduplicatedPatterns.length,
    totalCareerYogaPatterns: yogaPatterns.length,
    totalEvidence: evidence.length,
    totalConflicts: conflicts.length
  });

  // Step 15: Build final analysis result
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
