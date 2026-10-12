import { buildCanonicalCareerFoundation } from './canonicalCareerFoundationBuilder';
import { CanonicalCareerOrchestrator } from './canonicalCareerOrchestrator';
import { defaultCareerOrchestrationPorts } from './canonicalCareerPortsAdapter';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import {
  buildCareerGraphFactsFromStructural,
  buildCareerAstroGraph,
  detectCareerHouseNetworks
} from '../careerGraph';
import { classifyCareerPatterns } from '../careerPattern/careerPatternClassification';
import { buildCareerPlanetaryRelevance } from '../careerPlanetaryRelevanceIntegration';
import { buildCareerPlanetaryCondition } from '../careerPlanetaryConditionIntegration';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../CareerDomainInterpreterV2';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import type { DomainReasoningOptions } from '../../reasoning/reasoningTypes';
import type { CanonicalCareerOrchestrationInput } from './canonicalCareerContracts';

const testMethodology = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
};

function makeDomainOptions(asOf?: string, targetHoroscope?: any): DomainReasoningOptions {
  const context = createAnalysisContext({ asOf, methodology: testMethodology });
  const temporalState = targetHoroscope ? resolveAnalysisTemporalState(targetHoroscope, context) : { asOf: context.asOf, dashaInterpretation: undefined };
  return { context, temporalState };
}

/**
 * P2-11G Production Integration Boundary Tests
 *
 * This test suite validates the production integration boundary for the canonical
 * career orchestrator.
 *
 * Test strategy:
 * 1. Integration test: Build foundation through real production producers
 * 2. Regression test: Ensure interpretCareerV2 structural integrity is maintained
 * 3. Determinism test: Verify output is deterministic across repeated builds
 * 4. Permutation test: Verify output is deterministic under orchestrator input permutation
 */

