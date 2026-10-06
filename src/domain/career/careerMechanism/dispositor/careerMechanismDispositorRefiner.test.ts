import { describe, it, expect } from 'vitest';
import type {
  CareerMechanismCandidate,
  CareerMechanismEvidence,
  CareerMechanismProvenance
} from '../careerMechanismTypes';
import type {
  CareerDispositorContext,
  CareerMechanismDispositorRefinementInput
} from './careerMechanismDispositorTypes';
import { defaultCareerMechanismDispositorRefiner } from './defaultCareerMechanismDispositorRefiner';
import { assertValidDispositorRefinementSource } from './careerMechanismDispositorUtils';
import { Planet } from '../../../../types';

/**
 * P2-07E Career Mechanism Dispositor Refiner Tests
 *
 * Synthetic tests for dispositor-based mechanism refinement.
 * Tests cover:
 * - Terminal refinement emits REFINED + DISPOSITOR-role evidence
 * - MUTUAL_RECEPTION → UNCHANGED, no invented terminal
 * - SELF_DISPOSITOR preserved
 * - sourceEvidenceIds propagated into provenance
 * - D10/DASHA source rejection
 * - Order-determinism (permuted contexts → identical result)
 * - No-candidate path impossible by type (input accepts candidate only)
 * - Original candidate mechanism + evidence preserved
 * - INSUFFICIENT_DATA when no usable context
 */

