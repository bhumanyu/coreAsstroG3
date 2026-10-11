import { describe, expect, it } from 'vitest';
import {
  buildNormalizedCareerTiming,
  buildNormalizedWealthTiming,
  mapPeriodToCanonicalEvidenceIds
} from './domainTimingAdapter';
import {
  createDomainInterpretation,
  createDomainEvidence,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createDomainConclusion
} from './index';
import { Planet } from '../../types';
import { resolveSemanticIdentity } from './DomainEvidence';
import type { DomainEvidence } from './DomainEvidence';

describe('domainTimingAdapter - Period Traceability (Finding 1)', () => {
  it('returns RESOLVED with matching canonical evidence IDs for MD period', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:MD:JUPITER:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Jupiter Mahadasha activates career'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'MD', Planet.JUPITER, []);

    expect(result.evidenceIds).toEqual(['CAREER_DASHA:MD:JUPITER:SUPPORT']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('returns RESOLVED with matching canonical evidence IDs for AD period', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:AD:SATURN:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Saturn Antardasha modifies career'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'AD',
            planet: Planet.SATURN
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'AD', Planet.SATURN, []);

    expect(result.evidenceIds).toEqual(['CAREER_DASHA:AD:SATURN:SUPPORT']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('returns RESOLVED with matching canonical evidence IDs for PD period', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:PD:MARS:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Mars Pratyantardasha triggers career'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'PD',
            planet: Planet.MARS
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'PD', Planet.MARS, []);

    expect(result.evidenceIds).toEqual(['CAREER_DASHA:PD:MARS:SUPPORT']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('returns DEGRADED when canonical evidence is absent for the period', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:MD:JUPITER:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Jupiter Mahadasha activates career'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ]
    });

    // Request AD but only MD exists
    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'AD', Planet.SATURN, []);

    expect(result.evidenceIds).toEqual([]);
    expect(result.traceability).toBe('DEGRADED');
  });

  it('returns DEGRADED when no DASHA evidence exists at all', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        createDomainEvidence({
          id: 'NATAL_EVIDENCE',
          sourceType: 'PLANET',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          statement: 'Natal evidence only'
        })
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'MD', Planet.JUPITER, []);

    expect(result.evidenceIds).toEqual([]);
    expect(result.traceability).toBe('DEGRADED');
  });

  it('returns DEGRADED when interpretation is undefined', () => {
    const result = mapPeriodToCanonicalEvidenceIds(undefined, 'MD', Planet.JUPITER, []);

    expect(result.evidenceIds).toEqual([]);
    expect(result.traceability).toBe('DEGRADED');
  });

  it('buildNormalizedCareerTiming includes traceability status on each period', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:MD:JUPITER:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Jupiter Mahadasha'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any,
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:AD:SATURN:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Saturn Antardasha'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'AD',
            planet: Planet.SATURN
          }
        } as any
      ],
      conclusionData: {
        careerDashaSynthesis: {
          md: {
            planet: Planet.JUPITER,
            effect: 'SUPPORTS',
            factors: [{ id: 'FACTOR_1', period: 'MD', planet: Planet.JUPITER, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }],
            summary: 'MD summary'
          },
          ad: {
            planet: Planet.SATURN,
            effect: 'SUPPORTS',
            factors: [{ id: 'FACTOR_2', period: 'AD', planet: Planet.SATURN, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }],
            summary: 'AD summary'
          },
          pd: {
            planet: Planet.MARS,
            effect: 'NEUTRAL',
            factors: [{ id: 'FACTOR_3', period: 'PD', planet: Planet.MARS, category: 'TEST', direction: 'NEUTRAL', weight: 1.0, statement: 'Test' }],
            summary: 'PD summary'
          },
          combined: {
            md: {
              planet: Planet.JUPITER,
              effect: 'SUPPORTS',
              factors: [{ id: 'FACTOR_1', period: 'MD', planet: Planet.JUPITER, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }]
            },
            ad: {
              planet: Planet.SATURN,
              effect: 'SUPPORTS',
              factors: [{ id: 'FACTOR_2', period: 'AD', planet: Planet.SATURN, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }]
            },
            pd: {
              planet: Planet.MARS,
              effect: 'NEUTRAL',
              factors: [{ id: 'FACTOR_3', period: 'PD', planet: Planet.MARS, category: 'TEST', direction: 'NEUTRAL', weight: 1.0, statement: 'Test' }]
            },
            combinedEffect: 'SUPPORTS'
          },
          asOf: '2024-01-01T00:00:00.000Z'
        }
      }
    });

    const timing = buildNormalizedCareerTiming(interpretation);

    expect(timing).toBeDefined();
    expect(timing?.status).toBe('AVAILABLE');
    expect(timing?.mahadasha?.traceability).toBe('RESOLVED');
    expect(timing?.antardasha?.traceability).toBe('RESOLVED');
    expect(timing?.pratyantardasha?.traceability).toBe('DEGRADED'); // No PD evidence
  });

  it('buildNormalizedWealthTiming includes traceability status on each period', () => {
    const interpretation = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'WEALTH_DASHA:MD:JUPITER:SUPPORT',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Jupiter Mahadasha'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ],
      periodTimingActivations: [
        {
          period: 'MD',
          planet: Planet.JUPITER,
          effect: 'ACTIVATES',
          dimensions: {
            accumulation: 'ACTIVATES',
            gains: 'ACTIVATES',
            fortune: 'ACTIVATES',
            speculation: 'ACTIVATES'
          },
          evidenceIds: [],
          statement: 'MD period'
        },
        {
          period: 'AD',
          planet: Planet.SATURN,
          effect: 'CHALLENGES',
          dimensions: {
            accumulation: 'CHALLENGES',
            gains: 'CHALLENGES',
            fortune: 'CHALLENGES',
            speculation: 'CHALLENGES'
          },
          evidenceIds: [],
          statement: 'AD period'
        },
        {
          period: 'PD',
          planet: Planet.MARS,
          effect: 'DOES_NOT_ACTIVATE',
          dimensions: {
            accumulation: 'DOES_NOT_ACTIVATE',
            gains: 'DOES_NOT_ACTIVATE',
            fortune: 'DOES_NOT_ACTIVATE',
            speculation: 'DOES_NOT_ACTIVATE'
          },
          evidenceIds: [],
          statement: 'PD period'
        }
      ]
    });

    const timing = buildNormalizedWealthTiming(interpretation);

    expect(timing).toBeDefined();
    expect(timing?.status).toBe('AVAILABLE');
    expect(timing?.mahadasha?.traceability).toBe('RESOLVED');
    expect(timing?.antardasha?.traceability).toBe('DEGRADED'); // No AD evidence
    expect(timing?.pratyantardasha?.traceability).toBe('DEGRADED'); // No PD evidence
  });
});

