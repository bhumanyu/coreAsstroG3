import { describe, it, expect } from 'vitest';
import { deriveDirectionalDashaEvidence } from './dashaDirectionalReasoner';
import { synthesizeDashaDomains } from './dashaDomainSynthesis';
import { adaptInterpretationEvidenceListToReasoningFacts } from './dashaFactAdapter';
import { synthesizeDashaDirection } from './dashaDirectionalSynthesisEngine';
import { Planet, Sign, DignityStatus, PlanetStateCondition, AspectType } from '../../types';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { DashaInterpretationEvidence } from './dashaInterpretationTypes';
import { DashaReasoningEvidence } from './dashaReasoningTypes';

describe('Dasha Directional Reasoner & Domain Synthesis', () => {
  describe('deriveDirectionalDashaEvidence', () => {
    it('Ownership alone yields IMPLICATION with NEUTRAL effect and does NOT become SUPPORT', () => {
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
        sign: Sign.SAGITTARIUS,
        ownedHouses: [9, 12],
        reasoningEvidence: facts
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

      // Ownership alone without combined dignity/strength must NOT become SUPPORT
      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('NEUTRAL');
      expect(outcome?.confidence).toBe(0);

      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('NEUTRAL');
      expect(synthesis.confidence).toBe(0);
      expect(synthesis.supportingEvidenceIds).toHaveLength(0);
    });

    it('Ownership + strong dignity + benefic nature derives OUTCOME SUPPORT with non-zero confidence and correct sourceEvidenceIds', () => {
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
        sign: Sign.CANCER,
        ownedHouses: [9, 12],
        dignity: DignityStatus.EXALTED,
        functionalNature: FunctionalNature.BENEFIC,
        strength: {
          availability: 'AVAILABLE',
          totalRupa: 7.5,
          meetsMinimum: true
        },
        reasoningEvidence: facts
      });

      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('SUPPORT');
      expect(outcome?.confidence).toBeGreaterThan(0);
      expect(outcome?.sourceEvidenceIds.length).toBeGreaterThan(0);

      // Verify lineage references the dignity and functional nature facts
      const dignityFact = facts.find((f) => f.basis === 'DIGNITY');
      const natureFact = facts.find((f) => f.basis === 'FUNCTIONAL_NATURE');
      if (dignityFact) {
        expect(outcome?.sourceEvidenceIds).toContain(dignityFact.id);
      }
      if (natureFact) {
        expect(outcome?.sourceEvidenceIds).toContain(natureFact.id);
      }

      // Full synthesis should yield SUPPORT
      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('SUPPORT');
      expect(synthesis.confidence).toBeGreaterThan(0);
      expect(synthesis.supportingEvidenceIds).toContain(outcome?.id);
    });

    it('Ownership + Debilitation/Affliction derives OUTCOME CHALLENGE', () => {
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
        sign: Sign.ARIES,
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
        reasoningEvidence: facts
      });

      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('CHALLENGE');
      expect(outcome?.confidence).toBeGreaterThan(0);

      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('CHALLENGE');
      expect(synthesis.challengingEvidenceIds).toContain(outcome?.id);
    });

    it('No text inference: a NEUTRAL fact whose statement contains strong/powerful stays NEUTRAL', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_PLACEMENT',
          type: 'HOUSE_PLACEMENT',
          level: 'MAHADASHA',
          planets: [Planet.MARS],
          houses: [10],
          statement: 'Dasha lord Mars achieves supreme strong powerful glorious fabulous victory.',
          effect: 'NEUTRAL',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.MARS,
        house: 10,
        sign: Sign.CAPRICORN,
        ownedHouses: [1, 8],
        reasoningEvidence: facts
      });

      const outcome = derived.find((e) => e.level === 'OUTCOME');
      expect(outcome).toBeDefined();
      expect(outcome?.effect).toBe('NEUTRAL');
      expect(outcome?.confidence).toBe(0);

      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const synthesis = synthesizeDashaDirection(allReasoning);
      expect(synthesis.effect).toBe('NEUTRAL');
      expect(synthesis.confidence).toBe(0);
    });

    it('Deduplicates reasoning evidence by ID so each item appears exactly once', () => {
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
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.SUN,
        house: 10,
        sign: Sign.ARIES,
        ownedHouses: [5],
        reasoningEvidence: facts
      });

      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const uniqueIds = new Set(allReasoning.map((e) => e.id));
      expect(allReasoning.length).toBe(uniqueIds.size);
    });

    it('derives cast and received aspect implications with NEUTRAL effect', () => {
      const rawEvidence: DashaInterpretationEvidence[] = [
        {
          ruleId: 'DASHA_LORD_CAST_ASPECT_FULL_H7',
          type: 'ASPECT_CAST',
          level: 'MAHADASHA',
          planets: [Planet.MARS],
          houses: [7],
          statement: 'Dasha lord Mars casts FULL aspect on House 7.',
          effect: 'NEUTRAL',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.MARS,
        house: 1,
        sign: Sign.ARIES,
        ownedHouses: [1, 8],
        castAspects: [
          {
            sourcePlanet: Planet.MARS,
            sourceHouse: 1,
            targetPlanet: undefined,
            targetHouse: 7,
            aspectType: AspectType.FULL_7TH
          }
        ],
        receivedAspects: [
          {
            sourcePlanet: Planet.JUPITER,
            sourceHouse: 9,
            targetPlanet: Planet.MARS,
            targetHouse: 1,
            aspectType: AspectType.FULL_7TH
          }
        ],
        reasoningEvidence: facts
      });

      const castImp = derived.find(
        (e) => e.level === 'IMPLICATION' && e.id.includes('CAST_ASPECT')
      );
      expect(castImp).toBeDefined();
      expect(castImp?.effect).toBe('NEUTRAL');
      expect(castImp?.activatedHouses).toContain(7);

      const receivedImp = derived.find(
        (e) => e.level === 'IMPLICATION' && e.id.includes('RECEIVED_ASPECT')
      );
      expect(receivedImp).toBeDefined();
      expect(receivedImp?.effect).toBe('NEUTRAL');
      expect(receivedImp?.activatedHouses).toContain(9);
    });
  });

  describe('synthesizeDashaDomains & Contract Separation', () => {
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
        sign: Sign.ARIES,
        ownedHouses: [5],
        dignity: DignityStatus.EXALTED,
        functionalNature: FunctionalNature.BENEFIC,
        reasoningEvidence: facts
      });

      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const activatedHouses = [10, 5];
      const domains = synthesizeDashaDomains(allReasoning, activatedHouses);

      const careerDomain = domains.find((d) => d.domain === 'CAREER');
      expect(careerDomain).toBeDefined();
      expect(careerDomain?.effect).toBe('SUPPORT');
      expect(careerDomain?.activatedHouses).toContain(10);
      expect(careerDomain?.supportingEvidenceIds.length).toBeGreaterThan(0);
    });

    it('synthesizes WEALTH and MARRIAGE domains accurately and maintains separate contracts from planetarySynthesis', () => {
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
        },
        {
          ruleId: 'DASHA_LORD_DIGNITY',
          type: 'DIGNITY',
          level: 'MAHADASHA',
          planets: [Planet.VENUS],
          houses: [7],
          statement: 'Dasha lord Venus is in OWN_SIGN in Libra.',
          effect: 'SUPPORT',
          source: 'Planet Analysis'
        }
      ];

      const facts = adaptInterpretationEvidenceListToReasoningFacts(rawEvidence);
      const derived = deriveDirectionalDashaEvidence({
        planet: Planet.VENUS,
        house: 7,
        sign: Sign.LIBRA,
        ownedHouses: [2, 7],
        dignity: DignityStatus.OWN_SIGN,
        functionalNature: FunctionalNature.BENEFIC,
        reasoningEvidence: facts
      });

      const reasoningMap = new Map<string, DashaReasoningEvidence>();
      for (const item of facts) reasoningMap.set(item.id, item);
      for (const item of derived) reasoningMap.set(item.id, item);
      const allReasoning = Array.from(reasoningMap.values());

      const planetarySynthesis = synthesizeDashaDirection(allReasoning);
      const activatedHouses = [7, 2];
      const domains = synthesizeDashaDomains(allReasoning, activatedHouses);

      // Planetary synthesis is strictly planetary-level
      expect(planetarySynthesis.effect).toBe('SUPPORT');
      expect(planetarySynthesis.confidence).toBeGreaterThan(0);

      // Domain synthesis is exposed under separate domain contracts
      const marriageDomain = domains.find((d) => d.domain === 'MARRIAGE');
      expect(marriageDomain).toBeDefined();
      expect(marriageDomain?.effect).toBe('SUPPORT');
      expect(marriageDomain?.activatedHouses).toContain(7);

      const wealthDomain = domains.find((d) => d.domain === 'WEALTH');
      expect(wealthDomain).toBeDefined();
      expect(wealthDomain?.effect).toBe('SUPPORT');
      expect(wealthDomain?.activatedHouses).toContain(2);

      // Domains are independent objects with their own activated houses
      expect(marriageDomain?.domain).toBe('MARRIAGE');
      expect(wealthDomain?.domain).toBe('WEALTH');
    });
  });
});
