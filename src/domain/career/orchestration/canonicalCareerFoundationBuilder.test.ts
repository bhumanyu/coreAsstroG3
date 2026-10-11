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

      // Verify dispositor contexts diagnostic is present
      const dispositorDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE'
      );
      expect(dispositorDiagnostic).toBeDefined();
      expect(dispositorDiagnostic?.severity).toBe('WARNING');
      expect(dispositorDiagnostic?.category).toBe('MISSING_DATA');

      // Verify identity mappings diagnostic is present
      const identityMappingDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED'
      );
      expect(identityMappingDiagnostic).toBeDefined();
      expect(identityMappingDiagnostic?.severity).toBe('INFO');
      expect(identityMappingDiagnostic?.category).toBe('DEFERRED_FEATURE');

      // Verify mechanism refinements are UNRESOLVED/UNAVAILABLE when dispositor contexts are missing
      for (const refinement of foundation.mechanismRefinements) {
        expect(refinement.resolution).toBe('UNRESOLVED');
        expect(refinement.status).toBe('UNAVAILABLE');
        expect(refinement.mechanism).toBeNull();
      }

      // Verify identity mappings are empty
      expect(foundation.identityMappings).toEqual([]);
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
  });

  describe('Regression Test: interpretCareerV2 Structural Integrity', () => {
    // NOTE: These are structural smoke tests, not regression-equivalence tests.
    // They verify that interpretCareerV2 produces valid output structure, but do NOT
    // assert that buildCanonicalCareerFoundation leaves interpretCareerV2 output unchanged.
    // Full regression-equivalence testing (comparing interpretCareerV2 output before/after
    // building the foundation) is out of scope for this milestone.

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
  });
});
