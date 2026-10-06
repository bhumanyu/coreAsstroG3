import type {
  CareerExpressionCandidate,
  CareerMechanismExpressionEvidence,
  CareerExpressionProvenance,
  CareerExpressionAnalysisResult,
  CareerExpressionResolverInput
} from './careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismType
} from '../careerMechanism';
import type {
  Career10HFoundation
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation
} from '../career10h/career10LFoundationTypes';
import { CAREER_EXPRESSION_RULES } from './careerExpressionRules';
import type { CareerExpressionRule } from './careerExpressionRules';
import {
  createCareerExpressionId,
  createExpressionEvidenceId,
  deduplicateExpressionCandidates,
  canonicalSortExpressionCandidates,
  mergeExpressionProvenances
} from './careerExpressionUtils';

/**
 * P2-08A Default Career Expression Resolver
 *
 * This module implements the career expression resolver that maps career mechanism
 * candidates to career expression candidates.
 *
 * Per spec §8:
 * - Normalize candidates → match rules against mechanismTypes → emit candidate per matched rule
 * - 10H/10L refine-only (context may add source10HIds/source10LIds to evidence/provenance but
 *   NEVER emit an expression without a source mechanism)
 * - Dedupe by (expressionType, canonical-source-set) merging provenance
 * - Canonical sort using compareParticipantIds-style ordering
 * - Immutable output (deep-frozen)
 * - Missing input ≠ negative: emit missingInputs + PARTIAL/INSUFFICIENT_DATA, never treat
 *   absent 10H/10L as weakening
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - profession
 * - ai
 * - legacy careerExpression.ts
 */

/**
 * Default career expression resolver.
 * Implements the resolve(input): CareerExpressionAnalysisResult contract.
 */
export class DefaultCareerExpressionResolver {
  /**
   * Resolves career mechanism candidates into career expression candidates.
   *
   * @param input - The resolver input containing mechanism candidates and optional context
   * @returns Frozen CareerExpressionAnalysisResult
   */
  resolve(input: CareerExpressionResolverInput): CareerExpressionAnalysisResult {
    const {
      careerMechanismCandidates,
      careerMechanismRefinements,
      career10HFoundation,
      career10LFoundation
    } = input;

    // Track missing inputs
    const missingInputs: string[] = [];

    if (!career10HFoundation) {
      missingInputs.push('career10HFoundation');
    }

    if (!career10LFoundation) {
      missingInputs.push('career10LFoundation');
    }

    // Normalize candidates: combine base candidates with refinements
    const allMechanismCandidates = this.normalizeMechanismCandidates(
      careerMechanismCandidates,
      careerMechanismRefinements
    );

    // Check for insufficient data (no mechanism candidates at all)
    if (allMechanismCandidates.length === 0) {
      return this.createInsufficientDataResult(missingInputs);
    }

    // Match rules against mechanism types and emit candidates
    const expressionCandidates = this.matchRulesAndEmitCandidates(
      allMechanismCandidates,
      career10HFoundation,
      career10LFoundation
    );

    // Dedupe by (expressionType, canonical-source-set) merging provenance
    const deduplicatedCandidates = deduplicateExpressionCandidates(expressionCandidates);

    // Canonical sort
    const sortedCandidates = canonicalSortExpressionCandidates(deduplicatedCandidates);

    // Determine status based on missing inputs
    const status = this.determineStatus(missingInputs, sortedCandidates);

    // Build aggregate provenance
    const aggregateProvenance = this.buildAggregateProvenance(sortedCandidates);

    // Extract source mechanism IDs
    const sourceMechanismIds = Object.freeze(
      allMechanismCandidates.map(c => c.candidateId).sort()
    );

    // Find unmapped mechanism types (those with no matching rule)
    const unmappedMechanismTypes = this.findUnmappedMechanismTypes(
      allMechanismCandidates,
      sortedCandidates
    );

    // Return frozen result
    return Object.freeze({
      expressions: sortedCandidates,
      status,
      sourceMechanismIds,
      missingInputs: Object.freeze(missingInputs),
      unmappedMechanismTypes,
      provenance: aggregateProvenance
    });
  }

  /**
   * Normalizes mechanism candidates by combining base candidates with refinements.
   * Refinements are treated as additional sources for expression resolution.
   *
   * @param baseCandidates - Base mechanism candidates
   * @param refinements - Optional refined mechanism candidates
   * @returns Combined array of mechanism candidates
   */
  private normalizeMechanismCandidates(
    baseCandidates: readonly CareerMechanismCandidate[],
    refinements?: readonly CareerMechanismCandidate[]
  ): readonly CareerMechanismCandidate[] {
    if (!refinements || refinements.length === 0) {
      return baseCandidates;
    }

    // Combine and deduplicate by candidateId
    const candidateMap = new Map<string, CareerMechanismCandidate>();

    for (const candidate of baseCandidates) {
      candidateMap.set(candidate.candidateId, candidate);
    }

    for (const refinement of refinements) {
      candidateMap.set(refinement.candidateId, refinement);
    }

    return Object.freeze(
      Array.from(candidateMap.values()).sort((a, b) =>
        a.candidateId.localeCompare(b.candidateId)
      )
    );
  }