describe('domainTimingAdapter - Semantic Identity Resolution (P2-11D)', () => {
  it('resolveSemanticIdentity returns identityKey when present', () => {
    const evidence = createDomainEvidence({
      id: 'OCCURRENCE_ID_123',
      sourceType: 'DASHA',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      statement: 'Test evidence',
      identityKey: 'SEMANTIC_KEY_ABC'
    });

    const identity = resolveSemanticIdentity(evidence);
    expect(identity).toBe('SEMANTIC_KEY_ABC');
  });

  it('resolveSemanticIdentity falls back to id when identityKey is absent', () => {
    const evidence = createDomainEvidence({
      id: 'OCCURRENCE_ID_123',
      sourceType: 'DASHA',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      statement: 'Test evidence'
    });

    const identity = resolveSemanticIdentity(evidence);
    expect(identity).toBe('OCCURRENCE_ID_123');
  });

  it('resolveSemanticIdentity falls back to id when identityKey is empty string', () => {
    const evidence = createDomainEvidence({
      id: 'OCCURRENCE_ID_123',
      sourceType: 'DASHA',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      statement: 'Test evidence',
      identityKey: ''
    });

    const identity = resolveSemanticIdentity(evidence);
    expect(identity).toBe('OCCURRENCE_ID_123');
  });

  it('resolveSemanticIdentity falls back to id when identityKey is whitespace-only (RAW object literal)', () => {
    // Use RAW DomainEvidence object literal, not createDomainEvidence factory,
    // to exercise the problematic input path (factory drops falsy identityKey)
    const evidence: DomainEvidence = {
      id: 'OCCURRENCE_ID_456',
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Test evidence',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 1,
      relatedEvidenceIds: [],
      identityKey: '   ' // Whitespace-only
    };

    const identity = resolveSemanticIdentity(evidence);
    expect(identity).toBe('OCCURRENCE_ID_456');
  });

  it('resolveSemanticIdentity falls back to id when identityKey is empty string (RAW object literal)', () => {
    // Use RAW DomainEvidence object literal, not createDomainEvidence factory,
    // to exercise the problematic input path (factory drops falsy identityKey)
    const evidence: DomainEvidence = {
      id: 'OCCURRENCE_ID_789',
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Test evidence',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 1,
      relatedEvidenceIds: [],
      identityKey: '' // Empty string
    };

    const identity = resolveSemanticIdentity(evidence);
    expect(identity).toBe('OCCURRENCE_ID_789');
  });

  it('mapPeriodToCanonicalEvidenceIds uses semantic identity (identityKey) when present', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'OCCURRENCE_ID_123',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Jupiter Mahadasha activates career',
            identityKey: 'SEMANTIC_KEY_ABC'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'MD', Planet.JUPITER, []);

    expect(result.evidenceIds).toEqual(['SEMANTIC_KEY_ABC']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('mapPeriodToCanonicalEvidenceIds falls back to occurrence id when identityKey absent', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'OCCURRENCE_ID_456',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Saturn Antardasha modifies career'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'AD',
            planet: Planet.SATURN
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'AD', Planet.SATURN, []);

    expect(result.evidenceIds).toEqual(['OCCURRENCE_ID_456']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('mapPeriodToCanonicalEvidenceIds handles mixed identityKey presence (some with, some without)', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'OCC_1',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Evidence with identityKey',
            identityKey: 'SEM_1'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any,
        {
          ...createDomainEvidence({
            id: 'OCC_2',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Evidence without identityKey'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'MD', Planet.JUPITER, []);

    // Sorted deterministically by semantic identity
    expect(result.evidenceIds).toEqual(['OCC_2', 'SEM_1']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('mapPeriodToCanonicalEvidenceIds produces deterministic output (sorted by semantic identity)', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'OCC_Z',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Third evidence',
            identityKey: 'SEM_C'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any,
        {
          ...createDomainEvidence({
            id: 'OCC_A',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'First evidence',
            identityKey: 'SEM_A'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any,
        {
          ...createDomainEvidence({
            id: 'OCC_M',
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Second evidence',
            identityKey: 'SEM_B'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'MD', Planet.JUPITER, []);

    // Sorted deterministically by semantic identity
    expect(result.evidenceIds).toEqual(['SEM_A', 'SEM_B', 'SEM_C']);
    expect(result.traceability).toBe('RESOLVED');
  });

  it('downstream resolution: id !== identityKey resolves correctly through actual consumer path', () => {
    // Test that semantic identity resolution works end-to-end through the adapter
    // Evidence has id !== identityKey, and the adapter correctly uses identityKey for resolution
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'OCCURRENCE_UNIQUE_ID_ABC', // Occurrence ID
            sourceType: 'DASHA',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Jupiter Mahadasha activates career',
            identityKey: 'SEMANTIC_FACT_JUPITER_MD' // Semantic identity key
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: {
            level: 'MD',
            planet: Planet.JUPITER
          }
        } as any
      ]
    });

    const result = mapPeriodToCanonicalEvidenceIds(interpretation, 'MD', Planet.JUPITER, []);

    // The adapter should return the semantic identity (identityKey), not the occurrence ID
    expect(result.evidenceIds).toEqual(['SEMANTIC_FACT_JUPITER_MD']);
    expect(result.traceability).toBe('RESOLVED');

    // Verify that the semantic identity is NOT the occurrence ID
    expect(result.evidenceIds[0]).not.toBe('OCCURRENCE_UNIQUE_ID_ABC');
  });
});
