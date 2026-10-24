import { describe, expect, it } from 'vitest';
import type { ProductDirection } from './productAnalysisTypes';
import { mapDirection } from './productAnalysisMapper';

const directionCases: ReadonlyArray<readonly [string, ProductDirection]> = [
  ['ACTIVATES', 'SUPPORT'],
  ['PARTIALLY_ACTIVATES', 'MIXED'],
  ['CHALLENGES', 'CHALLENGE'],
  ['DOES_NOT_ACTIVATE', 'NEUTRAL'],
  ['UNKNOWN', 'UNAVAILABLE'],
  ['INSUFFICIENT_DATA', 'UNAVAILABLE'],
  ['UNAVAILABLE', 'UNAVAILABLE'],
  ['VERY_STRONG', 'SUPPORT'],
  ['STRONG', 'SUPPORT'],
  ['STRONGLY_SUPPORTED', 'SUPPORT'],
  ['SUPPORTED', 'SUPPORT'],
  ['SUPPORT', 'SUPPORT'],
  ['MODERATE', 'MIXED'],
  ['MIXED', 'MIXED'],
  ['WEAK', 'CHALLENGE'],
  ['VERY_WEAK', 'CHALLENGE'],
  ['CHALLENGED', 'CHALLENGE'],
  ['CHALLENGE', 'CHALLENGE'],
  ['NEUTRAL', 'NEUTRAL'],
  ['LIMITED', 'UNAVAILABLE']
];

describe('mapDirection', () => {
  it.each(directionCases)('%s maps to %s', (source, expected) => {
    expect(mapDirection(source)).toBe(expected);
  });

  it('maps partial activation to mixed rather than support', () => {
    expect(mapDirection('PARTIALLY_ACTIVATES')).toBe('MIXED');
  });

  it.each([
    undefined,
    '',
    '   ',
    'UNRECOGNIZED_EFFECT',
    'ACTIVATES_WITH_UNKNOWN_SUFFIX',
    'NOT_ACTIVATES',
    'NOT_STRONG'
  ])('fails closed for %s', (source) => {
    expect(mapDirection(source)).toBe('UNAVAILABLE');
  });

  it('normalizes casing and surrounding whitespace before exact matching', () => {
    expect(mapDirection('  partially_activates  ')).toBe('MIXED');
    expect(mapDirection(' sUpPoRt ')).toBe('SUPPORT');
  });
});
