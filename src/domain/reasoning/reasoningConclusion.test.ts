import { describe, it, expect } from 'vitest';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import { classifyReasoningEvidence } from './reasoningHierarchy';
import { resolveNatalPromise, resolveStrength } from './reasoningConclusion';

describe('CW-01 Reasoning Conclusion', () => {
  it('resolves qualitative strength from support and challenge dominance', () => {
    expect(resolveStrength(0, 0)).toBe('UNDETERMINED');
    expect(resolveStrength(10, 0)).toBe('VERY_STRONG');
    expect(resolveStrength(10, 3)).toBe('STRONG');
    expect(resolveStrength(10, 6)).toBe('MODERATE');
    expect(resolveStrength(5, 5)).toBe('MIXED');
    expect(resolveStrength(3, 10)).toBe('WEAK');
    expect(resolveStrength(0, 10)).toBe('VERY_WEAK');
  });

  it('ensures primary promise outweighs multiple weak secondary factors (C5)', () => {
    const primarySupport = createDomainEvidence({
      id: 'EV_PRIMARY',
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

    const weakSecondaries = [1, 2, 3, 4].map((i) =>
      createDomainEvidence({
        id: `EV_SEC_${i}`,
        sourceType: 'ASPECT',
        domain: 'CAREER',
        role: 'SECONDARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: `Secondary aspect ${i} is neutral or mildly challenging`,
        polarity: 'CHALLENGING',
        strength: 'WEAK',
        priority: 40
      })
    );

    const weighted = classifyReasoningEvidence([primarySupport, ...weakSecondaries]);
    const natalPromise = resolveNatalPromise(weighted);

    expect(natalPromise.direction).toBe('SUPPORT');
    expect(natalPromise.primarySupport).toBeGreaterThan(natalPromise.primaryChallenge);
    expect(natalPromise.primarySupport).toBe(7.5);
    // 4 weak secondaries: 4 * (2.5 * 0.5) = 5.0
    expect(natalPromise.secondaryChallenge).toBe(5.0);
  });

  it('excludes dasha and transit evidence from natal promise evaluation', () => {
    const dashaEv = createDomainEvidence({
      id: 'EV_DASHA',
      sourceType: 'DASHA',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      statement: 'Active Mahadasha',
      polarity: 'SUPPORTING',
      strength: 'VERY_STRONG',
      priority: 95
    });

    const transitEv = createDomainEvidence({
      id: 'EV_TRANSIT',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Active Transit',
      polarity: 'CHALLENGING',
      strength: 'VERY_STRONG',
      priority: 95
    });

    const weighted = classifyReasoningEvidence([dashaEv, transitEv]);
    const natalPromise = resolveNatalPromise(weighted);

    expect(natalPromise.direction).toBe('UNAVAILABLE');
    expect(natalPromise.strength).toBe('UNDETERMINED');
    expect(natalPromise.primarySupport).toBe(0);
    expect(natalPromise.primaryChallenge).toBe(0);
  });
});
