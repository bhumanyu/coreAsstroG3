import { describe, it, expect } from 'vitest';
import { deriveDirectionalDashaEvidence } from './dashaDirectionalReasoner';
import { synthesizeDashaDomains } from './dashaDomainSynthesis';
import { adaptInterpretationEvidenceListToReasoningFacts } from './dashaFactAdapter';
import { synthesizeDashaDirection } from './dashaDirectionalSynthesisEngine';
import { Planet, DignityStatus, PlanetStateCondition } from '../../types';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { DashaInterpretationEvidence } from './dashaInterpretationTypes';

describe('Dasha Directional Reasoner & Domain Synthesis', () => {
  describe('deriveDirectionalDashaEvidence', () => {
    it('derives NEUTRAL implication for house placement and ownership with preserved lineage', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_PLACEMENT',
          type: 'HOUSE_PLACEMENT',
          level: 'MAHADASHA',
          planets: [Planet.JUPITER],
          houses: [9],
          statement: 'Dasha lord Jupiter occupies House 9.',
          effect: 'NEUTRAL',
          source: 'Planet Analysis'
        },
        {
          ruleId: 'DASHA_LORD_OWNERSHIP_9',
          type: 'HOUSE_OWNERSHIP',
          level: 'MAHADASHA',
          planets: [Planet.JUPITER],
          houses: [9],
          statement: 'Dasha lord Jupiter owns House 9.',
          effect: 'NEUTRAL',
          source: 'House Lordship'
        },
        {
          ruleId: 'DASHA_LORD_OWNERSHIP_12',
          type: 'HOUSE_OWNERSHIP',
          level: 'MAHADASHA',
          planets: [Planet.JUPITER],
          houses: [12],
          statement: 'Dasha lord Jupiter owns House 12.',
          effect: 'NEUTRAL',
          source: 'House Lordship'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.JUPITER,
        house: 9,
        sign: 'SAGITTARIUS' as any,
        ownedHouses: [9, 12],
        reasoningEvidence: facts,
        existingEvidence: rawEvidence
      });

      // Implications for placement and ownerships
      const placementImp = derived.find(
        (e) => e.level === 'IMPLICATION' && e.basis === 'PLACEMENT' && e.activatedHouses.includes(9)
      );
      expect(placementImp).toBeDefined();
      expect(placementImp?.effect).toBe('NEUTRAL');
      expect(placementImp?.sourceEvidenceIds.length).toBeGreaterThan(0);

      const ownership9Imp = derived.find(
        (e) => e.level === 'IMPLICATION' && e.basis === 'OWNERSHIP' && e.activatedHouses.includes(9)
      );
      expect(ownership9Imp).toBeDefined();
      expect(ownership9Imp?.effect).toBe('NEUTRAL');

      const ownership12Imp = derived.find(
        (e) => e.level === 'IMPLICATION' && e.basis === 'OWNERSHIP' && e.activatedHouses.includes(12)
      );
      expect(ownership12Imp).toBeDefined();
      expect(ownership12Imp?.effect).toBe('NEUTRAL');
    });

    it('derives SUPPORT outcome when planet has Exalted dignity and Benefic functional nature', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_DIGNITY',
          type: 'DIGNITY',
          level: 'MAHADASHA',
          planets: [Planet.JUPITER],
          houses: [4],
          statement: 'Dasha lord Jupiter is in EXALTED dignity in Cancer.',
          effect: 'SUPPORT',
          source: 'Planet Analysis'
        },
        {
          ruleId: 'DASHA_LORD_NATURE',
          type: 'FUNCTIONAL_NATURE',
          level: 'MAHADASHA',
          planets: [Planet.JUPITER],
          houses: [4],
          statement: 'Dasha lord Jupiter has BENEFIC functional nature.',
          effect: 'SUPPORT',
          source: 'Functional Nature'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.JUPITER,
        house: 4,
        sign: 'CANCER' as any,
        ownedHouses: [9, 12],
        dignity: DignityStatus.EXALTED,
        functionalNature: FunctionalNature.BENEFIC,
        strength: {
          availability: 'AVAILABLE',
          totalRupa: 7.5,
          meetsMinimum: true
        },
        reasoningEvidence: facts,
        existingEvidence: rawEvidence
      });

      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('SUPPORT');
      expect(outcome?.sourceEvidenceIds.length).toBeGreaterThan(0);

      // Full synthesis should yield SUPPORT
      const allReasoning = [...facts, ...derived];
      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('SUPPORT');
      expect(synthesis.supportingEvidenceIds).toContain(outcome?.id);
    });

    it('derives CHALLENGE outcome when planet has Debilitated dignity and is Combust', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_DIGNITY',
          type: 'DIGNITY',
          level: 'MAHADASHA',
          planets: [Planet.SATURN],
          houses: [1],
          statement: 'Dasha lord Saturn is in DEBILITATED dignity in Aries.',
          effect: 'CHALLENGE',
          source: 'Planet Analysis'
        },
        {
          ruleId: 'DASHA_LORD_STATE',
          type: 'STATE',
          level: 'MAHADASHA',
          planets: [Planet.SATURN],
          houses: [1],
          statement: 'Dasha lord Saturn is combust.',
          effect: 'CHALLENGE',
          source: 'Planet State'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.SATURN,
        house: 1,
        sign: 'ARIES' as any,
        ownedHouses: [10, 11],
        dignity: DignityStatus.DEBILITATED,
        functionalNature: FunctionalNature.MALEFIC,
        state: {
          condition: PlanetStateCondition.COMBUST,
          combust: true,
          motion: { retrograde: false }
        },
        strength: {
          availability: 'AVAILABLE',
          totalRupa: 4.2,
          meetsMinimum: false
        },
        reasoningEvidence: facts,
        existingEvidence: rawEvidence
      });

      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('CHALLENGE');

      const allReasoning = [...facts, ...derived];
      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('CHALLENGE');
      expect(synthesis.challengingEvidenceIds).toContain(outcome?.id);
    });

    it('remains strictly deterministic without relying on freeform text parsing', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_PLACEMENT',
          type: 'HOUSE_PLACEMENT',
          level: 'MAHADASHA',
          planets: [Planet.MARS],
          houses: [10],
          statement: 'Dasha lord Mars achieves supreme fabulous spectacular victory.',
          effect: 'NEUTRAL',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.MARS,
        house: 10,
        sign: 'CAPRICORN' as any,
        ownedHouses: [1, 8],
        reasoningEvidence: facts,
        existingEvidence: rawEvidence
      });

      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('NEUTRAL');
      expect(outcome?.confidence).toBe(0);

      const allReasoning = [...facts, ...derived];
      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('NEUTRAL');
      expect(synthesis.confidence).toBe(0);
    });
  });

  describe('synthesizeDashaDomains', () => {
    it('synthesizes CAREER domain when house 10 or 2 or 6 or 11 is activated', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_PLACEMENT',
          type: 'HOUSE_PLACEMENT',
          level: 'MAHADASHA',
          planets: [Planet.SUN],
          houses: [10],
          statement: 'Dasha lord Sun occupies House 10.',
          effect: 'NEUTRAL',
          source: 'Planet Analysis'
        },
        {
          ruleId: 'DASHA_LORD_DIGNITY',
          type: 'DIGNITY',
          level: 'MAHADASHA',
          planets: [Planet.SUN],
          houses: [10],
          statement: 'Dasha lord Sun is EXALTED in Aries.',
          effect: 'SUPPORT',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.SUN,
        house: 10,
        sign: 'ARIES' as any,
        ownedHouses: [5],
        dignity: DignityStatus.EXALTED,
        functionalNature: FunctionalNature.BENEFIC,
        reasoningEvidence: facts,
        existingEvidence: rawEvidence
      });

      const allReasoning = [...facts, ...derived];
      const activatedHouses = [10, 5];
      const domains = synthesizeDashaDomains(allReasoning, activatedHouses);

      const careerDomain = domains.find((d) => d.domain === 'CAREER');
      expect(careerDomain).toBeDefined();
      expect(careerDomain?.effect).toBe('SUPPORT');
      expect(careerDomain?.activatedHouses).toContain(10);
      expect(careerDomain?.supportingEvidenceIds.length).toBeGreaterThan(0);
    });

    it('synthesizes WEALTH and MARRIAGE domains accurately with isolated house activations', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_PLACEMENT',
          type: 'HOUSE_PLACEMENT',
          level: 'MAHADASHA',
          planets: [Planet.VENUS],
          houses: [7],
          statement: 'Dasha lord Venus occupies House 7.',
          effect: 'NEUTRAL',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.VENUS,
        house: 7,
        sign: 'LIBRA' as any,
        ownedHouses: [2, 7],
        dignity: DignityStatus.OWN_SIGN,
        functionalNature: FunctionalNature.BENEFIC,
        reasoningEvidence: facts,
        existingEvidence: rawEvidence
      });

      const allReasoning = [...facts, ...derived];
      const activatedHouses = [7, 2];
      const domains = synthesizeDashaDomains(allReasoning, activatedHouses);

      const marriageDomain = domains.find((d) => d.domain === 'MARRIAGE');
      expect(marriageDomain).toBeDefined();
      expect(marriageDomain?.effect).toBe('SUPPORT');
      expect(marriageDomain?.activatedHouses).toContain(7);

      const wealthDomain = domains.find((d) => d.domain === 'WEALTH');
      expect(wealthDomain).toBeDefined();
      expect(wealthDomain?.effect).toBe('SUPPORT');
      expect(wealthDomain?.activatedHouses).toContain(2);
    });
  });
});
