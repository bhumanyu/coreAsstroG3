import { describe, it, expect } from 'vitest';
import {
  detectReasoningConflicts,
  resolveReasoningConflicts
} from './reasoningConflictResolver';
import type { NatalPromiseResult } from './reasoningConclusion';

describe('CW-01 Reasoning Conflict Resolver', () => {
  const strongNatalPromise: NatalPromiseResult = {
    direction: 'SUPPORT',
    strength: 'STRONG',
    primaryDirection: 'SUPPORT',
    primaryStrength: 'STRONG',
    primarySupport: 10,
    primaryChallenge: 0,
    secondarySupport: 5,
    secondaryChallenge: 0,
    modifierSupport: 0,
    modifierChallenge: 0,
    guardrails: ['NONE'],
    contradiction: {
      hasContradiction: false,
      primaryContradictionRatio: 0,
      secondaryContradictionRatio: 0,
      modifierContradictionRatio: 0
    },
    rationale: 'Natal promise strong'
  };

  it('detects structural conflicts across layers', () => {
    const conflicts = detectReasoningConflicts({
      natalPromise: strongNatalPromise,
      vargaDirection: 'CHALLENGE',
      dashaEffect: 'CHALLENGES',
      transitDirection: 'CHALLENGE'
    });

    expect(conflicts).toHaveLength(3);
    expect(conflicts.some((c) => c.kind === 'VARGA_EXPRESSION_CONFLICT')).toBe(true);
    expect(conflicts.some((c) => c.kind === 'DASHA_NATAL_TENSION')).toBe(true);
    expect(conflicts.some((c) => c.kind === 'TRANSIT_NATAL_TENSION')).toBe(true);
  });

  it('ensures challenging transit does NOT erase a strong natal promise', () => {
    const resolution = resolveReasoningConflicts({
      natalPromise: strongNatalPromise,
      transitDirection: 'CHALLENGE'
    });

    expect(resolution.finalDirection).toBe('SUPPORT');
  });

  it('ensures active Dasha cannot manufacture a natal promise out of challenged chart', () => {
    const challengedNatal: NatalPromiseResult = {
      direction: 'CHALLENGE',
      strength: 'WEAK',
      primaryDirection: 'CHALLENGE',
      primaryStrength: 'WEAK',
      primarySupport: 0,
      primaryChallenge: 10,
      secondarySupport: 0,
      secondaryChallenge: 5,
      modifierSupport: 0,
      modifierChallenge: 0,
      guardrails: ['NONE'],
      contradiction: {
        hasContradiction: false,
        primaryContradictionRatio: 0,
        secondaryContradictionRatio: 0,
        modifierContradictionRatio: 0
      },
      rationale: 'Challenged chart'
    };

    const resolution = resolveReasoningConflicts({
      natalPromise: challengedNatal,
      dashaEffect: 'ACTIVATES'
    });

    expect(resolution.finalDirection).toBe('CHALLENGE');
  });
});
