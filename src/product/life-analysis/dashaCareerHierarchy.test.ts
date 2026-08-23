import { describe, it, expect } from 'vitest';
import { synthesizeCareerDashaHierarchy } from './dashaCareerHierarchy';
import type { CareerTimingActivation } from '../../domain/career/careerTypes';
import { Planet } from '../../types';

describe('D07-C: Career Dasha Hierarchy Synthesis', () => {
  it('synthesizes full agreement across MD, AD, PD into ACTIVATES with high confidence', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['CAREER-TIMING-MD-1', 'CAREER-TIMING-MD-2'],
      statement: 'Jupiter activates 10th house'
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SUN,
      effect: 'ACTIVATES',
      evidenceIds: ['CAREER-TIMING-AD-1'],
      statement: 'Sun activates D10'
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MARS,
      effect: 'ACTIVATES',
      evidenceIds: ['CAREER-TIMING-PD-1'],
      statement: 'Mars activates lagna lord'
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    expect(result.overallEffect).toBe('ACTIVATES');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.primary).toBe(md);
    expect(result.modifier).toBe(ad);
    expect(result.trigger).toBe(pd);
    expect(result.evidenceIds).toEqual([
      'CAREER-TIMING-MD-1',
      'CAREER-TIMING-MD-2',
      'CAREER-TIMING-AD-1',
      'CAREER-TIMING-PD-1'
    ]);
    expect(result.evidence).toEqual([
      { evidenceId: 'CAREER-TIMING-MD-1', level: 'MAHADASHA', role: 'PRIMARY' },
      { evidenceId: 'CAREER-TIMING-MD-2', level: 'MAHADASHA', role: 'PRIMARY' },
      { evidenceId: 'CAREER-TIMING-AD-1', level: 'ANTARDASHA', role: 'MODIFIER' },
      { evidenceId: 'CAREER-TIMING-PD-1', level: 'PRATYANTARDASHA', role: 'TRIGGER' }
    ]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.evidence)).toBe(true);
    expect(Object.isFrozen(result.evidenceIds)).toBe(true);
  });

  it('prevents PD trigger from overriding MD+AD established direction (PD=CHALLENGES cannot flip MD=ACTIVATES)', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-MD'],
      statement: 'Jupiter strong'
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SUN,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-AD'],
      statement: 'Sun supportive'
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-PD'],
      statement: 'Saturn transit challenge'
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    // MD + AD established ACTIVATES; PD trigger cannot flip this to CHALLENGES
    expect(result.overallEffect).toBe('ACTIVATES');
    expect(result.confidence).toBeLessThan(0.9); // Conflict penalty applied
  });

  it('prevents PD trigger from overriding MD+AD established CHALLENGES (PD=ACTIVATES cannot flip MD=CHALLENGES)', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.RAHU,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-AD']
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.VENUS,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-PD']
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    // MD + AD established CHALLENGES; PD trigger cannot flip to ACTIVATES
    expect(result.overallEffect).toBe('CHALLENGES');
  });

  it('maps conflicting primary (ACTIVATES) and modifier (CHALLENGES) to PARTIALLY_ACTIVATES, never MIXED', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-AD']
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MARS,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-PD']
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
    expect((result.overallEffect as string)).not.toBe('MIXED');
  });

  it('preserves challenge context when MD=CHALLENGES and AD=ACTIVATES resulting in PARTIALLY_ACTIVATES', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-AD']
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.SUN,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-PD']
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
  });

  it('does not force full ACTIVATES if MD was DOES_NOT_ACTIVATE', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.MOON,
      effect: 'DOES_NOT_ACTIVATE',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-AD']
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.SUN,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-PD']
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
  });

  it('handles missing or insufficient data cleanly with reduced confidence', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.MERCURY,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.KETU,
      effect: 'INSUFFICIENT_DATA',
      evidenceIds: []
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.VENUS,
      effect: 'UNKNOWN',
      evidenceIds: []
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    expect(result.overallEffect).toBe('ACTIVATES');
    expect(result.confidence).toBeLessThan(0.75);
    expect(result.evidenceIds).toEqual(['EV-MD']);
  });

  it('generates a hierarchy-faithful descriptive summary', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-AD']
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MERCURY,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-PD']
    };

    const result = synthesizeCareerDashaHierarchy(md, ad, pd);

    expect(result.summary).toContain('JUPITER');
    expect(result.summary).toContain('SATURN');
    expect(result.summary).toContain('MERCURY');
    expect(result.summary).toContain('Partially Activates');
  });
});
