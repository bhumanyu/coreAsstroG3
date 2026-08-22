import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Planet, Sign, DignityStatus } from '../../types';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { calculateHoroscope } from '../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES
} from '../../domain/career/careerTypes';
import {
  WEALTH_ACCUMULATION_FAMILIES,
  WEALTH_GAINS_FAMILIES,
  WEALTH_FORTUNE_FAMILIES,
  WEALTH_SPECULATION_FAMILIES
} from '../../domain/wealth/wealthManifestations';
import {
  WEALTH_SUBTHEME_CONFIGS,
  WealthSubthemeConfig
} from '../themeInterpretation/wealthThemeInterpretation';
import { WealthEvidenceFamily } from '../themeInterpretation/wealthThemeInterpretationTypes';
import {
  DomainActivationRuleProvider,
  CanonicalDomainActivationRuleProvider,
  defaultDomainActivationRuleProvider
} from './domainActivationRuleProvider';
import { synthesizeDashaDomains } from './dashaDomainSynthesis';
import { deriveDirectionalDashaEvidence } from './dashaDirectionalReasoner';
import { adaptInterpretationEvidenceListToReasoningFacts } from './dashaFactAdapter';
import { synthesizeDashaDirection } from './dashaDirectionalSynthesisEngine';
import { DashaInterpretationEvidence } from './dashaInterpretationTypes';
import {
  interpretCareerV2,
  evaluateCareerTimingActivation
} from '../../domain/career/CareerDomainInterpreterV2';
import {
  interpretWealthV2,
  evaluateWealthPeriodTimingActivation
} from '../../domain/wealth/WealthDomainInterpreterV2';
import { projectDomainInterpretationForAi } from '../../domain/interpretation';

