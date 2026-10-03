import type {
  CareerPattern,
  CareerPatternClassification,
  CareerPatternClassificationEvidence,
  CareerPatternClassificationInput,
  CareerPatternClassificationProvenance,
  CareerPatternClassificationResult,
  CareerPatternFamily,
  CareerPatternLevel
} from './careerPatternTypes';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import { buildCareerPatternIdentityKey, buildCareerPatternId } from './careerPatternIdentity';
import { classifyCareerHouseNetwork, type CareerPatternRuleMatch } from './careerPatternClassificationRules';

/**
 * P2-03 Career Pattern Classification
 *
 * This module provides the main classification logic for Career patterns.
 *
 * This layer is pure structural pattern-identity/classification only - it does NOT calculate
 * strength, confidence, scores, qualification, activation, Dasha, D10, transit, mechanism,
 * or prediction anywhere in the output.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Resolves the pattern level based on family.
 * PARIVARTANA → 'PLANETARY_YOGA', else 'HOUSE_NETWORK'.
 */
function resolvePatternLevel(family: CareerPatternFamily): CareerPatternLevel {
  return family === 'PARIVARTANA' ? 'PLANETARY_YOGA' : 'HOUSE_NETWORK';
}

/**
 * Builds a human-readable name for a pattern based on its classification.
 */
function buildPatternName(classification: CareerPatternClassification): string {
  const nameMap: Record<CareerPatternClassification, string> = {
    CAREER_HOUSE_NETWORK: 'Career House Network',
    WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS: 'Wealth to Service to Profession to Gains',
    COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS: 'Communication to Work to Profession to Gains',
    CREATIVE_DHARMA_TO_PROFESSION: 'Creative Dharma to Profession',
    DHARMA_KARMA_ALIGNMENT: 'Dharma Karma Alignment',
    SERVICE_TO_PROFESSION_TO_GAINS: 'Service to Profession to Gains',
    PROFESSION_TO_GAINS: 'Profession to Gains',
    UPACHAYA_PROGRESSION: 'Upachaya Progression',
    PARIVARTANA_YOGA: 'Parivartana Yoga'
  };
  return nameMap[classification] || classification;
}

/**
 * Builds a CareerPattern from a network and rule match.
 */
function buildCareerPattern(
  network: CareerHouseNetwork,
  match: CareerPatternRuleMatch
): CareerPattern {
  const identityKey = buildCareerPatternIdentityKey(
    match.family,
    match.classification,
    network.houses,
    network.topology,
    network.relationships.map(r => r.identityKey)
  );

  const patternId = buildCareerPatternId(identityKey);
  const level = resolvePatternLevel(match.family);
  const name = buildPatternName(match.classification);

  const relationshipIds = network.relationships.map(r => r.identityKey).sort();

  const evidence = Object.freeze([{
    evidenceId: `P2-03-EVIDENCE:${match.ruleId}:${network.identityKey}`,
    ruleId: match.ruleId,
    sourceNetworkId: network.networkId,
    sourceNetworkIdentityKey: network.identityKey
  }]) as readonly CareerPatternClassificationEvidence[];

  const provenance: CareerPatternClassificationProvenance = {
    sourceNetworkIds: [network.networkId],
    relationshipIds,
    ruleIds: [match.ruleId]
  };

  return Object.freeze({
    patternId,
    identityKey,
    family: match.family,
    level,
    classification: match.classification,
    name,
    topology: network.topology,
    direction: network.direction,
    houses: network.houses,
    houseRoles: match.houseRoles,
    planets: network.lords,
    networkIds: [network.networkId],
    relationshipIds,
    evidence,
    provenance
  });
}

/**
 * Deduplicates patterns by identityKey.
 * Merges networkIds/relationshipIds (sorted-unique), dedupes evidence by evidenceId and sorts.
 */
function deduplicatePatterns(patterns: readonly CareerPattern[]): readonly CareerPattern[] {
  const patternMap = new Map<string, CareerPattern>();

  for (const pattern of patterns) {
    const existing = patternMap.get(pattern.identityKey);

    if (existing) {
      // Merge networkIds (sorted-unique)
      const mergedNetworkIds = [...new Set([...existing.networkIds, ...pattern.networkIds])].sort();

      // Merge relationshipIds (sorted-unique)
      const mergedRelationshipIds = [...new Set([...existing.relationshipIds, ...pattern.relationshipIds])].sort();

      // Merge evidence (dedup by evidenceId, sorted)
      const evidenceMap = new Map<string, CareerPatternClassificationEvidence>();
      for (const e of [...existing.evidence, ...pattern.evidence]) {
        evidenceMap.set(e.evidenceId, e);
      }
      const mergedEvidence = Array.from(evidenceMap.values()).sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));

      // Merge provenance
      const mergedSourceNetworkIds = [...new Set([...existing.provenance.sourceNetworkIds, ...pattern.provenance.sourceNetworkIds])].sort();
      const mergedProvenanceRelationshipIds = [...new Set([...existing.provenance.relationshipIds, ...pattern.provenance.relationshipIds])].sort();
      const mergedRuleIds = [...new Set([...existing.provenance.ruleIds, ...pattern.provenance.ruleIds])].sort();

      const mergedProvenance: CareerPatternClassificationProvenance = Object.freeze({
        sourceNetworkIds: mergedSourceNetworkIds,
        relationshipIds: mergedProvenanceRelationshipIds,
        ruleIds: mergedRuleIds
      });

      const mergedPattern: CareerPattern = Object.freeze({
        ...existing,
        networkIds: mergedNetworkIds,
        relationshipIds: mergedRelationshipIds,
        evidence: mergedEvidence,
        provenance: mergedProvenance
      });

      patternMap.set(pattern.identityKey, mergedPattern);
    } else {
      patternMap.set(pattern.identityKey, pattern);
    }
  }

  // Sort by identityKey for deterministic output
  return Array.from(patternMap.values()).sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}

/**
 * Classifies Career patterns from CareerHouseNetworks.
 *
 * Per network → per rule match → buildCareerPattern → deduplicatePatterns → sort by identityKey.
 */
export function classifyCareerPatterns(input: CareerPatternClassificationInput): CareerPatternClassificationResult {
  const patterns: CareerPattern[] = [];

  for (const network of input.networks) {
    const matches = classifyCareerHouseNetwork(network);

    for (const match of matches) {
      const pattern = buildCareerPattern(network, match);
      patterns.push(pattern);
    }
  }

  const deduplicated = deduplicatePatterns(patterns);

  // Deep-freeze the result
  const frozenPatterns = deduplicated.map(p => Object.freeze(p));
  const result: CareerPatternClassificationResult = Object.freeze({
    patterns: Object.freeze(frozenPatterns)
  });

  return result;
}

// Re-export types for external use
export type { CareerPatternClassificationInput, CareerPatternClassificationResult };
