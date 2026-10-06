import type {
  CareerMechanism,
  CareerMechanismCandidate,
  CareerMechanismType,
  CareerMechanismPathway,
  CareerMechanismEvidence,
  CareerMechanismProvenance,
  ParticipantId
} from '../careerMechanismTypes';
import type {
  DispositorRefinementStatus,
  CareerDispositorContext,
  CareerMechanismDispositorRefinementInput,
  CareerMechanismDispositorRefinementResult,
  CareerMechanismDispositorRuleInput
} from './careerMechanismDispositorTypes';
import { CAREER_DISPOSITOR_MECHANISM_RULES } from './careerMechanismDispositorRules';
import {
  collectRelevantDispositorContexts,
  hasUsableDispositorContext,
  isCycle,
  assertValidDispositorRefinementSource
} from './careerMechanismDispositorUtils';
import { buildRefiningMechanismEvidence } from '../careerMechanismEvidence';
import { buildCareerMechanismProvenance } from '../careerMechanismProvenance';
import { createCareerMechanism, createCareerMechanismId } from '../careerMechanismUtils';

/**
 * P2-07E Default Career Mechanism Dispositor Refiner
 *
 * This module implements the default dispositor-based refiner for career mechanisms.
 * Per spec §14: collect relevant usable contexts → skip CYCLE/MUTUAL_RECEPTION (never invent a terminal)
 * → apply rules in registry order → status REFINED only if a new mechanism type was added
 * → build provenance via buildCareerMechanismProvenance merging candidate provenance + new evidenceIds
 * + sourceStages: [..., 'DISPOSITOR'] → emit one CareerMechanism per refined mechanism type
 * reusing the candidate's participants/pathway/patternId.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerD10
 * - careerDasha
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - AI modules
 */

/**
 * Dispositor-based refiner for career mechanisms.
 */
export interface CareerMechanismDispositorRefiner {
  /**
   * Refines a mechanism candidate using dispositor contexts.
   * Returns a refinement result with refined mechanisms.
   */
  refine(input: CareerMechanismDispositorRefinementInput): CareerMechanismDispositorRefinementResult;
}

/**
 * Default implementation of CareerMechanismDispositorRefiner.
 */