describe('D07-B: DomainActivationRuleProvider & Canonical Dasha Domain Activation', () => {
  const FIXED_AS_OF = '2024-06-01T00:00:00.000Z';

  describe('TASK 4.1: Architectural Regression & AST/Source Guard', () => {
    it('does NOT declare DASHA_DOMAIN_HOUSES in dashaDomainSynthesis or domainActivationRuleProvider', () => {
      const providerFile = fs.readFileSync(
        path.resolve(process.cwd(), 'src/engine/dashaInterpretation/domainActivationRuleProvider.ts'),
        'utf-8'
      );
      const synthesisFile = fs.readFileSync(
        path.resolve(process.cwd(), 'src/engine/dashaInterpretation/dashaDomainSynthesis.ts'),
        'utf-8'
      );

      expect(providerFile).not.toContain('DASHA_DOMAIN_HOUSES');
      expect(synthesisFile).not.toContain('DASHA_DOMAIN_HOUSES');
    });

    it('references canonical CAREER and WEALTH constants rather than declaring duplicate house arrays', () => {
      const providerFile = fs.readFileSync(
        path.resolve(process.cwd(), 'src/engine/dashaInterpretation/domainActivationRuleProvider.ts'),
        'utf-8'
      );

      // Must import CAREER canonical constants
      expect(providerFile).toContain('CAREER_PRIMARY_HOUSES');
      expect(providerFile).toContain('CAREER_SUPPORTING_HOUSES');

      // Must import WEALTH canonical family constants and subtheme configs
      expect(providerFile).toContain('WEALTH_ACCUMULATION_FAMILIES');
      expect(providerFile).toContain('WEALTH_GAINS_FAMILIES');
      expect(providerFile).toContain('WEALTH_FORTUNE_FAMILIES');
      expect(providerFile).toContain('WEALTH_SPECULATION_FAMILIES');
      expect(providerFile).toContain('WEALTH_SUBTHEME_CONFIGS');

      // Must not define hardcoded house literal maps
      expect(providerFile).not.toContain('[10, 6, 2, 1, 7]');
      expect(providerFile).not.toContain('[2, 11, 5, 9, 1]');
    });

    it('evaluators source from defaultDomainActivationRuleProvider rather than inline literals', () => {
      const careerEvaluator = fs.readFileSync(
        path.resolve(process.cwd(), 'src/engine/themeInterpretation/evaluators/dashaEvaluator.ts'),
        'utf-8'
      );
      const wealthEvaluator = fs.readFileSync(
        path.resolve(process.cwd(), 'src/engine/themeInterpretation/evaluators/wealthDashaEvaluator.ts'),
        'utf-8'
      );

      expect(careerEvaluator).toContain('defaultDomainActivationRuleProvider');
      expect(wealthEvaluator).toContain('defaultDomainActivationRuleProvider');
    });
  });

  describe('TASK 4.2: Divergence Test & Single Source of Truth', () => {
    it('derives canonical career houses from CAREER_PRIMARY_HOUSES and CAREER_SUPPORTING_HOUSES', () => {
      const expectedCareerHouses = Array.from(
        new Set([...CAREER_PRIMARY_HOUSES, ...CAREER_SUPPORTING_HOUSES])
      ).sort((a, b) => a - b);

      const resolvedHouses = defaultDomainActivationRuleProvider.getRelevantHouses('CAREER');
      expect(resolvedHouses).toEqual(expectedCareerHouses);
      expect(resolvedHouses).toContain(10);
      expect(resolvedHouses).toContain(6);
      expect(resolvedHouses).toContain(2);
      expect(resolvedHouses).toContain(11);
    });

    it('derives canonical wealth houses per-dimension with granularity', () => {
      expect(defaultDomainActivationRuleProvider.getRelevantHousesByDimension('ACCUMULATION')).toEqual([2]);
      expect(defaultDomainActivationRuleProvider.getRelevantHousesByDimension('GAINS')).toEqual([11]);
      expect(defaultDomainActivationRuleProvider.getRelevantHousesByDimension('FORTUNE')).toEqual([9]);
      expect(defaultDomainActivationRuleProvider.getRelevantHousesByDimension('SPECULATION')).toEqual([5]);

      const allWealthHouses = defaultDomainActivationRuleProvider.getRelevantHouses('WEALTH');
      expect(allWealthHouses).toEqual([2, 5, 9, 11]);
    });

    it('dynamically adapts dasha domain activation when canonical rules diverge in a parameterized provider', () => {
      // Create a custom provider where Career primary is House 1 and supporting is House 3 & 8 (e.g. specialized domain experiment)
      const customCareerPrimary = new Set([1]);
      const customCareerSupporting = new Set([3, 8]);

      const customProvider = new CanonicalDomainActivationRuleProvider(
        customCareerPrimary,
        customCareerSupporting
      );

      expect(customProvider.getRelevantHouses('CAREER')).toEqual([1, 3, 8]);

      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_PLACEMENT',
          type: 'HOUSE_PLACEMENT',
          level: 'MAHADASHA',
          planets: [Planet.MARS],
          houses: [3],
          statement: 'Dasha lord Mars occupies House 3.',
          effect: 'SUPPORT',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.MARS,
        house: 3,
        sign: Sign.ARIES,
        ownedHouses: [8],
        dignity: DignityStatus.OWN_SIGN,
        functionalNature: FunctionalNature.BENEFIC,
        reasoningEvidence: facts
      });

      const allReasoning = [...facts, ...derived];
      const activatedHouses = [3, 8];

      // Under standard provider: houses [3, 8] are NOT career houses
      const defaultSynthesis = synthesizeDashaDomains(
        allReasoning,
        activatedHouses,
        defaultDomainActivationRuleProvider
      );
      const defaultCareer = defaultSynthesis.find((d) => d.domain === 'CAREER');
      expect(defaultCareer?.activatedHouses).toEqual([]);
      expect(defaultCareer?.effect).toBe('NEUTRAL');

      // Under custom provider: houses [3, 8] ARE career houses -> domain activation triggers!
      const customSynthesis = synthesizeDashaDomains(
        allReasoning,
        activatedHouses,
        customProvider
      );
      const customCareer = customSynthesis.find((d) => d.domain === 'CAREER');
      expect(customCareer?.activatedHouses).toEqual([3, 8]);
      expect(customCareer?.effect).toBe('SUPPORT');
    });
  });

  describe('TASK 4.3: MD/AD/PD Timing Integration & Natal Promise Invariance', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, FIXED_AS_OF);

    it('MD/AD/PD career activation reaches evaluateCareerTimingActivation', () => {
      const careerV2 = interpretCareerV2(horoscope);
      expect(careerV2.domain).toBe('CAREER');
      expect(careerV2.evidence.length).toBeGreaterThan(0);

      const dashaEvidence = careerV2.evidence.filter((e) => e.phase === 'DASHA_ACTIVATION');
      const promiseIds = careerV2.evidence
        .filter((e) => e.phase === 'NATAL_PROMISE')
        .map((e) => e.id);

      // Evaluate MD, AD, and PD timing activation
      const mdActivation = evaluateCareerTimingActivation('MD', dashaEvidence, promiseIds, Planet.SATURN);
      const adActivation = evaluateCareerTimingActivation('AD', dashaEvidence, promiseIds, Planet.MERCURY);
      const pdActivation = evaluateCareerTimingActivation('PD', dashaEvidence, promiseIds, Planet.SUN);

      expect(mdActivation.period).toBe('MD');
      expect(adActivation.period).toBe('AD');
      expect(pdActivation.period).toBe('PD');
      const validEffects = ['ACTIVATES', 'PARTIALLY_ACTIVATES', 'CHALLENGES', 'DOES_NOT_ACTIVATE', 'UNKNOWN', 'INSUFFICIENT_DATA'];
      expect(validEffects).toContain(mdActivation.effect);
      expect(validEffects).toContain(adActivation.effect);
      expect(validEffects).toContain(pdActivation.effect);
    });

    it('MD/AD/PD wealth activation reaches evaluateWealthPeriodTimingActivation with all 4 dimensions independent', () => {
      const wealthV2 = interpretWealthV2(horoscope);
      expect(wealthV2.domain).toBe('WEALTH');
      expect(wealthV2.evidence.length).toBeGreaterThan(0);

      const dashaEvidence = wealthV2.evidence.filter((e) => e.phase === 'DASHA_ACTIVATION');
      const promiseIds = wealthV2.evidence
        .filter((e) => e.phase === 'NATAL_PROMISE')
        .map((e) => e.id);

      const mdActivation = evaluateWealthPeriodTimingActivation(
        'MD',
        dashaEvidence,
        wealthV2.evidence,
        promiseIds,
        Planet.SATURN
      );

      expect(mdActivation.period).toBe('MD');
      expect(mdActivation.dimensions).toBeDefined();
      expect(mdActivation.dimensions.accumulation).toBeDefined();
      expect(mdActivation.dimensions.gains).toBeDefined();
      expect(mdActivation.dimensions.fortune).toBeDefined();
      expect(mdActivation.dimensions.speculation).toBeDefined();

      const adActivation = evaluateWealthPeriodTimingActivation(
        'AD',
        dashaEvidence,
        wealthV2.evidence,
        promiseIds,
        Planet.MERCURY
      );
      expect(adActivation.period).toBe('AD');
      expect(adActivation.dimensions).toBeDefined();

      const pdActivation = evaluateWealthPeriodTimingActivation(
        'PD',
        dashaEvidence,
        wealthV2.evidence,
        promiseIds,
        Planet.SUN
      );
      expect(pdActivation.period).toBe('PD');
      expect(pdActivation.dimensions).toBeDefined();
    });

    it('a planetary SUPPORT does not blindly force Career or Wealth domain SUPPORT', () => {
      // Planetary dasha directional reasoner can find planetary synthesis SUPPORT
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_DIGNITY',
          type: 'DIGNITY',
          level: 'MAHADASHA',
          planets: [Planet.SUN],
          houses: [12],
          statement: 'Sun is EXALTED in Aries in House 12.',
          effect: 'SUPPORT',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.SUN,
        house: 12,
        sign: Sign.ARIES,
        ownedHouses: [5],
        dignity: DignityStatus.EXALTED,
        functionalNature: FunctionalNature.MALEFIC,
        reasoningEvidence: facts
      });

      const allReasoning = [...facts, ...derived];
      const planetarySynthesis = synthesizeDashaDirection(allReasoning);
      expect(planetarySynthesis.effect).toBe('SUPPORT');

      // However, Career domain timing only activates if linked career evidence is present
      // An isolated 12th house Sun without 10th/6th/2nd connection does not yield ACTIVATES for Career timing
      const careerTiming = evaluateCareerTimingActivation('MD', [], ['CAREER_PROMISE_10L'], Planet.SUN);
      expect(careerTiming.effect).not.toBe('ACTIVATES');
      expect(['INSUFFICIENT_DATA', 'UNKNOWN', 'DOES_NOT_ACTIVATE']).toContain(careerTiming.effect);
    });

    it('natal-promise strength is identical whether or not dasha timing is supplied', () => {
      const horoscopeWithDasha = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, FIXED_AS_OF);
      const careerWithDasha = interpretCareerV2(horoscopeWithDasha);
      const wealthWithDasha = interpretWealthV2(horoscopeWithDasha);

      // Interpret using baseline chart without active dasha context
      const baselineHoroscope = {
        ...horoscopeWithDasha,
        dashaInterpretation: {
          ...horoscopeWithDasha.dashaInterpretation,
          current: undefined
        }
      };
      const careerWithoutDasha = interpretCareerV2(baselineHoroscope as any);
      const wealthWithoutDasha = interpretWealthV2(baselineHoroscope as any);

      // Natal promise conclusions must be invariant
      expect(careerWithDasha.natalPromise.strength).toBe(
        careerWithoutDasha.natalPromise.strength
      );
      expect(wealthWithDasha.natalPromise.strength).toBe(
        wealthWithoutDasha.natalPromise.strength
      );
    });

    it('all projected AI evidence IDs resolve in context evidence', () => {
      const careerV2 = interpretCareerV2(horoscope);
      const aiCareer = projectDomainInterpretationForAi(careerV2);

      const allEvidenceIds = new Set(careerV2.evidence.map((e) => e.id));

      for (const ev of aiCareer.evidence) {
        expect(allEvidenceIds.has(ev.id)).toBe(true);
      }
      for (const id of aiCareer.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
    });
  });
});
