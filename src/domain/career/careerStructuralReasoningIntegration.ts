import type { Horoscope, Planet } from '../../types';
import type { CareerHouseRelationshipContext } from './careerHouseRelationship';
import { detectCareerHouseRelationships } from './careerHouseRelationship';
import { interpretCareerHouseRelationships } from './careerHouseRelationshipSemantics';
import { resolveCareerStructuralReasoning, careerStructuralSemanticKey, type CareerStructuralReasoning, type CareerStructuralEvidence } from './careerStructuralReasoning';
import { CAREER_HOUSE_PORTFOLIO } from './careerTypes';
import { createDomainEvidence, type DomainEvidence } from '../interpretation/DomainEvidence';
import { careerHouseRelationshipKey } from './careerHouseRelationship';
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
        for (const [planet, analysis] of Object.entries(horoscope.planetAnalysis.planets)) {
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
  // For consistent identity, use the same ruleId as the evidence id
  // This ensures the identity used for dedup is consistent
  return evidence.id;
}

function mapStructuralDirectionToPolarity(
  direction: CareerStructuralEvidence['direction']
): DomainEvidence['polarity'] {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORTING';
    case 'CHALLENGE':
      return 'CHALLENGING';
    case 'MIXED':
    case 'NEUTRAL':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
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
 * @param structural - The CareerStructuralReasoning result
 * @returns Array of DomainEvidence items
 */
export function toDomainEvidence(
  structural: CareerStructuralReasoning
): DomainEvidence[] {
  return structural.evidence.map((evidence: CareerStructuralEvidence): DomainEvidence => {
    const ruleId = deriveRuleIdFromStructuralEvidence(evidence);
    const polarity = mapStructuralDirectionToPolarity(evidence.direction);
    const strength = mapStructuralWeightToStrength(evidence.weight);
    const role = mapStructuralRoleToEvidenceRole(evidence.role);
    const provenanceEffect = mapStructuralDirectionToProvenanceEffect(evidence.direction);
    const provenanceStrength = mapStructuralRoleToEvidenceStrength(evidence.role);

    // For MIXED direction, preserve the true C4 direction in notes for traceability
    const notes = evidence.direction === 'MIXED'
      ? `C4 structural direction: MIXED. Contains both supporting and challenging influences.`
      : undefined;

    return createDomainEvidence({
      id: evidence.id,
      sourceType: 'STRUCTURAL',
      domain: 'CAREER',
      role,
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: evidence.statement,
      polarity,
      strength,
      priority: evidence.weight, // Use weight as priority for structural evidence
      ruleId,
      relatedEvidenceIds: [], // Structural evidence doesn't link to other evidence
      notes,
      provenance: {
        evidenceId: evidence.id,
        ruleId,
        domain: 'CAREER',
        axis: 'NATAL',
        source: 'D1', // Structural facts are D1/natal
        effect: provenanceEffect,
        strength: provenanceStrength
      },
      // Add house information if available from the relationship
      ...(evidence.relationship.houseA !== undefined ? { house: evidence.relationship.houseA } : {})
    });
  });
}