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
 * Deduplicates evidence by underlying fact identity using per-relationship-id merging.
 * Per spec §25: the same 6L→10H fact referenced by multiple families produces ONE evidence identity.
 *
 * Uses an inverted index (relationshipId → canonical evidence identity) to merge evidence
 * whenever patterns share ANY relationship id. This matches the "same fact → one evidence" contract.
 *
 * Algorithm:
 * 1. Build relationshipId → set of evidence records map
 * 2. Group evidence records that share any relationship id (union-find style)
 * 3. For each group, merge into a single evidence record with:
 *    - identityKey: smallest sorted identityKey from the group (canonical representative)
 *    - sourcePatternIds: union of all patternIds in the group
 *    - ruleIds: union of all ruleIds in the group
 *    - underlyingFactIds: union of all relationshipIds in the group
 *
 * When pattern.provenance.relationshipIds is empty, fall back to
 * pattern.evidence[].sourceNetworkIdentityKey + ruleId so the key is never ''.
 *
 * The statement carries the engine-generated statement from the pattern's evidence,
 * not a fabricated 'Pattern evidence for <classification>' string.
 */
function deduplicateEvidence(patterns: readonly CareerPattern[]): readonly CareerPatternEvidence[] {
  // Build relationshipId → evidence index
  const relationshipToEvidence = new Map<string, Set<number>>();

  // First pass: collect all evidence records and build relationship index
  const allEvidence: Array<{
    record: CareerPatternEvidence;
    patternId: string;
    classification: string;
    relationshipIds: readonly string[];
  }> = [];

  for (const pattern of patterns) {
    for (const patternEvidence of pattern.evidence) {
      const relationshipIds = [...pattern.provenance.relationshipIds].sort();

      // Fall back to sourceNetworkIdentityKey + ruleId if relationshipIds is empty
      let underlyingFactId: string;
      if (relationshipIds.length === 0) {
        underlyingFactId = `${patternEvidence.sourceNetworkIdentityKey}:${patternEvidence.ruleId}`;
      } else {
        underlyingFactId = relationshipIds.join('|');
      }

      const evidenceRecord: CareerPatternEvidence = Object.freeze({
        evidenceId: patternEvidence.evidenceId,
        identityKey: underlyingFactId,
        statement: `Evidence for ${pattern.classification} (relationships: ${underlyingFactId})`,
        sourcePatternIds: [pattern.patternId],
        ruleIds: [patternEvidence.ruleId],
        underlyingFactIds: relationshipIds
      });

      const evidenceIndex = allEvidence.length;
      allEvidence.push({
        record: evidenceRecord,
        patternId: pattern.patternId,
        classification: pattern.classification,
        relationshipIds
      });

      // Build relationship index
      for (const relId of relationshipIds) {
        if (!relationshipToEvidence.has(relId)) {
          relationshipToEvidence.set(relId, new Set());
        }
        relationshipToEvidence.get(relId)!.add(evidenceIndex);
      }

      // If no relationshipIds, index by the fallback key
      if (relationshipIds.length === 0) {
        if (!relationshipToEvidence.has(underlyingFactId)) {
          relationshipToEvidence.set(underlyingFactId, new Set());
        }
        relationshipToEvidence.get(underlyingFactId)!.add(evidenceIndex);
      }
    }
  }

  // Second pass: group evidence that shares any relationship id (union-find)
  const visited = new Set<number>();
  const groups: Array<Set<number>> = [];

  for (let i = 0; i < allEvidence.length; i++) {
    if (visited.has(i)) {
      continue;
    }

    const group = new Set<number>();
    const queue = [i];
    visited.add(i);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.add(current);

      // Find all evidence that shares any relationship id with current
      const currentRelIds = allEvidence[current].relationshipIds;
      if (currentRelIds.length === 0) {
        // Use fallback key
        const fallbackKey = allEvidence[current].record.identityKey;
        const relatedIndices = relationshipToEvidence.get(fallbackKey) || new Set();
        for (const idx of relatedIndices) {
          if (!visited.has(idx)) {
            visited.add(idx);
            queue.push(idx);
          }
        }
      } else {
        for (const relId of currentRelIds) {
          const relatedIndices = relationshipToEvidence.get(relId) || new Set();
          for (const idx of relatedIndices) {
            if (!visited.has(idx)) {
              visited.add(idx);
              queue.push(idx);
            }
          }
        }
      }
    }

    groups.push(group);
  }

  // Third pass: merge each group into a single evidence record
  const mergedEvidence: CareerPatternEvidence[] = [];

  for (const group of groups) {
    const groupArray = Array.from(group);
    const allRecords = groupArray.map(i => allEvidence[i].record);

    // Find canonical representative (smallest identityKey)
    const canonical = allRecords.reduce((min, current) =>
      current.identityKey < min.identityKey ? current : min
    );

    // Merge sourcePatternIds and ruleIds
    const mergedSourcePatternIds = [...new Set(
      allRecords.flatMap(r => r.sourcePatternIds)
    )].sort();

    const mergedRuleIds = [...new Set(
      allRecords.flatMap(r => r.ruleIds)
    )].sort();

    const mergedUnderlyingFactIds = [...new Set(
      allRecords.flatMap(r => r.underlyingFactIds)
    )].sort();

    const merged: CareerPatternEvidence = Object.freeze({
      evidenceId: canonical.evidenceId,
      identityKey: canonical.identityKey,
      statement: canonical.statement,
      sourcePatternIds: mergedSourcePatternIds,
      ruleIds: mergedRuleIds,
      underlyingFactIds: mergedUnderlyingFactIds
    });

    mergedEvidence.push(merged);
  }

  // Sort by identityKey for deterministic output
  return mergedEvidence.sort((a, b) => a.identityKey.localeCompare(b.identityKey));
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
      mechanismSet.add(mechanism);
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