export class DefaultCareerMechanismDispositorRefiner implements CareerMechanismDispositorRefiner {
  /**
   * Refines a mechanism candidate using dispositor contexts.
   */
  refine(input: CareerMechanismDispositorRefinementInput): CareerMechanismDispositorRefinementResult {
    const { candidate, dispositorContexts, coreParticipants, supportingParticipants, challengingParticipants } = input;

    // Step 0: Enforce firewall - validate all evidence sources
    // Check candidate evidence sources
    for (const evidence of candidate.evidence) {
      assertValidDispositorRefinementSource(evidence.source);
    }

    // Step 1: Collect relevant usable contexts
    const relevantContexts = collectRelevantDispositorContexts(candidate, dispositorContexts);

    // Step 2: Filter to usable contexts (sufficient data + non-empty chain)
    const usableContexts = relevantContexts.filter(hasUsableDispositorContext);

    // If no usable contexts, return INSUFFICIENT_DATA
    if (usableContexts.length === 0) {
      return this.buildInsufficientDataResult(candidate);
    }

    // Step 3: Skip CYCLE/MUTUAL_RECEPTION contexts (never invent a terminal per spec §13)
    // Check if any usable context is a cycle - if all are cycles, return UNCHANGED
    const hasNonCycleContext = usableContexts.some(context =>
      context.outcome !== 'CYCLE' && context.outcome !== 'MUTUAL_RECEPTION'
    );

    if (!hasNonCycleContext) {
      // All contexts are cycles - return UNCHANGED
      return this.buildUnchangedResult(candidate);
    }

    // Filter to terminal contexts (keep TERMINAL, SELF_DISPOSITOR only)
    // DEPTH_LIMIT, CYCLE, MUTUAL_RECEPTION do not refine per spec
    const terminalContexts = usableContexts.filter(context => {
      return context.outcome === 'TERMINAL' || context.outcome === 'SELF_DISPOSITOR';
    });

    // Step 4: Apply rules in registry order
    const refinedMechanismTypes = new Set<CareerMechanismType>();
    const allEvidenceIds: string[] = [];
    const explanations: string[] = [];

    for (const context of terminalContexts) {
      const ruleInput: CareerMechanismDispositorRuleInput = {
        mechanismType: candidate.mechanismType,
        participantIds: candidate.provenance.participantIds,
        context
      };

      for (const rule of CAREER_DISPOSITOR_MECHANISM_RULES) {
        if (rule.applies(ruleInput)) {
          const result = rule.refine(ruleInput);

          // Add refined mechanism types
          for (const type of result.mechanismTypes) {
            refinedMechanismTypes.add(type as CareerMechanismType);
          }

          // Collect evidence IDs
          allEvidenceIds.push(...result.evidence);

          // Collect explanations
          explanations.push(result.explanation);
        }
      }
    }

    // Step 5: Determine status
    if (refinedMechanismTypes.size === 0) {
      return this.buildUnchangedResult(candidate);
    }

    // Step 6: Build refined mechanisms (one per refined mechanism type)
    const mechanisms: CareerMechanism[] = [];
    const sortedMechanismTypes = Array.from(refinedMechanismTypes).sort();

    for (const mechanismType of sortedMechanismTypes) {
      const mechanism = this.buildRefinedMechanism(
        candidate,
        mechanismType,
        allEvidenceIds,
        explanations,
        coreParticipants,
        supportingParticipants,
        challengingParticipants
      );
      mechanisms.push(mechanism);
    }

    // Step 7: Build provenance
    const provenance = this.buildRefinementProvenance(candidate, allEvidenceIds);

    // Step 8: Return REFINED result
    return Object.freeze({
      status: 'REFINED' as DispositorRefinementStatus,
      originalCandidateId: candidate.candidateId,
      mechanisms: Object.freeze(mechanisms),
      evidence: Object.freeze(allEvidenceIds),
      provenance,
      explanation: `Refined ${candidate.mechanismType} to ${sortedMechanismTypes.join(', ')} via dispositor analysis. ${explanations.join(' ')}`
    });
  }

  /**
   * Builds an INSUFFICIENT_DATA result.
   */
  private buildInsufficientDataResult(
    candidate: CareerMechanismCandidate
  ): CareerMechanismDispositorRefinementResult {
    return Object.freeze({
      status: 'INSUFFICIENT_DATA' as DispositorRefinementStatus,
      originalCandidateId: candidate.candidateId,
      mechanisms: Object.freeze([]),
      evidence: Object.freeze([]),
      provenance: Object.freeze({
        originalProvenance: Object.freeze({
          patternIds: candidate.provenance.patternIds,
          relationshipIds: candidate.provenance.relationshipIds,
          participantIds: candidate.provenance.participantIds,
          evidenceIds: candidate.provenance.evidenceIds,
          sourceStages: candidate.provenance.sourceStages
        }),
        newEvidenceIds: Object.freeze([]),
        sourceStages: Object.freeze([...candidate.provenance.sourceStages, 'DISPOSITOR'])
      }),
      explanation: 'Insufficient dispositor data for refinement'
    });
  }

  /**
   * Builds an UNCHANGED result.
   */
  private buildUnchangedResult(
    candidate: CareerMechanismCandidate
  ): CareerMechanismDispositorRefinementResult {
    return Object.freeze({
      status: 'UNCHANGED' as DispositorRefinementStatus,
      originalCandidateId: candidate.candidateId,
      mechanisms: Object.freeze([]),
      evidence: Object.freeze([]),
      provenance: Object.freeze({
        originalProvenance: Object.freeze({
          patternIds: candidate.provenance.patternIds,
          relationshipIds: candidate.provenance.relationshipIds,
          participantIds: candidate.provenance.participantIds,
          evidenceIds: candidate.provenance.evidenceIds,
          sourceStages: candidate.provenance.sourceStages
        }),
        newEvidenceIds: Object.freeze([]),
        sourceStages: Object.freeze([...candidate.provenance.sourceStages, 'DISPOSITOR'])
      }),
      explanation: 'No dispositor refinement applied'
    });
  }

