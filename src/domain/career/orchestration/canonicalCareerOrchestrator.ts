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
  StageReference,
  OrchestrationDiagnostic,
  EvidenceIdentityKey,
  SourceId,
  RuleId,
  OccurrenceId,
  StageEvidence,
  EstablishingMechanismEvidence
} from './canonicalCareerContracts';
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
  validateCanonicalCareerFoundation
} from './canonicalCareerValidation';

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
      diagnostics
    );

    // Stage 6: 10H/10L supplements (P2-07F/G)
    const careerFoundationSupplements = this.buildCareerFoundationSupplements(
      input.result10H,
      input.result10L,
      diagnostics
    );

    // Stage 7: Identity mappings
    // Producers do not yet supply explicit identity mappings across stages
    // This is documented as a diagnostic rather than silently emitting empty mappings
    diagnostics.push({
      diagnosticId: 'ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED',
      severity: 'INFO',
      category: 'DEFERRED_FEATURE',
      message: 'Identity mappings across stages (pattern→qualification→mechanism→refinement) are not yet provided by producers - mappings deferred',
      relatedIds: [],
      stage: 'IDENTITY_MAPPINGS'
    });
    const identityMappings: readonly IdentityMapping[] = Object.freeze([]);

    // Stage 8: Stage references
    const stageReferences = this.buildStageReferences(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      careerFoundationSupplements
    );

    // Stage 9: Validation
    const validationResult = validateCanonicalCareerFoundation(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      identityMappings,
      this.validStages
    );
    diagnostics.push(...validationResult.diagnostics);

    // Stage 10: Build metadata
    const metadata = this.buildMetadata(
      patternCandidates,
      patternQualifications,
      resolvedMechanisms,
      mechanismRefinements,
      careerFoundationSupplements,
      validationResult.valid
    );

    // Stage 11: Deep freeze and return
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
      identityKey: identityKey as any,
      statement,
      sourceIds: sourceIds as any,
      ruleIds: ruleIds as any,
      occurrenceId: occurrenceId as any
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

      // Convert to resolved mechanisms
      const resolvedMechanisms: ResolvedMechanism[] = [];
      for (const candidateSet of candidateSets) {
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
    diagnostics: OrchestrationDiagnostic[]
  ): readonly MechanismRefinement[] {
    const refinements: MechanismRefinement[] = [];

    // Determine if dispositor contexts are available
    const contextsAvailable = dispositorContexts !== undefined && dispositorContexts.length > 0;

    if (!contextsAvailable) {
      diagnostics.push({
        diagnosticId: 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE',
        severity: 'WARNING',
        category: 'MISSING_DATA',
        message: 'Dispositor contexts are not provided in orchestration input - all refinements marked UNRESOLVED without calling refiner',
        relatedIds: [],
        stage: 'REFINEMENT'
      });

      // Produce UNRESOLVED refinements for all resolved mechanisms
      for (const resolved of resolvedMechanisms) {
        refinements.push({
          resolution: 'UNRESOLVED',
          candidateId: resolved.candidateId,
          mechanismType: resolved.mechanismType,
          status: 'UNAVAILABLE',
          mechanism: null,
          stageEvidence: Object.freeze([])
        });
      }
    } else {
      // When dispositor contexts are available, call the refiner
      for (const resolved of resolvedMechanisms) {
        try {
          const result = this.ports.mechanismRefiner.refine({
            candidate: resolved.candidate,
            dispositorContexts: Object.freeze(dispositorContexts)
          });

          // Map engine status to orchestration status
          // Only REFINED and UNCHANGED produce RESOLVED refinements
          // INSUFFICIENT_DATA produces UNRESOLVED refinements
          if (result.status === 'INSUFFICIENT_DATA') {
            diagnostics.push({
              diagnosticId: `ORCHESTRATION_MECHANISM_REFINER_INSUFFICIENT_DATA_${resolved.candidateId}`,
              severity: 'WARNING',
              category: 'MISSING_DATA',
              message: `Refinement result for candidate ${resolved.candidateId} has INSUFFICIENT_DATA - mechanism identity unresolved`,
              relatedIds: [resolved.candidateId],
              stage: 'REFINEMENT'
            });

            // Produce UNRESOLVED refinement for INSUFFICIENT_DATA
            refinements.push({
              resolution: 'UNRESOLVED',
              candidateId: resolved.candidateId,
              mechanismType: resolved.mechanismType,
              status: 'UNAVAILABLE',
              mechanism: null,
              stageEvidence: Object.freeze([])
            });
            continue;
          }

          let status: 'REFINED' | 'UNCHANGED';
          if (result.status === 'REFINED') {
            status = 'REFINED';
          } else {
            // UNCHANGED
            status = 'UNCHANGED';
          }

          // For UNCHANGED status, the original candidate remains valid
          // For REFINED status, we need a mechanism ID from the refinement result
          if (status === 'UNCHANGED') {
            // UNCHANGED: original candidate is valid, produce UNCHANGED refinement
            // Do NOT fabricate a mechanismId - expose the original candidate via sourceCandidateId
            refinements.push({
              resolution: 'UNCHANGED',
              sourceCandidateId: resolved.candidateId,
              candidateId: resolved.candidateId,
              mechanismType: resolved.mechanismType,
              status: 'UNCHANGED',
              mechanism: null, // No new mechanism produced
              stageEvidence: Object.freeze([])
            });
            continue;
          }

          // For REFINED status, use the real mechanism ID from the refinement result
          const mechanismId = result.mechanisms[0]?.mechanismId;
          if (!mechanismId) {
            diagnostics.push({
              diagnosticId: `ORCHESTRATION_MECHANISM_ID_MISSING_${resolved.candidateId}`,
              severity: 'WARNING',
              category: 'MISSING_DATA',
              message: `Refinement result for candidate ${resolved.candidateId} did not provide a mechanism ID - mechanism identity unresolved`,
              relatedIds: [resolved.candidateId],
              stage: 'REFINEMENT'
            });

            // Produce UNRESOLVED refinement when mechanism ID is missing
            refinements.push({
              resolution: 'UNRESOLVED',
              candidateId: resolved.candidateId,
              mechanismType: resolved.mechanismType,
              status: 'UNAVAILABLE',
              mechanism: null,
              stageEvidence: Object.freeze([])
            });
            continue;
          }

          // Convert refinement evidence to stage evidence
          // Preserve identity namespace: use evidence's identityKey if available, otherwise occurrenceId only
          const stageEvidence: StageEvidence[] = result.evidence.map(evId =>
            this.convertToStageEvidence(
              evId,
              undefined, // Refinement evidence does not expose identityKey - use occurrenceId only
              'Refinement evidence from dispositor refiner',
              [],
              result.provenance.newEvidenceIds,
              evId // Use evidenceId as occurrenceId
            )
          );

          refinements.push({
            resolution: 'REFINED',
            mechanismId,
            candidateId: resolved.candidateId,
            mechanismType: resolved.mechanismType,
            status: 'REFINED',
            mechanism: result.mechanisms[0] ?? null,
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
        }
      }
    }

    // Sort deterministically by candidateId
    refinements.sort((a, b) => a.candidateId.localeCompare(b.candidateId));

    return Object.freeze(refinements);
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
   * Builds stage references from all stage outputs.
   */
  private buildStageReferences(
    patternCandidates: readonly PatternCandidate[],
    patternQualifications: readonly PatternQualification[],
    resolvedMechanisms: readonly ResolvedMechanism[],
    mechanismRefinements: readonly MechanismRefinement[],
    careerFoundationSupplements: readonly CareerFoundationSupplement[]
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
