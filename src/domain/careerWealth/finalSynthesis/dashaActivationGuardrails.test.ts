import { describe, it, expect } from 'vitest';
import { Planet } from '../../../types';
import type { CareerDashaSynthesis } from '../../career/careerDasha/careerDashaSynthesisTypes';
import { resolveDashaActivationGuardrail } from './dashaActivationGuardrails';
import { createMockCareerDashaSynthesis } from '../../timing/careerWealthTiming/__testUtils__/mockDasha';

describe('dashaActivationGuardrails (CW-05 boundary)', () => {
  it('returns INSUFFICIENT_DATA when dashaSynthesis or combined is undefined', () => {
    const result1 = resolveDashaActivationGuardrail(undefined);
    expect(result1.effect).toBe('INSUFFICIENT_DATA');
    expect(result1.status).toBe('INSUFFICIENT_DATA');
    expect(result1.hierarchyConsistent).toBe(false);
    expect(result1.confidence).toBeUndefined();
    expect(result1.strength).toBeUndefined();
    expect(result1.summary).toBeUndefined();
    expect(result1.hierarchy).toBeUndefined();
    expect(result1.consistency).toEqual({
      effectConsistent: false,
      hierarchyRolesConsistent: false
    });

    // Intentionally testing malformed runtime input
    const result2 = resolveDashaActivationGuardrail({} as unknown as CareerDashaSynthesis);
    expect(result2.effect).toBe('INSUFFICIENT_DATA');
    expect(result2.status).toBe('INSUFFICIENT_DATA');
    expect(result2.hierarchyConsistent).toBe(false);
    expect(result2.consistency).toEqual({
      effectConsistent: false,
      hierarchyRolesConsistent: false
    });
  });

  it('strong MD challenge remains dominant when AD also challenges', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.SATURN,
      adPlanet: Planet.RAHU,
      pdPlanet: Planet.JUPITER,
      mdEffect: 'STRONGLY_CHALLENGES',
      adEffect: 'CHALLENGES',
      pdEffect: 'SUPPORTS',
      combinedEffect: 'STRONGLY_CHALLENGES'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('STRONGLY_CHALLENGES');
    expect(result.status).toBe('CHALLENGE');
    expect(result.hierarchyConsistent).toBe(true);
    expect(result.consistency?.effectConsistent).toBe(true);
    expect(result.consistency?.hierarchyRolesConsistent).toBe(true);
  });

  it('detects an inconsistent supplied combinedEffect', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.SATURN,
      adPlanet: Planet.MARS,
      pdPlanet: Planet.RAHU,
      mdEffect: 'CHALLENGES',
      adEffect: 'CHALLENGES',
      pdEffect: 'CHALLENGES',
      combinedEffect: 'SUPPORTS' // Inconsistent with MD/AD/PD
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('CHALLENGES');
    expect(result.status).toBe('CHALLENGE');
    expect(result.hierarchyConsistent).toBe(false);
    expect(result.consistency?.effectConsistent).toBe(false);
    expect(result.consistency?.hierarchyRolesConsistent).toBe(true);
    expect(result.summary).toContain('CW-05 recomputed the activation');
  });

  it('detects non-canonical MD/AD/PD hierarchy roles', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.JUPITER,
      adPlanet: Planet.SUN,
      pdPlanet: Planet.MARS,
      mdEffect: 'SUPPORTS',
      adEffect: 'SUPPORTS',
      pdEffect: 'SUPPORTS',
      combinedEffect: 'SUPPORTS'
    });

    // Intentionally testing runtime-corruption of hierarchy roles
    const corruptedDasha = {
      ...dasha,
      combined: {
        ...dasha.combined,
        hierarchy: {
          mdRole: 'MODIFIER',
          adRole: 'PRIMARY',
          pdRole: 'REFINEMENT'
        }
      }
    } as unknown as CareerDashaSynthesis;

    const result = resolveDashaActivationGuardrail(corruptedDasha);

    expect(result.effect).toBe('SUPPORTS');
    expect(result.status).toBe('SUPPORT');
    expect(result.hierarchyConsistent).toBe(false);
    expect(result.consistency?.effectConsistent).toBe(true);
    expect(result.consistency?.hierarchyRolesConsistent).toBe(false);
    expect(result.summary).toContain('CW-05 recomputed the activation');
  });

  it('consistent combinedEffect sets hierarchyConsistent to true', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.JUPITER,
      adPlanet: Planet.SUN,
      pdPlanet: Planet.MARS,
      mdEffect: 'SUPPORTS',
      adEffect: 'SUPPORTS',
      pdEffect: 'SUPPORTS',
      combinedEffect: 'SUPPORTS',
      combinedConfidence: 'HIGH',
      combinedScore: 2.0
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('SUPPORTS');
    expect(result.status).toBe('SUPPORT');
    expect(result.hierarchyConsistent).toBe(true);
    expect(result.confidence).toBe('HIGH');
    expect(result.strength).toBe(2.0);
    expect(result.summary).not.toContain('CW-05 recomputed the activation');
  });

  it('MD SUPPORTS + AD CHALLENGES yields MIXED', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.JUPITER,
      adPlanet: Planet.SATURN,
      pdPlanet: Planet.SUN,
      mdEffect: 'SUPPORTS',
      adEffect: 'CHALLENGES',
      pdEffect: 'SUPPORTS'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('MIXED');
    expect(result.status).toBe('MIXED');
  });

  it('MD STRONGLY_SUPPORTS + AD SUPPORTS + PD CHALLENGES yields SUPPORTS', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.JUPITER,
      adPlanet: Planet.SUN,
      pdPlanet: Planet.SATURN,
      mdEffect: 'STRONGLY_SUPPORTS',
      adEffect: 'SUPPORTS',
      pdEffect: 'CHALLENGES'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('SUPPORTS');
    expect(result.status).toBe('SUPPORT');
  });

  it('MD CHALLENGES + AD SUPPORTS yields MIXED', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.SATURN,
      adPlanet: Planet.JUPITER,
      pdPlanet: Planet.SUN,
      mdEffect: 'CHALLENGES',
      adEffect: 'SUPPORTS',
      pdEffect: 'SUPPORTS'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('MIXED');
    expect(result.status).toBe('MIXED');
  });

  it('MD MIXED + AD SUPPORTS yields SUPPORTS', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.MERCURY,
      adPlanet: Planet.JUPITER,
      pdPlanet: Planet.SUN,
      mdEffect: 'MIXED',
      adEffect: 'SUPPORTS',
      pdEffect: 'SUPPORTS'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('SUPPORTS');
    expect(result.status).toBe('SUPPORT');
  });

  it('MD DOES_NOT_ACTIVATE + AD SUPPORTS yields MIXED', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.VENUS,
      adPlanet: Planet.JUPITER,
      pdPlanet: Planet.SUN,
      mdEffect: 'DOES_NOT_ACTIVATE',
      adEffect: 'SUPPORTS',
      pdEffect: 'SUPPORTS'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('MIXED');
    expect(result.status).toBe('MIXED');
  });

  it('all DOES_NOT_ACTIVATE yields DOES_NOT_ACTIVATE / NEUTRAL', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.VENUS,
      adPlanet: Planet.MERCURY,
      pdPlanet: Planet.MOON,
      mdEffect: 'DOES_NOT_ACTIVATE',
      adEffect: 'DOES_NOT_ACTIVATE',
      pdEffect: 'DOES_NOT_ACTIVATE'
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.effect).toBe('DOES_NOT_ACTIVATE');
    expect(result.status).toBe('NEUTRAL');
  });

  it('preserves hierarchy roles and planet effects in activationHierarchy as frozen objects', () => {
    const dasha = createMockCareerDashaSynthesis({
      mdPlanet: Planet.JUPITER,
      adPlanet: Planet.SATURN,
      pdPlanet: Planet.MERCURY,
      mdEffect: 'SUPPORTS',
      adEffect: 'CHALLENGES',
      pdEffect: 'SUPPORTS',
      combinedConfidence: 'MEDIUM',
      combinedScore: 1.5
    });

    const result = resolveDashaActivationGuardrail(dasha);

    expect(result.hierarchy).toEqual({
      md: { effect: 'SUPPORTS', role: 'PRIMARY' },
      ad: { effect: 'CHALLENGES', role: 'MODIFIER' },
      pd: { effect: 'SUPPORTS', role: 'REFINEMENT' }
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.hierarchy)).toBe(true);
    expect(Object.isFrozen(result.hierarchy?.md)).toBe(true);
    expect(Object.isFrozen(result.hierarchy?.ad)).toBe(true);
    expect(Object.isFrozen(result.hierarchy?.pd)).toBe(true);
  });
});
