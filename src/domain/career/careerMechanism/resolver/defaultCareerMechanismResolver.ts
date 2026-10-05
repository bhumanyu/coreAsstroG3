import type {
  CareerMechanismCandidate,
  CareerMechanismCandidateSet,
  CareerMechanismEvidence,
  CareerMechanismPathway,
  CareerMechanismProvenance,
  CareerMechanismType
} from '../careerMechanismTypes';
import type {
  CareerMechanismResolutionInput,
  CareerMechanismResolver
} from './careerMechanismResolverTypes';
import { CAREER_MECHANISM_RESOLUTION_RULES } from './careerMechanismResolverRules';
import {
  createCareerMechanismCandidate,
  createCareerMechanismCandidateId
} from '../careerMechanismUtils';
import { buildCareerMechanismEvidence } from '../careerMechanismEvidence';
import { buildCareerMechanismProvenance } from '../careerMechanismProvenance';
import { createCareerMechanismCandidateSet } from './careerMechanismResolverUtils';

/**
 * P2-07D Default Career Mechanism Resolver
 *
 * This module implements the default mechanism resolver that maps pattern structural
 * facts to mechanism candidates. Per spec §25: only proven mappings initially, based on
 * dusthana transformation patterns (8↔10, 12↔10, composite 8-12-10).
 *
 * RESOLUTION PIPELINE:
 * 1. Validate input (pattern present, qualification gating)
 * 2. Filter applicable rules preserving registry order
 * 3. FlatMap resolve() results, dedupe mechanism types
 * 4. Build candidates with evidence and provenance
 * 5. Return CandidateSet per pattern (never merged)
 *
 * QUALIFICATION GATING POLICY:
 * - UNQUALIFIED: Skip resolution, return empty CandidateSet
 * - QUALIFIED: Resolve normally
 * - INSUFFICIENT_DATA: Resolve structurally (fallback to pattern-level facts)
 *
 * This policy ensures that unqualified patterns don't produce candidates, while
 * patterns with insufficient data can still generate structurally-valid candidates
 * for downstream consumption. This is a deliberate design choice to avoid blocking
 * the pipeline when qualification data is missing but pattern structure is valid.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - any AI/profession module
 */

/**
 * Default implementation of CareerMechanismResolver.
 */
export class DefaultCareerMechanismResolver implements CareerMechanismResolver {
  /**
   * Resolves mechanism candidates for a single pattern.
   *
   * @param input - The resolution input containing pattern, qualification, roles, evidence, and networks
   * @returns CandidateSet with candidates, evidence, and provenance
   */
  resolve(input: CareerMechanismResolutionInput): CareerMechanismCandidateSet {
    const { pattern, qualification, participantRoles, establishingEvidence, networks } = input;

    // (a) Validate input - pattern must be present
    if (!pattern) {
      throw new Error('Pattern is required for mechanism resolution');
    }

    // (a) Qualification gating - skip UNQUALIFIED patterns
    // INSUFFICIENT_DATA: resolve structurally (policy choice documented above)
    if (qualification.status === 'UNQUALIFIED') {
      // Return empty candidate set for unqualified patterns
      return createCareerMechanismCandidateSet(pattern.patternId, []);
    }

    // (b) Filter applicable rules preserving registry order
    // COMPOSITE-SUBSUMPTION PRECEDENCE: If composite rule applies, exclude pair rules
    const compositeRule = CAREER_MECHANISM_RESOLUTION_RULES.find(
      (rule) => rule.ruleId === 'RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10'
    );

    const applicableRules = CAREER_MECHANISM_RESOLUTION_RULES.filter((rule) => {
      const applies = rule.applies(input);

      // If composite applies, exclude pair rules
      if (compositeRule && compositeRule.applies(input)) {
        if (rule.ruleId === 'RULE_MECHANISM_PATTERN_DUSTHANA_8_10' ||
          rule.ruleId === 'RULE_MECHANISM_PATTERN_DUSTHANA_12_10') {
          return false;
        }
      }

      return applies;
    });

    // (c) FlatMap resolve() results from all applicable rules
    const allMechanismTypes = applicableRules.flatMap((rule) => rule.resolve(input));

    // Dedupe mechanism types preserving deterministic sort
    const uniqueMechanismTypes = Array.from(new Set(allMechanismTypes)).sort();

    // If no mechanism types resolved, return empty candidate set
    if (uniqueMechanismTypes.length === 0) {
      return createCareerMechanismCandidateSet(pattern.patternId, []);
    }

    // (d)-(e) Build candidates with evidence and provenance
    const candidates: CareerMechanismCandidate[] = [];

    for (const mechanismType of uniqueMechanismTypes) {
      const candidateId = createCareerMechanismCandidateId(pattern.patternId, mechanismType);
      const pathway: CareerMechanismPathway = 'PATTERN';

      // Build evidence for this candidate
      const evidence = this.buildCandidateEvidence(
        pattern.patternId,
        candidateId,
        mechanismType,
        pathway,
        input
      );

      // Build provenance for this candidate
      const provenance = this.buildCandidateProvenance(
        pattern.patternId,
        input
      );

      // Build explanation
      const explanation = this.buildExplanation(mechanismType, input);

      // Create candidate
      const candidate = createCareerMechanismCandidate(
        pattern.patternId,
        mechanismType,
        pathway,
        evidence,
        provenance,
        explanation
      );

      candidates.push(candidate);
    }

    // (f) Return CandidateSet via utility
    return createCareerMechanismCandidateSet(pattern.patternId, candidates);
  }

