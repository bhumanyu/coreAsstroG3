import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { interpretWealthTheme } from '../../engine/themeInterpretation/wealthThemeInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  interpretWealthV2,
  resolveWealthConclusionStrength,
  calculateDomainStrength,
  calculateVargaStrength,
  classifyWealthEvidence,
  buildWealthEvidence,
  evaluateWealthTiming,
  evaluateAccumulationDasha,
  evaluateGainsDasha,
  evaluateFortuneDasha,
  evaluateSpeculationDasha,
  evaluateWealthTimingActivation,
  evaluateDashaEffect,
  evaluateTransitEffect,
  evaluateD2Relationship,
  resolveDimensionStatus,
  evaluateWealthDimension,
  resolveOverallWealthStatus,
  calculateWealthDataCompleteness,
  buildWealthConclusionData,
  buildWealthHeadline,
  buildWealthDashaStatement,
  buildWealthTransitStatement,
  buildD2Statement,
  mapWealthRole,
  mapWealthPhase,
  mapWealthSource,
  mapWealthDimension
} from './WealthDomainInterpreterV2';
import { WealthDomainInterpreter } from './WealthDomainInterpreter';
import {
  createDomainEvidence,
  detectDomainConflicts,
  calculateEvidenceConfidence,
  projectDomainInterpretationForAi,
  interpretDomain,
  createDefaultDomainInterpreterRegistry,
  type DomainEvidence
} from '../interpretation';
import {
  buildGoldenWealthInterpretation,
  GOLDEN_WEALTH_EVIDENCE
} from './wealth-v2-golden.fixture';
import { deriveWealthManifestations } from './wealthManifestations';
import {
  linkWealthEvidence,
  resolveRelatedWealthPromiseEvidenceIds
} from './wealthEvidenceLinker';
import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import { Planet } from '../../types';
import { synthesizeWealthTiming } from '../timing/careerWealthTiming';
import { resolveWealthDimensionTransitEffect } from '../timing/careerWealthTiming/wealthTransitRules';
import { createMockActiveDashaState } from '../timing/careerWealthTiming/__testUtils__/mockDasha';

