import type { Horoscope, Planet, PlanetAnalysis } from '../../types';
import type { CareerHouseRelationshipContext, CareerHouseRelationship } from './careerHouseRelationship';
import { detectCareerHouseRelationships } from './careerHouseRelationship';
import { interpretCareerHouseRelationships } from './careerHouseRelationshipSemantics';
import { resolveCareerStructuralReasoning, type CareerStructuralReasoning, type CareerStructuralEvidence, careerStructuralSemanticKey } from './careerStructuralReasoning';
export type { CareerStructuralReasoning } from './careerStructuralReasoning';
import { CAREER_HOUSE_PORTFOLIO } from './careerTypes';
import { createDomainEvidence, type DomainEvidence } from '../interpretation/DomainEvidence';
import type { EvidenceProvenance, EvidenceStrength } from '../careerWealth/provenance/evidenceProvenance';

export interface CareerStructuralReasoningInput {
  readonly horoscope: Horoscope;
}

function createCareerHouseRelationshipContextFromHoroscope(
  horoscope: Horoscope
): CareerHouseRelationshipContext {
  return {
    getHouseLord: (house: number): Planet | undefined => {
      const houseAnalysis = horoscope.houseAnalysis?.houses;
      if (!houseAnalysis) return undefined;

      const houseData = Array.isArray(houseAnalysis)
        ? houseAnalysis.find((h: any) => h.house === house)
        : (houseAnalysis as Record<number, any>)[house];

      return houseData?.lord;
    },

    getHouseOccupants: (targetHouse: number): readonly Planet[] => {
      const occupants: Planet[] = [];

      // Check planetFacts for house placement
      if (horoscope.planetFacts) {
        for (const [planet, facts] of Object.entries(horoscope.planetFacts)) {
          const house = facts.house ?? facts.position?.house;
          if (house === targetHouse) {
            occupants.push(planet as Planet);
          }
        }
      }

      // Also check planetAnalysis if available
      if (horoscope.planetAnalysis?.planets) {
        const planetAnalysisPlanets = horoscope.planetAnalysis.planets as Record<string, PlanetAnalysis>;
        for (const [planet, analysis] of Object.entries(planetAnalysisPlanets)) {
          if (analysis.house === targetHouse && !occupants.includes(planet as Planet)) {
            occupants.push(planet as Planet);
          }
        }
      }

      return Object.freeze(occupants);
    },

    getPlanetHouse: (planet: Planet): number | undefined => {
      if (horoscope.planetFacts?.[planet]) {
        return horoscope.planetFacts[planet].house ?? horoscope.planetFacts[planet].position?.house;
      }
      if (horoscope.planetAnalysis?.planets?.[planet]) {
        return horoscope.planetAnalysis.planets[planet].house;
      }
      return undefined;
    },

    lordAspectsLord: (source: Planet, target: Planet): boolean => {
      const aspects = horoscope.natalGrahaDrishti?.aspects ?? [];
      return aspects.some(
        (aspect) =>
          aspect.sourcePlanet === source && aspect.targetPlanet === target
      );
    },

    lordAspectsHouse: (source: Planet, targetHouse: number): boolean => {
      const aspects = horoscope.natalGrahaDrishti?.aspects ?? [];
      return aspects.some(
        (aspect) =>
          aspect.sourcePlanet === source && aspect.targetHouse === targetHouse
      );
    }
  };
}

function deriveRuleIdFromStructuralEvidence(
  evidence: CareerStructuralEvidence
): string {
  // Derive deterministic ruleId from the relationship and semantic identity
  if (evidence.id.startsWith('CAREER_STRUCTURAL:')) {
    return `CAREER_STRUCTURAL_${evidence.id.slice('CAREER_STRUCTURAL:'.length).replace(/:/g, '_')}`;
  }
  return `CAREER_STRUCTURAL_${evidence.id}`;
}

function mapStructuralDirectionToPolarity(
  direction: CareerStructuralEvidence['direction']
): DomainEvidence['polarity'] {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORTING';
    case 'CHALLENGE':
      return 'CHALLENGING';
    case 'NEUTRAL':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
    case 'MIXED':
      // MIXED is handled by splitting into two occurrences of the same semantic fact
      // This function should not be called for MIXED direction
      throw new Error('MIXED direction should be split into two occurrences of the same semantic fact');
    default:
      return 'NEUTRAL';
  }
}