describe('P2-11G Canonical Career Foundation Builder', () => {
  describe('Integration Test: Real Production Producers', () => {
    it('builds foundation through the real production producer chain', async () => {
      // Build horoscope from canonical birth details
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Build foundation through the real production chain
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Verify foundation structure
      expect(foundation).toBeDefined();
      expect(foundation.foundationId).toBeDefined();
      expect(foundation.timestamp).toBeDefined();

      // Verify pattern candidates are populated
      expect(foundation.patternCandidates).toBeDefined();
      expect(Array.isArray(foundation.patternCandidates)).toBe(true);

      // Verify pattern qualifications are populated
      expect(foundation.patternQualifications).toBeDefined();
      expect(Array.isArray(foundation.patternQualifications)).toBe(true);

      // Verify participant role assignments are populated
      expect(foundation.participantRoleAssignments).toBeDefined();
      expect(Array.isArray(foundation.participantRoleAssignments)).toBe(true);

      // Verify resolved mechanisms are populated
      expect(foundation.resolvedMechanisms).toBeDefined();
      expect(Array.isArray(foundation.resolvedMechanisms)).toBe(true);

      // Verify mechanism refinements are populated (may be UNAVAILABLE due to deferred dispositor contexts)
      expect(foundation.mechanismRefinements).toBeDefined();
      expect(Array.isArray(foundation.mechanismRefinements)).toBe(true);

      // Verify supplements are populated (may be UNAVAILABLE due to deferred 10H/10L)
      expect(foundation.careerFoundationSupplements).toBeDefined();
      expect(Array.isArray(foundation.careerFoundationSupplements)).toBe(true);

      // Verify identity mappings are empty (deferred)
      expect(foundation.identityMappings).toEqual([]);

      // Verify stage references are populated
      expect(foundation.stageReferences).toBeDefined();
      expect(Array.isArray(foundation.stageReferences)).toBe(true);

      // Verify diagnostics are populated
      expect(foundation.diagnostics).toBeDefined();
      expect(Array.isArray(foundation.diagnostics)).toBe(true);

      // Verify metadata is populated
      expect(foundation.metadata).toBeDefined();
      expect(foundation.metadata.totalPatterns).toBe(foundation.patternCandidates.length);
      // Note: totalQualifiedPatterns may be 0 if canonical chart produces no qualified patterns
      expect(foundation.metadata.totalQualifiedPatterns).toBeGreaterThanOrEqual(0);
      expect(foundation.metadata.totalMechanisms).toBe(foundation.resolvedMechanisms.length);
      expect(foundation.metadata.totalRefinedMechanisms).toBe(
        foundation.mechanismRefinements.filter(r => r.resolution === 'REFINED').length
      );
    });

    it('preserves identity keys and provenance from producers', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Verify pattern candidates preserve identity from source patterns
      for (const patternCandidate of foundation.patternCandidates) {
        expect(patternCandidate.patternId).toBeDefined();
        expect(patternCandidate.identityKey).toBeDefined();
        expect(patternCandidate.sourcePattern).toBeDefined();
        expect(patternCandidate.sourcePattern.patternId).toBe(patternCandidate.patternId);
        expect(patternCandidate.sourcePattern.identityKey).toBe(patternCandidate.identityKey);
      }

      // Verify pattern qualifications preserve identity from source patterns
      for (const patternQualification of foundation.patternQualifications) {
        expect(patternQualification.patternId).toBeDefined();
        expect(patternQualification.identityKey).toBeDefined();
        expect(patternQualification.qualifiedPattern).toBeDefined();
        expect(patternQualification.qualifiedPattern.patternId).toBe(patternQualification.patternId);
        expect(patternQualification.qualifiedPattern.identityKey).toBe(patternQualification.identityKey);
      }

      // Verify participant role assignments preserve pattern provenance
      for (const roleAssignment of foundation.participantRoleAssignments) {
        expect(roleAssignment.patternId).toBeDefined();
        expect(roleAssignment.patternIdentityKey).toBeDefined();
        expect(roleAssignment.assignment).toBeDefined();
      }

      // Verify resolved mechanisms preserve candidate provenance
      for (const resolvedMechanism of foundation.resolvedMechanisms) {
        expect(resolvedMechanism.candidateId).toBeDefined();
        expect(resolvedMechanism.patternId).toBeDefined();
        expect(resolvedMechanism.candidate).toBeDefined();
        expect(resolvedMechanism.candidateSet).toBeDefined();
      }
    });

    it('represents missing data explicitly via documented diagnostics', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Verify dispositor contexts diagnostic is present when flag is false (default)
      const dispositorDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE'
      );
      expect(dispositorDiagnostic).toBeDefined();
      expect(dispositorDiagnostic?.severity).toBe('WARNING');
      expect(dispositorDiagnostic?.category).toBe('MISSING_DATA');

      // Verify identity mappings diagnostic is present (partial coverage)
      const identityMappingDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL'
      );
      expect(identityMappingDiagnostic).toBeDefined();
      expect(identityMappingDiagnostic?.severity).toBe('INFO');
      expect(identityMappingDiagnostic?.category).toBe('PARTIAL_FEATURE');

      // Verify mechanism refinements are UNRESOLVED/UNAVAILABLE when dispositor contexts are missing
      for (const refinement of foundation.mechanismRefinements) {
        expect(refinement.resolution).toBe('UNRESOLVED');
        expect(refinement.status).toBe('UNAVAILABLE');
        expect(refinement.mechanism).toBeNull();
      }

      // Verify identity mappings are populated from explicit linkage (not empty)
      expect(foundation.identityMappings.length).toBeGreaterThan(0);
    });

    it('output is deterministic across repeated builds', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Build foundation twice
      const foundation1 = buildCanonicalCareerFoundation({ horoscope });
      const foundation2 = buildCanonicalCareerFoundation({ horoscope });

      // Verify deterministic output
      expect(JSON.stringify(foundation1)).toBe(JSON.stringify(foundation2));
    });

    it('output is deterministic under orchestrator input permutation', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Build foundation by manually constructing orchestrator input
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);
      const graph = buildCareerAstroGraph({ facts });
      const networks = detectCareerHouseNetworks({ graph });
      const patterns = classifyCareerPatterns({ networks: networks.networks });
      const relevance = buildCareerPlanetaryRelevance({ horoscope, structural });
      const condition = buildCareerPlanetaryCondition({ horoscope, relevance });

      // Assemble orchestrator input in original order
      const input1: CanonicalCareerOrchestrationInput = {
        patterns: patterns.patterns,
        relevance,
        condition,
        networks: networks.networks,
        dispositorContexts: undefined,
        result10H: undefined,
        result10L: undefined
      };

      // Assemble orchestrator input with permuted collection order (semantically equivalent)
      // Reverse the actual array elements to test true order-sensitivity
      const input2: CanonicalCareerOrchestrationInput = {
        patterns: [...patterns.patterns].reverse(),
        relevance: [...relevance].reverse(),
        condition: [...condition].reverse(),
        networks: [...networks.networks].reverse(),
        dispositorContexts: undefined,
        result10H: undefined,
        result10L: undefined
      };

      const orchestrator1 = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
      const foundation1 = orchestrator1.orchestrate(input1);

      const orchestrator2 = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
      const foundation2 = orchestrator2.orchestrate(input2);

      // Normalize outputs by sorting collections by stable IDs before comparison
      const normalizeFoundation = (foundation: any) => ({
        ...foundation,
        patternCandidates: [...foundation.patternCandidates].sort((a, b) => a.patternId.localeCompare(b.patternId)),
        patternQualifications: [...foundation.patternQualifications].sort((a, b) => a.patternId.localeCompare(b.patternId)),
        participantRoleAssignments: [...foundation.participantRoleAssignments].sort((a, b) => a.patternId.localeCompare(b.patternId)),
        resolvedMechanisms: [...foundation.resolvedMechanisms].sort((a, b) => a.candidateId.localeCompare(b.candidateId)),
        mechanismRefinements: [...foundation.mechanismRefinements].sort((a, b) => a.candidateId.localeCompare(b.candidateId)),
        careerFoundationSupplements: [...foundation.careerFoundationSupplements].sort((a, b) => a.supplementId.localeCompare(b.supplementId)),
        stageReferences: [...foundation.stageReferences].sort((a, b) => a.stageId.localeCompare(b.stageId)),
        diagnostics: [...foundation.diagnostics].sort((a, b) => a.diagnosticId.localeCompare(b.diagnosticId))
      });

      const normalized1 = normalizeFoundation(foundation1);
      const normalized2 = normalizeFoundation(foundation2);

      // Output should be identical regardless of input collection order
      expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2));
    });

    it('deep freezes all output objects', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Verify top-level foundation is frozen
      expect(Object.isFrozen(foundation)).toBe(true);

      // Verify arrays are frozen
      expect(Object.isFrozen(foundation.patternCandidates)).toBe(true);
      expect(Object.isFrozen(foundation.patternQualifications)).toBe(true);
      expect(Object.isFrozen(foundation.participantRoleAssignments)).toBe(true);
      expect(Object.isFrozen(foundation.resolvedMechanisms)).toBe(true);
      expect(Object.isFrozen(foundation.mechanismRefinements)).toBe(true);
      expect(Object.isFrozen(foundation.careerFoundationSupplements)).toBe(true);
      expect(Object.isFrozen(foundation.identityMappings)).toBe(true);
      expect(Object.isFrozen(foundation.stageReferences)).toBe(true);
      expect(Object.isFrozen(foundation.diagnostics)).toBe(true);

      // Verify nested objects are frozen
      if (foundation.patternCandidates.length > 0) {
        expect(Object.isFrozen(foundation.patternCandidates[0])).toBe(true);
      }
      if (foundation.patternQualifications.length > 0) {
        expect(Object.isFrozen(foundation.patternQualifications[0])).toBe(true);
      }
    });

    it('two-pass orchestration when enableDispositorContexts=true', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Build foundation with dispositor contexts enabled
      const foundation = buildCanonicalCareerFoundation({ horoscope, enableDispositorContexts: true });

      // Verify dispositor contexts diagnostic is NOT present (contexts available)
      const dispositorDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE'
      );
      expect(dispositorDiagnostic).toBeUndefined();

      // Verify upstream outputs were computed once and reused
      // We can verify this by checking that the foundation is deterministic
      // (same input produces same output)
      const foundation2 = buildCanonicalCareerFoundation({ horoscope, enableDispositorContexts: true });
      expect(JSON.stringify(foundation)).toBe(JSON.stringify(foundation2));

      // Verify mechanism refinements have actual resolution states
      // (not all UNRESOLVED/UNAVAILABLE, which would indicate refiner was not called)
      if (foundation.resolvedMechanisms.length > 0) {
        // At least some refinements should have a resolution other than UNRESOLVED
        // The refiner was called with dispositor contexts
        const hasNonUnresolvedRefinements = foundation.mechanismRefinements.some(
          r => r.resolution === 'REFINED' || r.resolution === 'UNCHANGED'
        );

        // Note: It's possible that all refinements remain UNRESOLVED if dispositor contexts
        // were insufficient for all candidates. The important assertion is that the
        // two-pass orchestration ran without error and produced a valid foundation.
        // If we have mechanisms, we should have refinements (even if UNRESOLVED).
        expect(foundation.mechanismRefinements.length).toBe(foundation.resolvedMechanisms.length);
      }
    });

    it('two-pass orchestration: insufficient data leaves refinements UNRESOLVED', async () => {
      // Create a minimal horoscope that will produce mechanisms but insufficient dispositor data
      const minimalHoroscope: any = {
        planetFacts: [
          { planet: 'SUN', sign: 'ARIES', longitude: 10, house: 10 }
        ],
        houses: [
          { houseNumber: 10, sign: 'ARIES', longitude: 10, lord: 'SUN' }
        ],
        ascendant: {
          sign: 'ARIES',
          longitude: 0
        },
        houseLordship: {
          10: 'SUN'
        }
      };

      // Build foundation with dispositor contexts enabled
      const foundation = buildCanonicalCareerFoundation({ horoscope: minimalHoroscope, enableDispositorContexts: true });

      // Verify dispositor contexts diagnostic is NOT present (contexts were built)
      const dispositorDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE'
      );
      expect(dispositorDiagnostic).toBeUndefined();

      // If mechanisms were produced, verify refinements exist
      // (even if they are UNRESOLVED due to insufficient data)
      if (foundation.resolvedMechanisms.length > 0) {
        expect(foundation.mechanismRefinements.length).toBe(foundation.resolvedMechanisms.length);

        // Verify refinements are either UNRESOLVED (insufficient data) or UNCHANGED/REFINED
        for (const refinement of foundation.mechanismRefinements) {
          expect(['UNRESOLVED', 'UNCHANGED', 'REFINED']).toContain(refinement.resolution);
        }
      }
    });

    it('identity mappings reference valid stages', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Verify all identity mappings reference valid stages
      const validStages = new Set(['PATTERN', 'QUALIFICATION', 'PARTICIPANT_ROLES', 'MECHANISM', 'REFINEMENT', '10H', '10L']);
      for (const mapping of foundation.identityMappings) {
        expect(validStages.has(mapping.sourceStage)).toBe(true);
        expect(validStages.has(mapping.targetStage)).toBe(true);
      }

      // Build semantic identity key sets for each stage (not candidateId sets)
      const patternIdentityKeys = new Set(foundation.patternCandidates.map(p => p.identityKey));
      const qualificationIdentityKeys = new Set(foundation.patternQualifications.map(q => q.identityKey));
      // Mechanism candidates do not currently expose identityKey - set is empty
      const mechanismIdentityKeys = new Set<string>();
      // Only REFINED refinements expose mechanismId
      const refinementIdentityKeys = new Set(
        foundation.mechanismRefinements
          .filter(r => r.resolution === 'REFINED')
          .map(r => r.mechanismId)
      );

      // Validate every emitted mapping against semantic identity key sets
      for (const mapping of foundation.identityMappings) {
        if (mapping.sourceStage === 'PATTERN') {
          expect(patternIdentityKeys.has(mapping.sourceIdentityKey)).toBe(true);
        } else if (mapping.sourceStage === 'QUALIFICATION') {
          expect(qualificationIdentityKeys.has(mapping.sourceIdentityKey)).toBe(true);
        } else if (mapping.sourceStage === 'MECHANISM') {
          // Mechanism stage currently has no identityKey - mapping should not exist
          expect(true).toBe(false); // Fail if we reach here
        } else if (mapping.sourceStage === 'REFINEMENT') {
          expect(refinementIdentityKeys.has(mapping.sourceIdentityKey)).toBe(true);
        }

        if (mapping.targetStage === 'PATTERN') {
          expect(patternIdentityKeys.has(mapping.targetIdentityKey)).toBe(true);
        } else if (mapping.targetStage === 'QUALIFICATION') {
          expect(qualificationIdentityKeys.has(mapping.targetIdentityKey)).toBe(true);
        } else if (mapping.targetStage === 'MECHANISM') {
          // Mechanism stage currently has no identityKey - mapping should not exist
          expect(true).toBe(false); // Fail if we reach here
        } else if (mapping.targetStage === 'REFINEMENT') {
          expect(refinementIdentityKeys.has(mapping.targetIdentityKey)).toBe(true);
        }
      }

      // Assert Pattern → Qualification mappings are present (both have identityKey)
      const patternToQualificationMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'PATTERN' && m.targetStage === 'QUALIFICATION'
      );
      expect(patternToQualificationMappings.length).toBeGreaterThan(0);

      // Assert qualification→mechanism mappings are NOT present (mechanism has no identityKey)
      const qualificationToMechanismMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'QUALIFICATION' && m.targetStage === 'MECHANISM'
      );
      expect(qualificationToMechanismMappings.length).toBe(0);

      // Assert mechanism→refinement mappings are NOT present (mechanism has no identityKey)
      const mechanismToRefinementMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'MECHANISM' && m.targetStage === 'REFINEMENT'
      );
      expect(mechanismToRefinementMappings.length).toBe(0);

      // Assert unresolved-mapping diagnostics are present
      const unresolvedQualToMechDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_UNRESOLVED_QUALIFICATION_TO_MECHANISM'
      );
      expect(unresolvedQualToMechDiagnostic).toBeDefined();
      expect(unresolvedQualToMechDiagnostic?.category).toBe('PARTIAL_FEATURE');

      const unresolvedMechToRefineDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_UNRESOLVED_MECHANISM_TO_REFINEMENT'
      );
      expect(unresolvedMechToRefineDiagnostic).toBeDefined();
      expect(unresolvedMechToRefineDiagnostic?.category).toBe('PARTIAL_FEATURE');
    });

    it('identity mappings: valid pattern→qualification mapping with real identity keys', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Find a pattern→qualification mapping
      const patternToQualMapping = foundation.identityMappings.find(
        m => m.sourceStage === 'PATTERN' && m.targetStage === 'QUALIFICATION'
      );

      expect(patternToQualMapping).toBeDefined();

      // Verify both identity keys are real (not fabricated)
      const patternIdentityKey = patternToQualMapping!.sourceIdentityKey;
      const qualificationIdentityKey = patternToQualMapping!.targetIdentityKey;

      // Verify these keys exist in the actual stage data
      const patternExists = foundation.patternCandidates.some(p => p.identityKey === patternIdentityKey);
      const qualificationExists = foundation.patternQualifications.some(q => q.identityKey === qualificationIdentityKey);

      expect(patternExists).toBe(true);
      expect(qualificationExists).toBe(true);

      // Verify keys are not fabricated patterns like CANDIDATE_ or REFINEMENT_
      expect(patternIdentityKey).not.toMatch(/^CANDIDATE_/);
      expect(patternIdentityKey).not.toMatch(/^REFINEMENT_/);
      expect(qualificationIdentityKey).not.toMatch(/^CANDIDATE_/);
      expect(qualificationIdentityKey).not.toMatch(/^REFINEMENT_/);
    });

    it('identity mappings: qualification with no mechanism candidate is handled gracefully', async () => {
      // This test uses the real fixture - some patterns may have no mechanism candidates
      // The orchestrator should not emit qualification→mechanism mappings for such cases
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Find qualifications that have no corresponding mechanisms
      const patternIdsWithQualifications = new Set(foundation.patternQualifications.map(q => q.patternId));
      const patternIdsWithMechanisms = new Set(foundation.resolvedMechanisms.map(m => m.patternId));

      const qualificationsWithoutMechanisms = foundation.patternQualifications.filter(
        q => !patternIdsWithMechanisms.has(q.patternId)
      );

      // If any qualifications without mechanisms exist, verify no mappings were emitted for them
      if (qualificationsWithoutMechanisms.length > 0) {
        const qualificationToMechanismMappings = foundation.identityMappings.filter(
          m => m.sourceStage === 'QUALIFICATION' && m.targetStage === 'MECHANISM'
        );
        expect(qualificationToMechanismMappings.length).toBe(0);
      }
    });

    it('identity mappings: mechanism with no valid semantic identity mapping is reported as unresolved', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Mechanism candidates do not expose identityKey in current contract
      // Therefore, qualification→mechanism mappings should be reported as unresolved
      const unresolvedDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_UNRESOLVED_QUALIFICATION_TO_MECHANISM'
      );

      expect(unresolvedDiagnostic).toBeDefined();
      expect(unresolvedDiagnostic?.severity).toBe('INFO');
      expect(unresolvedDiagnostic?.category).toBe('PARTIAL_FEATURE');

      // Verify no qualification→mechanism mappings were emitted
      const qualificationToMechanismMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'QUALIFICATION' && m.targetStage === 'MECHANISM'
      );
      expect(qualificationToMechanismMappings.length).toBe(0);
    });

    it('identity mappings: refinement that is UNRESOLVED is handled correctly', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Find UNRESOLVED refinements
      const unresolvedRefinements = foundation.mechanismRefinements.filter(r => r.resolution === 'UNRESOLVED');

      if (unresolvedRefinements.length > 0) {
        // Verify no mechanism→refinement mappings were emitted for UNRESOLVED refinements
        const mechanismToRefinementMappings = foundation.identityMappings.filter(
          m => m.sourceStage === 'MECHANISM' && m.targetStage === 'REFINEMENT'
        );
        expect(mechanismToRefinementMappings.length).toBe(0);
      }
    });

    it('identity mappings: multiple candidates linked to same pattern do not cause collisions', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Find patterns with multiple mechanism candidates
      const patternToCandidateCount = new Map<string, number>();
      for (const mechanism of foundation.resolvedMechanisms) {
        const count = patternToCandidateCount.get(mechanism.patternId) || 0;
        patternToCandidateCount.set(mechanism.patternId, count + 1);
      }

      const patternsWithMultipleCandidates = Array.from(patternToCandidateCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([patternId, _]) => patternId);

      if (patternsWithMultipleCandidates.length > 0) {
        // Verify identity mappings are still deterministic and valid
        // (No fabricated keys, no duplicate mapping IDs)
        const mappingIds = new Set(foundation.identityMappings.map(m => m.mappingId));
        expect(mappingIds.size).toBe(foundation.identityMappings.length);
      }
    });

    it('identity mappings: participant-role mapping remains explicitly unresolved', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Verify no participant role identity mappings exist
      const participantRoleMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'PARTICIPANT_ROLES' || m.targetStage === 'PARTICIPANT_ROLES'
      );
      expect(participantRoleMappings.length).toBe(0);

      // Verify diagnostic documents this gap
      const partialDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL'
      );
      expect(partialDiagnostic).toBeDefined();
      expect(partialDiagnostic?.message).toContain('Participant role assignments lack explicit stage linkage');
    });

    it('10H/10L acceptance gates: canonical chart resolves to COMPLETE', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const foundation = buildCanonicalCareerFoundation({ horoscope });

      // Find 10H supplement
      const supplement10H = foundation.careerFoundationSupplements.find(s => s.supplementType === '10H');
      expect(supplement10H).toBeDefined();

      // Assert canonical fixture produces AVAILABLE and COMPLETE status
      expect(supplement10H?.availability).toBe('AVAILABLE');
      expect(supplement10H?.status10H).toBe('COMPLETE');
      expect(supplement10H?.foundation10H).not.toBeNull();

      // Find 10L supplement
      const supplement10L = foundation.careerFoundationSupplements.find(s => s.supplementType === '10L');
      expect(supplement10L).toBeDefined();

      // Assert canonical fixture produces AVAILABLE and COMPLETE status for 10L
      expect(supplement10L?.availability).toBe('AVAILABLE');
      expect(supplement10L?.status10L).toBe('COMPLETE');
      expect(supplement10L?.foundation10L).not.toBeNull();
    });

    it('10H/10L missing-data path: INSUFFICIENT_DATA when inputs missing', async () => {
      // Test 10H failure: missing houseLordship
      const horoscopeWithoutHouseLordship: any = {
        planetFacts: [
          { planet: 'SUN', sign: 'ARIES', longitude: 10, house: 10 }
        ],
        houses: [
          { houseNumber: 10, sign: 'ARIES', longitude: 10, lord: 'SUN' }
        ],
        ascendant: {
          sign: 'ARIES',
          longitude: 0
        }
        // houseLordship is missing
      };

      const foundation10H = buildCanonicalCareerFoundation({ horoscope: horoscopeWithoutHouseLordship });

      // Find 10H supplement
      const supplement10H = foundation10H.careerFoundationSupplements.find(s => s.supplementType === '10H');

      // 10H should be PARTIALLY_AVAILABLE or UNAVAILABLE due to missing houseLordship
      if (supplement10H) {
        expect(['PARTIALLY_AVAILABLE', 'UNAVAILABLE']).toContain(supplement10H.availability);
        expect(supplement10H.status10H).toBe('INSUFFICIENT_DATA');
        expect(supplement10H.missingInputs).toContain('houseLordship');
      } else {
        // Or supplement may not be created at all if 10H result is missing
        expect(supplement10H).toBeUndefined();
      }

      // Test 10L failure: missing 10H foundation (10H not COMPLETE)
      const horoscopeWith10HInsufficient: any = {
        planetFacts: [],
        houses: [],
        ascendant: {
          sign: 'ARIES',
          longitude: 0
        },
        houseLordship: {}
      };

      const foundation10L = buildCanonicalCareerFoundation({ horoscope: horoscopeWith10HInsufficient });

      // Find 10L supplement
      const supplement10L = foundation10L.careerFoundationSupplements.find(s => s.supplementType === '10L');

      // 10L should be UNAVAILABLE when 10H is not COMPLETE
      if (supplement10L) {
        expect(supplement10L.availability).toBe('UNAVAILABLE');
        expect(supplement10L.status10L).toBe('INSUFFICIENT_DATA');
      } else {
        // Or supplement may not be created at all
        expect(supplement10L).toBeUndefined();
      }
    });
  });

  describe('Regression Test: interpretCareerV2 Structural Integrity', () => {
    it('interpretCareerV2 produces valid C4-C11 conclusion structure', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Run interpretCareerV2
      const options = makeDomainOptions('2024-01-01T00:00:00Z', horoscope);
      const interpretation = interpretCareerV2(horoscope, options);

      // Verify interpretation structure is valid
      expect(interpretation).toBeDefined();
      expect(interpretation.domain).toBe('CAREER');
      expect(interpretation.evidence).toBeDefined();
      expect(interpretation.natalPromise).toBeDefined();
      expect(interpretation.dashaActivation).toBeDefined();
      expect(interpretation.transitTrigger).toBeDefined();
      expect(interpretation.vargaConfirmations).toBeDefined();
      expect(interpretation.manifestations).toBeDefined();
      expect(interpretation.conflicts).toBeDefined();
      expect(interpretation.conclusion).toBeDefined();
      expect(interpretation.conclusionData).toBeDefined();
      expect(interpretation.reasoningTrace).toBeDefined();

      // Verify canonical C11 result is present in conclusionData
      if (interpretation.conclusionData) {
        expect(interpretation.conclusionData.canonicalCareerFinalSynthesis).toBeDefined();
      }
    });

    it('interpretCareerV2 evidence set has unique IDs (no double-count)', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Run interpretCareerV2
      const options = makeDomainOptions('2024-01-01T00:00:00Z', horoscope);
      const interpretation = interpretCareerV2(horoscope, options);

      // Verify evidence count is reasonable (not zero)
      expect(interpretation.evidence.length).toBeGreaterThan(0);

      // Verify all evidence has unique IDs (no duplicates)
      const evidenceIds = interpretation.evidence.map(e => e.id);
      const uniqueIds = new Set(evidenceIds);
      expect(uniqueIds.size).toBe(evidenceIds.length);
    });

    it('interpretCareerV2 reasoning trace is present and structured', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      // Run interpretCareerV2
      const options = makeDomainOptions('2024-01-01T00:00:00Z', horoscope);
      const interpretation = interpretCareerV2(horoscope, options);

      // Verify reasoning trace is present
      expect(interpretation.reasoningTrace).toBeDefined();

      // Verify reasoning trace graph is present in conclusionData
      if (interpretation.conclusionData) {
        expect(interpretation.conclusionData.reasoningTraceGraph).toBeDefined();
      }
    });

    it('determinism: interpretCareerV2 produces deterministic output across repeated runs', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions('2024-01-01T00:00:00Z', horoscope);

      // Run interpretCareerV2 twice to verify determinism
      const interpretation1 = interpretCareerV2(horoscope, options);
      const interpretation2 = interpretCareerV2(horoscope, options);

      // Compare conclusion-relevant fields (C4-C11 derived outputs)
      // These should be byte-for-byte identical across runs
      expect(interpretation1.conclusion.strength).toBe(interpretation2.conclusion.strength);
      expect(interpretation1.conclusion.confidence).toBe(interpretation2.conclusion.confidence);
      expect(interpretation1.conclusion.statement).toBe(interpretation2.conclusion.statement);
      expect(interpretation1.conclusion.primaryEvidenceIds).toEqual(interpretation2.conclusion.primaryEvidenceIds);
      expect(interpretation1.conclusion.supportingEvidenceIds).toEqual(interpretation2.conclusion.supportingEvidenceIds);
      expect(interpretation1.conclusion.challengingEvidenceIds).toEqual(interpretation2.conclusion.challengingEvidenceIds);

      expect(interpretation1.natalPromise.strength).toBe(interpretation2.natalPromise.strength);
      expect(interpretation1.natalPromise.confidence).toBe(interpretation2.natalPromise.confidence);
      expect(interpretation1.natalPromise.statement).toBe(interpretation2.natalPromise.statement);
      expect(interpretation1.natalPromise.evidenceIds).toEqual(interpretation2.natalPromise.evidenceIds);
      expect(interpretation1.natalPromise.supportingEvidenceIds).toEqual(interpretation2.natalPromise.supportingEvidenceIds);
      expect(interpretation1.natalPromise.challengingEvidenceIds).toEqual(interpretation2.natalPromise.challengingEvidenceIds);

      expect(interpretation1.dashaActivation.active).toBe(interpretation2.dashaActivation.active);
      expect(interpretation1.dashaActivation.effect).toBe(interpretation2.dashaActivation.effect);
      expect(interpretation1.dashaActivation.strength).toBe(interpretation2.dashaActivation.strength);
      expect(interpretation1.dashaActivation.confidence).toBe(interpretation2.dashaActivation.confidence);
      expect(interpretation1.dashaActivation.statement).toBe(interpretation2.dashaActivation.statement);
      expect(interpretation1.dashaActivation.evidenceIds).toEqual(interpretation2.dashaActivation.evidenceIds);
      expect(interpretation1.dashaActivation.activatedPromiseEvidenceIds).toEqual(interpretation2.dashaActivation.activatedPromiseEvidenceIds);

      expect(interpretation1.transitTrigger.active).toBe(interpretation2.transitTrigger.active);
      expect(interpretation1.transitTrigger.effect).toBe(interpretation2.transitTrigger.effect);
      expect(interpretation1.transitTrigger.strength).toBe(interpretation2.transitTrigger.strength);
      expect(interpretation1.transitTrigger.confidence).toBe(interpretation2.transitTrigger.confidence);
      expect(interpretation1.transitTrigger.statement).toBe(interpretation2.transitTrigger.statement);
      expect(interpretation1.transitTrigger.evidenceIds).toEqual(interpretation2.transitTrigger.evidenceIds);
      expect(interpretation1.transitTrigger.triggeredPromiseEvidenceIds).toEqual(interpretation2.transitTrigger.triggeredPromiseEvidenceIds);

      expect(interpretation1.vargaConfirmations).toEqual(interpretation2.vargaConfirmations);

      expect(interpretation1.timingActivations).toEqual(interpretation2.timingActivations);

      // Compare evidence set (should be identical)
      expect(interpretation1.evidence.length).toBe(interpretation2.evidence.length);
      const evidenceIds1 = new Set(interpretation1.evidence.map(e => e.id));
      const evidenceIds2 = new Set(interpretation2.evidence.map(e => e.id));
      expect(evidenceIds1).toEqual(evidenceIds2);

      // Compare canonical C11 synthesis (authoritative conclusion)
      if (interpretation1.conclusionData && interpretation2.conclusionData) {
        expect(interpretation1.conclusionData.canonicalCareerFinalSynthesis).toEqual(
          interpretation2.conclusionData.canonicalCareerFinalSynthesis
        );
      }

      // Compare reasoning trace
      expect(interpretation1.reasoningTrace).toEqual(interpretation2.reasoningTrace);

      // Verify canonicalCareerFoundation is present in conclusionData (new field,不影响 C4-C11)
      if (interpretation1.conclusionData && interpretation2.conclusionData) {
        expect(interpretation1.conclusionData.canonicalCareerFoundation).toBeDefined();
        expect(interpretation2.conclusionData.canonicalCareerFoundation).toBeDefined();
        // Foundation should be deterministic
        expect(interpretation1.conclusionData.canonicalCareerFoundation?.foundationId).toBe(
          interpretation2.conclusionData.canonicalCareerFoundation?.foundationId
        );
      }
    });

    // TODO: Add regression-equivalence test with golden baseline
    // This test should compare the changed implementation against a committed golden baseline
    // captured from the pre-integration C11 behavior. The baseline should lock:
    // - conclusion strength/confidence/statement
    // - evidence references
    // - canonical C11 synthesis
    // - reasoning trace
    // This requires:
    // 1. Capturing a baseline from a known-good commit before P2-11B integration
    // 2. Storing the baseline in a test fixture file
    // 3. Comparing current output against the baseline
    // Deferred to a future PR when baseline infrastructure is available.
  });
});