  /**
   * Matches rules against mechanism types and emits expression candidates.
   * Per spec: emit candidate per matched rule.
   *
   * For composite rules, all matching mechanisms are grouped into one expression.
   * For 1:1 rules, all matching mechanisms of the same type are grouped into one expression.
   * Composite rules do NOT suppress 1:1 rules - both are emitted (additive behavior).
   * Dominance/primacy belongs to P2-08B convergence, not the resolver.
   *
   * @param mechanismCandidates - Mechanism candidates to match against rules
   * @param career10HFoundation - Optional 10H foundation for context refinement
   * @param career10LFoundation - Optional 10L foundation for context refinement
   * @returns Array of expression candidates
   */
  private matchRulesAndEmitCandidates(
    mechanismCandidates: readonly CareerMechanismCandidate[],
    career10HFoundation?: Career10HFoundation,
    career10LFoundation?: Career10LFoundation
  ): CareerExpressionCandidate[] {
    const expressionCandidates: CareerExpressionCandidate[] = [];

    // Collect all mechanism types from candidates
    const mechanismTypes = new Set<CareerMechanismType>(
      mechanismCandidates.map(c => c.mechanismType)
    );

    // Process all rules (both composite and 1:1) - additive behavior
    for (const rule of CAREER_EXPRESSION_RULES) {
      // Check if all required mechanism types are present
      const hasAllMechanismTypes = rule.mechanismTypes.every(type =>
        mechanismTypes.has(type)
      );

      if (!hasAllMechanismTypes) {
        continue;
      }

      // For composite rules, check minimum mechanism count
      if (rule.requiredContext?.composite) {
        const minCount = rule.requiredContext.minMechanismCount ?? 2;
        const matchingCount = rule.mechanismTypes.filter(type =>
          mechanismTypes.has(type)
        ).length;

        if (matchingCount < minCount) {
          continue;
        }
      }

      // Group all matching mechanisms into one expression
      const matchingMechanisms = mechanismCandidates.filter(c =>
        rule.mechanismTypes.includes(c.mechanismType)
      );

      if (matchingMechanisms.length === 0) {
        continue;
      }

      const expressionCandidate = this.createExpressionCandidate(
        rule,
        matchingMechanisms,
        career10HFoundation,
        career10LFoundation
      );

      expressionCandidates.push(expressionCandidate);
    }

    return expressionCandidates;
  }

  /**
   * Creates an expression candidate from a rule and matching mechanisms.
   * 10H/10L context is added as optional refinement to evidence/provenance only.
   *
   * @param rule - The expression rule that matched
   * @param matchingMechanisms - The mechanism candidates that matched the rule
   * @param career10HFoundation - Optional 10H foundation for context refinement
   * @param career10LFoundation - Optional 10L foundation for context refinement
   * @returns Expression candidate
   */
  private createExpressionCandidate(
    rule: CareerExpressionRule,
    matchingMechanisms: readonly CareerMechanismCandidate[],
    career10HFoundation?: Career10HFoundation,
    career10LFoundation?: Career10LFoundation
  ): CareerExpressionCandidate {
    const sourceMechanismIds = Object.freeze(
      matchingMechanisms.map(m => m.candidateId).sort()
    );

    // Canonicalize mechanismTypes: dedupe + sort + freeze
    const mechanismTypes = Object.freeze(
      [...new Set(matchingMechanisms.map(m => m.mechanismType))].sort()
    );

    const expressionId = createCareerExpressionId(
      rule.expressionType,
      sourceMechanismIds
    );

    // Determine pathway: use shared pathway if all match, otherwise COMBINED
    const pathway = this.determineExpressionPathway(matchingMechanisms);

    // Extract real 10H/10L provenance IDs from typed foundations
    const source10HIds = this.extract10HProvenanceIds(career10HFoundation);
    const source10LIds = this.extract10LProvenanceIds(career10LFoundation);

    // Create evidence for each matching mechanism
    const evidence: CareerMechanismExpressionEvidence[] = matchingMechanisms.map(mechanism => {
      const sourceEvidenceIds = Object.freeze(
        mechanism.evidence.map(e => e.evidenceId).sort()
      );

      const evidenceId = createExpressionEvidenceId(
        rule.ruleId,
        mechanism.candidateId,
        sourceEvidenceIds
      );

      return Object.freeze({
        evidenceId,
        sourceMechanismId: mechanism.candidateId,
        sourceEvidenceIds,
        source10HIds: source10HIds.length > 0 ? source10HIds : undefined,
        source10LIds: source10LIds.length > 0 ? source10LIds : undefined,
        ruleId: rule.ruleId,
        role: 'ESTABLISHING'
      });
    });

    // Build provenance from matching mechanisms
    const provenance = this.buildExpressionProvenance(matchingMechanisms, evidence);

    return Object.freeze({
      expressionId,
      expressionType: rule.expressionType,
      sourceMechanismIds,
      mechanismTypes,
      status: 'CANDIDATE',
      pathway,
      evidence: Object.freeze(evidence),
      provenance
    });
  }