function mapStructuralDirectionToProvenanceEffect(
  direction: CareerStructuralEvidence['direction']
): EvidenceProvenance['effect'] {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
    default:
      return 'NEUTRAL';
  }
}

function mapStructuralRoleToEvidenceStrength(
  role: CareerStructuralEvidence['role']
): EvidenceStrength {
  switch (role) {
    case 'PRIMARY':
      return 'PRIMARY';
    case 'SUPPORTING':
      return 'SECONDARY';
    case 'CHALLENGING':
      return 'SECONDARY';
    case 'MIXED':
    case 'MODIFIER':
      return 'TERTIARY';
    default:
      return 'TERTIARY';
  }
}

function mapStructuralWeightToStrength(
  weight: number
): DomainEvidence['strength'] {
  if (weight >= 3) return 'STRONG';
  if (weight >= 2) return 'MODERATE';
  return 'WEAK';
}

function mapStructuralRoleToEvidenceRole(
  role: CareerStructuralEvidence['role']
): DomainEvidence['role'] {
  switch (role) {
    case 'PRIMARY':
      return 'PRIMARY';
    case 'SUPPORTING':
      return 'SECONDARY';
    case 'CHALLENGING':
      return 'SECONDARY';
    case 'MIXED':
    case 'MODIFIER':
      return 'MODIFIER';
    default:
      return 'MODIFIER';
  }
}

/**
 * Builds the canonical C4 structural reasoning chain for Career.
 * 
 * This function runs the full chain:
 * chart → careerHouseRelationship derivation → interpretCareerHouseRelationships → resolveCareerStructuralReasoning
 * 
 * @param input - The input containing the horoscope
 * @returns The CareerStructuralReasoning result
 */
export function buildCareerStructuralReasoning(
  input: CareerStructuralReasoningInput
): CareerStructuralReasoning {
  const { horoscope } = input;
  const context = createCareerHouseRelationshipContextFromHoroscope(horoscope);

  const portfolio = CAREER_HOUSE_PORTFOLIO;
  const allCareerHouses = [
    ...portfolio.primary,
    ...portfolio.supporting,
    ...portfolio.challenging
  ];

  // Detect all house relationships among career houses
  const relationships: readonly CareerHouseRelationship[] = Object.freeze(
    allCareerHouses.flatMap((houseA, i) =>
      allCareerHouses.slice(i + 1).flatMap((houseB) =>
        detectCareerHouseRelationships(context, houseA, houseB)
      )
    )
  );

  // Interpret relationships into semantics
  const semantics = interpretCareerHouseRelationships(relationships);

  // Resolve structural reasoning from semantics
  return resolveCareerStructuralReasoning(semantics);
}

/**
 * Converts CareerStructuralEvidence to canonical DomainEvidence.
 * 
 * This mapper preserves the structural evidence identity by:
 * - Using deterministic ruleId derived from relationship/semantic keys
 * - Marking source as structural/NATAL
 * - Setting domain='CAREER', phase='NATAL_PROMISE'
 * - Preserving polarity from C4 direction
 * - Mapping weight and role appropriately
 * - Adding provenance marking as C4-derived
 * 
 * For MIXED direction evidence, this function splits it into TWO separate DomainEvidence items:
 * - One with polarity='SUPPORTING' 
 * - One with polarity='CHALLENGING'
 * 
 * Both split items share the SAME canonical ruleId and semantic identity (same house), so
 * downstream deduplication merges them into ONE canonical record with direction='MIXED',
 * occurrenceCount=2, and sourceIds containing both occurrence IDs. The weight is NOT doubled
 * (max of single occurrences). This reuses the existing mergeEvidenceDirection and
 * deduplicateReasoningEvidence engine as intended.
 * 
 * Note: CareerStructuralReasoning.direction === 'MIXED' is an AGGREGATE conclusion across
 * all career house relationships. It does NOT make every underlying mixed relationship a
 * primary-promise factor. The per-relationship role mapping (MIXED/MODIFIER → MODIFIER) is
 * intentional to distinguish aggregate conclusions from per-relationship factors.
 * 
 * @param structural - The CareerStructuralReasoning result
 * @returns Array of DomainEvidence items
 */
