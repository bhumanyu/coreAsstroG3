import { describe, it, expect } from 'vitest';
import { synthesizeDashaDirection } from './dashaDirectionalSynthesisEngine';
import { DashaReasoningEvidence } from './dashaReasoningTypes';
import { adaptInterpretationEvidenceToReasoningFact } from './dashaFactAdapter';
import { DashaInterpretationEvidence } from './dashaInterpretationTypes';
import { Planet } from '../../types';

describe('Dasha Directional Synthesis Engine', () => {
  // Test 1 (Spec §25): Neutral facts stay NEUTRAL
  it('evaluates a set of neutral facts as NEUTRAL with 0 confidence', () => {
    const neutralEvidence: DashaReasoningEvidence[] = [
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_ACTIVATION:JUPITER::NEUTRAL',
        level: 'FACT',
        basis: 'PLACEMENT',
        effect: 'NEUTRAL',
        statement: 'Dasha lord Jupiter is activated at MAHADASHA level.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_ACTIVATION'],
        activatedHouses: []
      },
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:JUPITER:9:NEUTRAL',
        level: 'FACT',
        basis: 'PLACEMENT',
        effect: 'NEUTRAL',
        statement: 'Dasha lord Jupiter occupies House 9.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_PLACEMENT'],
        activatedHouses: [9]
      },
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_OWNERSHIP_9:JUPITER:9:NEUTRAL',
        level: 'FACT',
        basis: 'OWNERSHIP',
        effect: 'NEUTRAL',
        statement: 'Dasha lord Jupiter owns House 9.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_OWNERSHIP_9'],
        activatedHouses: [9]
      }
    ];

    const synthesis = synthesizeDashaDirection(neutralEvidence);

    expect(synthesis.effect).toBe('NEUTRAL');
    expect(synthesis.confidence).toBe(0);
    expect(synthesis.supportingEvidenceIds).toHaveLength(0);
    expect(synthesis.challengingEvidenceIds).toHaveLength(0);
    expect(synthesis.neutralEvidenceIds).toEqual([
      'DASHA_REASONING:FACT:DASHA_LORD_ACTIVATION:JUPITER::NEUTRAL',
      'DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:JUPITER:9:NEUTRAL',
      'DASHA_REASONING:FACT:DASHA_LORD_OWNERSHIP_9:JUPITER:9:NEUTRAL'
    ]);
    expect(synthesis.summary).toContain('neutral');
  });

  // Test 2 (Spec §26): Explicit SUPPORT outcome -> SUPPORT with id in supportingEvidenceIds
  it('synthesizes SUPPORT when explicit supporting evidence is present', () => {
    const evidence: DashaReasoningEvidence[] = [
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:JUPITER:9:NEUTRAL',
        level: 'FACT',
        basis: 'PLACEMENT',
        effect: 'NEUTRAL',
        statement: 'Dasha lord Jupiter occupies House 9.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_PLACEMENT'],
        activatedHouses: [9]
      },
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_DIGNITY:JUPITER::SUPPORT',
        level: 'FACT',
        basis: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Dasha lord Jupiter is in EXALTED dignity.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_DIGNITY'],
        activatedHouses: []
      }
    ];

    const synthesis = synthesizeDashaDirection(evidence);

    expect(synthesis.effect).toBe('SUPPORT');
    expect(synthesis.confidence).toBe(1.0);
    expect(synthesis.supportingEvidenceIds).toEqual([
      'DASHA_REASONING:FACT:DASHA_LORD_DIGNITY:JUPITER::SUPPORT'
    ]);
    expect(synthesis.challengingEvidenceIds).toHaveLength(0);
    expect(synthesis.neutralEvidenceIds).toEqual([
      'DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:JUPITER:9:NEUTRAL'
    ]);
  });

  // Test 3 (Spec §27): Explicit CHALLENGE -> CHALLENGE
  it('synthesizes CHALLENGE when explicit challenging evidence is present', () => {
    const evidence: DashaReasoningEvidence[] = [
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:SATURN:1:NEUTRAL',
        level: 'FACT',
        basis: 'PLACEMENT',
        effect: 'NEUTRAL',
        statement: 'Dasha lord Saturn occupies House 1.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_PLACEMENT'],
        activatedHouses: [1]
      },
      {
        id: 'DASHA_REASONING:FACT:DASHA_LORD_DIGNITY:SATURN::CHALLENGE',
        level: 'FACT',
        basis: 'DIGNITY',
        effect: 'CHALLENGE',
        statement: 'Dasha lord Saturn is in DEBILITATED dignity.',
        confidence: 1.0,
        sourceEvidenceIds: ['DASHA_LORD_DIGNITY'],
        activatedHouses: []
      }
    ];

    const synthesis = synthesizeDashaDirection(evidence);

    expect(synthesis.effect).toBe('CHALLENGE');
    expect(synthesis.confidence).toBe(1.0);
    expect(synthesis.challengingEvidenceIds).toEqual([
      'DASHA_REASONING:FACT:DASHA_LORD_DIGNITY:SATURN::CHALLENGE'
    ]);
    expect(synthesis.supportingEvidenceIds).toHaveLength(0);
    expect(synthesis.neutralEvidenceIds).toEqual([
      'DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:SATURN:1:NEUTRAL'
    ]);
  });

  // Test 4 (Spec §28): Balanced support+challenge -> MIXED
  it('synthesizes MIXED when support and challenge are balanced', () => {
    const evidence: DashaReasoningEvidence[] = [
      {
        id: 'DASHA_REASONING:FACT:SUPPORT_YOGA:JUPITER::SUPPORT',
        level: 'FACT',
        basis: 'YOGA', // weight 1.5
        effect: 'SUPPORT',
        statement: 'Jupiter participates in beneficial yoga.',
        confidence: 1.0,
        sourceEvidenceIds: ['YOGA_BENEFIC'],
        activatedHouses: []
      },
      {
        id: 'DASHA_REASONING:FACT:CHALLENGE_DIGNITY:JUPITER::CHALLENGE',
        level: 'FACT',
        basis: 'DIGNITY', // weight 1.5
        effect: 'CHALLENGE',
        statement: 'Jupiter is debilitated.',
        confidence: 1.0,
        sourceEvidenceIds: ['DIGNITY_DEBILITATED'],
        activatedHouses: []
      }
    ];

    const synthesis = synthesizeDashaDirection(evidence);

    expect(synthesis.effect).toBe('MIXED');
    expect(synthesis.confidence).toBe(0);
    expect(synthesis.supportingEvidenceIds).toHaveLength(1);
    expect(synthesis.challengingEvidenceIds).toHaveLength(1);
  });

  // Test 5 (Spec §29): sourceEvidenceIds lineage preserved
  it('preserves sourceEvidenceIds lineage when adapting interpretation evidence', () => {
    const rawEvidence: DashaInterpretationEvidence = {
      ruleId: 'DASHA_LORD_DIGNITY',
      type: 'DIGNITY',
      level: 'MAHADASHA',
      planets: [Planet.JUPITER],
      houses: [9],
      statement: 'Dasha lord Jupiter is in EXALTED dignity.',
      effect: 'SUPPORT',
      source: 'Planet Analysis'
    };

    const reasoningFact = adaptInterpretationEvidenceToReasoningFact(rawEvidence);

    expect(reasoningFact.level).toBe('FACT');
    expect(reasoningFact.basis).toBe('DIGNITY');
    expect(reasoningFact.effect).toBe('SUPPORT');
    expect(reasoningFact.confidence).toBe(1.0);
    expect(reasoningFact.sourceEvidenceIds).toContain('DASHA_LORD_DIGNITY');
    expect(reasoningFact.sourceEvidenceIds).toContain('DASHA:MAHADASHA:DASHA_LORD_DIGNITY:JUPITER:9:SUPPORT');
    expect(reasoningFact.activatedHouses).toEqual([9]);

    const synthesis = synthesizeDashaDirection([reasoningFact]);
    expect(synthesis.reasoningEvidence[0].sourceEvidenceIds).toContain('DASHA_LORD_DIGNITY');
  });

  // Test 6 (Spec §30): No text-based inference (NEUTRAL fact with word "strong" stays NEUTRAL)
  it('does not perform text-based keyword inference on NEUTRAL evidence statements', () => {
    const deceptiveNeutralEvidence: DashaReasoningEvidence = {
      id: 'DASHA_REASONING:FACT:STRENGTH_STATEMENT:JUPITER::NEUTRAL',
      level: 'FACT',
      basis: 'STRENGTH',
      effect: 'NEUTRAL',
      statement: 'Dasha lord Jupiter is exceptionally strong and powerful with exalted auspiciousness.',
      confidence: 1.0,
      sourceEvidenceIds: ['STRENGTH_STATEMENT'],
      activatedHouses: []
    };

    const synthesis = synthesizeDashaDirection([deceptiveNeutralEvidence]);

    expect(synthesis.effect).toBe('NEUTRAL');
    expect(synthesis.confidence).toBe(0);
    expect(synthesis.supportingEvidenceIds).toHaveLength(0);
    expect(synthesis.challengingEvidenceIds).toHaveLength(0);
    expect(synthesis.neutralEvidenceIds).toContain(deceptiveNeutralEvidence.id);
  });
});
