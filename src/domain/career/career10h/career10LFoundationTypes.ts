import type { Planet, Sign } from '../../../types';
import type { CareerReferencePoint, Career10HContext, Career10HFoundation } from './career10HFoundationTypes';
import type { CareerPlanetaryDignity, CareerPlanetaryMotion, CareerPlanetaryCombustion } from '../careerPlanetaryCondition';
import type { CareerGraphEdgeType, CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
import type { HouseLordshipReport } from '../../../engine/houseLordship/houseLordship';
import type { PlanetAnalysisReport } from '../../../types';
import type { CareerAstroGraph } from '../careerGraph/careerAstroGraphTypes';

/**
 * P2-07G Career 10L Condition and Relationships Module
 *
 * This module extends the P2-07F 10H structural context to add 10L (10th lord) condition
 * and relationship analysis. It consumes Career10HFoundation and produces Career10LFoundation
 * with per-reference Career10LContext containing:
 * - 10L identity and placement (consumed verbatim from Career10HContext)
 * - Career10LCondition (adapted from PlanetAnalysisReport)
 * - Career10LRelationship[] (filtered canonical CareerGraphEdge views for six target lord pairs)
 *
 * This is a D1-only, deterministic, facts/derived-facts layer with NO interpretation.
 *
 *BOUNDARY ENFORCEMENT: This module must NOT:
 * - Import from careerDasha, careerD10, careerFinalSynthesis, careerExpression
 * - Import from domain/timing
 * - Import careerMechanism, careerProfession
 * - Perform strength/score calculations
 * - Generate evidence or interpretations
 * - Process Dasha/D10/transit/profession/domain inference
 * - Make AI calls or generate yoga
 * - Add MOOLATRIKONA to CareerPlanetaryDignity (fold into OWN_SIGN)
 * - Create any Career10LRelationshipType enum (reuse CareerGraphEdgeType)
 * - Add scores, support/challenge fields, or planet-level interpretation strings
 *
 * MOOLATRIKONA → OWN_SIGN fold:
 * The engine's DignityStatus includes MOOLATRIKONA, but CareerPlanetaryDignity does not.
 * Per spec decision, MOOLATRIKONA is folded into OWN_SIGN for career context.
 * This is a deliberate simplification to avoid expanding the career dignity union.
 */

/**
 * Status for 10L foundation resolution.
 */
export type Career10LStatus = 'COMPLETE' | 'INSUFFICIENT_DATA';

/**
 * Data availability status for condition and relationship collections.
 * UNAVAILABLE means the engine report is absent, not that there are no conditions/relationships.
 */
export type Career10LDataStatus = 'AVAILABLE' | 'UNAVAILABLE';

/**
 * A relationship between the 10L and a target house lord.
 * Represents a canonical CareerGraphEdge view filtered for the six target lord pairs.
 */
export interface Career10LRelationship {
  /** The counterpart house (1|5|6|8|9|12) */
  readonly targetHouse: 1 | 5 | 6 | 8 | 9 | 12;
  /** Lord of targetHouse (source lord in the relationship) */
  readonly sourceLord: Planet;
  /** Always the 10L (target lord in the relationship) */
  readonly targetLord: Planet;
  /** Relationship type - reused from CareerGraphEdgeType, no new enum */
  readonly relationshipType: CareerGraphEdgeType;
  /** Edge identity key, verbatim from source edge */
  readonly relationshipId: string;
  /** Edge provenance, verbatim from source edge */
  readonly provenance: CareerGraphProvenance;
}

/**
 * Condition of the 10L (10th lord) adapted from PlanetAnalysisReport.
 * Contains dignity, motion, combustion, and placement facts without interpretation.
 */
export interface Career10LCondition {
  /** Data availability status */
  readonly status: Career10LDataStatus;
  /** Dignity status - folded from DignityStatus (MOOLATRIKONA → OWN_SIGN) */
  readonly dignity?: CareerPlanetaryDignity;
  /** Motion status */
  readonly motion?: CareerPlanetaryMotion;
  /** Combustion status */
  readonly combustion?: CareerPlanetaryCombustion;
  /** Sign placement */
  readonly sign?: Sign;
  /** House placement */
  readonly house?: number;
  /** Real PlanetAnalysisEvidence ruleIds that produced the copied facts */
  readonly sourceRuleIds: readonly string[];
}

/**
 * Complete 10L context for a reference point (LAGNA or MOON).
 * Combines 10L identity/placement from Career10HContext with condition and relationships.
 */
export interface Career10LContext {
  /** Reference point (LAGNA or MOON) */
  readonly referencePoint: CareerReferencePoint;
  /** The 10th lord planet */
  readonly house10Lord: Planet;
  /** The house where the 10L is placed (consumed from Career10HContext.lordHouse) */
  readonly lordHouse: number;
  /** Condition of the 10L */
  readonly condition: Career10LCondition;
  /** Relationships between 10L and target house lords */
  readonly relationships: readonly Career10LRelationship[];
  /** Data availability status for relationships (engine absent ≠ no relationships) */
  readonly relationshipDataStatus: Career10LDataStatus;
  /** Provenance tracking */
  readonly provenance: Career10LProvenance;
}

/**
 * Complete 10L foundation containing both Lagna and Moon contexts.
 */
export interface Career10LFoundation {
  /** 10L context from Lagna reference point */
  readonly lagnaContext: Career10LContext | null;
  /** 10L context from Moon reference point */
  readonly moonContext: Career10LContext | null;
}

/**
 * Provenance tracking for 10L context.
 * Tracks upstream evidence IDs and relationship identity keys.
 */
export interface Career10LProvenance {
  /** Reference point locator (not an ID) */
  readonly house10ContextRef: CareerReferencePoint;
  /** Real upstream evidence ruleIds/IDs from condition source */
  readonly conditionSourceIds: readonly string[];
  /** Collected edge identityKeys from relationships */
  readonly relationshipIds: readonly string[];
}

/**
 * Input for resolving 10L foundation.
 * Consumes Career10HFoundation from P2-07F and optional engine reports.
 *
 * Status contract:
 * - foundation: required (missing → INSUFFICIENT_DATA)
 * - houseLordship: required for relationships stage (missing → INSUFFICIENT_DATA)
 * - planetAnalysis: optional enrichment (missing → condition status UNAVAILABLE, overall status COMPLETE)
 * - careerGraph: optional (missing → relationshipDataStatus UNAVAILABLE, recorded in missingInputs, overall status COMPLETE)
 */
export interface Career10LFoundationInput {
  /** Required: 10H foundation from P2-07F */
  readonly foundation: Career10HFoundation;
  /** Required for relationships: House lordship report for relationship resolution */
  readonly houseLordship?: HouseLordshipReport;
  /** Optional: Planet analysis report for condition resolution */
  readonly planetAnalysis?: PlanetAnalysisReport;
  /** Optional: Career graph for relationship resolution */
  readonly careerGraph?: CareerAstroGraph;
}

/**
 * Result of 10L foundation resolution.
 */
export interface Career10LFoundationResult {
  /** Resolution status */
  readonly status: Career10LStatus;
  /** The resolved foundation */
  readonly foundation: Career10LFoundation;
  /** List of missing required inputs */
  readonly missingInputs: readonly string[];
}
