import type { Planet } from '../../../types';
import type { Career10HContext } from './career10HFoundationTypes';
import type { Career10LRelationship, Career10LDataStatus } from './career10LFoundationTypes';
import type { HouseLordshipReport } from '../../../engine/houseLordship/houseLordship';
import type { CareerAstroGraph, CareerGraphEdgeType } from '../careerGraph/careerAstroGraphTypes';

/**
 * P2-07G Career 10L Relationship Foundation
 *
 * This module resolves relationships between the 10L and six target house lords (1, 5, 6, 8, 9, 12).
 * It filters the canonical CareerAstroGraph for planet-to-planet edges between the 10L and target lords.
 *
 * KEY CONSTRAINTS:
 * - Only include edges with type ∈ {ASPECTS, CONJUNCT, EXCHANGES} (planet-to-planet only)
 * - LORD_OF and OCCUPIES are planet→house edges and cannot join two lords
 * - Dedupe by identityKey (same semantic relationship from both directions → one record)
 * - Deterministic ordering: targetHouse order, then edge.type canonical order, then identityKey
 * - For Moon context: uses Lagna-relative house lords from D1 lordship table
 *   NOTE: Moon chart lordship is not canonical in this codebase.
 *   P2-07G evaluates the Moon-10L against Lagna lords.
 *   This is a deferred semantic question flagged for future consideration.
 */

/**
 * The six target houses for 10L relationship analysis.
 * These are the key houses traditionally considered for career/livelihood assessment.
 */
export const CAREER_10L_RELATIONSHIP_HOUSES = [1, 5, 6, 8, 9, 12] as const;

/**
 * Resolves 10L relationships from CareerAstroGraph and HouseLordshipReport.
 *
 * @param context10H - The 10H context containing the 10L identity
 * @param houseLordship - Optional HouseLordshipReport for target lord lookup
 * @param graph - Optional CareerAstroGraph for edge lookup
 * @returns Object with relationships array and data status
 */
export function resolveCareer10LRelationships(
  context10H: Career10HContext,
  houseLordship: HouseLordshipReport | undefined,
  graph: CareerAstroGraph | undefined
): {
  relationships: readonly Career10LRelationship[];
  dataStatus: Career10LDataStatus;
} {
  // If graph or houseLordship is absent, return UNAVAILABLE with empty relationships
  // Per spec §28: engine-absent ≠ no-relationship
  if (!graph || !houseLordship) {
    return {
      relationships: Object.freeze([]),
      dataStatus: 'UNAVAILABLE' as Career10LDataStatus
    };
  }

  const tenL = context10H.house10Lord;
  const tenLNodeId = `PLANET:${tenL}`;

  const relationships: Career10LRelationship[] = [];
  const seenIdentityKeys = new Set<string>();

  // Iterate through target houses in canonical order
  for (const targetHouse of CAREER_10L_RELATIONSHIP_HOUSES) {
    // Get the lord of the target house from D1 lordship table
    // NOTE: For Moon context, we still use Lagna-relative lords (D1 table)
    // Moon chart lordship is not canonical in this codebase
    const sourceLord = houseLordship.houseLords[targetHouse as keyof typeof houseLordship.houseLords];
    if (!sourceLord) {
      continue;
    }

    const sourceLordNodeId = `PLANET:${sourceLord}`;

    // Find edges connecting the two planets in either direction
    // Only include planet-to-planet edges (ASPECTS, CONJUNCT, EXCHANGES)
    const matchingEdges = graph.edges.filter(edge => {
      // Filter by edge type (planet-to-planet only)
      if (
        edge.type !== 'ASPECTS' &&
        edge.type !== 'CONJUNCT' &&
        edge.type !== 'EXCHANGES'
      ) {
        return false;
      }

      // Check if edge connects the two planets in either direction
      const connectsTenLToSourceLord =
        edge.sourceNodeId === tenLNodeId && edge.targetNodeId === sourceLordNodeId;
      const connectsSourceLordToTenL =
        edge.sourceNodeId === sourceLordNodeId && edge.targetNodeId === tenLNodeId;

      return connectsTenLToSourceLord || connectsSourceLordToTenL;
    });

    // Dedupe by identityKey and add to relationships
    for (const edge of matchingEdges) {
      if (seenIdentityKeys.has(edge.identityKey)) {
        continue;
      }
      seenIdentityKeys.add(edge.identityKey);

      relationships.push({
        targetHouse,
        sourceLord,
        targetLord: tenL,
        relationshipType: edge.type,
        relationshipId: edge.identityKey,
        provenance: edge.provenance
      });
    }
  }

  // Sort deterministically:
  // 1. By targetHouse (CAREER_10L_RELATIONSHIP_HOUSES order)
  // 2. By edge.type canonical order (LORD_OF < OCCUPIES < ASPECTS < CONJUNCT < EXCHANGES)
  // 3. By identityKey lexicographic
  const canonicalEdgeTypeOrder: Record<CareerGraphEdgeType, number> = {
    'LORD_OF': 0,
    'OCCUPIES': 1,
    'ASPECTS': 2,
    'CONJUNCT': 3,
    'EXCHANGES': 4
  };

  relationships.sort((a, b) => {
    // Sort by targetHouse index in CAREER_10L_RELATIONSHIP_HOUSES
    const aHouseIndex = CAREER_10L_RELATIONSHIP_HOUSES.indexOf(a.targetHouse as any);
    const bHouseIndex = CAREER_10L_RELATIONSHIP_HOUSES.indexOf(b.targetHouse as any);
    if (aHouseIndex !== bHouseIndex) {
      return aHouseIndex - bHouseIndex;
    }

    // Sort by edge type canonical order
    const aTypeOrder = canonicalEdgeTypeOrder[a.relationshipType];
    const bTypeOrder = canonicalEdgeTypeOrder[b.relationshipType];
    if (aTypeOrder !== bTypeOrder) {
      return aTypeOrder - bTypeOrder;
    }

    // Sort by identityKey lexicographic
    return a.relationshipId.localeCompare(b.relationshipId);
  });

  return {
    relationships: Object.freeze(relationships),
    dataStatus: 'AVAILABLE' as Career10LDataStatus
  };
}