  /**
   * Determines the expression pathway from source mechanisms.
   * If all mechanisms share the same pathway, use it.
   * If they differ, use 'COMBINED'.
   *
   * @param mechanisms - Source mechanism candidates
   * @returns Expression pathway
   */
  private determineExpressionPathway(
    mechanisms: readonly CareerMechanismCandidate[]
  ): 'COMBINED' | CareerMechanismPathway {
    if (mechanisms.length === 0) {
      return 'PATTERN'; // Fallback, should never happen
    }

    if (mechanisms.length === 1) {
      return mechanisms[0].pathway;
    }

    // Check if all pathways are the same
    const firstPathway = mechanisms[0].pathway;
    const allSame = mechanisms.every(m => m.pathway === firstPathway);

    if (allSame) {
      return firstPathway;
    }

    // Pathways differ, use COMBINED
    return 'COMBINED';
  }

  /**
   * Extracts real provenance IDs from Career10HFoundation.
   * Extracts context identity keys, houseLordship evidence IDs, and drishtiAspectIds.
   * Returns empty array if foundation is absent or has no relevant IDs.
   *
   * @param foundation - Optional 10H foundation
   * @returns Array of real provenance IDs
   */
  private extract10HProvenanceIds(
    foundation?: Career10HFoundation
  ): readonly string[] {
    if (!foundation) {
      return Object.freeze([]);
    }

    const ids: string[] = [];

    // Extract from lagna context
    if (foundation.lagnaContext) {
      const ctx = foundation.lagnaContext;
      // Context identity key (lagnaRelativeHouseNumber as string)
      ids.push(`10H_LAGNA_${ctx.lagnaRelativeHouseNumber}`);
      // House lordship evidence ID
      if (ctx.provenance.houseLordshipEvidenceId) {
        ids.push(ctx.provenance.houseLordshipEvidenceId);
      }
      // Drishti aspect IDs
      ids.push(...ctx.provenance.drishtiAspectIds);
    }

    // Extract from moon context
    if (foundation.moonContext) {
      const ctx = foundation.moonContext;
      // Context identity key (lagnaRelativeHouseNumber as string)
      ids.push(`10H_MOON_${ctx.lagnaRelativeHouseNumber}`);
      // House lordship evidence ID
      if (ctx.provenance.houseLordshipEvidenceId) {
        ids.push(ctx.provenance.houseLordshipEvidenceId);
      }
      // Drishti aspect IDs
      ids.push(...ctx.provenance.drishtiAspectIds);
    }

    return Object.freeze(ids.sort());
  }

  /**
   * Extracts real provenance IDs from Career10LFoundation.
   * Extracts condition provenanceIds, relationship identityKeys, and statuses.
   * Returns empty array if foundation is absent or has no relevant IDs.
   *
   * @param foundation - Optional 10L foundation
   * @returns Array of real provenance IDs
   */
  private extract10LProvenanceIds(
    foundation?: Career10LFoundation
  ): readonly string[] {
    if (!foundation) {
      return Object.freeze([]);
    }

    const ids: string[] = [];

    // Extract from lagna context
    if (foundation.lagnaContext) {
      const ctx = foundation.lagnaContext;
      // Condition source rule IDs
      ids.push(...ctx.condition.sourceRuleIds);
      // Relationship identity keys
      ids.push(...ctx.relationships.map(r => r.relationshipId));
      // Status marker
      ids.push(`10L_LAGNA_STATUS_${ctx.condition.status}`);
    }

    // Extract from moon context
    if (foundation.moonContext) {
      const ctx = foundation.moonContext;
      // Condition source rule IDs
      ids.push(...ctx.condition.sourceRuleIds);
      // Relationship identity keys
      ids.push(...ctx.relationships.map(r => r.relationshipId));
      // Status marker
      ids.push(`10L_MOON_STATUS_${ctx.condition.status}`);
    }

    return Object.freeze(ids.sort());
  }