  /**
   * Resolves mechanism candidates for multiple patterns.
   * Returns one CandidateSet per input pattern, never merged.
   *
   * @param inputs - Array of resolution inputs
   * @returns Array of CandidateSets (one per input)
   */
  resolveAll(
    inputs: readonly CareerMechanismResolutionInput[]
  ): readonly CareerMechanismCandidateSet[] {
    // Map resolve per input, never merge
    const candidateSets = inputs.map((input) => this.resolve(input));

    // Return frozen array
    return Object.freeze(candidateSets);
  }

  /**
   * Builds evidence for a mechanism candidate.
   * Uses source 'PATTERN' for pattern-derived evidence and 'PARTICIPANT_ROLE'
   * where participant roles contributed. Incorporates establishingEvidence from
   * the input if present.
   *
   * @param patternId - The pattern ID
   * @param candidateId - The candidate ID
   * @param mechanismType - The mechanism type
   * @param pathway - The mechanism pathway
   * @param input - The resolution input
   * @returns Frozen array of evidence records
   */
  private buildCandidateEvidence(
    patternId: string,
    candidateId: string,
    mechanismType: CareerMechanismType,
    pathway: CareerMechanismPathway,
    input: CareerMechanismResolutionInput
  ): readonly CareerMechanismEvidence[] {
    const evidence: CareerMechanismEvidence[] = [];

    // Add PATTERN evidence (pattern-derived)
    const patternEvidence = buildCareerMechanismEvidence({
      mechanismId: candidateId,
      mechanismType,
      source: 'PATTERN',
      patternId,
      explanation: `Mechanism ${mechanismType} derived from pattern ${patternId} structural facts`
    });
    evidence.push(patternEvidence);

    // Add PARTICIPANT_ROLE evidence if participant roles are present
    if (input.participantRoles.length > 0) {
      const participantIds = input.participantRoles.map((role) => role.participantId);
      const roleEvidence = buildCareerMechanismEvidence({
        mechanismId: candidateId,
        mechanismType,
        source: 'PARTICIPANT_ROLE',
        participantIds,
        patternId,
        explanation: `Participant roles ${participantIds.join(', ')} contributed to mechanism ${mechanismType}`
      });
      evidence.push(roleEvidence);
    }

    // Add RELATIONSHIP evidence from establishing relationships
    const establishingRelationshipIds = input.pattern.provenance.establishingRelationshipIds;
    if (establishingRelationshipIds.length > 0) {
      const relationshipEvidence = buildCareerMechanismEvidence({
        mechanismId: candidateId,
        mechanismType,
        source: 'RELATIONSHIP',
        relationshipIds: establishingRelationshipIds,
        patternId,
        explanation: `Establishing relationships ${establishingRelationshipIds.join(', ')} support mechanism ${mechanismType}`
      });
      evidence.push(relationshipEvidence);
    }

    // Incorporate establishingEvidence from input if present
    // This allows upstream layers to pre-build evidence that flows into the resolver
    if (input.establishingEvidence.length > 0) {
      for (const ev of input.establishingEvidence) {
        // Only include evidence that matches this mechanism type
        if (ev.mechanismType === mechanismType) {
          evidence.push(ev);
        }
      }
    }

    // Return frozen array
    return Object.freeze(evidence);
  }

  /**
   * Builds provenance for a mechanism candidate.
   * Uses the P2-07C provenance builder.
   *
   * @param patternId - The pattern ID
   * @param input - The resolution input
   * @returns Frozen provenance record
   */
  private buildCandidateProvenance(
    patternId: string,
    input: CareerMechanismResolutionInput
  ): CareerMechanismProvenance {
    // Extract participant IDs from participant roles
    const participantIds = input.participantRoles.map((role) => role.participantId);

    // Extract relationship IDs from pattern provenance
    const relationshipIds = input.pattern.provenance.establishingRelationshipIds;

    // Extract source stages from evidence
    const sourceStages = input.establishingEvidence.map((ev) => ev.source);

    // Build provenance using P2-07C builder
    return buildCareerMechanismProvenance({
      patternIds: [patternId],
      relationshipIds,
      participantIds,
      evidenceIds: input.establishingEvidence.map((ev) => ev.evidenceId),
      sourceStages
    });
  }

  /**
   * Builds an explanation for a mechanism candidate.
   *
   * @param mechanismType - The mechanism type
   * @param input - The resolution input
   * @returns Explanation string
   */
  private buildExplanation(
    mechanismType: CareerMechanismType,
    input: CareerMechanismResolutionInput
  ): string {
    const { pattern, qualification } = input;

    const houses = pattern.houses.join(', ');
    const patternName = pattern.name;

    return `Mechism ${mechanismType} candidate for pattern ${patternName} (houses ${houses}). ` +
      `Qualification status: ${qualification.status}. ` +
      `Derived from pattern structural facts and establishing relationships.`;
  }
}

/**
 * Default resolver instance.
 * Exported for use across the Career domain.
 */
export const defaultCareerMechanismResolver = Object.freeze(
  new DefaultCareerMechanismResolver()
);
