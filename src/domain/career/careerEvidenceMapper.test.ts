import { describe, expect, it } from 'vitest';
import {
  buildCareerEvidence,
  resolveCareerSubjectKey
} from './careerEvidenceMapper';
import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import { Planet } from '../../types';

describe('careerEvidenceMapper - Determinism & Provenance (CW-06A)', () => {
  describe('resolveCareerSubjectKey', () => {
    it('returns rule-intrinsic L6_L10_LINK for CAREER_6L_10L_LINK_001', () => {
      const item1: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        id: 'career-6-10-link-1',
        ruleId: 'CAREER_6L_10L_LINK_001',
        evidenceFamily: CareerEvidenceFamily.FUNCTIONAL_ROLE,
        statement: '6th and 10th lords are linked',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY',
        planets: [Planet.MARS, Planet.SATURN]
      };
      const item2: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        ...item1,
        planets: [Planet.SATURN, Planet.MARS]
      };
      const item3: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        ...item1,
        planets: []
      };

      expect(resolveCareerSubjectKey(item1)).toBe('L6_L10_LINK');
      expect(resolveCareerSubjectKey(item2)).toBe('L6_L10_LINK');
      expect(resolveCareerSubjectKey(item3)).toBe('L6_L10_LINK');
    });

    it('returns semantic karaka subjectKey for karaka rules', () => {
      const sunKaraka: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        id: 'sun-karaka-1',
        ruleId: 'CAREER_SUN_KARAKA_001',
        evidenceFamily: CareerEvidenceFamily.SUN,
        statement: 'Sun is karaka for authority',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY',
        planets: [Planet.SUN]
      };
      expect(resolveCareerSubjectKey(sunKaraka)).toBe('SUN_KARAKA');
    });

    it('sorts planets to ensure order-independent subject key for planet-identified rules', () => {
      const itemA: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        id: 'conjunction-1',
        ruleId: 'CAREER_CONJUNCTION_001',
        evidenceFamily: CareerEvidenceFamily.ASPECT,
        statement: 'Jupiter and Sun conjunction',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'SECONDARY',
        planets: [Planet.SUN, Planet.JUPITER]
      };
      const itemB: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        ...itemA,
        planets: [Planet.JUPITER, Planet.SUN]
      };

      expect(resolveCareerSubjectKey(itemA)).toBe('JUPITER_SUN');
      expect(resolveCareerSubjectKey(itemB)).toBe('JUPITER_SUN');
      expect(resolveCareerSubjectKey(itemA)).toBe(resolveCareerSubjectKey(itemB));
    });
  });

  describe('Concern 12: Migrated producer CAREER_6L_10L_LINK_001 canonical provenance', () => {
    it('emits evidence.id === evidence.provenance.evidenceId with provenance.ruleId and order-independent id', () => {
      const rawEvidenceMarsSaturn: ThemeInterpretationEvidence<CareerEvidenceFamily>[] = [
        {
          id: 'raw-link-mars-saturn',
          ruleId: 'CAREER_6L_10L_LINK_001',
          evidenceFamily: CareerEvidenceFamily.FUNCTIONAL_ROLE,
          statement: '6th lord Mars aspects 10th lord Saturn, creating strong professional drive',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: [Planet.MARS, Planet.SATURN],
          houses: [6, 10]
        }
      ];

      const rawEvidenceSaturnMars: ThemeInterpretationEvidence<CareerEvidenceFamily>[] = [
        {
          id: 'raw-link-saturn-mars',
          ruleId: 'CAREER_6L_10L_LINK_001',
          evidenceFamily: CareerEvidenceFamily.FUNCTIONAL_ROLE,
          statement: '6th lord Mars aspects 10th lord Saturn, creating strong professional drive',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: [Planet.SATURN, Planet.MARS],
          houses: [10, 6]
        }
      ];

      const [mappedMarsSaturn] = buildCareerEvidence(rawEvidenceMarsSaturn);
      const [mappedSaturnMars] = buildCareerEvidence(rawEvidenceSaturnMars);

      // 1. Assert evidence.id === evidence.provenance.evidenceId
      expect(mappedMarsSaturn.id).toBe(mappedMarsSaturn.provenance?.evidenceId);
      expect(mappedSaturnMars.id).toBe(mappedSaturnMars.provenance?.evidenceId);

      // 2. Assert provenance.ruleId === 'CAREER_6L_10L_LINK_001'
      expect(mappedMarsSaturn.provenance?.ruleId).toBe('CAREER_6L_10L_LINK_001');
      expect(mappedSaturnMars.provenance?.ruleId).toBe('CAREER_6L_10L_LINK_001');

      // 3. Core determinism guarantee: id is identical when input planets array order is reversed
      expect(mappedMarsSaturn.id).toBe(mappedSaturnMars.id);
      expect(mappedMarsSaturn.id).toBe(
        'CW-CAREER-NATAL-D1-CAREER_6L_10L_LINK_001-L6_L10_LINK-SUPPORT-PRIMARY'
      );
    });
  });

  describe('Concern 13: Non-migrated legacy producers unchanged regression', () => {
    it('preserves id, ruleId, polarity, phase, and priority without provenance on legacy producers', () => {
      const rawLegacyItems: ThemeInterpretationEvidence<CareerEvidenceFamily>[] = [
        {
          id: 'LEGACY_CAREER_10H_001',
          ruleId: 'CAREER_10H_STRONG',
          evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
          statement: '10th house has strong planetary occupation',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          houses: [10]
        },
        {
          id: 'LEGACY_CAREER_SUN_001',
          ruleId: 'CAREER_SUN_DIGNITY',
          evidenceFamily: CareerEvidenceFamily.SUN,
          statement: 'Sun in own sign boosts leadership capability',
          effect: 'SUPPORT',
          strength: 'MODERATE',
          priority: 'SECONDARY',
          planets: [Planet.SUN]
        }
      ];

      const mappedLegacy = buildCareerEvidence(rawLegacyItems);

      // Verify item 1
      expect(mappedLegacy[0].id).toBe('LEGACY_CAREER_10H_001');
      expect(mappedLegacy[0].ruleId).toBe('CAREER_10H_STRONG');
      expect(mappedLegacy[0].polarity).toBe('SUPPORTING');
      expect(mappedLegacy[0].phase).toBe('NATAL_PROMISE');
      expect(mappedLegacy[0].priority).toBe(90);
      expect(mappedLegacy[0].provenance).toBeUndefined();

      // Verify item 2
      expect(mappedLegacy[1].id).toBe('LEGACY_CAREER_SUN_001');
      expect(mappedLegacy[1].ruleId).toBe('CAREER_SUN_DIGNITY');
      expect(mappedLegacy[1].polarity).toBe('SUPPORTING');
      expect(mappedLegacy[1].phase).toBe('NATAL_PROMISE');
      expect(mappedLegacy[1].priority).toBe(70);
      expect(mappedLegacy[1].provenance).toBeUndefined();
    });
  });
});
