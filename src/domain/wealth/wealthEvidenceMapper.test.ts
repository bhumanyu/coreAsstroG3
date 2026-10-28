import { describe, expect, it } from 'vitest';
import {
  buildWealthEvidence,
  mapWealthSourceType,
  resolveRequiredWealthSubjectKey,
  resolveWealthSubjectKey
} from './wealthEvidenceMapper';
import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type {
  ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import { Planet } from '../../types';

describe('mapWealthSourceType', () => {
  const item = (
    evidenceFamily: WealthEvidenceFamily,
    overrides: Partial<ThemeInterpretationEvidence<WealthEvidenceFamily>> = {}
  ): ThemeInterpretationEvidence<WealthEvidenceFamily> => ({
    id: `WEALTH_SOURCE_TYPE_${evidenceFamily}`,
    ruleId: `WEALTH_${evidenceFamily}`,
    evidenceFamily,
    statement: 'Wealth source type test fixture',
    effect: 'SUPPORT',
    strength: 'MODERATE',
    priority: 'PRIMARY',
    ...overrides
  });

  it.each([
    WealthEvidenceFamily.SECOND_HOUSE,
    WealthEvidenceFamily.FIFTH_HOUSE,
    WealthEvidenceFamily.NINTH_HOUSE,
    WealthEvidenceFamily.ELEVENTH_HOUSE,
    WealthEvidenceFamily.SECOND_LORD,
    WealthEvidenceFamily.FIFTH_LORD,
    WealthEvidenceFamily.NINTH_LORD,
    WealthEvidenceFamily.ELEVENTH_LORD
  ])('maps %s to STRUCTURAL', (family) => {
    expect(mapWealthSourceType(item(family))).toBe('STRUCTURAL');
  });

  it('maps explicit D2/varga evidence to VARGA', () => {
    expect(mapWealthSourceType(item(WealthEvidenceFamily.D2))).toBe('VARGA');
    expect(mapWealthSourceType(item(WealthEvidenceFamily.SECOND_HOUSE, {
      vargaEvidence: {
        varga: 'D2',
        relationship: 'CONFIRMS',
        statement: 'D2 confirms the natal evidence',
        effect: 'SUPPORT'
      }
    }))).toBe('VARGA');
  });

  it('maps Dasha family and timing evidence to DASHA', () => {
    expect(mapWealthSourceType(item(WealthEvidenceFamily.DASHA))).toBe('DASHA');
    expect(mapWealthSourceType(item(WealthEvidenceFamily.SECOND_HOUSE, {
      timingEvidence: {
        dashaLevel: 'MAHADASHA',
        planet: Planet.JUPITER,
        relevanceReason: 'Wealth lord period',
        houses: [2]
      }
    }))).toBe('DASHA');
  });

  it('maps transit evidence to TRANSIT before other source classifications', () => {
    expect(mapWealthSourceType(item(WealthEvidenceFamily.TRANSIT))).toBe('TRANSIT');
    expect(mapWealthSourceType(item(WealthEvidenceFamily.D2, {
      transitEvidence: { effect: 'SUPPORT' }
    }))).toBe('TRANSIT');
  });

  it.each([
    [WealthEvidenceFamily.JUPITER, 'PLANET'],
    [WealthEvidenceFamily.VENUS, 'PLANET'],
    [WealthEvidenceFamily.MERCURY, 'PLANET'],
    [WealthEvidenceFamily.FUNCTIONAL_ROLE, 'PLANET'],
    [WealthEvidenceFamily.PLANETARY_STRENGTH, 'STRENGTH'],
    [WealthEvidenceFamily.ASPECT, 'ASPECT'],
    [WealthEvidenceFamily.YOGA, 'YOGA']
  ] as const)('preserves the %s mapping to %s', (family, expected) => {
    expect(mapWealthSourceType(item(family))).toBe(expected);
  });

  it('maps an unrecognized evidence family to OTHER', () => {
    expect(mapWealthSourceType(item('UNRECOGNIZED' as WealthEvidenceFamily))).toBe('OTHER');
  });
});

describe('wealthEvidenceMapper - Determinism & Provenance (CW-06A)', () => {
  describe('resolveWealthSubjectKey', () => {
    it('returns semantic VENUS_KARAKA for WEALTH_VENUS_KARAKA_001', () => {
      const item1: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'wealth-venus-karaka-1',
        ruleId: 'WEALTH_VENUS_KARAKA_001',
        evidenceFamily: WealthEvidenceFamily.VENUS,
        statement: 'Venus as karaka for prosperity is well placed',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY',
        planets: [Planet.VENUS]
      };
      const item2: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        ...item1,
        planets: []
      };

      expect(resolveWealthSubjectKey(item1)).toBe('VENUS_KARAKA');
      expect(resolveWealthSubjectKey(item2)).toBe('VENUS_KARAKA');
    });

    it('returns semantic karaka subjectKey for other karaka rules', () => {
      const jupiterKaraka: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'jupiter-karaka-1',
        ruleId: 'WEALTH_JUPITER_KARAKA_001',
        evidenceFamily: WealthEvidenceFamily.JUPITER,
        statement: 'Jupiter is karaka for abundance',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY',
        planets: [Planet.JUPITER]
      };
      expect(resolveWealthSubjectKey(jupiterKaraka)).toBe('JUPITER_KARAKA');
    });

    it('sorts planets to ensure order-independent subject key for planet-identified rules', () => {
      const itemA: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'dhana-yoga-1',
        ruleId: 'WEALTH_DHANA_YOGA_001',
        evidenceFamily: WealthEvidenceFamily.YOGA,
        statement: 'Venus and Mercury in 2nd house',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'SECONDARY',
        planets: [Planet.VENUS, Planet.MERCURY]
      };
      const itemB: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        ...itemA,
        planets: [Planet.MERCURY, Planet.VENUS]
      };

      expect(resolveWealthSubjectKey(itemA)).toBe('MERCURY_VENUS');
      expect(resolveWealthSubjectKey(itemB)).toBe('MERCURY_VENUS');
      expect(resolveWealthSubjectKey(itemA)).toBe(resolveWealthSubjectKey(itemB));
    });
  });

  describe('strict provenance subject identity', () => {
    const base: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
      id: 'strict-1', ruleId: '', evidenceFamily: WealthEvidenceFamily.VENUS,
      statement: 'test', effect: 'SUPPORT', strength: 'STRONG', priority: 'PRIMARY'
    };

    it('rejects empty rule and subject, and generic/unrecognized fallback subjects', () => {
      expect(() => resolveRequiredWealthSubjectKey(base)).toThrow();
      expect(() => resolveRequiredWealthSubjectKey({ ...base, ruleId: 'WEALTH_UNKNOWN_001' })).toThrow();
      expect(() => resolveRequiredWealthSubjectKey({ ...base, ruleId: 'VENUS_KARAKA' })).toThrow();
      expect(resolveRequiredWealthSubjectKey({ ...base, ruleId: 'WEALTH_VENUS_KARAKA_001', planets: [] })).toBe('VENUS_KARAKA');
      expect(() => resolveRequiredWealthSubjectKey({ ...base, ruleId: 'WEALTH_STRANGE_KARAKA_001' })).toThrow();
    });

    it('rejects fabricated Venus karaka from rule substring fallback', () => {
      expect(() => resolveRequiredWealthSubjectKey({ ...base, ruleId: 'SOMETHING_VENUS_KARAKA' })).toThrow();
    });

    it('rejects duplicate planets and invalid or duplicate houses', () => {
      const venus = { ...base, ruleId: 'WEALTH_VENUS_KARAKA_001' };
      expect(() => resolveRequiredWealthSubjectKey({ ...venus, planets: [Planet.VENUS, Planet.VENUS] })).toThrow();
      expect(() => resolveRequiredWealthSubjectKey({ ...venus, houses: [2, 2] })).toThrow();
      expect(() => resolveRequiredWealthSubjectKey({ ...venus, houses: [13] })).toThrow();
      expect(() => resolveRequiredWealthSubjectKey({ ...venus, houses: [0] })).toThrow();
      expect(resolveRequiredWealthSubjectKey({ ...venus, planets: [Planet.JUPITER] })).toBe('VENUS_KARAKA');
      expect(resolveRequiredWealthSubjectKey({ ...venus, planets: [Planet.VENUS, Planet.JUPITER] })).toBe('VENUS_KARAKA');
      expect(resolveRequiredWealthSubjectKey({ ...venus, planets: [Planet.VENUS], houses: [2, 11] })).toBe('VENUS_KARAKA');
    });
  });

  describe('Concern 12: Migrated producer WEALTH_VENUS_KARAKA_001 canonical provenance', () => {
    it('emits evidence.id === evidence.provenance.evidenceId with provenance.ruleId and order-independent id', () => {
      const rawEvidenceVenusOnly: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = [
        {
          id: 'raw-venus-karaka-1',
          ruleId: 'WEALTH_VENUS_KARAKA_001',
          evidenceFamily: WealthEvidenceFamily.VENUS,
          statement: 'Venus as natural karaka of wealth and prosperity is well placed',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: [Planet.VENUS],
          houses: [2]
        }
      ];

      const rawEvidenceMultiPlanetsReversed: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = [
        {
          id: 'raw-venus-karaka-2',
          ruleId: 'WEALTH_VENUS_KARAKA_001',
          evidenceFamily: WealthEvidenceFamily.VENUS,
          statement: 'Venus as natural karaka of wealth and prosperity is well placed',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: [Planet.JUPITER, Planet.VENUS],
          houses: [2]
        }
      ];

      const [mappedVenusOnly] = buildWealthEvidence(rawEvidenceVenusOnly);
      const [mappedMultiReversed] = buildWealthEvidence(rawEvidenceMultiPlanetsReversed);

      // 1. Assert evidence.id === evidence.provenance.evidenceId
      expect(mappedVenusOnly.id).toBe(mappedVenusOnly.provenance?.evidenceId);
      expect(mappedMultiReversed.id).toBe(mappedMultiReversed.provenance?.evidenceId);

      // 2. Assert provenance.ruleId === 'WEALTH_VENUS_KARAKA_001'
      expect(mappedVenusOnly.provenance?.ruleId).toBe('WEALTH_VENUS_KARAKA_001');
      expect(mappedMultiReversed.provenance?.ruleId).toBe('WEALTH_VENUS_KARAKA_001');

      // 3. Core determinism guarantee: id is identical
      expect(mappedVenusOnly.id).toBe(mappedMultiReversed.id);
      expect(mappedVenusOnly.id).toBe(
        'CW-WEALTH-NATAL-D1-WEALTH_VENUS_KARAKA_001-VENUS_KARAKA-SUPPORT-PRIMARY'
      );
    });
  });

  describe('Concern 13: Non-migrated legacy producers unchanged regression', () => {
    it('preserves id, ruleId, polarity, phase, and priority without provenance on legacy producers', () => {
      const rawLegacyItems: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = [
        {
          id: 'LEGACY_WEALTH_2H_001',
          ruleId: 'WEALTH_2H_STRONG',
          evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
          statement: '2nd house of accumulated wealth has auspicious placements',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          houses: [2]
        },
        {
          id: 'LEGACY_WEALTH_11H_001',
          ruleId: 'WEALTH_11H_GAINS',
          evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
          statement: '11th house supports continuous income and gains',
          effect: 'SUPPORT',
          strength: 'MODERATE',
          priority: 'SECONDARY',
          houses: [11]
        }
      ];

      const mappedLegacy = buildWealthEvidence(rawLegacyItems);

      // Verify item 1
      expect(mappedLegacy[0].id).toBe('LEGACY_WEALTH_2H_001');
      expect(mappedLegacy[0].ruleId).toBe('WEALTH_2H_STRONG');
      expect(mappedLegacy[0].polarity).toBe('SUPPORTING');
      expect(mappedLegacy[0].phase).toBe('NATAL_PROMISE');
      expect(mappedLegacy[0].priority).toBe(90);
      expect(mappedLegacy[0].provenance).toBeUndefined();

      // Verify item 2
      expect(mappedLegacy[1].id).toBe('LEGACY_WEALTH_11H_001');
      expect(mappedLegacy[1].ruleId).toBe('WEALTH_11H_GAINS');
      expect(mappedLegacy[1].polarity).toBe('SUPPORTING');
      expect(mappedLegacy[1].phase).toBe('NATAL_PROMISE');
      expect(mappedLegacy[1].priority).toBe(70);
      expect(mappedLegacy[1].provenance).toBeUndefined();
    });
  });

  describe('Finding 3: Legacy Wealth mapper id/identityKey contract', () => {
    it('uses identityKey as id when present on raw evidence item', () => {
      const rawItemWithIdentityKey: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'RAW_OCCURRENCE_ID_123',
        ruleId: 'WEALTH_2H_STRONG',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        statement: '2nd house of accumulated wealth has auspicious placements',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY',
        houses: [2],
        identityKey: 'SEMANTIC_KEY_ABC'
      };

      const [mapped] = buildWealthEvidence([rawItemWithIdentityKey]);

      // Contract: id = identityKey when present
      expect(mapped.id).toBe('SEMANTIC_KEY_ABC');
      expect(mapped.identityKey).toBe('SEMANTIC_KEY_ABC');
      // Original occurrence ID is not preserved in id field
      expect(mapped.id).not.toBe('RAW_OCCURRENCE_ID_123');
    });

    it('uses item.id as id when identityKey is absent', () => {
      const rawItemWithoutIdentityKey: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'RAW_OCCURRENCE_ID_456',
        ruleId: 'WEALTH_11H_GAINS',
        evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        statement: '11th house supports continuous income and gains',
        effect: 'SUPPORT',
        strength: 'MODERATE',
        priority: 'SECONDARY',
        houses: [11]
      };

      const [mapped] = buildWealthEvidence([rawItemWithoutIdentityKey]);

      // Contract: id = item.id when identityKey absent
      expect(mapped.id).toBe('RAW_OCCURRENCE_ID_456');
      expect(mapped.identityKey).toBeUndefined();
    });

    it('uses item.id as id when identityKey is undefined', () => {
      const rawItemWithUndefinedIdentityKey: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'RAW_OCCURRENCE_ID_789',
        ruleId: 'WEALTH_9H_FORTUNE',
        evidenceFamily: WealthEvidenceFamily.NINTH_HOUSE,
        statement: '9th house supports fortune and luck',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY',
        houses: [9],
        identityKey: undefined
      };

      const [mapped] = buildWealthEvidence([rawItemWithUndefinedIdentityKey]);

      // Contract: id = item.id when identityKey is undefined (nullish coalescing)
      expect(mapped.id).toBe('RAW_OCCURRENCE_ID_789');
      expect(mapped.identityKey).toBeUndefined();
    });
  });
});