  /**
   * Builds a refined mechanism from a candidate.
   * Reuses the candidate's participants/pathway/patternId.
   */
  private buildRefinedMechanism(
    candidate: CareerMechanismCandidate,
    mechanismType: CareerMechanismType,
    sourceEvidenceIds: readonly string[],
    explanations: readonly string[],
    coreParticipants?: readonly string[],
    supportingParticipants?: readonly string[],
    challengingParticipants?: readonly string[]
  ): CareerMechanism {
    const mechanismId = createCareerMechanismId(candidate.patternId, mechanismType);
    const pathway: CareerMechanismPathway = 'DISPOSITOR';

    // Build DISPOSITOR evidence with role: 'REFINING'
    // sourceEvidenceIds are carried in explanation, NOT in relationshipIds
    // relationshipIds should only contain actual relationship IDs (edge IDs)
    const explanation = `Dispositor refinement evidence for ${mechanismType}. Source evidence: [${sourceEvidenceIds.join(', ')}]. ${explanations.join(' ')}`;
    const dispositorEvidence = buildRefiningMechanismEvidence({
      mechanismId,
      mechanismType,
      source: 'DISPOSITOR',
      participantIds: candidate.provenance.participantIds,
      relationshipIds: [], // Empty - sourceEvidenceIds are not relationship IDs
      patternId: candidate.patternId,
      explanation
    });

    // Merge candidate evidence with new dispositor evidence
    const mergedEvidence = [...candidate.evidence, dispositorEvidence];

    // Build provenance
    const provenance = buildCareerMechanismProvenance({
      patternIds: candidate.provenance.patternIds,
      relationshipIds: candidate.provenance.relationshipIds,
      participantIds: candidate.provenance.participantIds,
      evidenceIds: [...candidate.provenance.evidenceIds, dispositorEvidence.evidenceId],
      sourceStages: [...candidate.provenance.sourceStages, 'DISPOSITOR']
    });

    // Build explanation for the mechanism
    const mechanismExplanation = `Refined mechanism ${mechanismType} from candidate ${candidate.candidateId}. ${explanations.join(' ')}`;

    // Use provided participant roles if available, otherwise all-as-core
    const finalCoreParticipants = (coreParticipants ?? candidate.provenance.participantIds) as ParticipantId[];
    const finalSupportingParticipants = (supportingParticipants ?? Object.freeze([])) as ParticipantId[];
    const finalChallengingParticipants = (challengingParticipants ?? Object.freeze([])) as ParticipantId[];

    // Create mechanism
    const mechanism = createCareerMechanism({
      patternId: candidate.patternId,
      mechanismType,
      pathway,
      participants: candidate.provenance.participantIds,
      coreParticipants: finalCoreParticipants,
      supportingParticipants: finalSupportingParticipants,
      challengingParticipants: finalChallengingParticipants,
      status: 'REFINED',
      explanation: mechanismExplanation,
      evidence: mergedEvidence,
      provenance
    });

    return mechanism;
  }

  /**
   * Builds refinement provenance.
   * Merges candidate provenance with new evidence IDs and adds DISPOSITOR to source stages.
   */
  private buildRefinementProvenance(
    candidate: CareerMechanismCandidate,
    newEvidenceIds: readonly string[]
  ): CareerMechanismDispositorRefinementResult['provenance'] {
    return Object.freeze({
      originalProvenance: Object.freeze({
        patternIds: candidate.provenance.patternIds,
        relationshipIds: candidate.provenance.relationshipIds,
        participantIds: candidate.provenance.participantIds,
        evidenceIds: candidate.provenance.evidenceIds,
        sourceStages: candidate.provenance.sourceStages
      }),
      newEvidenceIds: Object.freeze(newEvidenceIds),
      sourceStages: Object.freeze([...candidate.provenance.sourceStages, 'DISPOSITOR'])
    });
  }
}

/**
 * Default refiner instance.
 */
export const defaultCareerMechanismDispositorRefiner = Object.freeze(
  new DefaultCareerMechanismDispositorRefiner()
);
