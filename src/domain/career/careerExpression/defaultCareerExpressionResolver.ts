import type {
  CareerExpressionCandidate,
  CareerExpressionEvidence,
  CareerExpressionProvenance,
  CareerExpressionAnalysisResult,
  CareerExpressionResolverInput
} from './careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismType
} from '../careerMechanism';
import { CAREER_EXPRESSION_RULES } from './careerExpressionRules';
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

    // Check for insufficient data
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

    // Return frozen result
    return Object.freeze({
      expressions: sortedCandidates,
      status,
      sourceMechanismIds,
      missingInputs: Object.freeze(missingInputs),
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
   * Composite rules have precedence over 1:1 rules for the same mechanism types.
   *
   * @param mechanismCandidates - Mechanism candidates to match against rules
   * @param career10HFoundation - Optional 10H foundation for context refinement
   * @param career10LFoundation - Optional 10L foundation for context refinement
   * @returns Array of expression candidates
   */
  private matchRulesAndEmitCandidates(
    mechanismCandidates: readonly CareerMechanismCandidate[],
    career10HFoundation?: unknown,
    career10LFoundation?: unknown
  ): CareerExpressionCandidate[] {
    const expressionCandidates: CareerExpressionCandidate[] = [];

    // Collect all mechanism types from candidates
    const mechanismTypes = new Set<CareerMechanismType>(
      mechanismCandidates.map(c => c.mechanismType)
    );

    // Track which mechanism types have been used by composite rules
    const mechanismTypesUsedByComposite = new Set<CareerMechanismType>();

    // First, process composite rules (higher precedence)
    for (const rule of CAREER_EXPRESSION_RULES) {
      if (!rule.requiredContext?.composite) {
        continue;
      }

      // Check if all required mechanism types are present
      const hasAllMechanismTypes = rule.mechanismTypes.every(type =>
        mechanismTypes.has(type)
      );

      if (!hasAllMechanismTypes) {
        continue;
      }

      // Check minimum mechanism count
      const minCount = rule.requiredContext.minMechanismCount ?? 2;
      const matchingCount = rule.mechanismTypes.filter(type =>
        mechanismTypes.has(type)
      ).length;

      if (matchingCount < minCount) {
        continue;
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

      // Mark these mechanism types as used by composite
      rule.mechanismTypes.forEach(type => mechanismTypesUsedByComposite.add(type));
    }

    // Then, process 1:1 rules (only for mechanism types not used by composite)
    for (const rule of CAREER_EXPRESSION_RULES) {
      if (rule.requiredContext?.composite) {
        continue;
      }

      // Skip if any of this rule's mechanism types were used by a composite rule
      if (rule.mechanismTypes.some(type => mechanismTypesUsedByComposite.has(type))) {
        continue;
      }

      // Check if all required mechanism types are present
      const hasAllMechanismTypes = rule.mechanismTypes.every(type =>
        mechanismTypes.has(type)
      );

      if (!hasAllMechanismTypes) {
        continue;
      }

      // Group all matching mechanisms of this type into one expression
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
    rule: {
      readonly ruleId: string;
      readonly expressionType: string;
      readonly mechanismTypes: readonly CareerMechanismType[];
    },
    matchingMechanisms: readonly CareerMechanismCandidate[],
    career10HFoundation?: unknown,
    career10LFoundation?: unknown
  ): CareerExpressionCandidate {
    const sourceMechanismIds = Object.freeze(
      matchingMechanisms.map(m => m.candidateId).sort()
    );

    const mechanismTypes = Object.freeze(
      matchingMechanisms.map(m => m.mechanismType)
    );

    const expressionId = createCareerExpressionId(
      rule.expressionType,
      sourceMechanismIds
    );

    // Determine pathway (use the first matching mechanism's pathway)
    const pathway = matchingMechanisms[0].pathway;

    // Create evidence for each matching mechanism
    const evidence: CareerExpressionEvidence[] = matchingMechanisms.map(mechanism => {
      const sourceEvidenceIds = Object.freeze(
        mechanism.evidence.map(e => e.evidenceId).sort()
      );

      const evidenceId = createExpressionEvidenceId(
        rule.ruleId,
        mechanism.candidateId,
        sourceEvidenceIds
      );

      // Add 10H/10L context as optional refinement (never establishes expression)
      const source10HIds = career10HFoundation
        ? Object.freeze([`10H_REF:${expressionId}`])
        : undefined;

      const source10LIds = career10LFoundation
        ? Object.freeze([`10L_REF:${expressionId}`])
        : undefined;

      return Object.freeze({
        evidenceId,
        sourceMechanismId: mechanism.candidateId,
        sourceEvidenceIds,
        source10HIds,
        source10LIds,
        ruleId: rule.ruleId,
        role: 'ESTABLISHING'
      });
    });

    // Build provenance from matching mechanisms
    const provenance = this.buildExpressionProvenance(matchingMechanisms, evidence);

    return Object.freeze({
      expressionId,
      expressionType: rule.expressionType as any,
      sourceMechanismIds,
      mechanismTypes,
      status: 'CANDIDATE',
      pathway,
      evidence: Object.freeze(evidence),
      provenance
    });
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
    evidence: readonly CareerExpressionEvidence[]
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
   *
   * @param missingInputs - Array of missing input names
   * @param candidates - Expression candidates
   * @returns Analysis status
   */
  private determineStatus(
    missingInputs: readonly string[],
    candidates: readonly CareerExpressionCandidate[]
  ): 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA' {
    if (candidates.length === 0) {
      return 'INSUFFICIENT_DATA';
    }

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
      provenance: Object.freeze({
        mechanismIds: Object.freeze([]),
        patternIds: Object.freeze([]),
        relationshipIds: Object.freeze([]),
        evidenceIds: Object.freeze([]),
        sourceStages: Object.freeze([])
      })
    });
  }
}

/**
 * Default instance of the career expression resolver.
 */
export const defaultCareerExpressionResolver = Object.freeze(
  new DefaultCareerExpressionResolver()
);
