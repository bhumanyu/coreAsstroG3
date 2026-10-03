import type { CareerStructuralReasoning } from '../careerStructuralReasoning';
import type { CareerHouseRelationship } from '../careerHouseRelationship';
import type { CareerGraphFact, CareerGraphNodeRef, CareerGraphProvenance } from './careerAstroGraphTypes';

/**
 * Adapter that maps C4 CareerStructuralReasoning to CareerGraphFact[].
 *
 * This provides an explicit, tested translation from structural reasoning relationships
 * to graph facts, ensuring no silent fallbacks and complete coverage of all relationship types.
 *
 * @param structural - The structural reasoning output from C4
 * @returns Array of CareerGraphFact representing the structural relationships
 */
export function buildCareerGraphFactsFromStructural(
  structural: CareerStructuralReasoning
): readonly CareerGraphFact[] {
  const facts: CareerGraphFact[] = [];

  for (const evidence of structural.evidence) {
    const relationship = evidence.relationship;
    const provenance: CareerGraphProvenance = {
      sourceIds: [evidence.id],
      ruleIds: [],
      parentIds: []
    };

    // Map each relationship type explicitly to graph facts
    switch (relationship.type) {
      case 'LORD_CONJUNCTION':
        // CONJUNCT: PLANET→PLANET (lordA→lordB)
        if (relationship.lordA && relationship.lordB) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'PLANET', key: relationship.lordB },
            relationship: 'CONJUNCT',
            provenance
          });
        }
        break;

      case 'LORD_ASPECT':
        // ASPECTS: PLANET→PLANET (lordA→lordB)
        if (relationship.lordA && relationship.lordB) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'PLANET', key: relationship.lordB },
            relationship: 'ASPECTS',
            provenance
          });
        }
        break;

      case 'EXCHANGE':
        // EXCHANGES: PLANET→PLANET (lordA→lordB)
        if (relationship.lordA && relationship.lordB) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'PLANET', key: relationship.lordB },
            relationship: 'EXCHANGES',
            provenance
          });
        }
        break;

      case 'LORD_IN_HOUSE':
        // OCCUPIES: PLANET→HOUSE (lordA→houseB if lordA is in houseB)
        if (relationship.lordA && relationship.lordAHouse === relationship.houseB) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'HOUSE', key: String(relationship.houseB) },
            relationship: 'OCCUPIES',
            provenance
          });
        }
        // Also handle the symmetric case: lordB→houseA if lordB is in houseA
        if (relationship.lordB && relationship.lordBHouse === relationship.houseA) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordB },
            targetNode: { type: 'HOUSE', key: String(relationship.houseA) },
            relationship: 'OCCUPIES',
            provenance
          });
        }
        break;

      case 'COMMON_LORD':
        // COMMON_LORD: LORD_OF PLANET→HOUSE for each governed house
        if (relationship.lordA) {
          // lordA governs houseA
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'HOUSE', key: String(relationship.houseA) },
            relationship: 'LORD_OF',
            provenance
          });
          // lordA also governs houseB
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'HOUSE', key: String(relationship.houseB) },
            relationship: 'LORD_OF',
            provenance
          });
        }
        break;

      case 'HOUSE_ASPECT':
        // ASPECTS: PLANET→HOUSE (lordA→houseB or lordB→houseA)
        if (relationship.lordA) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordA },
            targetNode: { type: 'HOUSE', key: String(relationship.houseB) },
            relationship: 'ASPECTS',
            provenance
          });
        }
        if (relationship.lordB) {
          facts.push({
            sourceNode: { type: 'PLANET', key: relationship.lordB },
            targetNode: { type: 'HOUSE', key: String(relationship.houseA) },
            relationship: 'ASPECTS',
            provenance
          });
        }
        break;

      default:
        // Exhaustive switch - no fallback. If we reach here, TypeScript will error
        // if a new relationship type is added without handling it.
        const _exhaustiveCheck: never = relationship.type;
        throw new Error(`Unhandled relationship type: ${_exhaustiveCheck}`);
    }
  }

  return Object.freeze(facts);
}
