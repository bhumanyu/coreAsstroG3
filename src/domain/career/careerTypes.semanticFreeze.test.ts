import { describe, expect, it } from 'vitest';

import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES,
  CAREER_PRIMARY_LORDS,
  CAREER_SUPPORTING_LORDS,
  CAREER_CHALLENGING_LORDS,
  CAREER_HOUSE_PORTFOLIO,
  classifyCareerHouse
} from './careerTypes';

describe('CW-R1 C1 — Career structural portfolio freeze', () => {
  it('freezes primary Career houses', () => {
    expect(
      [...CAREER_PRIMARY_HOUSES]
    ).toEqual([10]);
  });

  it('freezes supporting Career houses', () => {
    expect(
      [...CAREER_SUPPORTING_HOUSES]
    ).toEqual([6, 2, 11]);
  });

  it('freezes challenging Career houses', () => {
    expect(
      [...CAREER_CHALLENGING_HOUSES]
    ).toEqual([8, 12]);
  });

  it('freezes primary Career lord semantics', () => {
    expect(
      [...CAREER_PRIMARY_LORDS]
    ).toEqual(['10L']);
  });

  it('freezes supporting Career lord semantics', () => {
    expect(
      [...CAREER_SUPPORTING_LORDS]
    ).toEqual([
      '6L',
      '2L',
      '11L'
    ]);
  });

  it('freezes challenging Career lord semantics', () => {
    expect(
      [...CAREER_CHALLENGING_LORDS]
    ).toEqual([
      '8L',
      '12L'
    ]);
  });

  it('freezes the canonical Career house portfolio', () => {
    expect(CAREER_HOUSE_PORTFOLIO).toEqual({
      primary: [10],
      supporting: [6, 2, 11],
      challenging: [8, 12],
      secondary: []
    });
  });

  it('classifies known Career houses deterministically', () => {
    expect(classifyCareerHouse(10)).toBe('PRIMARY');

    expect(classifyCareerHouse(6)).toBe('SUPPORTING');
    expect(classifyCareerHouse(2)).toBe('SUPPORTING');
    expect(classifyCareerHouse(11)).toBe('SUPPORTING');

    expect(classifyCareerHouse(8)).toBe('CHALLENGING');
    expect(classifyCareerHouse(12)).toBe('CHALLENGING');

    expect(classifyCareerHouse(1)).toBe('NEUTRAL');
  });
});
