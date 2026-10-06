import type {
  Career10LFoundationInput,
  Career10LFoundationResult,
  Career10LStatus,
  Career10LFoundation,
  Career10LContext,
  Career10LProvenance
} from './career10LFoundationTypes';
import type { Career10HFoundation, Career10HContext } from './career10HFoundationTypes';
import type { HouseLordshipReport } from '../../../engine/houseLordship/houseLordship';
import type { PlanetAnalysisReport } from '../../../types';
import type { CareerAstroGraph } from '../careerGraph/careerAstroGraphTypes';
import { resolveCareer10LCondition } from './career10LCondition';
import { resolveCareer10LRelationships } from './career10LRelationships';

/**
 * P2-07G Default Career 10L Foundation Resolver
 *
 * This module provides the main entry point for resolving 10L foundation from
 * Career10HFoundation and optional engine reports (planetAnalysis, houseLordship, careerGraph).
 *
 * This function processes both Lagna and Moon contexts from the input foundation,
 * builds Career10LContext for each, and returns a complete foundation.
 *
 * KEY CONSTRAINTS:
 * - Never fabricate missing data - return partial contexts with null where appropriate
 * - Handle INSUFFICIENT_DATA gracefully by declaring missing inputs
 * - Deep-freeze all output objects
 * - Mirror P2-07F's aspectDataStatus convention: UNAVAILABLE when engine absent ≠ no data
 *
 * Status contract:
 * - foundation: required (missing → INSUFFICIENT_DATA)
 * - houseLordship: required for relationships stage (missing → INSUFFICIENT_DATA)
 * - planetAnalysis: optional enrichment (missing → condition status UNAVAILABLE, overall status COMPLETE)
 * - careerGraph: optional (missing → relationshipDataStatus UNAVAILABLE, recorded in missingInputs, overall status COMPLETE)
 */

/**
 * Default implementation of Career10LFoundation resolver.
 */
export class DefaultCareer10LFoundation {
  /**
   * Resolves the 10L foundation from the provided input.
   *
   * @param input - Career10LFoundationInput with foundation and optional engine reports
   * @returns Career10LFoundationResult with status and foundation
   */
  static resolve(input: Career10LFoundationInput): Career10LFoundationResult {
    const missingInputs: string[] = [];

    // Validate required input
    if (!input.foundation) {
      missingInputs.push('foundation');
      return {
        status: 'INSUFFICIENT_DATA' as Career10LStatus,
        foundation: {
          lagnaContext: null,
          moonContext: null
        },
        missingInputs: Object.freeze(missingInputs)
      };
    }

    const { foundation, houseLordship, planetAnalysis, careerGraph } = input;

    // Build Lagna context if available
    let lagnaContext: Career10LContext | null = null;
    if (foundation.lagnaContext) {
      lagnaContext = this.buildCareer10LContext(
        foundation.lagnaContext,
        houseLordship,
        planetAnalysis,
        careerGraph,
        missingInputs
      );
    }

    // Build Moon context if available
    let moonContext: Career10LContext | null = null;
    if (foundation.moonContext) {
      moonContext = this.buildCareer10LContext(
        foundation.moonContext,
        houseLordship,
        planetAnalysis,
        careerGraph,
        missingInputs
      );
    }

    // Build foundation
    const resultFoundation: Career10LFoundation = {
      lagnaContext,
      moonContext
    };

    // Determine status
    // INSUFFICIENT_DATA when a required input is missing
    // Mirror P2-07F: UNAVAILABLE status for optional inputs doesn't affect overall status
    const status: Career10LStatus =
      missingInputs.length === 0 ? 'COMPLETE' : 'INSUFFICIENT_DATA';

    // Deep-freeze and return
    const frozenResult = {
      status,
      foundation: this.freezeCareer10LFoundation(resultFoundation),
      missingInputs: Object.freeze(missingInputs)
    };
    return Object.freeze(frozenResult);
  }

  /**
   * Builds a Career10LContext from a Career10HContext.
   */
  private static buildCareer10LContext(
    context10H: Career10HContext,
    houseLordship: HouseLordshipReport | undefined,
    planetAnalysis: PlanetAnalysisReport | undefined,
    careerGraph: CareerAstroGraph | undefined,
    missingInputs: string[]
  ): Career10LContext | null {
    // Consume 10L identity and placement verbatim from Career10HContext
    const { referencePoint, house10Lord, lordHouse } = context10H;

    // Resolve condition
    const condition = resolveCareer10LCondition(context10H, planetAnalysis);
    if (condition.status === 'UNAVAILABLE' && !planetAnalysis) {
      // planetAnalysis is optional, don't add to missingInputs
      // This mirrors P2-07F's aspectDataStatus convention
    }

    // Resolve relationships
    const relationshipResult = resolveCareer10LRelationships(
      context10H,
      houseLordship,
      careerGraph
    );
    if (relationshipResult.dataStatus === 'UNAVAILABLE') {
      // houseLordship is required for relationships stage
      if (!houseLordship) {
        missingInputs.push('HOUSE_LORDSHIP');
      }
      // careerGraph is optional - record in missingInputs but doesn't affect overall status
      if (!careerGraph) {
        missingInputs.push('CAREER_GRAPH');
      }
    }

    // Build provenance
    const provenance: Career10LProvenance = {
      house10ContextRef: referencePoint,
      conditionSourceIds: condition.sourceRuleIds,
      relationshipIds: [...relationshipResult.relationships.map(r => r.relationshipId)].sort()
    };

    // Build context
    const context: Career10LContext = {
      referencePoint,
      house10Lord,
      lordHouse,
      condition,
      relationships: relationshipResult.relationships,
      relationshipDataStatus: relationshipResult.dataStatus,
      provenance
    };

    return this.freezeCareer10LContext(context);
  }

  /**
   * Deep freezes a Career10LContext.
   */
  private static freezeCareer10LContext(context: Career10LContext): Career10LContext {
    Object.freeze(context);
    Object.freeze(context.condition);
    Object.freeze(context.condition.sourceRuleIds);
    Object.freeze(context.relationships);
    for (const rel of context.relationships) {
      Object.freeze(rel);
      Object.freeze(rel.provenance);
      Object.freeze(rel.provenance.sourceIds);
      Object.freeze(rel.provenance.ruleIds);
      Object.freeze(rel.provenance.parentIds);
    }
    Object.freeze(context.provenance);
    Object.freeze(context.provenance.conditionSourceIds);
    Object.freeze(context.provenance.relationshipIds);
    return context;
  }

  /**
   * Deep freezes a Career10LFoundation.
   */
  private static freezeCareer10LFoundation(foundation: Career10LFoundation): Career10LFoundation {
    Object.freeze(foundation);
    if (foundation.lagnaContext) {
      this.freezeCareer10LContext(foundation.lagnaContext);
    }
    if (foundation.moonContext) {
      this.freezeCareer10LContext(foundation.moonContext);
    }
    return foundation;
  }
}

/**
 * Convenience function to resolve 10L foundation.
 */
export function resolveCareer10LFoundation(
  input: Career10LFoundationInput
): Career10LFoundationResult {
  return DefaultCareer10LFoundation.resolve(input);
}