  /**
   * Builds expression provenance from mechanism candidates and evidence.
   *
   * @param mechanismCandidates - Mechanism candidates
   * @param evidence - Expression evidence
   * @returns Expression provenance
   */
  private buildExpressionProvenance(
    mechanismCandidates: readonly CareerMechanismCandidate[],
    evidence: readonly CareerMechanismExpressionEvidence[]
  ): CareerExpressionProvenance {
    const mechanismIds = Object.freeze(
      mechanismCandidates.map(m => m.candidateId).sort()
    );

    const patternIds = Object.freeze(
      mechanismCandidates.flatMap(m => m.provenance.patternIds).sort()
    );

    const relationshipIds = Object.freeze(
      mechanismCandidates.flatMap(m => m.provenance.relationshipIds).sort()
    );

    const evidenceIds = Object.freeze(
      evidence.map(e => e.evidenceId).sort()
    );

    const sourceStages = Object.freeze(
      mechanismCandidates.flatMap(m => m.provenance.sourceStages).sort()
    );

    return Object.freeze({
      mechanismIds,
      patternIds,
      relationshipIds,
      evidenceIds,
      sourceStages
    });
  }

  /**
   * Builds aggregate provenance from all expression candidates.
   *
   * @param expressionCandidates - Expression candidates
   * @returns Aggregate provenance
   */
  private buildAggregateProvenance(
    expressionCandidates: readonly CareerExpressionCandidate[]
  ): CareerExpressionProvenance {
    return mergeExpressionProvenances(
      ...expressionCandidates.map(c => c.provenance)
    );
  }

  /**
   * Determines the analysis status based on missing inputs and candidates.
   * Per spec: missing input ≠ negative, emit PARTIAL/INSUFFICIENT_DATA only.
   * Status is INSUFFICIENT_DATA only when no mechanism candidates exist.
   * When mechanism candidates exist but no rules match, status is COMPLETE/PARTIAL
   * with unmappedMechanismTypes populated.
   *
   * @param missingInputs - Array of missing input names
   * @param candidates - Expression candidates
   * @returns Analysis status
   */
  private determineStatus(
    missingInputs: readonly string[],
    candidates: readonly CareerExpressionCandidate[]
  ): 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' {
    // Status is determined by missing inputs, not by lack of expressions
    // (no expressions can be valid if mechanisms exist but have no matching rules)
    if (missingInputs.length > 0) {
      return 'PARTIAL';
    }

    return 'COMPLETE';
  }

  /**
   * Creates an INSUFFICIENT_DATA result when no mechanism candidates are available.
   *
   * @param missingInputs - Array of missing input names
   * @returns Frozen INSUFFICIENT_DATA result
   */
  private createInsufficientDataResult(
    missingInputs: readonly string[]
  ): CareerExpressionAnalysisResult {
    return Object.freeze({
      expressions: Object.freeze([]),
      status: 'INSUFFICIENT_DATA',
      sourceMechanismIds: Object.freeze([]),
      missingInputs: Object.freeze(missingInputs),
      unmappedMechanismTypes: Object.freeze([]),
      provenance: Object.freeze({
        mechanismIds: Object.freeze([]),
        patternIds: Object.freeze([]),
        relationshipIds: Object.freeze([]),
        evidenceIds: Object.freeze([]),
        sourceStages: Object.freeze([])
      })
    });
  }

  /**
   * Finds mechanism types that have no matching expression rule.
   * Distinguishes no-rule from insufficient-data scenarios.
   *
   * @param mechanismCandidates - All mechanism candidates
   * @param expressionCandidates - Emitted expression candidates
   * @returns Array of unmapped mechanism types
   */
  private findUnmappedMechanismTypes(
    mechanismCandidates: readonly CareerMechanismCandidate[],
    expressionCandidates: readonly CareerExpressionCandidate[]
  ): readonly CareerMechanismType[] {
    // Collect all mechanism types from candidates
    const inputMechanismTypes = new Set<CareerMechanismType>(
      mechanismCandidates.map(c => c.mechanismType)
    );

    // Collect all mechanism types that were used in expressions
    const mappedMechanismTypes = new Set<CareerMechanismType>();
    for (const expression of expressionCandidates) {
      for (const type of expression.mechanismTypes) {
        mappedMechanismTypes.add(type);
      }
    }

    // Find unmapped types
    const unmapped: CareerMechanismType[] = [];
    for (const type of inputMechanismTypes) {
      if (!mappedMechanismTypes.has(type)) {
        unmapped.push(type);
      }
    }

    return Object.freeze(unmapped.sort());
  }
}

/**
 * Default instance of the career expression resolver.
 */
export const defaultCareerExpressionResolver = Object.freeze(
  new DefaultCareerExpressionResolver()
);
