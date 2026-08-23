import { describe, it, expect } from 'vitest';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import {
  classifyReasoningEvidence,
  resolveLayer,
  resolveDirection,
  summarizeLayers
} from './reasoningHierarchy';

describe('CW-01 Reasoning Hierarchy', () => {
  it('correctly maps evidence phases to reasoning layers', () => {
    const primaryPromise = createDomainEvidence({
      id: 'EV_10H',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th house is exceptionally strong',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95
    });

    const secondarySupport = createDomainEvidence({
      id: 'EV_6H',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'SECONDARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '6th house is supportive',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 70
    });

    const d10Varga = createDomainEvidence({
      id: 'EV_D10',
      sourceType: 'VARGA',
      domain: 'CAREER',
      role: 'CONFIRMATION',
      phase: 'VARGA_CONFIRMATION',
      source: 'D10',
      statement: 'D10 confirms career status',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 80
    });

    const dashaEv = createDomainEvidence({
      id: 'EV_DASHA',
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      statement: 'Active Mahadasha activates 10th house',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 85
    });

    const transitEv = createDomainEvidence({
      id: 'EV_TRANSIT',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Saturn transit creates friction',
      polarity: 'CHALLENGING',
      strength: 'MODERATE',
      priority: 50
    });

    expect(resolveLayer(primaryPromise)).toBe('PRIMARY_PROMISE');
    expect(resolveLayer(secondarySupport)).toBe('SECONDARY_SUPPORT');
    expect(resolveLayer(d10Varga)).toBe('VARGA');
    expect(resolveLayer(dashaEv)).toBe('DASHA');
    expect(resolveLayer(transitEv)).toBe('TRANSIT');

    expect(resolveDirection(primaryPromise)).toBe('SUPPORT');
    expect(resolveDirection(transitEv)).toBe('CHALLENGE');
  });

  it('classifies and weights evidence without altering raw evidence', () => {
    const ev = createDomainEvidence({
      id: 'EV_10L',
      sourceType: 'LORDSHIP',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10th lord Sun exalted',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95
    });

    const weighted = classifyReasoningEvidence([ev]);
    expect(weighted).toHaveLength(1);
    expect(weighted[0].layer).toBe('PRIMARY_PROMISE');
    expect(weighted[0].direction).toBe('SUPPORT');
    expect(weighted[0].weight).toBe(5.0 * 1.5); // PRIMARY_PROMISE (5.0) * VERY_STRONG (1.5) = 7.5
  });

  it('summarizes layers correctly with support and challenge breakdown', () => {
    const ev1 = createDomainEvidence({
      id: 'EV_1',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10H strong',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95
    });

    const ev2 = createDomainEvidence({
      id: 'EV_2',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: '10L afflicted',
      polarity: 'CHALLENGING',
      strength: 'MODERATE',
      priority: 90
    });

    const weighted = classifyReasoningEvidence([ev1, ev2]);
    const summaries = summarizeLayers(weighted);

    expect(summaries).toHaveLength(1);
    expect(summaries[0].layer).toBe('PRIMARY_PROMISE');
    expect(summaries[0].weightedSupport).toBeGreaterThan(summaries[0].weightedChallenge);
    expect(summaries[0].direction).toBe('SUPPORT');
  });
});