describe('WealthDomainInterpreterV2', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  // 1. Core integration & legacy preservation
  it('preserves existing wealth conclusion summary and version V2', () => {
    const legacy = interpretWealthTheme(horoscope);
    const v2 = interpretWealthV2(horoscope);

    expect(v2.domain).toBe('WEALTH');
    expect(v2.version).toBe('V2');
    expect(v2.conclusion.statement).toContain(legacy.conclusion.summary);
    expect(v2.conclusionData).toBeDefined();
    expect(v2.generatedAt).toBeDefined();
  });

  // 2. Golden fixture test
  it('correctly constructs and evaluates the Golden Wealth interpretation fixture', () => {
    const golden = buildGoldenWealthInterpretation();

    expect(golden.domain).toBe('WEALTH');
    expect(golden.natalPromise.strength).toBe('VERY_STRONG');
    expect(golden.natalPromise.confidence).toBe('VERY_HIGH');
    expect(golden.vargaConfirmations[0].relationship).toBe('CONFIRMS');

    const d2Evidence = golden.evidence.filter((e) => e.source === 'D2');
    const natalPromiseIds = golden.natalPromise.evidenceIds;
    const computedD2Rel = evaluateD2Relationship(undefined, d2Evidence, natalPromiseIds);
    expect(computedD2Rel).toBe('CONFIRMS');

    expect(golden.timingActivations).toBeDefined();
    expect(golden.timingActivations?.length).toBe(4);

    const accTiming = golden.timingActivations?.find((t) => t.dimension === 'ACCUMULATION');
    const gainsTiming = golden.timingActivations?.find((t) => t.dimension === 'GAINS');
    const specTiming = golden.timingActivations?.find((t) => t.dimension === 'SPECULATION');

    expect(accTiming?.effect).toBe('ACTIVATES');
    expect(gainsTiming?.effect).toBe('ACTIVATES');
    expect(specTiming?.effect).toBe('CHALLENGES');

    expect(golden.transitTrigger.effect).toBe('CHALLENGE');
    expect(golden.transitTrigger.triggeredPromiseEvidenceIds).toContain('GOLDEN_WEALTH_2H_STRONG');

    const manifestationModes = golden.manifestations.map((m) => m.mode);
    expect(manifestationModes).toContain('ACCUMULATION');
    expect(manifestationModes).toContain('GAINS');
    expect(manifestationModes).toContain('FORTUNE');
    expect(manifestationModes).toContain('SPECULATION');

    expect(golden.conclusion.strength).toBe('VERY_STRONG');
    expect(golden.dataCompleteness?.primaryFactors).toBe('AVAILABLE');
    expect(golden.dataCompleteness?.d2).toBe('AVAILABLE');
    expect(golden.dataCompleteness?.dasha).toBe('AVAILABLE');
    expect(golden.dataCompleteness?.transit).toBe('AVAILABLE');
  });

  // 3. Natal Promise calculation
  describe('Natal Promise calculation', () => {
    it('evaluates strong 2nd/11th factors as VERY_STRONG or STRONG', () => {
      const strongSupporting = [
        createDomainEvidence({
          id: '2H-STRONG',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house is strong with Dhana yoga',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION'
        }),
        createDomainEvidence({
          id: '11H-STRONG',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '11th house brings major revenue gains',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'GAINS'
        })
      ];
      const strength = calculateDomainStrength(strongSupporting, []);
      expect(strength).toBe('VERY_STRONG');
    });

    it('evaluates afflicted wealth factors as WEAK or VERY_WEAK', () => {
      const challenging = [
        createDomainEvidence({
          id: '2H-AFFLICTED',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house heavily afflicted',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION'
        })
      ];
      const strength = calculateDomainStrength([], challenging);
      expect(strength).toBe('VERY_WEAK');
    });

    it('evaluates strong support + strong challenge as MIXED', () => {
      const supporting = [
        createDomainEvidence({
          id: '2H-STRONG',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION'
        })
      ];
      const challenging = [
        createDomainEvidence({
          id: '2L-DEBILITATED',
          sourceType: 'LORDSHIP',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd lord debilitated',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION'
        })
      ];
      const strength = calculateDomainStrength(supporting, challenging);
      expect(strength).toBe('MIXED');
    });
  });

  // 4. Evidence hierarchy and role mapping
  describe('Evidence Hierarchy and Role Mapping', () => {
    it('classifies 2nd/11th/9th/5th as PRIMARY, Jupiter/modifiers as MODIFIER, D2 as CONFIRMATION, Dasha as TIMING', () => {
      const evidence = [
        createDomainEvidence({
          id: 'E-2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION'
        }),
        createDomainEvidence({
          id: 'E-JUPITER',
          sourceType: 'PLANET',
          domain: 'WEALTH',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Jupiter karaka',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 60,
          dimension: 'FORTUNE'
        }),
        createDomainEvidence({
          id: 'E-D2',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2 confirmation',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50
        }),
        createDomainEvidence({
          id: 'E-DASHA',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha timing',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30
        })
      ];

      const classified = classifyWealthEvidence(evidence);
      expect(classified.primary.map((e) => e.id)).toContain('E-2H');
      expect(classified.modifiers.map((e) => e.id)).toContain('E-JUPITER');
    });

    it('ensures unlinked D2 confirmation ends with empty relatedEvidenceIds', () => {
      const unlinkedD2 = [
        createDomainEvidence({
          id: 'D2-UNLINKED',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2 unlinked status',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: []
        }),
        createDomainEvidence({
          id: 'PRIMARY-2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION'
        })
      ];

      const linked = linkWealthEvidence(unlinkedD2);
      const d2Result = linked.find((e) => e.id === 'D2-UNLINKED');
      expect(d2Result).toBeDefined();
      expect(d2Result?.relatedEvidenceIds).toEqual([]);
    });

    it('links D2 evidence only to explicit 2nd house / 2nd lord and never to unrelated PRIMARY evidence', () => {
      const rawEvidence: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = [
        {
          id: 'RAW-2H',
          ruleId: 'WEALTH_HOUSE_PROMISE_2H_001',
          evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '2nd house strong'
        },
        {
          id: 'RAW-2L',
          ruleId: 'WEALTH_LORD_PROMISE_2L_001',
          evidenceFamily: WealthEvidenceFamily.SECOND_LORD,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '2nd lord strong'
        },
        {
          id: 'RAW-5H-PRIMARY',
          ruleId: 'WEALTH_HOUSE_PROMISE_5H_001',
          evidenceFamily: WealthEvidenceFamily.FIFTH_HOUSE,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '5th house speculation'
        },
        {
          id: 'RAW-D2',
          ruleId: 'WEALTH_D2_CONFIRMATION_001',
          evidenceFamily: WealthEvidenceFamily.D2,
          priority: 'CONFIRMATORY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: 'D2 confirmation',
          vargaEvidence: { varga: 'D2', relationship: 'CONFIRMS', statement: 'D2 confirms', effect: 'SUPPORT' }
        }
      ];

      const d2Item = rawEvidence.find((e) => e.id === 'RAW-D2')!;
      const relatedIds = resolveRelatedWealthPromiseEvidenceIds(d2Item, rawEvidence);
      expect(relatedIds).toContain('RAW-2H');
      expect(relatedIds).toContain('RAW-2L');
      expect(relatedIds).not.toContain('RAW-5H-PRIMARY');
      expect(relatedIds.length).toBe(2);

      const domainEvidence = buildWealthEvidence(rawEvidence);
      const d2Domain = domainEvidence.find((e) => e.id === 'RAW-D2');
      expect(d2Domain?.relatedEvidenceIds).toEqual(['RAW-2H', 'RAW-2L']);
      expect(d2Domain?.relatedEvidenceIds).not.toContain('RAW-5H-PRIMARY');
    });

    it('maps unknown evidence family with PRIMARY priority to SECONDARY role (P0)', () => {
      const rawEvidence: ThemeInterpretationEvidence<WealthEvidenceFamily> = {
        id: 'RAW-UNKNOWN',
        ruleId: 'UNKNOWN_RULE_001',
        evidenceFamily: 'CUSTOM_UNLISTED_FAMILY' as unknown as WealthEvidenceFamily,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: 'Unknown family raw evidence'
      };

      const role = mapWealthRole(rawEvidence);
      expect(role).not.toBe('PRIMARY');
      expect(role).toBe('SECONDARY');
    });

    it('maps all known WealthEvidenceFamily members to their designated roles (regression)', () => {
      const primaryFamilies = [
        WealthEvidenceFamily.SECOND_HOUSE,
        WealthEvidenceFamily.SECOND_LORD,
        WealthEvidenceFamily.ELEVENTH_HOUSE,
        WealthEvidenceFamily.ELEVENTH_LORD,
        WealthEvidenceFamily.NINTH_HOUSE,
        WealthEvidenceFamily.NINTH_LORD,
        WealthEvidenceFamily.FIFTH_HOUSE,
        WealthEvidenceFamily.FIFTH_LORD
      ];
      for (const fam of primaryFamilies) {
        expect(
          mapWealthRole({
            id: 'test',
            ruleId: 'r',
            evidenceFamily: fam,
            priority: 'SECONDARY',
            strength: 'STRONG',
            effect: 'SUPPORT',
            statement: 's'
          })
        ).toBe('PRIMARY');
      }

      const modifierFamilies = [
        WealthEvidenceFamily.JUPITER,
        WealthEvidenceFamily.VENUS,
        WealthEvidenceFamily.MERCURY,
        WealthEvidenceFamily.YOGA,
        WealthEvidenceFamily.FUNCTIONAL_ROLE,
        WealthEvidenceFamily.PLANETARY_STRENGTH,
        WealthEvidenceFamily.ASPECT
      ];
      for (const fam of modifierFamilies) {
        expect(
          mapWealthRole({
            id: 'test',
            ruleId: 'r',
            evidenceFamily: fam,
            priority: 'PRIMARY',
            strength: 'STRONG',
            effect: 'SUPPORT',
            statement: 's'
          })
        ).toBe('MODIFIER');
      }

      expect(
        mapWealthRole({
          id: 'test',
          ruleId: 'r',
          evidenceFamily: WealthEvidenceFamily.D2,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: 's'
        })
      ).toBe('CONFIRMATION');

      expect(
        mapWealthRole({
          id: 'test',
          ruleId: 'r',
          evidenceFamily: WealthEvidenceFamily.DASHA,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: 's'
        })
      ).toBe('TIMING');

      expect(
        mapWealthRole({
          id: 'test',
          ruleId: 'r',
          evidenceFamily: WealthEvidenceFamily.TRANSIT,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: 's'
        })
      ).toBe('TIMING');
    });
  });

  // 5. D2 evaluation matrix
  describe('D2 Varga relationship evaluation', () => {
    it('evaluates D2 CONFIRMS when supporting', () => {
      const rel = evaluateD2Relationship([], undefined, undefined, undefined, 'CONFIRMED');
      expect(rel).toBe('CONFIRMS');
    });

    it('evaluates D2 CONFLICTS when challenging', () => {
      const rel = evaluateD2Relationship([], undefined, undefined, undefined, 'CONFLICTED');
      expect(rel).toBe('CONFLICTS');
    });

    it('evaluates D2 UNAVAILABLE when no D2 data exists', () => {
      const rel = evaluateD2Relationship([], [], [], [], 'NOT_APPLICABLE');
      expect(rel).toBe('UNAVAILABLE');
    });

    it('evaluates D2 CONFIRMS when linked to natal promise evidence ids', () => {
      const natalPromiseIds = ['PROMISE-2H', 'PROMISE-2L'];
      const linkedD2: readonly DomainEvidence[] = [
        createDomainEvidence({
          id: 'D2-SUPP',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2 supports liquid wealth',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: ['PROMISE-2H']
        })
      ];
      const rel = evaluateD2Relationship(undefined, linkedD2, natalPromiseIds);
      expect(rel).toBe('CONFIRMS');
    });

    it('evaluates D2 UNAVAILABLE when D2 evidence has no intersecting links to natalPromiseEvidenceIds', () => {
      const natalPromiseIds = ['PROMISE-2H', 'PROMISE-2L'];
      const unlinkedD2: readonly DomainEvidence[] = [
        createDomainEvidence({
          id: 'D2-UNLINKED',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2 supports unrelated pattern',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: ['SOME-UNRELATED-ID']
        })
      ];
      const rel = evaluateD2Relationship(undefined, unlinkedD2, natalPromiseIds);
      expect(rel).toBe('UNAVAILABLE');
    });
  });

  // 6. Dasha timing per-dimension evaluation
  describe('Dasha timing & Dimensional separation', () => {
    it('activates accumulation when Dasha links to 2H, but does NOT activate speculation', () => {
      const allEvidence: DomainEvidence[] = [
        createDomainEvidence({
          id: 'PROMISE-2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION',
          evidenceFamily: 'SECOND_HOUSE'
        }),
        createDomainEvidence({
          id: 'PROMISE-5H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '5th house speculation',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 90,
          dimension: 'SPECULATION',
          evidenceFamily: 'FIFTH_HOUSE'
        })
      ];

      const dashaEvidence: DomainEvidence[] = [
        createDomainEvidence({
          id: 'DASHA-2H',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha period activates 2nd house wealth',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['PROMISE-2H'],
          evidenceFamily: 'DASHA'
        })
      ];

      const accEffect = evaluateAccumulationDasha(dashaEvidence, allEvidence);
      const specEffect = evaluateSpeculationDasha(dashaEvidence, allEvidence);

      expect(accEffect).toBe('ACTIVATES');
      expect(specEffect).toBe('DOES_NOT_ACTIVATE');
    });

    it('returns INSUFFICIENT_DATA when timing evidence is completely empty', () => {
      const emptyTiming: DomainEvidence[] = [];
      const accEffect = evaluateAccumulationDasha(emptyTiming);
      const specEffect = evaluateSpeculationDasha(emptyTiming);
      const dashaEffect = evaluateDashaEffect(emptyTiming);
      const timingActivation = evaluateWealthTimingActivation('MD', emptyTiming, ['PROMISE-2H']);

      expect(accEffect).toBe('INSUFFICIENT_DATA');
      expect(specEffect).toBe('INSUFFICIENT_DATA');
      expect(dashaEffect).toBe('INSUFFICIENT_DATA');
      expect(timingActivation.effect).toBe('INSUFFICIENT_DATA');
    });

    it('returns DOES_NOT_ACTIVATE when timing evidence is present but unrelated to the dimension', () => {
      const allEvidence: DomainEvidence[] = [
        createDomainEvidence({
          id: 'PROMISE-2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION',
          evidenceFamily: 'SECOND_HOUSE'
        })
      ];

      const dashaEvidence: DomainEvidence[] = [
        createDomainEvidence({
          id: 'DASHA-2H',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha activates 2H',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['PROMISE-2H'],
          evidenceFamily: 'DASHA'
        })
      ];

      const specEffect = evaluateSpeculationDasha(dashaEvidence, allEvidence);
      expect(specEffect).toBe('DOES_NOT_ACTIVATE');
    });

    it('returns CHALLENGES and PARTIALLY_ACTIVATES for linked timing combinations', () => {
      const allEvidence: DomainEvidence[] = [
        createDomainEvidence({
          id: 'PROMISE-2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          dimension: 'ACCUMULATION',
          evidenceFamily: 'SECOND_HOUSE'
        })
      ];

      const challengingDasha: DomainEvidence[] = [
        createDomainEvidence({
          id: 'DASHA-CHALLENGE',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha challenge to 2H',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['PROMISE-2H'],
          evidenceFamily: 'DASHA'
        })
      ];

      expect(evaluateAccumulationDasha(challengingDasha, allEvidence)).toBe('CHALLENGES');

      const mixedDasha: DomainEvidence[] = [
        ...challengingDasha,
        createDomainEvidence({
          id: 'DASHA-SUPPORT',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha support to 2H',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['PROMISE-2H'],
          evidenceFamily: 'DASHA'
        })
      ];

      expect(evaluateAccumulationDasha(mixedDasha, allEvidence)).toBe('PARTIALLY_ACTIVATES');
    });

    it('returns UNKNOWN when Dasha evidence has no linked natal evidence', () => {
      const unlinkedDasha = [
        createDomainEvidence({
          id: 'DASHA-UNLINKED',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha lord unrelated',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: []
        })
      ];

      const effect = evaluateDashaEffect(unlinkedDasha, []);
      expect(effect).toBe('UNKNOWN');
    });
  });

  // 7. Transit trigger evaluation
  describe('Transit trigger evaluation', () => {
    it('evaluates TRIGGER when transit supports and links to natal wealth promise', () => {
      const transitEvidence = [
        createDomainEvidence({
          id: 'TRANSIT-JUPITER',
          sourceType: 'TRANSIT',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Jupiter transits 2nd house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['WEALTH-2H']
        })
      ];

      const effect = evaluateTransitEffect(transitEvidence, ['WEALTH-2H']);
      expect(effect).toBe('TRIGGER');
    });

    it('returns UNKNOWN when transit has no linked natal evidence', () => {
      const unlinkedTransit = [
        createDomainEvidence({
          id: 'TRANSIT-UNLINKED',
          sourceType: 'TRANSIT',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Transit 8th house',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: []
        })
      ];

      const effect = evaluateTransitEffect(unlinkedTransit, []);
      expect(effect).toBe('UNKNOWN');

      const emptyEffect = evaluateTransitEffect([]);
      expect(emptyEffect).toBe('NO_MATERIAL_TRIGGER');
    });
  });

  // 8. Dimensional evaluation & Overall wealth promise invariant
  describe('Dimensional evaluation & Overall status invariant', () => {
    it('ensures speculation weakness does NOT downgrade overall wealth status when accumulation and gains are strong', () => {
      const dimensions = Object.freeze([
        {
          dimension: 'ACCUMULATION' as const,
          status: 'STRONGLY_SUPPORTED' as const,
          supportingEvidenceIds: ['2H'],
          challengingEvidenceIds: [],
          dashaEffect: 'ACTIVATES' as const
        },
        {
          dimension: 'GAINS' as const,
          status: 'STRONGLY_SUPPORTED' as const,
          supportingEvidenceIds: ['11H'],
          challengingEvidenceIds: [],
          dashaEffect: 'ACTIVATES' as const
        },
        {
          dimension: 'FORTUNE' as const,
          status: 'SUPPORTED' as const,
          supportingEvidenceIds: ['9H'],
          challengingEvidenceIds: [],
          dashaEffect: 'DOES_NOT_ACTIVATE' as const
        },
        {
          dimension: 'SPECULATION' as const,
          status: 'CHALLENGED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: ['5H_CHALLENGE'],
          dashaEffect: 'CHALLENGES' as const
        }
      ]);

      const overall = resolveOverallWealthStatus(dimensions);
      expect(overall).toBe('STRONGLY_SUPPORTED');
    });

    it('resolves CHALLENGED overall status when accumulation and gains are both challenged', () => {
      const dimensions = Object.freeze([
        {
          dimension: 'ACCUMULATION' as const,
          status: 'CHALLENGED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: ['2H_CHALLENGE'],
          dashaEffect: 'CHALLENGES' as const
        },
        {
          dimension: 'GAINS' as const,
          status: 'CHALLENGED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: ['11H_CHALLENGE'],
          dashaEffect: 'CHALLENGES' as const
        },
        {
          dimension: 'FORTUNE' as const,
          status: 'LIMITED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          dashaEffect: 'DOES_NOT_ACTIVATE' as const
        },
        {
          dimension: 'SPECULATION' as const,
          status: 'SUPPORTED' as const,
          supportingEvidenceIds: ['5H'],
          challengingEvidenceIds: [],
          dashaEffect: 'ACTIVATES' as const
        }
      ]);

      const overall = resolveOverallWealthStatus(dimensions);
      expect(overall).toBe('CHALLENGED');
    });
  });

  // 9. Manifestation determinism
  describe('Manifestation determinism', () => {
    it('derives ACCUMULATION from 2nd house evidence and GAINS from 11th house evidence', () => {
      const evidence = [
        createDomainEvidence({
          id: '2H_ACC',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house savings and liquid capital',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'SECOND_HOUSE',
          dimension: 'ACCUMULATION',
          ruleId: 'WEALTH_HOUSE_PROMISE_2H_001'
        }),
        createDomainEvidence({
          id: '11H_REV',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '11th house business gains',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'ELEVENTH_HOUSE',
          dimension: 'GAINS',
          ruleId: 'WEALTH_HOUSE_PROMISE_11H_001'
        })
      ];

      const manifestations = deriveWealthManifestations(evidence);
      const acc = manifestations.find((m) => m.mode === 'ACCUMULATION');
      const gains = manifestations.find((m) => m.mode === 'GAINS');

      expect(acc?.evidenceIds).toContain('2H_ACC');
      expect(gains?.evidenceIds).toContain('11H_REV');
    });

    it('does not produce positive SPECULATION from challenging 5th house rules', () => {
      const challengingSpec = [
        createDomainEvidence({
          id: '5H_LOSS',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '5th house afflicted causing speculative losses',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'FIFTH_HOUSE',
          dimension: 'SPECULATION',
          ruleId: 'WEALTH_HOUSE_PROMISE_5H_001'
        })
      ];

      const manifestations = deriveWealthManifestations(challengingSpec);
      const spec = manifestations.find((m) => m.mode === 'SPECULATION');
      expect(spec?.evidenceIds).not.toContain('5H_LOSS');
    });

    it('sets INSUFFICIENT_DATA status and VERY_LOW confidence when dimension has no evidence, and applies softened speculation wording', () => {
      const evidence = [
        createDomainEvidence({
          id: '2H_ACC',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house savings',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'SECOND_HOUSE',
          dimension: 'ACCUMULATION',
          ruleId: 'WEALTH_HOUSE_PROMISE_2H_001'
        }),
        createDomainEvidence({
          id: '2L_ACC',
          sourceType: 'LORDSHIP',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd lord strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 85,
          evidenceFamily: 'SECOND_LORD',
          dimension: 'ACCUMULATION',
          ruleId: 'WEALTH_LORD_PROMISE_2L_001'
        })
      ];

      const manifestations = deriveWealthManifestations(evidence);
      const acc = manifestations.find((m) => m.mode === 'ACCUMULATION');
      const spec = manifestations.find((m) => m.mode === 'SPECULATION');
      const fortune = manifestations.find((m) => m.mode === 'FORTUNE');
      const gains = manifestations.find((m) => m.mode === 'GAINS');

      expect(acc?.status).toBe('SUPPORTED');
      expect(acc?.confidence).toBe('VERY_HIGH');

      expect(spec?.status).toBe('INSUFFICIENT_DATA');
      expect(spec?.confidence).toBe('VERY_LOW');
      expect(spec?.statement).toBe('Speculative indicators are comparatively weaker than accumulation and gains.');
      expect(spec?.statement).not.toContain('speculative returns');
      expect(spec?.statement).not.toContain('calculated investments');

      expect(fortune?.status).toBe('INSUFFICIENT_DATA');
      expect(fortune?.confidence).toBe('VERY_LOW');

      expect(gains?.status).toBe('INSUFFICIENT_DATA');
      expect(gains?.confidence).toBe('VERY_LOW');
    });

    it('emits softened positive speculation wording when supportive 5th house evidence is present', () => {
      const specEvidence = [
        createDomainEvidence({
          id: '5H_SPEC',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '5th house supportive',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'FIFTH_HOUSE',
          dimension: 'SPECULATION',
          ruleId: 'WEALTH_HOUSE_PROMISE_5H_001'
        }),
        createDomainEvidence({
          id: '5L_SPEC',
          sourceType: 'LORDSHIP',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '5th lord supportive',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 85,
          evidenceFamily: 'FIFTH_LORD',
          dimension: 'SPECULATION',
          ruleId: 'WEALTH_LORD_PROMISE_5L_001'
        })
      ];

      const manifestations = deriveWealthManifestations(specEvidence);
      const spec = manifestations.find((m) => m.mode === 'SPECULATION');
      expect(spec?.status).toBe('SUPPORTED');
      expect(spec?.statement).toBe(
        'The chart contains supportive indicators for speculative activity, though these should be interpreted separately from overall wealth potential.'
      );
    });
  });

  // 10. Conflict tiers & Natal Promise preservation
  describe('Conflict tiers & Natal Promise preservation', () => {
    it('detects all conflict tiers and preserves strong natal promise through transit pressure', () => {
      const evidence = [
        createDomainEvidence({
          id: 'P1',
          sourceType: 'LORDSHIP',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd lord strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 95
        }),
        createDomainEvidence({
          id: 'P2',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house exalted occupant',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        }),
        createDomainEvidence({
          id: 'V1',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2 challenge',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 70,
          relatedEvidenceIds: ['P1']
        }),
        createDomainEvidence({
          id: 'T1',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha expenditure challenge',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['P1']
        }),
        createDomainEvidence({
          id: 'TR1',
          sourceType: 'TRANSIT',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Transit pressure on cash flow',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['P1']
        })
      ];

      const conflicts = detectDomainConflicts('WEALTH', evidence);
      const tiers = conflicts.map((c) => c.tier);

      expect(tiers).toContain('PRIMARY_VS_VARGA');
      expect(tiers).toContain('PRIMARY_VS_TIMING');
      expect(tiers).toContain('PRIMARY_VS_TRANSIT');

      const natalSupporting = evidence.filter((e) => e.phase === 'NATAL_PROMISE' && e.polarity === 'SUPPORTING');
      const natalStrength = calculateDomainStrength(natalSupporting, []);
      expect(natalStrength).toBe('VERY_STRONG');

      // D2 downgrade test: VERY_STRONG -> STRONG
      const withVarga = resolveWealthConclusionStrength(natalStrength, 'CONFLICTS', conflicts);
      expect(withVarga).toBe('STRONG');

      // Transit only conflict preserves strong natal promise
      const transitOnlyConflicts = conflicts.filter((c) => c.tier === 'PRIMARY_VS_TRANSIT');
      const withTransitOnly = resolveWealthConclusionStrength('STRONG', 'CONFIRMS', transitOnlyConflicts);
      expect(withTransitOnly).toBe('STRONG');
    });
  });

  // 11. Confidence evaluation rules
  describe('Confidence evaluation rules', () => {
    it('single weak primary evidence does not yield HIGH', () => {
      const weakPrimary = [
        createDomainEvidence({
          id: 'WEAK-2L',
          sourceType: 'LORDSHIP',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd lord in weak dignity',
          polarity: 'SUPPORTING',
          strength: 'WEAK',
          priority: 90
        })
      ];
      const confidence = calculateEvidenceConfidence(weakPrimary);
      expect(confidence).toBe('LOW');
      expect(confidence).not.toBe('HIGH');
    });

    it('multiple strong primary factors with D2 confirmation yields HIGH or VERY_HIGH', () => {
      const strongPrimary = [
        createDomainEvidence({
          id: 'STRONG-2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house strong',
          polarity: 'SUPPORTING',
          strength: 'VERY_STRONG',
          priority: 95
        }),
        createDomainEvidence({
          id: 'STRONG-11H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '11th house strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        })
      ];
      const confidence = calculateEvidenceConfidence(strongPrimary, {
        dataCompleteness: 'COMPLETE',
        hasVargaConflict: false,
        hasPrimaryChallenge: false
      });
      expect(['HIGH', 'VERY_HIGH']).toContain(confidence);
    });
  });

  // 12. Data completeness
  describe('Data completeness', () => {
    it('accurately reports completeness when factors are present', () => {
      const evidence = [
        createDomainEvidence({
          id: '2H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'SECOND_HOUSE'
        }),
        createDomainEvidence({
          id: '11H',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '11th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: 'ELEVENTH_HOUSE'
        }),
        createDomainEvidence({
          id: 'D2',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          evidenceFamily: 'D2'
        })
      ];

      const completeness = calculateWealthDataCompleteness(evidence);
      expect(completeness.primaryFactors).toBe('AVAILABLE');
      expect(completeness.d2).toBe('AVAILABLE');
      expect(completeness.dasha).toBe('UNAVAILABLE');
    });

    it('reports dasha AVAILABLE and transit UNAVAILABLE when ONLY Dasha evidence is present (regression test)', () => {
      const dashaOnly = [
        createDomainEvidence({
          id: 'DASHA-1',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active Dasha',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          evidenceFamily: 'DASHA'
        })
      ];

      const completeness = calculateWealthDataCompleteness(dashaOnly);
      expect(completeness.dasha).toBe('AVAILABLE');
      expect(completeness.transit).toBe('UNAVAILABLE');
    });

    it('reports dasha UNAVAILABLE and transit AVAILABLE when ONLY Transit evidence is present with role TIMING (regression test)', () => {
      const transitOnly = [
        createDomainEvidence({
          id: 'TRANSIT-1',
          sourceType: 'TRANSIT',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Active Transit',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          evidenceFamily: 'TRANSIT'
        })
      ];

      const completeness = calculateWealthDataCompleteness(transitOnly);
      expect(completeness.dasha).toBe('UNAVAILABLE');
      expect(completeness.transit).toBe('AVAILABLE');
    });

    it('determines primary factors completeness authoritatively by evidenceFamily, not statement text', () => {
      // Evidence with valid evidenceFamily but generic statement text
      const evidence = [
        createDomainEvidence({
          id: 'EVID-A',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Completely generic text',
          ruleId: 'CUSTOM_RULE_AAA',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE
        }),
        createDomainEvidence({
          id: 'EVID-B',
          sourceType: 'LORDSHIP',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Another generic statement',
          ruleId: 'CUSTOM_RULE_BBB',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          evidenceFamily: WealthEvidenceFamily.ELEVENTH_LORD
        })
      ];

      const completeness = calculateWealthDataCompleteness(evidence);
      expect(completeness.primaryFactors).toBe('AVAILABLE');

      // Evidence with statement containing "2nd house" but wrong evidenceFamily (e.g. JUPITER) does NOT flip has2H
      const statementOnlyEvidence = [
        createDomainEvidence({
          id: 'HOUSE_2_NAME',
          sourceType: 'PLANET',
          domain: 'WEALTH',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house is influenced by Jupiter karaka',
          ruleId: 'WEALTH_JUPITER_KARAKA_001',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 60,
          evidenceFamily: WealthEvidenceFamily.JUPITER
        })
      ];

      const statementOnlyCompleteness = calculateWealthDataCompleteness(statementOnlyEvidence);
      expect(statementOnlyCompleteness.primaryFactors).toBe('UNAVAILABLE');
    });
  });

  // 13. Traceability invariant
  describe('Evidence Traceability Invariant', () => {
    it('guarantees every evidence ID referenced anywhere exists in result.evidence', () => {
      const v2 = interpretWealthV2(horoscope);
      const allEvidenceIds = new Set(v2.evidence.map((e) => e.id));

      for (const id of v2.conclusion.supportingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.conclusion.challengingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.conclusion.primaryEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.natalPromise.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.dashaActivation.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.dashaActivation.activatedPromiseEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.transitTrigger.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.transitTrigger.triggeredPromiseEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const varga of v2.vargaConfirmations) {
        for (const id of varga.evidenceIds) {
          expect(allEvidenceIds.has(id)).toBe(true);
        }
      }
      for (const manifestation of v2.manifestations) {
        for (const id of manifestation.evidenceIds) {
          expect(allEvidenceIds.has(id)).toBe(true);
        }
      }
      for (const conflict of v2.conflicts) {
        for (const id of conflict.positiveEvidenceIds) {
          expect(allEvidenceIds.has(id)).toBe(true);
        }
        for (const id of conflict.negativeEvidenceIds) {
          expect(allEvidenceIds.has(id)).toBe(true);
        }
      }
    });
  });

  // 14. AI Projection
  describe('AI Projection', () => {
    it('projects domain interpretation cleanly for AI', () => {
      const v2 = interpretWealthV2(horoscope);
      const projection = projectDomainInterpretationForAi(v2);

      expect(projection.domain).toBe('WEALTH');
      expect(projection.natalPromise).toBeDefined();
      expect(projection.conclusion).toBeDefined();
      expect(projection.manifestations.length).toBeGreaterThan(0);

      const projRecord = projection as unknown as Record<string, unknown>;
      expect(projRecord.horoscope).toBeUndefined();

      const allEvidenceIds = new Set(v2.evidence.map((e) => e.id));
      for (const id of projection.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // Verify enriched evidence array in projection
      expect(projection.evidence).toBeDefined();
      expect(projection.evidence.length).toBe(v2.evidence.length);
      for (const ev of projection.evidence) {
        expect(allEvidenceIds.has(ev.id)).toBe(true);
        expect(ev.statement).toBeDefined();
        expect(ev.sourceType).toBeDefined();
        expect(ev.role).toBeDefined();
        expect(ev.polarity).toBeDefined();
        expect(ev.strength).toBeDefined();
      }
    });
  });

  // 15. Headline & statement generation
  describe('Headline and statement generation', () => {
    it('generates correct headline when accumulation and gains are strongly supported', () => {
      const headline = buildWealthHeadline({
        overallStatus: 'STRONGLY_SUPPORTED',
        accumulationStatus: 'STRONGLY_SUPPORTED',
        gainsStatus: 'STRONGLY_SUPPORTED',
        speculationStatus: 'SUPPORTED'
      });
      expect(headline).toBe('Wealth potential is strongly supported through accumulation and gains.');
    });

    it('generates correct headline when speculation is challenged', () => {
      const headline = buildWealthHeadline({
        overallStatus: 'SUPPORTED',
        accumulationStatus: 'SUPPORTED',
        gainsStatus: 'SUPPORTED',
        speculationStatus: 'CHALLENGED'
      });
      expect(headline).toBe('Wealth is better supported through structured accumulation and gains than through speculation.');
    });

    it('generates Dasha statements consistent with computed effect', () => {
      const dummyEvidence = [
        createDomainEvidence({
          id: 'DUMMY-EVID',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha timing effect',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30
        })
      ];

      expect(buildWealthDashaStatement(dummyEvidence, 'ACTIVATES')).toContain('actively supports');
      expect(buildWealthDashaStatement(dummyEvidence, 'CHALLENGES')).toContain('consolidation or expenditure');
      expect(buildWealthDashaStatement(dummyEvidence, 'DOES_NOT_ACTIVATE')).toContain('No active wealth Dasha');
      expect(buildWealthDashaStatement(dummyEvidence, 'UNKNOWN')).toContain('could not be established');
    });

    it('generates Transit statements consistent with computed effect', () => {
      const dummyEvidence = [
        createDomainEvidence({
          id: 'DUMMY-EVID',
          sourceType: 'TRANSIT',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Transit effect',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30
        })
      ];

      expect(buildWealthTransitStatement(dummyEvidence, 'TRIGGER')).toContain('Transit triggers are active');
      expect(buildWealthTransitStatement(dummyEvidence, 'CHALLENGE')).toContain('Current transit pressure');
      expect(buildWealthTransitStatement(dummyEvidence, 'NO_MATERIAL_TRIGGER')).toContain('No material transit trigger');
      expect(buildWealthTransitStatement(dummyEvidence, 'UNKNOWN')).toContain('could not be confirmed');
    });

    it('generates D2 statements consistent with relationship', () => {
      const dummyEvidence = [
        createDomainEvidence({
          id: 'D2-EVID',
          sourceType: 'VARGA',
          domain: 'WEALTH',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D2',
          statement: 'D2 Hora',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50
        })
      ];

      expect(buildD2Statement(dummyEvidence, 'CONFIRMS')).toContain('confirms liquid wealth potential');
      expect(buildD2Statement(dummyEvidence, 'CONFLICTS')).toContain('diverges from natal promise');
      expect(buildD2Statement(dummyEvidence, 'UNAVAILABLE')).toContain('unavailable or neutral');
    });
  });

  // 16. Registry integration
  it('implements DomainInterpreter and works via registry service', () => {
    const interpreter = new WealthDomainInterpreter();
    expect(interpreter.domain).toBe('WEALTH');

    const result = interpreter.interpret(horoscope);
    expect(result.domain).toBe('WEALTH');

    const registry = createDefaultDomainInterpreterRegistry();
    expect(registry.has('WEALTH')).toBe(true);

    const serviceResult = interpretDomain({
      horoscope,
      domain: 'WEALTH',
      registry
    });
    expect(serviceResult.domain).toBe('WEALTH');
    expect(serviceResult.conclusion).toBeDefined();
  });

  // 17. CW-02 -> CW-03 end-to-end timing integration (Concern 9 & Concern 11)
  it('plumbs CW-02 Dasha activations through to CW-03 wealthTimingSynthesis given an explicit asOf date', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = interpretWealthV2(horoscope, { asOf });

    expect(result.domain).toBe('WEALTH');
    expect(result.conclusionData).toBeDefined();

    const wealthTiming = (result.conclusionData as any).wealthTimingSynthesis;
    expect(wealthTiming).toBeDefined();
    expect(wealthTiming.dimensions).toBeDefined();

    // Verify all 4 dimensions are populated
    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const dimSynthesis = wealthTiming.dimensions[dim];
      expect(dimSynthesis).toBeDefined();
      expect(dimSynthesis.dimension).toBe(dim);
      expect(dimSynthesis.natalPromise).toBeDefined();
      expect(dimSynthesis.dashaEffect).toBeDefined();
      expect(dimSynthesis.transitEffect).toBeDefined();
      expect(dimSynthesis.overallEffect).toBeDefined();
      expect(dimSynthesis.factors).toBeDefined();
    }

    // GAINS dimension concrete verification on canonical chart
    const gainsSynthesis = wealthTiming.dimensions.GAINS;
    expect(gainsSynthesis.dashaEffect).toBe('NEUTRAL');
    expect(gainsSynthesis.natalPromise).toBe('STRONG');
    expect(gainsSynthesis.overallEffect).toBe('DOES_NOT_ACTIVATE');
  });

  it('proves deterministic CW-02 -> CW-03 activation pipeline (STRONG natal + SUPPORTS Dasha + SUPPORTS Transit -> ACTIVATES)', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');

    // Direct resolver proof:
    expect(
      resolveWealthDimensionTransitEffect('STRONG', 'SUPPORTS', { transitEffect: 'SUPPORTS' })
    ).toBe('ACTIVATES');

    // Direct synthesizer proof with explicit natal promise and dasha effects:
    const supportiveDashaState = createMockActiveDashaState({
      mdPlanet: Planet.SATURN,
      adPlanet: Planet.SATURN,
      pdPlanet: Planet.SATURN
    });

    const synthesizedSupport = synthesizeWealthTiming(
      horoscope,
      supportiveDashaState,
      asOf,
      { ACCUMULATION: 'STRONG' },
      { ACCUMULATION: 'SUPPORTS' }
    );
    expect(synthesizedSupport.dimensions.ACCUMULATION.natalPromise).toBe('STRONG');
    expect(synthesizedSupport.dimensions.ACCUMULATION.dashaEffect).toBe('SUPPORTS');
    expect(synthesizedSupport.dimensions.ACCUMULATION.overallEffect).toBe('ACTIVATES');

    // Corresponding challenge cases pinning exact CW-03 matrix transitions:
    expect(
      resolveWealthDimensionTransitEffect('STRONG', 'CHALLENGES', { transitEffect: 'SUPPORTS' })
    ).toBe('MODIFIES');
    expect(
      resolveWealthDimensionTransitEffect('STRONG', 'SUPPORTS', { transitEffect: 'CHALLENGES' })
    ).toBe('MODIFIES');
    expect(
      resolveWealthDimensionTransitEffect('STRONG', 'CHALLENGES', { transitEffect: 'CHALLENGES' })
    ).toBe('CHALLENGES');
    expect(
      resolveWealthDimensionTransitEffect('WEAK', 'SUPPORTS', { transitEffect: 'SUPPORTS' })
    ).toBe('DOES_NOT_ACTIVATE');

    const synthesizedChallenge = synthesizeWealthTiming(
      horoscope,
      supportiveDashaState,
      asOf,
      { ACCUMULATION: 'STRONG' },
      { ACCUMULATION: 'CHALLENGES' }
    );
    expect(synthesizedChallenge.dimensions.ACCUMULATION.dashaEffect).toBe('CHALLENGES');
    expect(synthesizedChallenge.dimensions.ACCUMULATION.overallEffect).toBe('CHALLENGES');
  });

  // End-to-end CW-04 Wealth Manifestation Pipeline Test
  it('CW-04 end-to-end pipeline: produces deterministic wealth manifestation synthesis with explicit asOf date', () => {
    const asOf = '2024-06-15T12:00:00.000Z';
    const result1 = interpretWealthV2(horoscope, { asOf });
    const result2 = interpretWealthV2(horoscope, { asOf });

    const manifestationSynthesis = result1.conclusionData?.wealthManifestationSynthesis;
    expect(manifestationSynthesis).toBeDefined();
    expect(manifestationSynthesis?.reasoningVersion).toBe('CW-04');
    expect(typeof manifestationSynthesis?.summary).toBe('string');
    expect(manifestationSynthesis?.summary.length).toBeGreaterThan(0);

    const dims = manifestationSynthesis?.dimensions;
    expect(dims).toBeDefined();
    expect(dims).toHaveProperty('ACCUMULATION');
    expect(dims).toHaveProperty('GAINS');
    expect(dims).toHaveProperty('FORTUNE');
    expect(dims).toHaveProperty('SPECULATION');

    // Pin deterministic per-dimension statuses for canonical chart at asOf date
    expect(dims?.ACCUMULATION.status).toBe('SUPPORTED');
    expect(dims?.GAINS.status).toBe('SUPPORTED');
    expect(dims?.FORTUNE.status).toBe('SUPPORTED');
    expect(dims?.SPECULATION.status).toBe('SUPPORTED');

    const dimensions: ('ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION')[] = [
      'ACCUMULATION',
      'GAINS',
      'FORTUNE',
      'SPECULATION'
    ];

    for (const dim of dimensions) {
      const syn = dims![dim];
      expect(syn).toBeDefined();
      expect(syn.dimension).toBe(dim);
      expect(syn.reasoningVersion).toBe('CW-04');
      expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'MIXED', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(syn.status);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(syn.confidence);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.natalSupport);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.dashaSupport);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.transitSupport);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.d2Support);
      expect(typeof syn.summary).toBe('string');

      for (const factor of syn.factors) {
        expect(factor.dimension).toBe(dim);
        expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(factor.direction);
        expect(['NATAL', 'DASHA', 'TRANSIT', 'D2']).toContain(factor.source);
        expect(typeof factor.statement).toBe('string');
      }
    }

    // Strict determinism verification
    expect(result1.conclusionData?.wealthManifestationSynthesis).toEqual(
      result2.conclusionData?.wealthManifestationSynthesis
    );
  });

  // End-to-end CW-05 Wealth Final Synthesis Pipeline Test
  it('CW-05 end-to-end pipeline: produces deterministic wealth final synthesis with multi-axis dimensions, riskProfile, and provenance', () => {
    const asOf = '2024-06-15T12:00:00.000Z';
    const result1 = interpretWealthV2(horoscope, { asOf });
    const result2 = interpretWealthV2(horoscope, { asOf });

    const finalSynthesis = result1.conclusionData?.wealthFinalSynthesis;
    expect(finalSynthesis).toBeDefined();
    expect(finalSynthesis?.domain).toBe('WEALTH');
    expect(finalSynthesis?.reasoningVersion).toBe('CW-05');
    expect(typeof finalSynthesis?.summary).toBe('string');
    expect(finalSynthesis?.summary.length).toBeGreaterThan(0);

    // Verify all 6 axes on overall synthesis
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.promiseStatus);
    expect(['SUPPORT', 'CHALLENGE', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.activationStatus);
    expect(['SUPPORT', 'CHALLENGE', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.timingStatus);
    expect(['CONFIRMS', 'CONFLICTS', 'UNAVAILABLE']).toContain(finalSynthesis?.divisionalStatus);
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.manifestationStatus);
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.finalStatus);

    // Verify backward compatibility aliases
    expect(finalSynthesis?.status).toBe(finalSynthesis?.finalStatus);
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK', 'VERY_WEAK', 'UNDETERMINED']).toContain(finalSynthesis?.primaryPromise);

    // Verify risk profile (driven by speculation, never diluting overall wealth status)
    expect(['LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.riskProfile);

    // Verify all 4 dimensions
    expect(finalSynthesis?.dimensions).toBeDefined();
    const dimensions: ('ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION')[] = [
      'ACCUMULATION',
      'GAINS',
      'FORTUNE',
      'SPECULATION'
    ];

    for (const dim of dimensions) {
      const dimSyn = finalSynthesis?.dimensions?.[dim];
      expect(dimSyn).toBeDefined();
      expect(dimSyn?.dimension).toBe(dim);
      expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(dimSyn?.status);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(dimSyn?.confidence);
      expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(dimSyn?.promiseStatus);
      expect(['SUPPORT', 'CHALLENGE', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA']).toContain(dimSyn?.activationStatus);
      expect(['SUPPORT', 'CHALLENGE', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA']).toContain(dimSyn?.timingStatus);
      expect(['CONFIRMS', 'CONFLICTS', 'UNAVAILABLE']).toContain(dimSyn?.divisionalStatus);
      expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(dimSyn?.manifestationStatus);
      expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(dimSyn?.finalStatus);
      expect(typeof dimSyn?.summary).toBe('string');
    }

    // Verify structured lists and metadata
    expect(Array.isArray(finalSynthesis?.strongestAreas)).toBe(true);
    expect(Array.isArray(finalSynthesis?.challengedAreas)).toBe(true);
    expect(Array.isArray(finalSynthesis?.keySupport)).toBe(true);
    expect(Array.isArray(finalSynthesis?.keyChallenges)).toBe(true);
    expect(Array.isArray(finalSynthesis?.manifestationSummary)).toBe(true);

    // Verify provenance fields
    expect(Array.isArray(finalSynthesis?.natalEvidenceIds)).toBe(true);
    expect(Array.isArray(finalSynthesis?.natalRuleIds)).toBe(true);
    expect(Array.isArray(finalSynthesis?.d2Evidence)).toBe(true);
    expect(Array.isArray(finalSynthesis?.ruleIds)).toBe(true);
    expect(Array.isArray(finalSynthesis?.evidenceIds)).toBe(true);

    expect(finalSynthesis?.ruleIds).toContain('CW-05-WEALTH-SYNTHESIS');

    // Strict determinism
    expect(result1.conclusionData?.wealthFinalSynthesis).toEqual(
      result2.conclusionData?.wealthFinalSynthesis
    );
  });
});