export function toDomainEvidence(
  structural: CareerStructuralReasoning
): readonly DomainEvidence[] {
  const result: DomainEvidence[] = [];

  for (const evidence of structural.evidence) {
    // Handle MIXED direction by splitting into two occurrences of the same semantic fact
    if (evidence.direction === 'MIXED') {
      const strength = mapStructuralWeightToStrength(evidence.weight);
      const role = mapStructuralRoleToEvidenceRole(evidence.role);
      const provenanceStrength = mapStructuralRoleToEvidenceStrength(evidence.role);
      const notes = `C4 structural direction: MIXED. Split into SUPPORTING and CHALLENGING occurrences of the same semantic fact; canonical dedup merges these into one MIXED record with occurrenceCount=2.`;

      // Use the canonical semantic ruleId (same as non-MIXED branch would produce)
      const semanticKey = careerStructuralSemanticKey(evidence.semantic);
      const canonicalRuleId = `CAREER_STRUCTURAL_${semanticKey.replace(/:/g, '_')}`;

      // Both occurrences share the same house to ensure identityKey collapse
      const house = evidence.relationship.houseA;

      // Create SUPPORTING occurrence with distinct id but shared ruleId/identity
      const supportingId = `CAREER_STRUCTURAL:${semanticKey}:SUPPORTING`;
      const supportingEvidence = createDomainEvidence({
        id: supportingId,
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role,
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: evidence.statement,
        polarity: 'SUPPORTING',
        strength,
        priority: evidence.weight,
        ruleId: canonicalRuleId, // Same canonical ruleId for both occurrences
        relatedEvidenceIds: [],
        notes,
        provenance: {
          evidenceId: supportingId,
          ruleId: canonicalRuleId, // Same canonical ruleId for both occurrences
          domain: 'CAREER',
          axis: 'NATAL',
          source: 'C4_STRUCTURAL_REASONING',
          effect: 'MIXED', // Preserve original MIXED effect
          strength: provenanceStrength
        },
        ...(house !== undefined ? { house } : {}), // Same house for both occurrences
        identityKey: canonicalRuleId // Add identityKey for deduplication
      });

      // Create CHALLENGING occurrence with distinct id but shared ruleId/identity
      const challengingId = `CAREER_STRUCTURAL:${semanticKey}:CHALLENGING`;
      const challengingEvidence = createDomainEvidence({
        id: challengingId,
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role,
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: evidence.statement,
        polarity: 'CHALLENGING',
        strength,
        priority: evidence.weight,
        ruleId: canonicalRuleId, // Same canonical ruleId for both occurrences
        relatedEvidenceIds: [],
        notes,
        provenance: {
          evidenceId: challengingId,
          ruleId: canonicalRuleId, // Same canonical ruleId for both occurrences
          domain: 'CAREER',
          axis: 'NATAL',
          source: 'C4_STRUCTURAL_REASONING',
          effect: 'MIXED', // Preserve original MIXED effect
          strength: provenanceStrength
        },
        ...(house !== undefined ? { house } : {}), // Same house for both occurrences
        identityKey: canonicalRuleId // Add identityKey for deduplication
      });

      result.push(supportingEvidence, challengingEvidence);
    } else {
      // Non-MIXED directions keep their existing 1:1 mapping
      const ruleId = deriveRuleIdFromStructuralEvidence(evidence);
      const polarity = mapStructuralDirectionToPolarity(evidence.direction);
      const strength = mapStructuralWeightToStrength(evidence.weight);
      const role = mapStructuralRoleToEvidenceRole(evidence.role);
      const provenanceEffect = mapStructuralDirectionToProvenanceEffect(evidence.direction);
      const provenanceStrength = mapStructuralRoleToEvidenceStrength(evidence.role);

      const domainEvidence = createDomainEvidence({
        id: evidence.id,
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role,
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: evidence.statement,
        polarity,
        strength,
        priority: evidence.weight,
        ruleId,
        relatedEvidenceIds: [],
        provenance: {
          evidenceId: evidence.id, // Keep original occurrence id for traceability
          ruleId,
          domain: 'CAREER',
          axis: 'NATAL',
          source: 'C4_STRUCTURAL_REASONING',
          effect: provenanceEffect,
          strength: provenanceStrength
        },
        ...(evidence.relationship.houseA !== undefined ? { house: evidence.relationship.houseA } : {}),
        identityKey: ruleId // Add identityKey for deduplication
      });

      result.push(domainEvidence);
    }
  }

  return Object.freeze(result);
}