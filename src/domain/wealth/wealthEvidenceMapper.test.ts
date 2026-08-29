import { describe, expect, it } from 'vitest';
import {
  buildWealthEvidence,
  resolveWealthSubjectKey
} from './wealthEvidenceMapper';
import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type {
  ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import { Planet } from '../../types';

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
});
