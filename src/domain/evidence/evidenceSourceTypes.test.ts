import { describe, expect, it } from 'vitest';
import {
  isEvidenceSourceType,
  type EvidenceSourceType
} from './evidenceSourceTypes';
import { validateDomainEvidence } from './evidenceSourceValidation';
import { createDomainEvidence, type DomainEvidence } from '../interpretation/DomainEvidence';
import { mapEvidenceSource } from '../../product/life-analysis/domainPresentationUtils';
import { interpretCareerV2 } from '../career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../wealth/WealthDomainInterpreterV2';
import { STAGE1_GOLDEN_HOROSCOPE } from '../../integration/stage1/stage1GoldenFixture';
import { GOLDEN_CAREER_EVIDENCE } from '../career/career-v2-golden.fixture';
import { GOLDEN_WEALTH_EVIDENCE } from '../wealth/wealth-v2-golden.fixture';

describe('EvidenceSourceType Contract & Mapping (P-031)', () => {
  const ALL_SOURCE_TYPES: readonly EvidenceSourceType[] = [
    'HOUSE',
    'PLANET',
    'LORDSHIP',
    'ASPECT',
    'YOGA',
    'VARGA',
    'STRENGTH',
    'DASHA',
    'TRANSIT',
    'OTHER'
  ];

  describe('isEvidenceSourceType', () => {
    it.each(ALL_SOURCE_TYPES)('recognizes %s as a valid EvidenceSourceType', (type) => {
      expect(isEvidenceSourceType(type)).toBe(true);
    });

    it('rejects invalid source types', () => {
      expect(isEvidenceSourceType('INVALID')).toBe(false);
      expect(isEvidenceSourceType('')).toBe(false);
      expect(isEvidenceSourceType(null)).toBe(false);
      expect(isEvidenceSourceType(undefined)).toBe(false);
      expect(isEvidenceSourceType(123)).toBe(false);
    });
  });

  describe('validateDomainEvidence', () => {
    it('validates compliant domain evidence without errors', () => {
      const validEvidence = createDomainEvidence({
        id: 'VALID-001',
        sourceType: 'HOUSE',
        statement: '10th House strong.'
      });
      const errors = validateDomainEvidence(validEvidence);
      expect(errors).toHaveLength(0);
    });

    it('flags missing or empty id', () => {
      const invalid = {
        ...createDomainEvidence({ id: 'TEMP', sourceType: 'HOUSE' }),
        id: ''
      } as DomainEvidence;
      const errors = validateDomainEvidence(invalid);
      expect(errors.some((e) => e.includes('id'))).toBe(true);
    });

    it('flags invalid sourceType', () => {
      const invalid = {
        ...createDomainEvidence({ id: 'TEMP', sourceType: 'HOUSE' }),
        sourceType: 'BOGUS' as EvidenceSourceType
      } as DomainEvidence;
      const errors = validateDomainEvidence(invalid);
      expect(errors.some((e) => e.includes('sourceType'))).toBe(true);
    });
  });

  describe('mapEvidenceSource deterministic typing', () => {
    it('uses sourceType instead of ruleId to determine source type', () => {
      const evidence = createDomainEvidence({
        id: 'EV_RULE_INDEP_001',
        sourceType: 'HOUSE',
        ruleId: 'SOME_COMPLETELY_UNRELATED_RULE_DASHA_VARGA',
        statement: '10th House indicator.'
      });

      const viewModel = mapEvidenceSource(evidence);
      expect(viewModel.type).toBe('HOUSE');
      expect(viewModel.label).toBe('Natal House (D1)');
      expect(viewModel.calculationId).toBeUndefined();
    });

    it('evidenceFamily cannot override sourceType', () => {
      const evidence = createDomainEvidence({
        id: 'EV_FAMILY_INDEP_001',
        sourceType: 'PLANET',
        evidenceFamily: 'TENTH_HOUSE',
        ruleId: 'CAREER_10H_STRONG_001',
        statement: 'Planet in 10th house.'
      });

      const viewModel = mapEvidenceSource(evidence);
      expect(viewModel.type).toBe('PLANET');
      expect(viewModel.label).toBe('Planetary Position (D1)');
    });

    it.each(ALL_SOURCE_TYPES)(
      'preserves source type %s deterministically in mapEvidenceSource',
      (sourceType) => {
        const evidence = createDomainEvidence({
          id: `EV_TEST_${sourceType}`,
          sourceType,
          statement: `Test evidence for ${sourceType}`
        });

        const viewModel = mapEvidenceSource(evidence);
        expect(viewModel.type).toBe(sourceType);
        expect(viewModel.label).toBeDefined();
        expect(viewModel.label.length).toBeGreaterThan(0);
      }
    );
  });

  describe('Golden Career Evidence Source Types', () => {
    it('maps Career evidence families to correct canonical source types', () => {
      const houseEvidence = GOLDEN_CAREER_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_CAREER_10H_STRONG'
      );
      expect(houseEvidence?.sourceType).toBe('HOUSE');

      const lordEvidence = GOLDEN_CAREER_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_CAREER_10L_STRONG'
      );
      expect(lordEvidence?.sourceType).toBe('LORDSHIP');

      const planetEvidence = GOLDEN_CAREER_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_CAREER_MERCURY_TECH'
      );
      expect(planetEvidence?.sourceType).toBe('PLANET');

      const vargaEvidence = GOLDEN_CAREER_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_CAREER_D10_CONFIRMS'
      );
      expect(vargaEvidence?.sourceType).toBe('VARGA');

      const dashaEvidence = GOLDEN_CAREER_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_CAREER_DASHA_MD_ACTIVATES'
      );
      expect(dashaEvidence?.sourceType).toBe('DASHA');

      const transitEvidence = GOLDEN_CAREER_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_CAREER_TRANSIT_CHALLENGE'
      );
      expect(transitEvidence?.sourceType).toBe('TRANSIT');
    });
  });

  describe('Golden Wealth Evidence Source Types', () => {
    it('maps Wealth evidence families to correct canonical source types', () => {
      const house2Evidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_2H_STRONG'
      );
      expect(house2Evidence?.sourceType).toBe('HOUSE');

      const lord2Evidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_2L_STRONG'
      );
      expect(lord2Evidence?.sourceType).toBe('LORDSHIP');

      const house11Evidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_11H_GAINS'
      );
      expect(house11Evidence?.sourceType).toBe('HOUSE');

      const lord11Evidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_11L_STRONG'
      );
      expect(lord11Evidence?.sourceType).toBe('LORDSHIP');

      const house9Evidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_9H_FORTUNE'
      );
      expect(house9Evidence?.sourceType).toBe('HOUSE');

      const house5Evidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_5H_SPECULATION'
      );
      expect(house5Evidence?.sourceType).toBe('HOUSE');

      const planetEvidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_JUPITER_KARAKA'
      );
      expect(planetEvidence?.sourceType).toBe('PLANET');

      const vargaEvidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_D2_CONFIRMS'
      );
      expect(vargaEvidence?.sourceType).toBe('VARGA');

      const dashaEvidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_DASHA_MD_ACTIVATES'
      );
      expect(dashaEvidence?.sourceType).toBe('DASHA');

      const transitEvidence = GOLDEN_WEALTH_EVIDENCE.find(
        (e) => e.id === 'GOLDEN_WEALTH_TRANSIT_CHALLENGE'
      );
      expect(transitEvidence?.sourceType).toBe('TRANSIT');
    });
  });

  describe('Interpreter Invariant Testing', () => {
    it('every deterministic domain evidence item produced by Career and Wealth interpreters on STAGE1_GOLDEN_HOROSCOPE has a valid sourceType', () => {
      const career = interpretCareerV2(STAGE1_GOLDEN_HOROSCOPE);
      const wealth = interpretWealthV2(STAGE1_GOLDEN_HOROSCOPE);

      expect(career.evidence.length).toBeGreaterThan(0);
      for (const item of career.evidence) {
        expect(item.sourceType).toBeDefined();
        expect(isEvidenceSourceType(item.sourceType)).toBe(true);
        expect(validateDomainEvidence(item)).toHaveLength(0);
      }

      expect(wealth.evidence.length).toBeGreaterThan(0);
      for (const item of wealth.evidence) {
        expect(item.sourceType).toBeDefined();
        expect(isEvidenceSourceType(item.sourceType)).toBe(true);
        expect(validateDomainEvidence(item)).toHaveLength(0);
      }
    });
  });
});
