import { describe, it, expect } from 'vitest';
import { buildBirthContext } from '../birthContext';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

describe('buildBirthContext', () => {
  it('returns undefined when birthDetails is undefined', () => {
    expect(buildBirthContext(undefined)).toBeUndefined();
  });

  it('formats canonical birth details with proper timeZone label and formatting', () => {
    const context = buildBirthContext(CANONICAL_BIRTH_DETAILS);

    expect(context).toBeDefined();
    expect(context?.name).toBe('Birth Chart');
    expect(context?.zoneLabel).toBe('IST');
    expect(context?.ayanamsa).toBe(CANONICAL_BIRTH_DETAILS.ayanamsa);
    expect(context?.formattedDate).toContain('1988');
  });

  it('preserves custom name and placeOfBirth when provided', () => {
    const customDetails = {
      ...CANONICAL_BIRTH_DETAILS,
      name: 'Aryabhata',
      placeOfBirth: 'Pataliputra, India'
    };

    const context = buildBirthContext(customDetails);

    expect(context?.name).toBe('Aryabhata');
    expect(context?.placeOfBirth).toBe('Pataliputra, India');
  });

  it('handles unknown timezone with fallback zone label', () => {
    const customDetails = {
      ...CANONICAL_BIRTH_DETAILS,
      timeZone: 'Custom/Region'
    };

    const context = buildBirthContext(customDetails);
    expect(context?.zoneLabel).toBe('Custom/Region');
  });
});
