import type {
  CanonicalCareerFoundation,
  CanonicalCareerOrchestrationInput,
  CareerOrchestrationPorts,
  PatternCandidate,
  PatternQualification,
  ParticipantRoleAssignment,
  ResolvedMechanism,
  MechanismRefinement,
  CareerFoundationSupplement,
  IdentityMapping,
  RelationshipMapping,
  StageReference,
  OrchestrationDiagnostic,
  EvidenceIdentityKey,
  SourceId,
  RuleId,
  OccurrenceId,
  StageEvidence,
  EstablishingMechanismEvidence
} from './canonicalCareerContracts';
import { participantRoleAssignmentReferenceId } from './canonicalCareerContracts';
import type {
  CareerPatternQualificationStatus
} from '../careerPatternQualification/careerPatternQualificationTypes';
import type {
  PatternLevelEstablishingEvidence
} from '../careerMechanism/resolver';
import type {
  CareerDispositorContext
} from '../careerMechanism/dispositor';
import {
  validateCanonicalCareerFoundation,
  validateParticipantRoleAssignments
} from './canonicalCareerValidation';
import { collectRelevantDispositorContexts } from '../careerMechanism/dispositor/careerMechanismDispositorUtils';

function hasSemanticIdentityKey(value: unknown): value is EvidenceIdentityKey {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * P2-11B Canonical Career Orchestrator
 *
 * This module implements the canonical career orchestrator that composes outputs from
 * all career domain stages (C4–C7, P2-07A–E, 10H-10L) into a single immutable
 * CanonicalCareerFoundation.
 *
 * This is a COMPOSITION LAYER ONLY - it does NOT implement any astrology rules. It:
 * - Validates contracts and invariants
 * - Preserves identities and provenance from producers
 * - Composes existing engines via injected ports
 * - Records diagnostics for missing data and issues
 * - Represents missing data explicitly (never fabricates)
 *
 * QUALIFICATION GATING POLICY:
 * - UNQUALIFIED: Skip mechanism resolution (no candidates produced)
 * - QUALIFIED: Resolve mechanisms normally
 * - INSUFFICIENT_DATA: Resolve structurally (pattern-level facts only)
 *
 * This policy ensures that unqualified patterns don't produce mechanisms, while patterns
 * with insufficient data can still generate structurally-valid candidates for downstream
 * consumption. This matches the real DefaultCareerMechanismResolver behavior.
 *
 * STATUS VOCABULARY:
 * - Uses INSUFFICIENT_DATA instead of INDETERMINATE to match the repo's vocabulary
 * - INSUFFICIENT_DATA is NOT treated as negative/unqualified - it represents missing data
 *
 * BOUNDARY ENFORCEMENT: This module must NOT:
 * - Implement any astrology calculations or interpretations
 * - Import from careerDasha, careerD10, careerExpression, careerFinalSynthesis
 * - Import from domain/timing
 * - Perform qualification or mechanism resolution logic
 *
 * Only composition, validation, and diagnostic recording.
 */

/**
 * Canonical career orchestrator.
 * Composes career domain outputs into a single immutable foundation.
 */
export class CanonicalCareerOrchestrator {
  private readonly ports: CareerOrchestrationPorts;
  private readonly validStages: ReadonlySet<string>;

  /**
   * Creates a new canonical career orchestrator.
   *
   * @param ports - Orchestration ports (injected dependencies)
   */
  constructor(ports: CareerOrchestrationPorts) {
    this.ports = Object.freeze(ports);
    this.validStages = Object.freeze(
      new Set(['PATTERN', 'QUALIFICATION', 'PARTICIPANT_ROLES', 'MECHANISM', 'REFINEMENT', '10H', '10L'])
    );
  }

  /**
   * Orchestrates the canonical career foundation.
   *
   * @param input - Input from all production stages
   * @returns Immutable canonical career foundation
   */
  orchestrate(input: CanonicalCareerOrchestrationInput): CanonicalCareerFoundation {
    const foundationId = this.generateDeterministicFoundationId(input);
    const timestamp = 'DETERMINISTIC_TIMESTAMP';
    const diagnostics: OrchestrationDiagnostic[] = [];

    // Stage 1: Pattern candidates (C4/P2-03)
    const patternCandidates = this.buildPatternCandidates(input.patterns, diagnostics);

    // Stage 2: Pattern qualification (P2-07A)
    const patternQualifications = this.buildPatternQualifications(
      input.patterns,
      input.relevance,
      input.condition,
      patternCandidates,
      diagnostics
    );

    // Stage 3: Participant roles (P2-07B)
    const participantRoleAssignments = this.buildParticipantRoleAssignments(
      patternCandidates,
      patternQualifications,
      input.networks,
      input.condition,
      input.relevance,
      diagnostics
    );
    const roleAssignmentValidation = validateParticipantRoleAssignments(participantRoleAssignments);
    diagnostics.push(...roleAssignmentValidation.diagnostics);
    const invalidRolePatternIds = new Set(
      roleAssignmentValidation.diagnostics
        .filter(diagnostic => diagnostic.severity === 'ERROR')
        .map(diagnostic => diagnostic.relatedIds[0])
    );

    // Stage 4: Mechanism resolution (P2-07D)
    const resolvedMechanisms = this.buildResolvedMechanisms(
      patternCandidates,
      patternQualifications,
      participantRoleAssignments,
      input.networks,
      diagnostics
    );

    // Stage 5: Mechanism refinement (P2-07E)
    const mechanismRefinements = this.buildMechanismRefinements(
      resolvedMechanisms,
      input.dispositorContexts,
      participantRoleAssignments,
      invalidRolePatternIds,
      diagnostics
    );

    // Stage 6: 10H/10L supplements (P2-07F/G)
    const careerFoundationSupplements = this.buildCareerFoundationSupplements(
      input.result10H,
      input.result10L,
      diagnostics
    );

    // Stage 7: Identity mappings
    // Populate identity mappings from explicit cross-stage linkage exposed by producers
    const identityMappings = this.buildIdentityMappings(
      patternCandidates,
      patternQualifications,
      diagnostics
    );

    // Stage 8: Relationship mappings
    // Populate relationship mappings using structural IDs (patternId, candidateId, mechanismId)
    const relationshipMappings = this.buildRelationshipMappings(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      participantRoleAssignments,
      diagnostics
    );

    // Stage 9: Stage references
    const stageReferences = this.buildStageReferences(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      careerFoundationSupplements,
      participantRoleAssignments
    );

    // Stage 10: Validation
    const validationResult = validateCanonicalCareerFoundation(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      identityMappings,
      relationshipMappings,
      participantRoleAssignments,
      this.validStages
    );
    diagnostics.push(...validationResult.diagnostics);

    // Stage 11: Build metadata
    const metadata = this.buildMetadata(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      careerFoundationSupplements,
      validationResult.valid
        && !diagnostics.some(diagnostic => diagnostic.severity === 'ERROR')
    );

    // Stage 12: Deep freeze and return
    return this.deepFreezeFoundation({
      foundationId,
      timestamp,
      patternCandidates,
      patternQualifications,
      participantRoleAssignments,
      resolvedMechanisms,
      mechanismRefinements,
      careerFoundationSupplements,
      identityMappings,
      relationshipMappings,
      stageReferences,
      diagnostics: Object.freeze(diagnostics),
      metadata
    });
  }

  /**
   * Converts producer evidence to orchestration StageEvidence.
   * Preserves identity keys from the producer without modification.
   * If identityKey is not available, uses occurrenceId and leaves identityKey unset.
   */
  private convertToStageEvidence(
    evidenceId: string,
    identityKey: string | undefined,
    statement: string,
    sourceIds: readonly string[],
    ruleIds: readonly string[],
    occurrenceId?: string
  ): StageEvidence {
    return Object.freeze({
      evidenceId,
      ...(identityKey !== undefined && identityKey.trim().length > 0
        ? { identityKey: identityKey as EvidenceIdentityKey }
        : {}),
      statement,
      sourceIds: Object.freeze(sourceIds.map(sourceId => sourceId as SourceId)),
      ruleIds: Object.freeze(ruleIds.map(ruleId => ruleId as RuleId)),
      ...(occurrenceId !== undefined ? { occurrenceId: occurrenceId as OccurrenceId } : {})
    });
  }

  /**
   * Builds pattern candidates from input patterns.
   */
  private buildPatternCandidates(
    patterns: readonly import('../careerPattern/careerPatternTypes').CareerPattern[],
    diagnostics: OrchestrationDiagnostic[]
  ): readonly PatternCandidate[] {
    const candidates: PatternCandidate[] = [];

    for (const pattern of patterns) {
      // Convert pattern evidence to stage evidence
      const stageEvidence: StageEvidence[] = pattern.evidence.map(ev =>
        this.convertToStageEvidence(
          ev.evidenceId,
          ev.sourceNetworkIdentityKey,
          `Pattern classification evidence from network ${ev.sourceNetworkId}`,
          [ev.sourceNetworkId],
          [ev.ruleId],
          ev.relationshipId // Use relationshipId as occurrenceId
        )
      );

      const candidate: PatternCandidate = {
        patternId: pattern.patternId,
        identityKey: pattern.identityKey,
        family: pattern.family,
        level: pattern.level,
        classification: pattern.classification,
        name: pattern.name,
        sourcePattern: pattern,
        stageEvidence: Object.freeze(stageEvidence)
      };
      candidates.push(candidate);
    }

    // Sort deterministically by patternId
    candidates.sort((a, b) => a.patternId.localeCompare(b.patternId));

    return Object.freeze(candidates);
  }

  /**
   * Builds pattern qualifications using the qualification port.
   */
  private buildPatternQualifications(
    patterns: readonly import('../careerPattern/careerPatternTypes').CareerPattern[],
    relevance: readonly import('../careerPlanetaryRelevance').CareerPlanetaryRelevance[],
    condition: readonly import('../careerPlanetaryCondition').CareerPlanetaryConditionResult[],
    patternCandidates: readonly PatternCandidate[],
    diagnostics: OrchestrationDiagnostic[]
  ): readonly PatternQualification[] {
    try {
      const result = this.ports.qualification.qualifyCareerPatterns({
        patterns,
        relevance,
        condition
      });

      const qualifications: PatternQualification[] = result.qualifiedPatterns.map((qp) => {
        // Convert qualification evidence to stage evidence
        const stageEvidence: StageEvidence[] = qp.evidence.map(ev =>
          this.convertToStageEvidence(
            ev.evidenceId,
            ev.identityKey,
            `Qualification evidence for dimension ${ev.dimension}`,
            ev.sourceEvidenceIds,
            ev.ruleIds,
            ev.evidenceId // Use evidenceId as occurrenceId
          )
        );

        return {
          patternId: qp.patternId,
          identityKey: qp.identityKey,
          status: qp.status,
          qualifiedPattern: qp,
          stageEvidence: Object.freeze(stageEvidence)
        };
      });

      // Sort deterministically by patternId
      qualifications.sort((a, b) => a.patternId.localeCompare(b.patternId));

      return Object.freeze(qualifications);
    } catch (error) {
      diagnostics.push({
        diagnosticId: 'ORCHESTRATION_QUALIFICATION_ERROR',
        severity: 'ERROR',
        category: 'PORT_ERROR',
        message: `Qualification port error: ${error instanceof Error ? error.message : String(error)}`,
        relatedIds: [],
        stage: 'QUALIFICATION'
      });

      return Object.freeze([]);
    }
  }

  /**
   * Builds participant role assignments using the participant roles port.
   */
  private buildParticipantRoleAssignments(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    networks: readonly import('../careerGraph/careerHouseNetworkTypes').CareerHouseNetwork[],
    condition: readonly import('../careerPlanetaryCondition').CareerPlanetaryConditionResult[],
    relevance: readonly import('../careerPlanetaryRelevance').CareerPlanetaryRelevance[],
    diagnostics: OrchestrationDiagnostic[]
  ): readonly ParticipantRoleAssignment[] {
    const allAssignments: ParticipantRoleAssignment[] = [];

    // Build qualification map for lookup
    const qualMap = new Map<string, PatternQualification>(
      patternQualifications.map((q) => [q.patternId, q])
    );

    for (const pattern of patternCandidates) {
      const qualification = qualMap.get(pattern.patternId);
      if (!qualification) {
        // Pattern has no qualification - skip role assignment
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_MISSING_QUALIFICATION_${pattern.patternId}`,
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: `Pattern ${pattern.patternId} has no qualification - skipping participant roles`,
          relatedIds: [pattern.patternId],
          stage: 'PARTICIPANT_ROLES'
        });
        continue;
      }

      try {
        const result = this.ports.participantRoles.assignParticipantRoles({
          pattern: pattern.sourcePattern,
          qualification: qualification.qualifiedPattern,
          networks,
          planetaryConditions: condition,
          relevance
        });

        // Convert engine assignments to orchestration-level assignments
        for (const assignment of result.assignments) {
          const orchAssignment: ParticipantRoleAssignment = {
            patternId: pattern.patternId,
            patternIdentityKey: pattern.identityKey,
            assignment
          };
          allAssignments.push(orchAssignment);
        }
      } catch (error) {
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_PARTICIPANT_ROLES_ERROR_${pattern.patternId}`,
          severity: 'ERROR',
          category: 'PORT_ERROR',
          message: `Participant roles port error for pattern ${pattern.patternId}: ${error instanceof Error ? error.message : String(error)}`,
          relatedIds: [pattern.patternId],
          stage: 'PARTICIPANT_ROLES'
        });
      }
    }

    // Sort deterministically by patternId, then participantId
    allAssignments.sort((a, b) => {
      const patternIdCompare = a.patternId.localeCompare(b.patternId);
      if (patternIdCompare !== 0) return patternIdCompare;
      return a.assignment.participantId.localeCompare(b.assignment.participantId);
    });

    return Object.freeze(allAssignments);
  }

  /**
   * Builds resolved mechanisms using the mechanism resolver port.
   *
   * QUALIFICATION GATING POLICY:
   * - UNQUALIFIED: Skip resolution (no candidates)
   * - QUALIFIED: Resolve normally
   * - INSUFFICIENT_DATA: Resolve structurally (pattern-level facts)
   *
   * This matches the real DefaultCareerMechanismResolver behavior.
   */
  private buildResolvedMechanisms(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    participantRoleAssignments: readonly ParticipantRoleAssignment[],
    networks: readonly import('../careerGraph/careerHouseNetworkTypes').CareerHouseNetwork[],
    diagnostics: OrchestrationDiagnostic[]
  ): readonly ResolvedMechanism[] {
    try {
      // Build qualification and role maps for lookup
      const qualMap = new Map<string, PatternQualification>(
        patternQualifications.map((q) => [q.patternId, q])
      );

      // Group assignments by patternId (unwrap orchestration-level assignments)
      const rolesByPattern = new Map<string, import('../careerParticipantRoles/participantRoleTypes').ParticipantRoleAssignment[]>();
      for (const orchAssignment of participantRoleAssignments) {
        const existing = rolesByPattern.get(orchAssignment.patternId) ?? [];
        rolesByPattern.set(orchAssignment.patternId, [...existing, orchAssignment.assignment]);
      }

      // Build resolution inputs for non-UNQUALIFIED patterns only
      const resolutionInputs: {
        readonly pattern: import('../careerPattern/careerPatternTypes').CareerPattern;
        readonly qualification: import('../careerPatternQualification/careerPatternQualificationTypes').QualifiedCareerPattern;
        readonly participantRoles: readonly import('../careerParticipantRoles/participantRoleTypes').ParticipantRoleAssignment[];
        readonly establishingEvidence: readonly PatternLevelEstablishingEvidence[];
        readonly networks: readonly import('../careerGraph/careerHouseNetworkTypes').CareerHouseNetwork[];
      }[] = [];

      // Track establishing evidence per pattern for post-resolution status determination
      const establishingEvidenceByPattern = new Map<string, readonly PatternLevelEstablishingEvidence[]>();

      for (const pattern of patternCandidates) {
        const qualification = qualMap.get(pattern.patternId);
        if (!qualification) {
          continue; // No qualification - skip
        }

        // GATING: Skip UNQUALIFIED patterns
        // QUALIFIED and INSUFFICIENT_DATA proceed to resolution
        if (qualification.status === 'UNQUALIFIED') {
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_UNQUALIFIED_PATTERN_MECHANISM_${pattern.patternId}`,
            severity: 'INFO',
            category: 'GATING',
            message: `Pattern ${pattern.patternId} is UNQUALIFIED - skipping mechanism resolution`,
            relatedIds: [pattern.patternId],
            stage: 'MECHANISM'
          });
          continue;
        }

        const roles = rolesByPattern.get(pattern.patternId) ?? [];

        // Derive establishing evidence from the qualified pattern's source pattern evidence
        // This preserves the provenance chain back to the pattern facts that established the mechanism
        let establishingEvidence: PatternLevelEstablishingEvidence[];

        if (qualification.qualifiedPattern.sourcePattern.evidence.length > 0) {
          establishingEvidence = qualification.qualifiedPattern.sourcePattern.evidence.map(ev => ({
            evidenceId: ev.evidenceId,
            // mechanismType is optional - the resolver determines the actual type
            mechanismType: undefined,
            source: 'PATTERN' as const,
            role: 'ESTABLISHING' as const,
            participantIds: [],
            relationshipIds: ev.relationshipId ? [ev.relationshipId] : [],
            patternId: pattern.patternId,
            explanation: `Pattern classification evidence from network ${ev.sourceNetworkId}`
          }));
        } else {
          establishingEvidence = [];
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_ESTABLISHING_EVIDENCE_UNAVAILABLE_${pattern.patternId}`,
            severity: 'WARNING',
            category: 'MISSING_DATA',
            message: `Pattern ${pattern.patternId} has no establishing evidence in qualified pattern - marked as UNAVAILABLE`,
            relatedIds: [pattern.patternId],
            stage: 'MECHANISM'
          });
        }

        // Track establishing evidence for post-resolution status
        establishingEvidenceByPattern.set(pattern.patternId, Object.freeze(establishingEvidence));

        resolutionInputs.push({
          pattern: pattern.sourcePattern,
          qualification: qualification.qualifiedPattern,
          participantRoles: roles,
          establishingEvidence: Object.freeze(establishingEvidence),
          networks
        });
      }

      // Resolve all mechanisms (only if there are inputs to resolve)
      const candidateSets = resolutionInputs.length > 0
        ? this.ports.mechanismResolver.resolveAll(resolutionInputs)
        : [];
      const candidateSetsByPattern = new Map(
        candidateSets.map(candidateSet => [candidateSet.patternId, candidateSet])
      );
      const resolutionPatternIds = new Set(
        resolutionInputs.map(resolutionInput => resolutionInput.pattern.patternId)
      );
      const returnedPatternIds = candidateSets.map(candidateSet => candidateSet.patternId);
      const returnedPatternIdSet = new Set(returnedPatternIds);
      const duplicatePatternIds = [...new Set(
        returnedPatternIds.filter((patternId, index) => returnedPatternIds.indexOf(patternId) !== index)
      )];
      const duplicatePatternIdSet = new Set(duplicatePatternIds);
      const foreignPatternIds = [...new Set(
        returnedPatternIds.filter(patternId => !resolutionPatternIds.has(patternId))
      )];

      if (
        candidateSets.length !== resolutionInputs.length ||
        duplicatePatternIds.length > 0 ||
        foreignPatternIds.length > 0
      ) {
        const missingPatternIds = [...resolutionPatternIds].filter(
          patternId => !returnedPatternIdSet.has(patternId)
        );
        diagnostics.push({
          diagnosticId: 'ORCHESTRATION_RESOLVE_ALL_CANDIDATE_SET_CONTRACT_VIOLATION',
          severity: 'WARNING',
          category: 'CONTRACT_VIOLATION',
          message: `Mechanism resolver resolveAll contract mismatch: expected one CandidateSet per input (${resolutionInputs.length}), received ${candidateSets.length}; missing patternIds [${missingPatternIds.join(', ')}], duplicate patternIds [${duplicatePatternIds.join(', ')}], foreign patternIds [${foreignPatternIds.join(', ')}]. Candidate sets for duplicated patternIds are excluded.`,
          relatedIds: [...new Set([...missingPatternIds, ...duplicatePatternIds, ...foreignPatternIds])],
          stage: 'MECHANISM'
        });
      }

      for (const resolutionInput of resolutionInputs) {
        const patternId = resolutionInput.pattern.patternId;
        // Duplicate IDs make the last-wins Map entry ambiguous, so fail closed for that pattern.
        if (duplicatePatternIdSet.has(patternId)) {
          continue;
        }

        const candidateSet = candidateSetsByPattern.get(patternId);
        if (candidateSet && candidateSet.candidates.length > 0) {
          continue;
        }

        // Distinguish missing candidate-set (contract violation) from present-but-empty (coverage gap)
        if (candidateSet === undefined) {
          // Resolver returned no CandidateSet for this pattern despite resolveAll contract
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_MISSING_CANDIDATE_SET_${resolutionInput.pattern.patternId}`,
            severity: 'WARNING',
            category: 'CONTRACT_VIOLATION',
            message: `Resolver returned no CandidateSet for pattern ${resolutionInput.pattern.patternId} (${resolutionInput.pattern.classification}) despite resolveAll contract (one set per input)`,
            relatedIds: [resolutionInput.pattern.patternId],
            stage: 'MECHANISM'
          });
        } else {
          // CandidateSet present but empty - coverage gap, not contract violation
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_NO_MECHANISM_RULE_MATCHED_${resolutionInput.pattern.patternId}`,
            severity: 'INFO',
            category: 'GATING',
            message: `Canonical career inputs produced no mechanism candidates for pattern ${resolutionInput.pattern.classification} (houses [${resolutionInput.pattern.houses.join(', ')}]) under the currently implemented resolver rules. This may reflect incomplete rule coverage; it does not disprove a career promise.`,
            relatedIds: [resolutionInput.pattern.patternId],
            stage: 'MECHANISM'
          });
        }
      }

      // Convert to resolved mechanisms
      const resolvedMechanisms: ResolvedMechanism[] = [];
      for (const resolutionInput of resolutionInputs) {
        const patternId = resolutionInput.pattern.patternId;
        // Only a unique set keyed to an input can contribute mechanisms; foreign and duplicate sets are excluded.
        if (duplicatePatternIdSet.has(patternId)) {
          continue;
        }
        const candidateSet = candidateSetsByPattern.get(patternId);
        if (candidateSet === undefined) {
          continue;
        }

        // Look up the establishing evidence supplied for this pattern
        const suppliedEstablishingEvidence = establishingEvidenceByPattern.get(candidateSet.patternId) ?? [];

        for (const candidate of candidateSet.candidates) {
          // Determine establishing evidence status using resolver-reported acceptance/rejection signals
          // IMPORTANT: establishingEvidenceStatus is a single priority-ordered value representing the overall outcome.
          // Priority order: RESOLVED_FOR_MECHANISM > REJECTED > SOURCE_EVIDENCE_PRESENT > UNRESOLVED > UNAVAILABLE
          //
          // - RESOLVED_FOR_MECHANISM: At least one establishing record was accepted for this candidate.
          //   Note: This status DOES NOT imply all evidence was accepted. Downstream consumers MUST inspect
          //   the three ID lists (acceptedEstablishingEvidenceIds, rejectedEstablishingEvidenceIds,
          //   firewallExcludedEstablishingEvidenceIds) on ResolvedMechanism to detect mixed outcomes where
          //   both accepted and rejected/firewall-excluded evidence are present.
          // - REJECTED: All source evidence was explicitly rejected by resolver (no accepted evidence)
          // - SOURCE_EVIDENCE_PRESENT: Source evidence exists but was either (a) all firewall-excluded,
          //   or (b) resolver produced no acceptance/rejection metadata (missing-metadata case)
          // - UNRESOLVED: No source evidence exists
          // - UNAVAILABLE: Source evidence unavailable from qualification
          let establishingEvidenceStatus: 'SOURCE_EVIDENCE_PRESENT' | 'RESOLVED_FOR_MECHANISM' | 'REJECTED' | 'UNRESOLVED' | 'UNAVAILABLE';

          if (suppliedEstablishingEvidence.length === 0) {
            establishingEvidenceStatus = 'UNAVAILABLE';
          } else {
            // Use resolver-reported acceptedEstablishingEvidenceIds, rejectedEstablishingEvidenceIds, and firewallExcludedEstablishingEvidenceIds if available
            if (candidate.acceptedEstablishingEvidenceIds && candidate.acceptedEstablishingEvidenceIds.length > 0) {
              // At least one evidence accepted - mark as RESOLVED_FOR_MECHANISM
              // Priority: accepted > rejected > firewall-excluded
              // Downstream must inspect all three ID lists to detect mixed outcomes
              establishingEvidenceStatus = 'RESOLVED_FOR_MECHANISM';
            } else if (candidate.rejectedEstablishingEvidenceIds && candidate.rejectedEstablishingEvidenceIds.length > 0) {
              // Explicitly rejected by resolver (no accepted evidence)
              establishingEvidenceStatus = 'REJECTED';
            } else if (candidate.firewallExcludedEstablishingEvidenceIds && candidate.firewallExcludedEstablishingEvidenceIds.length > 0) {
              // All source evidence was firewall-excluded (later-stage sources like D10, DISPOSITOR, etc.)
              // This is an expected outcome, not a missing-metadata case
              establishingEvidenceStatus = 'SOURCE_EVIDENCE_PRESENT';
            } else {
              // Source evidence exists but resolver produced no acceptance/rejection/firewall-exclusion metadata
              // This is a missing-metadata case - emit diagnostic
              diagnostics.push({
                diagnosticId: `ORCHESTRATION_RESOLVER_ACCEPTANCE_METADATA_MISSING_${candidate.candidateId}`,
                severity: 'WARNING',
                category: 'MISSING_DATA',
                message: `Resolver produced no acceptance/rejection/firewall-exclusion metadata for candidate ${candidate.candidateId} despite source evidence being present - treating as SOURCE_EVIDENCE_PRESENT`,
                relatedIds: [candidate.candidateId],
                stage: 'MECHANISM'
              });
              establishingEvidenceStatus = 'SOURCE_EVIDENCE_PRESENT';
            }
          }

          // Convert candidate evidence to stage evidence
          // Use evidenceId as occurrenceId - mechanism evidence does not use semantic identity keys
          const stageEvidence: StageEvidence[] = candidate.evidence.map(ev =>
            this.convertToStageEvidence(
              ev.evidenceId,
              undefined, // No identityKey for mechanism evidence
              `Mechanism evidence from ${ev.source}`,
              ev.participantIds,
              ev.relationshipIds,
              ev.evidenceId // Use evidenceId as occurrenceId
            )
          );

          resolvedMechanisms.push({
            candidateId: candidate.candidateId,
            patternId: candidate.patternId,
            mechanismType: candidate.mechanismType,
            candidate,
            candidateSet,
            establishingEvidenceStatus,
            acceptedEstablishingEvidenceIds: candidate.acceptedEstablishingEvidenceIds,
            rejectedEstablishingEvidenceIds: candidate.rejectedEstablishingEvidenceIds,
            firewallExcludedEstablishingEvidenceIds: candidate.firewallExcludedEstablishingEvidenceIds,
            stageEvidence: Object.freeze(stageEvidence)
          });
        }
      }

      // Sort deterministically by patternId, then candidateId
      resolvedMechanisms.sort((a, b) => {
        const patternIdCompare = a.patternId.localeCompare(b.patternId);
        if (patternIdCompare !== 0) return patternIdCompare;
        return a.candidateId.localeCompare(b.candidateId);
      });

      return Object.freeze(resolvedMechanisms);
    } catch (error) {
      diagnostics.push({
        diagnosticId: 'ORCHESTRATION_MECHANISM_RESOLVER_ERROR',
        severity: 'ERROR',
        category: 'PORT_ERROR',
        message: `Mechanism resolver port error: ${error instanceof Error ? error.message : String(error)}`,
        relatedIds: [],
        stage: 'MECHANISM'
      });

      return Object.freeze([]);
    }
  }

  /**
   * Builds mechanism refinements using the mechanism refiner port.
   *
   * Maps engine refinement status to orchestration status:
   * - Refined → REFINED
   * - Unchanged → UNCHANGED
   * - InsufficientData/missing → UNAVAILABLE
   *
   * Dispositor contexts are not yet available in the orchestration input.
   * When no dispositor contexts are available, refinement is explicitly UNRESOLVED
   * and the refiner is NOT called. This deferral is documented via diagnostic.
   */
  private buildMechanismRefinements(
    resolvedMechanisms: readonly ResolvedMechanism[],
    dispositorContexts: readonly CareerDispositorContext[] | undefined,
    participantRoleAssignments: readonly ParticipantRoleAssignment[],
    invalidRolePatternIds: ReadonlySet<string>,
    diagnostics: OrchestrationDiagnostic[]
  ): readonly MechanismRefinement[] {
    const refinements: MechanismRefinement[] = [];
    const dispositorContextsEnabled = dispositorContexts !== undefined;
    if (!dispositorContextsEnabled) {
      diagnostics.push({
        diagnosticId: 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE',
        severity: 'WARNING',
        category: 'MISSING_DATA',
        message: 'Dispositor contexts are not provided in orchestration input - all refinements marked UNRESOLVED without calling refiner',
        relatedIds: [],
        stage: 'REFINEMENT'
      });
    }

    for (const resolved of resolvedMechanisms) {
      if (invalidRolePatternIds.has(resolved.patternId)) {
        refinements.push(this.unresolvedRefinement(resolved));
        continue;
      }

      const patternAssignments = participantRoleAssignments.filter(
        roleAssignment => roleAssignment.patternId === resolved.patternId
      );
      if (patternAssignments.length === 0) {
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_PARTICIPANT_ROLES_UNAVAILABLE_${resolved.candidateId}`,
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: `Participant role assignments are unavailable for pattern ${resolved.patternId}; candidate refinement remains UNRESOLVED`,
          relatedIds: [resolved.candidateId, resolved.patternId],
          stage: 'REFINEMENT'
        });
        refinements.push(this.unresolvedRefinement(resolved));
        continue;
      }

      if (!dispositorContextsEnabled) {
        refinements.push(this.unresolvedRefinement(resolved));
        continue;
      }

      const participantGroups = this.resolveMechanismParticipantGroups(
        participantRoleAssignments,
        resolved.patternId
      );
      if (
        participantGroups.coreParticipants.length === 0 &&
        participantGroups.supportingParticipants.length === 0 &&
        participantGroups.challengingParticipants.length === 0
      ) {
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_PARTICIPANT_ROLE_GROUPS_UNAVAILABLE_${resolved.candidateId}`,
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: `Participant assignments for pattern ${resolved.patternId} do not provide a core, supporting, or challenging participant group; candidate refinement remains UNRESOLVED`,
          relatedIds: [resolved.candidateId, resolved.patternId],
          stage: 'REFINEMENT'
        });
        refinements.push(this.unresolvedRefinement(resolved));
        continue;
      }

      try {
        const candidateContexts = collectRelevantDispositorContexts(
          resolved.candidate,
          dispositorContexts ?? []
        );
        const hasStructuredContexts = (dispositorContexts ?? []).some(context =>
          typeof context.startPlanetId === 'string'
        );
        if (hasStructuredContexts && candidateContexts.length === 0) {
          diagnostics.push({
            diagnosticId: `DISPOSITOR_CONTEXT_PARTICIPANT_MISMATCH_${resolved.candidateId}`,
            severity: 'WARNING',
            category: 'MISSING_DATA',
            message: `No dispositor context participant matches candidate ${resolved.candidateId}; refinement remains INSUFFICIENT_DATA`,
            relatedIds: [resolved.candidateId],
            stage: 'REFINEMENT'
          });
          refinements.push(this.unresolvedRefinement(resolved));
          continue;
        }
        const result = this.ports.mechanismRefiner.refine({
          candidate: resolved.candidate,
          dispositorContexts: candidateContexts,
          ...participantGroups
        });

        if (result.status === 'INSUFFICIENT_DATA') {
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_MECHANISM_REFINER_INSUFFICIENT_DATA_${resolved.candidateId}`,
            severity: 'WARNING',
            category: 'MISSING_DATA',
            message: `Refinement result for candidate ${resolved.candidateId} has INSUFFICIENT_DATA - mechanism identity unresolved`,
            relatedIds: [resolved.candidateId],
            stage: 'REFINEMENT'
          });
          refinements.push(this.unresolvedRefinement(resolved));
          continue;
        }

        if (result.status === 'UNCHANGED') {
          refinements.push({
            resolution: 'UNCHANGED',
            sourceCandidateId: resolved.candidateId,
            candidateId: resolved.candidateId,
            mechanismType: resolved.mechanismType,
            status: 'UNCHANGED',
            mechanism: null,
            stageEvidence: Object.freeze([])
          });
          continue;
        }

        const mechanism = result.mechanisms[0];
        if (!mechanism?.mechanismId) {
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_MECHANISM_ID_MISSING_${resolved.candidateId}`,
            severity: 'WARNING',
            category: 'MISSING_DATA',
            message: `Refinement result for candidate ${resolved.candidateId} did not provide a mechanism ID - mechanism identity unresolved`,
            relatedIds: [resolved.candidateId],
            stage: 'REFINEMENT'
          });
          refinements.push(this.unresolvedRefinement(resolved));
          continue;
        }

        if (
          mechanism.patternId !== resolved.patternId ||
          mechanism.mechanismType !== resolved.mechanismType
        ) {
          diagnostics.push({
            diagnosticId: `ORCHESTRATION_REFINED_MECHANISM_REFERENCE_INVALID_${resolved.candidateId}`,
            severity: 'ERROR',
            category: 'INVALID_REFERENCE',
            message: `Refined mechanism for candidate ${resolved.candidateId} did not preserve its candidate pattern and mechanism type`,
            relatedIds: [resolved.candidateId, resolved.patternId],
            stage: 'REFINEMENT'
          });
          refinements.push(this.unresolvedRefinement(resolved));
          continue;
        }

        const stageEvidence = result.evidence.map(evId =>
          this.convertToStageEvidence(
            evId,
            undefined,
            'Refinement evidence from dispositor refiner',
            [],
            result.provenance.newEvidenceIds,
            evId
          )
        );
        refinements.push({
          resolution: 'REFINED',
          mechanismId: mechanism.mechanismId,
          candidateId: resolved.candidateId,
          mechanismType: resolved.mechanismType,
          status: 'REFINED',
          mechanism,
          stageEvidence: Object.freeze(stageEvidence)
        });
      } catch (error) {
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_MECHANISM_REFINER_ERROR_${resolved.candidateId}`,
          severity: 'ERROR',
          category: 'PORT_ERROR',
          message: `Mechanism refiner port error for candidate ${resolved.candidateId}: ${error instanceof Error ? error.message : String(error)}`,
          relatedIds: [resolved.candidateId],
          stage: 'REFINEMENT'
        });
        refinements.push(this.unresolvedRefinement(resolved));
      }
    }

    refinements.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
    return Object.freeze(refinements);
  }

  private unresolvedRefinement(resolved: ResolvedMechanism): MechanismRefinement {
    return {
      resolution: 'UNRESOLVED',
      candidateId: resolved.candidateId,
      mechanismType: resolved.mechanismType,
      status: 'UNAVAILABLE',
      mechanism: null,
      stageEvidence: Object.freeze([])
    };
  }

  private resolveMechanismParticipantGroups(
    participantRoleAssignments: readonly ParticipantRoleAssignment[],
    patternId: string
  ): {
    readonly coreParticipants: readonly string[];
    readonly supportingParticipants: readonly string[];
    readonly challengingParticipants: readonly string[];
  } {
    // CHALLENGING is cross-cutting, so it may overlap CORE or SUPPORTING.
    const coreParticipants = new Set<string>();
    const supportingParticipants = new Set<string>();
    const challengingParticipants = new Set<string>();

    for (const roleAssignment of participantRoleAssignments) {
      if (roleAssignment.patternId !== patternId) {
        continue;
      }
      const { assignment } = roleAssignment;
      if (assignment.primaryRole === 'CORE') {
        coreParticipants.add(assignment.participantId);
      } else if (assignment.primaryRole === 'SUPPORTING') {
        supportingParticipants.add(assignment.participantId);
      }
      if (assignment.isChallenging) {
        challengingParticipants.add(assignment.participantId);
      }
    }

    return Object.freeze({
      coreParticipants: Object.freeze([...coreParticipants].sort()),
      supportingParticipants: Object.freeze([...supportingParticipants].sort()),
      challengingParticipants: Object.freeze([...challengingParticipants].sort())
    });
  }

  /**
   * Builds career foundation supplements from 10H/10L result objects.
   *
   * Maps engine status to orchestration availability:
   * - COMPLETE → AVAILABLE
   * - INSUFFICIENT_DATA → PARTIALLY_AVAILABLE (if partial inputs present) or UNAVAILABLE (if absent)
   *
   * Uses result objects to derive real status and missingInputs for accurate availability reporting.
   */
  private buildCareerFoundationSupplements(
    result10H: import('../career10h/career10HFoundationTypes').Career10HFoundationResult | undefined,
    result10L: import('../career10h/career10LFoundationTypes').Career10LFoundationResult | undefined,
    diagnostics: OrchestrationDiagnostic[]
  ): readonly CareerFoundationSupplement[] {
    const supplements: CareerFoundationSupplement[] = [];

    // 10H supplement
    if (result10H) {
      // Derive availability from real status and missingInputs
      let availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';
      if (result10H.status === 'COMPLETE') {
        availability = 'AVAILABLE';
      } else if (result10H.missingInputs.length > 0) {
        availability = 'PARTIALLY_AVAILABLE';
      } else {
        availability = 'UNAVAILABLE';
      }

      supplements.push({
        supplementId: 'SUPPLEMENT_10H',
        supplementType: '10H',
        availability,
        foundation10H: result10H.foundation,
        foundation10L: null,
        status10H: result10H.status,
        status10L: 'INSUFFICIENT_DATA',
        missingInputs: result10H.missingInputs,
        stageEvidence: Object.freeze([])
      });
    } else {
      diagnostics.push({
        diagnosticId: 'ORCHESTRATION_MISSING_10H_RESULT',
        severity: 'WARNING',
        category: 'MISSING_DATA',
        message: '10H result not provided - supplement unavailable',
        relatedIds: [],
        stage: '10H'
      });
    }

    // 10L supplement
    if (result10L) {
      // Derive availability from real status and missingInputs
      let availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';
      if (result10L.status === 'COMPLETE') {
        availability = 'AVAILABLE';
      } else if (result10L.missingInputs.length > 0) {
        availability = 'PARTIALLY_AVAILABLE';
      } else {
        availability = 'UNAVAILABLE';
      }

      supplements.push({
        supplementId: 'SUPPLEMENT_10L',
        supplementType: '10L',
        availability,
        foundation10H: null,
        foundation10L: result10L.foundation,
        status10H: 'INSUFFICIENT_DATA',
        status10L: result10L.status,
        missingInputs: result10L.missingInputs,
        stageEvidence: Object.freeze([])
      });
    } else {
      diagnostics.push({
        diagnosticId: 'ORCHESTRATION_MISSING_10L_RESULT',
        severity: 'WARNING',
        category: 'MISSING_DATA',
        message: '10L result not provided - supplement unavailable',
        relatedIds: [],
        stage: '10L'
      });
    }

    return Object.freeze(supplements);
  }

  /**
   * Builds identity mappings from explicit cross-stage linkage.
   *
   * Only emits mappings when the originating producer actually exposes a supported
   * semantic identityKey for both source and target. Never fabricates identity keys.
   *
   * Pattern → Qualification: Uses real pattern.identityKey and qualification.identityKey
   * Qualification → Mechanism: Only mapped if mechanism candidate exposes identityKey
   * Mechanism → Refinement: Only mapped if refinement exposes mechanismId (REFINED status)
   *
   * When a source/target semantic identity is genuinely missing, no mapping is emitted
   * and an unresolved-mapping diagnostic is recorded.
   *
   * CARDINALITY HANDLING:
   * If multiple qualifications share the same patternId, all legitimate identity mappings
   * are emitted (grouped into arrays). Cardinality diagnostics are emitted in buildRelationshipMappings.
   */
  private buildIdentityMappings(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    diagnostics: OrchestrationDiagnostic[]
  ): readonly IdentityMapping[] {
    const mappings: IdentityMapping[] = [];
    let mappingIndex = 0;

    // Build qualification map for lookup - group into arrays to handle cardinality violations
    const qualMap = new Map<string, PatternQualification[]>();
    for (const qualification of [...patternQualifications].sort((a, b) => a.patternId.localeCompare(b.patternId))) {
      const existing = qualMap.get(qualification.patternId) ?? [];
      qualMap.set(qualification.patternId, [...existing, qualification]);
    }

    // Pattern → Qualification mappings (via patternId)
    // Both pattern and qualification expose real identityKey fields
    for (const pattern of [...patternCandidates].sort((a, b) => a.patternId.localeCompare(b.patternId))) {
      const qualifications = qualMap.get(pattern.patternId);
      if (qualifications && qualifications.length > 0) {
        for (const qualification of [...qualifications].sort((a, b) => a.identityKey.localeCompare(b.identityKey))) {
          if (hasSemanticIdentityKey(pattern.identityKey) && hasSemanticIdentityKey(qualification.identityKey)) {
            mappings.push({
              mappingId: `IDENTITY_MAPPING_${mappingIndex++}`,
              sourceStage: 'PATTERN',
              targetStage: 'QUALIFICATION',
              sourceIdentityKey: pattern.identityKey,
              targetIdentityKey: qualification.identityKey,
              mappingType: 'EQUIVALENCE'
            });
          } else {
            diagnostics.push({
              diagnosticId: `ORCHESTRATION_IDENTITY_KEY_UNAVAILABLE_${pattern.patternId}_${qualification.patternId}`,
              severity: 'WARNING',
              category: 'MISSING_DATA',
              message: `Pattern-to-qualification semantic identity mapping is unavailable for ${pattern.patternId}; producer identity keys must be non-empty`,
              relatedIds: [pattern.patternId, qualification.patternId],
              stage: 'IDENTITY_MAPPINGS'
            });
          }
        }
      }
    }

    // Qualification → Mechanism and Mechanism → Refinement are NOT identity mappings
    // They are now represented as RelationshipMappings (structural references via patternId/candidateId)
    // No unresolved diagnostics needed for these - relationship mappings cover them completely

    // Emit diagnostic for incomplete semantic identity coverage.
    diagnostics.push({
      diagnosticId: 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL',
      severity: 'INFO',
      category: 'PARTIAL_FEATURE',
      message: 'Qualification→mechanism and mechanism→refinement semantic identity remain unavailable because producers expose no semantic identity keys; participant-role and downstream lineage is carried by validated structural relationship mappings.',
      relatedIds: [],
      stage: 'IDENTITY_MAPPINGS'
    });

    return Object.freeze(mappings);
  }

  /**
   * Builds relationship mappings using structural IDs (patternId, candidateId, mechanismId).
   * These are NOT identity equivalences - they represent structural derivation/containment.
   *
   * CARDINALITY HANDLING:
   * - Pattern → Qualification: One-to-one (one patternId maps to one qualification)
   * - Qualification → Mechanism: One-to-many (one patternId can map to multiple mechanisms)
   * - Mechanism → Refinement: One-to-one (one candidateId maps to one refinement)
   *
   * If multiple qualifications share the same patternId (cardinality violation),
   * all legitimate relationships are emitted (grouped into arrays) and a diagnostic is recorded.
   */
  private buildRelationshipMappings(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    resolvedMechanisms: readonly ResolvedMechanism[],
    mechanismRefinements: readonly MechanismRefinement[],
    participantRoleAssignments: readonly ParticipantRoleAssignment[],
    diagnostics: OrchestrationDiagnostic[]
  ): readonly RelationshipMapping[] {
    const mappings: RelationshipMapping[] = [];
    let mappingIndex = 0;

    // Build qualification map for lookup - group into arrays to handle cardinality violations
    const qualMap = new Map<string, PatternQualification[]>();
    for (const qualification of patternQualifications) {
      const existing = qualMap.get(qualification.patternId) ?? [];
      qualMap.set(qualification.patternId, [...existing, qualification]);
    }

    // Detect cardinality violation: multiple qualifications for same patternId
    for (const [patternId, qualifications] of qualMap.entries()) {
      if (qualifications.length > 1) {
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_QUALIFICATION_CARDINALITY_VIOLATION_${patternId}`,
          severity: 'ERROR',
          category: 'CONTRACT_VIOLATION',
          message: `Multiple qualifications (${qualifications.length}) detected for patternId ${patternId} - cardinality contract violated (expected 1:1). All relationships will be emitted.`,
          relatedIds: [patternId],
          stage: 'QUALIFICATION'
        });
      }
    }

    // Pattern → Qualification mappings (via patternId)
    // Represents: qualification is derived from pattern
    for (const pattern of patternCandidates) {
      const qualifications = qualMap.get(pattern.patternId);
      if (qualifications && qualifications.length > 0) {
        // Emit relationships for all qualifications (even if cardinality violation)
        for (const qualification of qualifications) {
          mappings.push({
            mappingId: `RELATIONSHIP_MAPPING_${mappingIndex++}`,
            sourceStage: 'PATTERN',
            targetStage: 'QUALIFICATION',
            sourceId: pattern.patternId,
            targetId: qualification.patternId,
            relationshipType: 'DERIVATION'
          });
        }
      }
    }

    // Qualification → Mechanism mappings (via patternId)
    // Represents: mechanism candidates are derived from qualification (via pattern)
    for (const qualification of patternQualifications) {
      const mechanisms = resolvedMechanisms.filter(m => m.patternId === qualification.patternId);
      for (const mechanism of mechanisms) {
        mappings.push({
          mappingId: `RELATIONSHIP_MAPPING_${mappingIndex++}`,
          sourceStage: 'QUALIFICATION',
          targetStage: 'MECHANISM',
          sourceId: qualification.patternId,
          targetId: mechanism.candidateId,
          relationshipType: 'DERIVATION'
        });
      }
    }

    // Mechanism → Refinement mappings (via candidateId). Duplicate refinements are
    // all represented here; validation marks the foundation invalid for that candidate.
    for (const mechanism of resolvedMechanisms) {
      const refinements = mechanismRefinements.filter(r => r.candidateId === mechanism.candidateId);
      for (const refinement of refinements) {
        mappings.push({
          mappingId: `RELATIONSHIP_MAPPING_${mappingIndex++}`,
          sourceStage: 'MECHANISM',
          targetStage: 'REFINEMENT',
          sourceId: mechanism.candidateId,
          targetId: refinement.candidateId,
          relationshipType: 'DERIVATION'
        });
      }
    }

    const qualifiedPatternIds = new Set(patternQualifications.map(qualification => qualification.patternId));
    const rolePairs = new Map<string, { patternId: string; participantRoleReferenceId: string }>();
    for (const roleAssignment of participantRoleAssignments) {
      const { patternId, assignment } = roleAssignment;
      if (!qualifiedPatternIds.has(patternId)) {
        diagnostics.push({
          diagnosticId: `ORCHESTRATION_ROLE_WITHOUT_QUALIFICATION_${patternId}_${assignment.participantId}`,
          severity: 'WARNING',
          category: 'ORPHANED_REFERENCE',
          message: `Participant role assignment for pattern ${patternId} has no corresponding qualification`,
          relatedIds: [patternId, assignment.participantId],
          stage: 'PARTICIPANT_ROLES'
        });
        continue;
      }
      const participantRoleReferenceId = participantRoleAssignmentReferenceId(
        patternId,
        assignment.participantId,
        assignment.primaryRole
      );
      rolePairs.set(participantRoleReferenceId, {
        patternId,
        participantRoleReferenceId
      });
    }

    for (const { patternId, participantRoleReferenceId } of [...rolePairs.values()].sort(
      (a, b) => a.patternId.localeCompare(b.patternId) ||
        a.participantRoleReferenceId.localeCompare(b.participantRoleReferenceId)
    )) {
      mappings.push({
        mappingId: `RELATIONSHIP_MAPPING_${mappingIndex++}`,
        sourceStage: 'QUALIFICATION',
        targetStage: 'PARTICIPANT_ROLES',
        sourceId: patternId,
        targetId: participantRoleReferenceId,
        relationshipType: 'DERIVATION'
      });
    }

    return Object.freeze(mappings);
  }

  /**
   * Builds stage references from all stage outputs.
   */
  private buildStageReferences(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    resolvedMechanisms: readonly ResolvedMechanism[],
    mechanismRefinements: readonly MechanismRefinement[],
    careerFoundationSupplements: readonly CareerFoundationSupplement[],
    participantRoleAssignments: readonly ParticipantRoleAssignment[]
  ): readonly StageReference[] {
    const references: StageReference[] = [];

    // Pattern stage
    references.push({
      stageId: 'PATTERN',
      stageName: 'Pattern Classification (C4/P2-03)',
      evidenceIds: patternCandidates.map((p) => p.patternId)
    });

    // Qualification stage
    references.push({
      stageId: 'QUALIFICATION',
      stageName: 'Pattern Qualification (P2-07A)',
      evidenceIds: patternQualifications.map((q) => q.patternId)
    });

    references.push({
      stageId: 'PARTICIPANT_ROLES',
      stageName: 'Participant Role Assignment (P2-07B)',
      evidenceIds: [...new Set(
        participantRoleAssignments.flatMap(roleAssignment =>
          roleAssignment.assignment.roleEvidence.map(evidence => evidence.evidenceId)
        )
      )].sort()
    });

    // Mechanism stage
    references.push({
      stageId: 'MECHANISM',
      stageName: 'Mechanism Resolution (P2-07D)',
      evidenceIds: resolvedMechanisms.map((m) => m.candidateId)
    });

    // Refinement stage
    references.push({
      stageId: 'REFINEMENT',
      stageName: 'Mechanism Refinement (P2-07E)',
      evidenceIds: mechanismRefinements.map((r) => {
        if (r.resolution === 'REFINED') {
          return r.mechanismId;
        } else if (r.resolution === 'UNCHANGED') {
          return r.sourceCandidateId;
        } else {
          return r.candidateId;
        }
      })
    });

    // 10H/10L stage
    references.push({
      stageId: '10H_10L',
      stageName: '10H/10L Foundation (P2-07F/G)',
      evidenceIds: careerFoundationSupplements.map((s) => s.supplementId)
    });

    return Object.freeze(references);
  }

  /**
   * Builds metadata for the foundation.
   *
   * Separates data availability from contract validity:
   * - dataCompleteness: Whether all required data is present (COMPLETE, PARTIAL, INSUFFICIENT)
   * - contractValidity: Whether all contracts passed (VALID, INVALID, UNKNOWN)
   */
  private buildMetadata(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    resolvedMechanisms: readonly ResolvedMechanism[],
    mechanismRefinements: readonly MechanismRefinement[],
    careerFoundationSupplements: readonly CareerFoundationSupplement[],
    validationValid: boolean
  ) {
    const totalQualifiedPatterns = patternQualifications.filter(
      (q) => q.status === 'QUALIFIED'
    ).length;

    const totalRefinedMechanisms = mechanismRefinements.filter(
      (r) => r.resolution === 'REFINED'
    ).length;

    // Determine data completeness (availability of data)
    let dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
    if (careerFoundationSupplements.length === 0) {
      dataCompleteness = 'INSUFFICIENT';
    } else if (careerFoundationSupplements.some((s) => s.availability === 'PARTIALLY_AVAILABLE')) {
      dataCompleteness = 'PARTIAL';
    } else {
      dataCompleteness = 'COMPLETE';
    }

    // Determine contract validity from validation result
    const contractValidity: 'VALID' | 'INVALID' | 'UNKNOWN' = validationValid ? 'VALID' : 'INVALID';

    return Object.freeze({
      totalPatterns: patternCandidates.length,
      totalQualifiedPatterns,
      totalMechanisms: resolvedMechanisms.length,
      totalRefinedMechanisms,
      dataCompleteness,
      contractValidity
    });
  }

  /**
   * Generates a deterministic foundation ID from logical input.
   *
   * CONTRACT: CONTENT FINGERPRINT
   * The foundation ID is a CONTENT FINGERPRINT, not an INPUT IDENTITY. It changes when the
   * logical content of the input changes, ensuring that identical content produces the same ID
   * regardless of input order, but different content produces different IDs.
   *
   * FINGERPRINTED FIELDS:
   * - patternIds: Sorted list of pattern IDs
   * - relevanceData: Planet:relevance pairs (sorted)
   * - conditionData: Planet:condition pairs (sorted)
   * - networkIds: Sorted list of network IDs
   * - 10H status: COMPLETE or INSUFFICIENT_DATA
   * - 10L status: COMPLETE or INSUFFICIENT_DATA
   * - 10H missingInputs: Sorted list of missing input names (if any)
   * - 10L missingInputs: Sorted list of missing input names (if any)
   *
   * Note: The 10H/10L foundation payloads themselves are NOT included in the fingerprint.
   * Including the full payloads would make the ID sensitive to internal representation changes
   * that don't affect the logical content. The status and missingInputs capture the logical
   * availability state.
   *
   * The same logical input produces the same foundation ID regardless of order.
   */
  private generateDeterministicFoundationId(input: CanonicalCareerOrchestrationInput): string {
    // Collect all identity keys from the input
    const patternIds = input.patterns.map(p => p.patternId).sort();
    const relevanceData = input.relevance.map(r => `${r.planet}:${r.relevance}`).sort();
    const conditionData = input.condition.map(c => `${c.planet}:${c.condition}`).sort();
    const networkIds = input.networks.map(n => n.networkId).sort();

    // 10H status and missing inputs
    const status10H = input.result10H?.status ?? 'NO_10H';
    const missingInputs10H = input.result10H ? [...input.result10H.missingInputs].sort() : [];

    // 10L status and missing inputs
    const status10L = input.result10L?.status ?? 'NO_10L';
    const missingInputs10L = input.result10L ? [...input.result10L.missingInputs].sort() : [];

    // Concatenate and hash using a simple string hash
    const combined = [
      ...patternIds,
      ...relevanceData,
      ...conditionData,
      ...networkIds,
      `10H:${status10H}:${missingInputs10H.join(',')}`,
      `10L:${status10L}:${missingInputs10L.join(',')}`
    ].join('|');

    // Simple hash function (FNV-1a-like)
    let hash = 2166136261;
    for (let i = 0; i < combined.length; i++) {
      hash ^= combined.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    // Convert to positive hex string
    const hashHex = (hash >>> 0).toString(16).padStart(8, '0');
    return `FOUNDATION_${hashHex}`;
  }

  /**
   * Deep freezes the foundation to ensure immutability.
   */
  private deepFreezeFoundation(foundation: CanonicalCareerFoundation): CanonicalCareerFoundation {
    // Deep freeze all nested objects recursively
    const deepFreeze = (obj: unknown): unknown => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        Object.freeze(obj);
        for (const item of obj) {
          deepFreeze(item);
        }
        return obj;
      }

      Object.freeze(obj);
      for (const value of Object.values(obj)) {
        deepFreeze(value);
      }
      return obj;
    };

    return deepFreeze(foundation) as CanonicalCareerFoundation;
  }
}