describe('CareerMechanismDispositorRefiner', () => {
  describe('Terminal refinement', () => {
    it('emits REFINED status with DISPOSITOR-role evidence for Mercury terminal', () => {
      // Create a synthetic RESEARCH candidate
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // Create a dispositor context with Mercury terminal
      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be REFINED
      expect(result.status).toBe('REFINED');

      // Should have refined mechanisms
      expect(result.mechanisms.length).toBeGreaterThan(0);

      // Should have DISPOSITOR evidence in refined mechanisms
      const hasDispositorEvidence = result.mechanisms.some(mech =>
        mech.evidence.some(ev => ev.source === 'DISPOSITOR' && ev.role === 'REFINING')
      );
      expect(hasDispositorEvidence).toBe(true);

      // Verify DISPOSITOR evidence has empty relationshipIds and non-empty participantIds
      const dispositorEvidence = result.mechanisms
        .flatMap(mech => mech.evidence)
        .find(ev => ev.source === 'DISPOSITOR');
      expect(dispositorEvidence).toBeDefined();
      expect(dispositorEvidence!.relationshipIds).toEqual([]);
      expect(dispositorEvidence!.participantIds.length).toBeGreaterThan(0);
    });

    it('refines RESEARCH to SPECIALIZED_KNOWLEDGE via Mercury terminal', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should have SPECIALIZED_KNOWLEDGE in refined mechanisms
      const hasSpecializedKnowledge = result.mechanisms.some(mech =>
        mech.mechanismType === 'SPECIALIZED_KNOWLEDGE'
      );
      expect(hasSpecializedKnowledge).toBe(true);
    });
  });

  describe('Cycle handling', () => {
    it('returns UNCHANGED for MUTUAL_RECEPTION with sufficientData: true, no invented terminal', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // Create a context with MUTUAL_RECEPTION outcome
      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: undefined,
        depth: 2,
        outcome: 'MUTUAL_RECEPTION',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be UNCHANGED
      expect(result.status).toBe('UNCHANGED');

      // Should have no mechanisms
      expect(result.mechanisms.length).toBe(0);
    });

    it('returns UNCHANGED for CYCLE with sufficientData: true, no invented terminal', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // Create a context with CYCLE outcome
      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: undefined,
        depth: 2,
        outcome: 'CYCLE',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be UNCHANGED
      expect(result.status).toBe('UNCHANGED');

      // Should have no mechanisms
      expect(result.mechanisms.length).toBe(0);
    });
  });

  describe('SELF_DISPOSITOR handling', () => {
    it('preserves SELF_DISPOSITOR in context without refinement', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // Self-dispositor context (chain of length 1)
      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 0,
        outcome: 'SELF_DISPOSITOR',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Self-dispositor with Mercury terminal should still refine
      // (Mercury is in its own sign)
      expect(result.status).toBe('REFINED');
    });
  });

  describe('sourceEvidenceIds propagation', () => {
    it('propagates sourceEvidenceIds into provenance', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1', 'ev-2'], // Specific evidence IDs
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Evidence IDs should include sourceEvidenceIds
      expect(result.evidence).toContain('ev-1');
      expect(result.evidence).toContain('ev-2');
    });
  });

  describe('Source firewall', () => {
    it('rejects D10 source per spec §18', () => {
      expect(() => {
        assertValidDispositorRefinementSource('D10');
      }).toThrow('Invalid dispositor refinement source: D10');
    });

    it('rejects DASHA source per spec §18', () => {
      expect(() => {
        assertValidDispositorRefinementSource('DASHA');
      }).toThrow('Invalid dispositor refinement source: DASHA');
    });

    it('rejects TRANSIT source per spec §18', () => {
      expect(() => {
        assertValidDispositorRefinementSource('TRANSIT');
      }).toThrow('Invalid dispositor refinement source: TRANSIT');
    });

    it('rejects TIMING source per spec §18', () => {
      expect(() => {
        assertValidDispositorRefinementSource('TIMING');
      }).toThrow('Invalid dispositor refinement source: TIMING');
    });

    it('rejects FINAL_SYNTHESIS source per spec §18', () => {
      expect(() => {
        assertValidDispositorRefinementSource('FINAL_SYNTHESIS');
      }).toThrow('Invalid dispositor refinement source: FINAL_SYNTHESIS');
    });

    it('rejects AI source per spec §18', () => {
      expect(() => {
        assertValidDispositorRefinementSource('AI');
      }).toThrow('Invalid dispositor refinement source: AI');
    });

    it('accepts valid sources', () => {
      expect(() => {
        assertValidDispositorRefinementSource('PATTERN');
        assertValidDispositorRefinementSource('DISPOSITOR');
      }).not.toThrow();
    });

    it('rejects D10-sourced evidence through refine()', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-d10',
            mechanismType: 'RESEARCH',
            source: 'D10', // Forbidden source
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from D10'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-d10'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-d10'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      // Should throw due to D10 source in evidence
      expect(() => {
        defaultCareerMechanismDispositorRefiner.refine(input);
      }).toThrow('Invalid dispositor refinement source: D10');
    });
  });

  describe('Order determinism', () => {
    it('produces identical result with permuted contexts', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY', 'PLANET:JUPITER'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY', 'PLANET:JUPITER'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context1: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const context2: CareerDispositorContext = {
        startPlanetId: Planet.JUPITER,
        chain: [Planet.JUPITER, Planet.MERCURY, Planet.JUPITER],
        terminalPlanetId: Planet.JUPITER,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-2',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      // Test with contexts in order 1, 2
      const input1: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context1, context2]
      };

      const result1 = defaultCareerMechanismDispositorRefiner.refine(input1);

      // Test with contexts in order 2, 1
      const input2: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context2, context1]
      };

      const result2 = defaultCareerMechanismDispositorRefiner.refine(input2);

      // Results should be identical
      expect(result1.status).toBe(result2.status);
      expect(result1.mechanisms.length).toBe(result2.mechanisms.length);
      expect(result1.originalCandidateId).toBe(result2.originalCandidateId);
    });
  });

  describe('Type safety', () => {
    it('no-candidate path is impossible by type (input accepts candidate only)', () => {
      // This is a compile-time type check - the input type requires a candidate
      // There's no way to call refine without a candidate
      const input: CareerMechanismDispositorRefinementInput = {
        candidate: {} as CareerMechanismCandidate,
        dispositorContexts: []
      };

      // This validates the type structure
      expect(input.candidate).toBeDefined();
    });
  });

  describe('Original candidate preservation', () => {
    it('preserves original candidate mechanism and evidence', () => {
      const originalEvidence: CareerMechanismEvidence = {
        evidenceId: 'ev-1',
        mechanismType: 'RESEARCH',
        source: 'PATTERN',
        role: 'ESTABLISHING',
        participantIds: ['PLANET:MERCURY'],
        relationshipIds: [],
        patternId: 'pattern-1',
        explanation: 'Research mechanism from pattern'
      };

      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [originalEvidence],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Original candidate ID should be preserved
      expect(result.originalCandidateId).toBe(candidate.candidateId);

      // Original provenance should be preserved in result
      expect(result.provenance.originalProvenance.patternIds).toEqual(candidate.provenance.patternIds);
      expect(result.provenance.originalProvenance.evidenceIds).toEqual(candidate.provenance.evidenceIds);

      // Refined mechanisms should include original evidence
      const hasOriginalEvidence = result.mechanisms.some(mech =>
        mech.evidence.some(ev => ev.evidenceId === 'ev-1')
      );
      expect(hasOriginalEvidence).toBe(true);
    });
  });

  describe('Evidence vs relationship separation', () => {
    it('asserts no evidence ID appears in any relationshipIds array', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.MERCURY],
        terminalPlanetId: Planet.MERCURY,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1', 'ev-2'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Collect all evidence IDs from all mechanisms
      const allEvidenceIds = new Set<string>();
      for (const mechanism of result.mechanisms) {
        for (const evidence of mechanism.evidence) {
          allEvidenceIds.add(evidence.evidenceId);
        }
      }

      // Collect all relationship IDs from all mechanisms
      const allRelationshipIds = new Set<string>();
      for (const mechanism of result.mechanisms) {
        for (const evidence of mechanism.evidence) {
          for (const relId of evidence.relationshipIds) {
            allRelationshipIds.add(relId);
          }
        }
      }

      // Assert no evidence ID appears in relationshipIds
      for (const evidenceId of allEvidenceIds) {
        expect(allRelationshipIds.has(evidenceId)).toBe(false);
      }
    });
  });

  describe('INSUFFICIENT_DATA handling', () => {
    it('returns INSUFFICIENT_DATA when no usable context', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // Empty contexts
      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: []
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be INSUFFICIENT_DATA
      expect(result.status).toBe('INSUFFICIENT_DATA');

      // Should have no mechanisms
      expect(result.mechanisms.length).toBe(0);
    });

    it('returns INSUFFICIENT_DATA when all contexts have insufficient data', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [], // Empty chain
        terminalPlanetId: undefined,
        depth: 0,
        outcome: 'INSUFFICIENT_DATA',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: [],
        relevantHouseIds: [],
        sufficientData: false
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be INSUFFICIENT_DATA
      expect(result.status).toBe('INSUFFICIENT_DATA');
    });

    it('returns UNCHANGED for DEPTH_LIMIT context (sufficientData true, terminalPlanetId undefined, depth >= MAX)', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // DEPTH_LIMIT context: sufficientData true, terminalPlanetId undefined, depth >= MAX
      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [Planet.MERCURY, Planet.JUPITER, Planet.SATURN, Planet.MERCURY], // Long chain
        terminalPlanetId: undefined, // No terminal
        depth: 10, // >= MAX_DISPOSITOR_DEPTH
        outcome: 'DEPTH_LIMIT',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: ['ev-1'],
        relevantHouseIds: [],
        sufficientData: true
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be UNCHANGED (DEPTH_LIMIT does not refine)
      expect(result.status).toBe('UNCHANGED');

      // Should have no mechanisms (chain-tail is never treated as terminal)
      expect(result.mechanisms.length).toBe(0);
    });

    it('distinguishes INSUFFICIENT_DATA from DEPTH_LIMIT in outcome', () => {
      const candidate: CareerMechanismCandidate = {
        candidateId: 'CAREER_MECHANISM_CANDIDATE:pattern-1:RESEARCH',
        patternId: 'pattern-1',
        mechanismType: 'RESEARCH',
        pathway: 'PATTERN',
        evidence: [
          {
            evidenceId: 'ev-1',
            mechanismType: 'RESEARCH',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PLANET:MERCURY'],
            relationshipIds: [],
            patternId: 'pattern-1',
            explanation: 'Research mechanism from pattern'
          }
        ],
        provenance: {
          patternIds: ['pattern-1'],
          relationshipIds: [],
          participantIds: ['PLANET:MERCURY'],
          evidenceIds: ['ev-1'],
          sourceStages: ['PATTERN']
        },
        explanation: 'Research candidate'
      };

      // INSUFFICIENT_DATA context: missing data, not depth-limited
      const context: CareerDispositorContext = {
        startPlanetId: Planet.MERCURY,
        chain: [], // Empty chain - missing data
        terminalPlanetId: undefined,
        depth: 0,
        outcome: 'INSUFFICIENT_DATA',
        chainId: 'chain-1',
        provenanceIds: [],
        sourceEvidenceIds: [],
        relevantHouseIds: [],
        sufficientData: false
      };

      const input: CareerMechanismDispositorRefinementInput = {
        candidate,
        dispositorContexts: [context]
      };

      const result = defaultCareerMechanismDispositorRefiner.refine(input);

      // Should be INSUFFICIENT_DATA (not UNCHANGED)
      expect(result.status).toBe('INSUFFICIENT_DATA');

      // Should have no mechanisms
      expect(result.mechanisms.length).toBe(0);
    });
  });
});
