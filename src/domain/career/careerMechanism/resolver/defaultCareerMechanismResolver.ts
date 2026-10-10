import type {
  CareerMechanismCandidate,
  CareerMechanismCandidateSet,
  CareerMechanismEvidence,
  CareerMechanismEvidenceSource,
  CareerMechanismPathway,
  CareerMechanismProvenance,
  CareerMechanismType,
  ParticipantId
} from '../careerMechanismTypes';
import type {
  CareerMechanismResolutionInput,
  CareerMechanismResolver,
  PatternLevelEstablishingEvidence
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
 * Structural evidence sources allowed for establishing evidence.
 * These are the only sources that can flow into provenance as establishing evidence.
 * Later-stage inputs (D10, DISPOSITOR, PLANETARY_RELEVANCE, PLANETARY_CONDITION,
 * LORDSHIP, YOGA, DASHA) are filtered out at the firewall.
 */
const ESTABLISHING_EVIDENCE_SOURCES: ReadonlySet<CareerMechanismEvidenceSource> = Object.freeze(
  new Set<CareerMechanismEvidenceSource>(['PATTERN', 'PARTICIPANT_ROLE', 'RELATIONSHIP'])
);

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

      // Build evidence for this candidate (must be built before provenance)
      const [evidence, acceptedEstablishingEvidenceIds, _rejectedEstablishingEvidenceIds, _firewallExcludedEstablishingEvidenceIds] = this.buildCandidateEvidence(
        pattern.patternId,
        candidateId,
        mechanismType,
        pathway,
        input
      );

      // Build provenance for this candidate (uses evidence IDs from built evidence)
      const provenance = this.buildCandidateProvenance(
        pattern.patternId,
        input,
        evidence
      );

      // Build explanation
      const explanation = this.buildExplanation(mechanismType, input);

      // Create candidate with accepted, rejected, and firewall-excluded establishing evidence IDs
      const candidate = createCareerMechanismCandidate(
        pattern.patternId,
        mechanismType,
        pathway,
        evidence,
        provenance,
        explanation,
        acceptedEstablishingEvidenceIds.length > 0 ? acceptedEstablishingEvidenceIds : undefined,
        _rejectedEstablishingEvidenceIds.length > 0 ? _rejectedEstablishingEvidenceIds : undefined,
        _firewallExcludedEstablishingEvidenceIds.length > 0 ? _firewallExcludedEstablishingEvidenceIds : undefined
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
   * the input if present, filtered to structural sources only.
   *
   * Pattern-level establishing evidence (without mechanismType) is attached to
   * all candidates derived from the pattern. Typed establishing evidence (with
   * mechanismType) is attached only to matching mechanism types. Both are gated
   * by ESTABLISHING_EVIDENCE_SOURCES on the source field.
   *
   * ESTABLISHING EVIDENCE VALIDATION:
   * Before accepting supplied establishing evidence, validates:
   * (a) ev.source passes ESTABLISHING_EVIDENCE_SOURCES (structural sources only)
   * (b) ev.role === 'ESTABLISHING'
   * (c) ev.patternId matches the current candidate's patternId
   * (d) mechanismType match (for typed evidence)
   *
   * Evidence failing any validation is rejected (not marked accepted) and not
   * used to derive establishingEvidenceStatus. This prevents silent acceptance
   * of evidence that doesn't meet the contract.
   *
   * NOTE: The resolver validates structural eligibility only (source + role + pattern reference
   * + mechanism-type match). It does NOT validate full provenance agreement (e.g., relationshipIds/
   * participantIds against the pattern's establishingRelationshipIds/participants). Full provenance
   * validation is a separate concern performed at the pattern qualification layer.
   *
   * FIREWALL EXCLUSION:
   * Evidence whose source is not in ESTABLISHING_EVIDENCE_SOURCES is excluded
   * by the firewall and tracked separately in firewallExcludedEstablishingEvidenceIds.
   * This is distinct from validation rejection: firewall-excluded evidence is
   * structurally valid for later stages but ineligible for establishing provenance.
   *
   * Returns a tuple of [evidence array, accepted establishing evidence IDs,
   * rejected establishing evidence IDs, firewall-excluded establishing evidence IDs].
   * The accepted IDs track which supplied establishing evidence was validated and
   * attached to this candidate (used by orchestrator to derive status). The rejected
   * IDs track evidence that was supplied but failed validation (used to distinguish
   * "rejected" from "signal absent"). The firewall-excluded IDs track evidence that
   * was filtered out by the source firewall (used to distinguish "excluded" from "rejected").
   *
   * @param patternId - The pattern ID
   * @param candidateId - The candidate ID
   * @param mechanismType - The mechanism type
   * @param pathway - The mechanism pathway
   * @param input - The resolution input
   * @returns Frozen array of evidence records, accepted establishing evidence IDs, rejected establishing evidence IDs, and firewall-excluded establishing evidence IDs
   */
  private buildCandidateEvidence(
    patternId: string,
    candidateId: string,
    mechanismType: CareerMechanismType,
    pathway: CareerMechanismPathway,
    input: CareerMechanismResolutionInput
  ): readonly [readonly CareerMechanismEvidence[], readonly string[], readonly string[], readonly string[]] {
    const evidence: CareerMechanismEvidence[] = [];
    const acceptedEstablishingEvidenceIds: string[] = [];
    const rejectedEstablishingEvidenceIds: string[] = [];
    const firewallExcludedEstablishingEvidenceIds: string[] = [];

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

    // Incorporate establishingEvidence from input if present, filtered to structural sources only
    // This firewall ensures only PATTERN, PARTICIPANT_ROLE, and RELATIONSHIP sources flow into provenance
    // Later-stage inputs (D10, DISPOSITOR, PLANETARY_RELEVANCE, PLANETARY_CONDITION, LORDSHIP, YOGA, DASHA)
    // are filtered out here.
    if (input.establishingEvidence.length > 0) {
      for (const ev of input.establishingEvidence) {
        // Source firewall: only structural sources allowed
        if (!ESTABLISHING_EVIDENCE_SOURCES.has(ev.source)) {
          // Track as firewall-excluded (distinct from validation rejection)
          firewallExcludedEstablishingEvidenceIds.push(ev.evidenceId);
          continue;
        }

        // Validate role: must be ESTABLISHING
        if (ev.role !== 'ESTABLISHING') {
          rejectedEstablishingEvidenceIds.push(ev.evidenceId);
          continue;
        }

        // Validate patternId: must match current candidate's patternId
        if (ev.patternId !== patternId) {
          rejectedEstablishingEvidenceIds.push(ev.evidenceId);
          continue;
        }

        // Pattern-level evidence (no mechanismType): attach to all candidates
        if (ev.mechanismType === undefined) {
          evidence.push({
            evidenceId: ev.evidenceId,
            mechanismType,
            source: ev.source,
            role: ev.role,
            participantIds: ev.participantIds as readonly ParticipantId[],
            relationshipIds: ev.relationshipIds,
            patternId: ev.patternId,
            explanation: ev.explanation
          });
          // Track this as accepted establishing evidence
          acceptedEstablishingEvidenceIds.push(ev.evidenceId);
        }
        // Typed evidence: attach only to matching mechanism types
        else if (ev.mechanismType === mechanismType) {
          evidence.push({
            evidenceId: ev.evidenceId,
            mechanismType: ev.mechanismType,
            source: ev.source,
            role: ev.role,
            participantIds: ev.participantIds as readonly ParticipantId[],
            relationshipIds: ev.relationshipIds,
            patternId: ev.patternId,
            explanation: ev.explanation
          });
          // Track this as accepted establishing evidence
          acceptedEstablishingEvidenceIds.push(ev.evidenceId);
        } else {
          // Typed evidence with non-matching mechanismType - reject
          rejectedEstablishingEvidenceIds.push(ev.evidenceId);
        }
      }
    }

    // Return frozen array, accepted IDs, rejected IDs, and firewall-excluded IDs
    return Object.freeze([
      Object.freeze(evidence),
      Object.freeze(acceptedEstablishingEvidenceIds),
      Object.freeze(rejectedEstablishingEvidenceIds),
      Object.freeze(firewallExcludedEstablishingEvidenceIds)
    ]);
  }

  /**
   * Builds provenance for a mechanism candidate.
   * Uses the P2-07C provenance builder.
   *
   * @param patternId - The pattern ID
   * @param input - The resolution input
   * @param evidence - The evidence built for this candidate (must be built before provenance)
   * @returns Frozen provenance record
   */
  private buildCandidateProvenance(
    patternId: string,
    input: CareerMechanismResolutionInput,
    evidence: readonly CareerMechanismEvidence[]
  ): CareerMechanismProvenance {
    // Extract participant IDs from participant roles
    const participantIds = input.participantRoles.map((role) => role.participantId);

    // Extract relationship IDs from pattern provenance
    const relationshipIds = input.pattern.provenance.establishingRelationshipIds;

    // Extract source stages from the actual evidence attached to the candidate
    const sourceStages = evidence.map((ev) => ev.source);

    // Extract evidence IDs from the actual evidence attached to the candidate
    // Invariant: candidate.evidence[*].evidenceId (sorted) equals candidate.provenance.evidenceIds (sorted)
    const evidenceIds = evidence.map((ev) => ev.evidenceId);

    // Build provenance using P2-07C builder
    return buildCareerMechanismProvenance({
      patternIds: [patternId],
      relationshipIds,
      participantIds,
      evidenceIds,
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

    return `Mechanism ${mechanismType} candidate for pattern ${patternName} (houses ${houses}). ` +
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
