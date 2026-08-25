import { describe, expect, it } from 'vitest';
import { Planet } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  interpretCareerV2,
  resolveCareerConclusionStrength,
  calculateDomainStrength,
  classifyCareerEvidence,
  buildCareerEvidence,
  evaluateCareerTimingActivation,
  evaluateDashaEffect,
  evaluateTransitEffect,
  evaluateD10Relationship,
  calculateCareerDataCompleteness,
  buildCareerConclusionData,
  buildCareerHeadline,
  resolveCurrentActivation,
  resolveCurrentPressure,
  buildCareerDashaStatement,
  buildCareerTransitStatement,
  mapCareerSource,
  mapCareerPhase,
  type CareerConclusionData
} from './CareerDomainInterpreterV2';
import { CareerDomainInterpreter } from './CareerDomainInterpreter';
import {
  createDomainEvidence,
  createTransitTrigger,
  detectDomainConflicts,
  calculateEvidenceConfidence,
  projectDomainInterpretationForAi,
  interpretDomain,
  createDefaultDomainInterpreterRegistry,
  type DomainEvidence
} from '../interpretation';
import {
  buildGoldenCareerInterpretation,
  GOLDEN_CAREER_EVIDENCE
} from './career-v2-golden.fixture';
import {
  deriveCareerManifestations
} from './careerManifestations';
import type { CareerManifestationSynthesis } from './manifestation/careerManifestationSynthesisTypes';
import {
  linkCareerEvidence,
  resolveRelatedCareerPromiseEvidenceIds
} from './careerEvidenceLinker';
import {
  CareerEvidenceFamily,
  type ThemeInterpretationEvidence,
  type ThemeTransitEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';

describe('CareerDomainInterpreterV2', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  // 1. Core integration & legacy preservation
  it('preserves existing career conclusion and version V2', () => {
    const v2 = interpretCareerV2(horoscope);

    expect(v2.domain).toBe('CAREER');
    expect(v2.version).toBe('V2');
    expect(v2.conclusion.statement).toBeDefined();
    expect(v2.conclusion.statement.length).toBeGreaterThan(0);
    expect(v2.conclusionData).toBeDefined();
    expect(v2.generatedAt).toBeDefined();
  });

  // 2. Golden fixture test (§5, §36)
  it('correctly constructs and evaluates the Golden Career interpretation fixture', () => {
    const golden = buildGoldenCareerInterpretation();

    expect(golden.domain).toBe('CAREER');
    expect(golden.natalPromise.strength).toBe('VERY_STRONG');
    expect(golden.natalPromise.confidence).toBe('VERY_HIGH');
    expect(golden.vargaConfirmations[0].relationship).toBe('CONFIRMS');

    const d10Evidence = golden.evidence.filter((e) => e.source === 'D10');
    const natalPromiseIds = golden.natalPromise.evidenceIds;
    const computedD10Rel = evaluateD10Relationship([], undefined, d10Evidence, natalPromiseIds);
    expect(computedD10Rel).toBe('CONFIRMS');

    expect(golden.timingActivations).toBeDefined();
    expect(golden.timingActivations?.length).toBe(3);

    const md = golden.timingActivations?.find((t) => t.period === 'MD');
    const ad = golden.timingActivations?.find((t) => t.period === 'AD');
    const pd = golden.timingActivations?.find((t) => t.period === 'PD');

    expect(md?.effect).toBe('ACTIVATES');
    expect(md?.activatedPromiseEvidenceIds).toContain('GOLDEN_CAREER_10H_STRONG');

    expect(ad?.effect).toBe('PARTIALLY_ACTIVATES');
    expect(ad?.activatedPromiseEvidenceIds).toContain('GOLDEN_CAREER_10H_STRONG');

    expect(pd?.effect).toBe('INSUFFICIENT_DATA');

    expect(golden.transitTrigger.effect).toBe('CHALLENGE');
    expect(golden.transitTrigger.triggeredPromiseEvidenceIds).toContain('GOLDEN_CAREER_10H_STRONG');

    const manifestationModes = golden.manifestations.map((m) => m.mode);
    expect(manifestationModes).toContain('TECHNICAL_SPECIALIZATION');
    expect(manifestationModes).toContain('EMPLOYMENT');
    expect(manifestationModes).toContain('LEADERSHIP');

    expect(golden.conclusion.strength).toBe('VERY_STRONG');
    expect(golden.dataCompleteness?.primaryFactors).toBe('COMPLETE');
    expect(golden.dataCompleteness?.d10).toBe('AVAILABLE');
    expect(golden.dataCompleteness?.dasha).toBe('AVAILABLE');
    expect(golden.dataCompleteness?.transit).toBe('AVAILABLE');
  });

  // 3. Natal Promise calculation (§26.A)
  describe('Natal Promise calculation', () => {
    it('evaluates strong 10th factors as VERY_STRONG or STRONG', () => {
      const strongSupporting = [
        createDomainEvidence({
          id: '10H-STRONG',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house is exalted',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        }),
        createDomainEvidence({
          id: '10L-STRONG',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord is well placed',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        })
      ];
      const strength = calculateDomainStrength(strongSupporting, []);
      expect(strength).toBe('VERY_STRONG');
    });

    it('evaluates weak 10th factors as WEAK or VERY_WEAK', () => {
      const challenging = [
        createDomainEvidence({
          id: '10H-AFFLICTED',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house heavily afflicted',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 90
        })
      ];
      const strength = calculateDomainStrength([], challenging);
      expect(strength).toBe('VERY_WEAK');
    });

    it('evaluates strong support + strong challenge as MIXED', () => {
      const supporting = [
        createDomainEvidence({
          id: '10H-STRONG',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        })
      ];
      const challenging = [
        createDomainEvidence({
          id: '10L-DEBILITATED',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord debilitated',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 90
        })
      ];
      const strength = calculateDomainStrength(supporting, challenging);
      expect(strength).toBe('MIXED');
    });
  });

  // 4. Evidence hierarchy (§26.B)
  describe('Evidence Hierarchy', () => {
    it('classifies 10th house/lord as PRIMARY, 6th/2nd/11th as SECONDARY, aspects/dignities as MODIFIER, D10 as CONFIRMATION, Dasha as TIMING', () => {
      const evidence = [
        createDomainEvidence({
          id: 'E-10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        }),
        createDomainEvidence({
          id: 'E-6H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'SECONDARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '6th house',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 70
        }),
        createDomainEvidence({
          id: 'E-MOD',
          sourceType: 'PLANET',
          domain: 'CAREER',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Dignity modifier',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 60
        }),
        createDomainEvidence({
          id: 'E-D10',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 confirmation',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50
        }),
        createDomainEvidence({
          id: 'E-DASHA',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha timing',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30
        })
      ];

      const classified = classifyCareerEvidence(evidence);
      expect(classified.primary.map((e) => e.id)).toContain('E-10H');
      expect(classified.supporting.map((e) => e.id)).toContain('E-6H');
      expect(classified.modifiers.map((e) => e.id)).toContain('E-MOD');
    });

    it('ensures unlinked D10 confirmation ends with empty relatedEvidenceIds', () => {
      const unlinkedD10 = [
        createDomainEvidence({
          id: 'D10-UNLINKED',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 unlinked status',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: []
        }),
        createDomainEvidence({
          id: 'PRIMARY-10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        })
      ];

      const linked = linkCareerEvidence(unlinkedD10);
      const d10Result = linked.find((e) => e.id === 'D10-UNLINKED');
      expect(d10Result).toBeDefined();
      expect(d10Result?.relatedEvidenceIds).toEqual([]);
    });

    it('links D10 evidence only to explicit 10th house / 10th lord and never to unrelated PRIMARY evidence', () => {
      const rawEvidence: ThemeInterpretationEvidence<CareerEvidenceFamily>[] = [
        {
          id: 'RAW-10H',
          ruleId: 'CAREER_HOUSE_PROMISE_10H_001',
          evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '10th house strong'
        },
        {
          id: 'RAW-10L',
          ruleId: 'CAREER_LORD_PROMISE_10L_001',
          evidenceFamily: CareerEvidenceFamily.TENTH_LORD,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '10th lord strong'
        },
        {
          id: 'RAW-2H-PRIMARY',
          ruleId: 'CAREER_HOUSE_PROMISE_2H_001',
          evidenceFamily: CareerEvidenceFamily.SECOND_HOUSE,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '2nd house wealth accumulated'
        },
        {
          id: 'RAW-D10',
          ruleId: 'CAREER_D10_CONFIRMATION_001',
          evidenceFamily: CareerEvidenceFamily.D10,
          priority: 'CONFIRMATORY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: 'D10 confirmation',
          vargaEvidence: { varga: 'D10', relationship: 'CONFIRMS', statement: 'D10 confirms', effect: 'SUPPORT' }
        }
      ];

      const d10Item = rawEvidence.find((e) => e.id === 'RAW-D10')!;
      const relatedIds = resolveRelatedCareerPromiseEvidenceIds(d10Item, rawEvidence);
      expect(relatedIds).toContain('RAW-10H');
      expect(relatedIds).toContain('RAW-10L');
      expect(relatedIds).not.toContain('RAW-2H-PRIMARY');
      expect(relatedIds.length).toBe(2);

      // When mapped through buildCareerEvidence
      const domainEvidence = buildCareerEvidence(rawEvidence);
      const d10Domain = domainEvidence.find((e) => e.id === 'RAW-D10');
      expect(d10Domain?.relatedEvidenceIds).toEqual(['RAW-10H', 'RAW-10L']);
      expect(d10Domain?.relatedEvidenceIds).not.toContain('RAW-2H-PRIMARY');

      // When no 10H/10L is present
      const rawEvidenceNo10th: ThemeInterpretationEvidence<CareerEvidenceFamily>[] = [
        {
          id: 'RAW-2H-PRIMARY',
          ruleId: 'CAREER_HOUSE_PROMISE_2H_001',
          evidenceFamily: CareerEvidenceFamily.SECOND_HOUSE,
          priority: 'PRIMARY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: '2nd house wealth accumulated'
        },
        {
          id: 'RAW-D10',
          ruleId: 'CAREER_D10_CONFIRMATION_001',
          evidenceFamily: CareerEvidenceFamily.D10,
          priority: 'CONFIRMATORY',
          strength: 'STRONG',
          effect: 'SUPPORT',
          statement: 'D10 confirmation',
          vargaEvidence: { varga: 'D10', relationship: 'CONFIRMS', statement: 'D10 confirms', effect: 'SUPPORT' }
        }
      ];
      const d10ItemNo10th = rawEvidenceNo10th.find((e) => e.id === 'RAW-D10')!;
      const relatedIdsNo10th = resolveRelatedCareerPromiseEvidenceIds(d10ItemNo10th, rawEvidenceNo10th);
      expect(relatedIdsNo10th).toEqual([]);

      const domainEvidenceNo10th = buildCareerEvidence(rawEvidenceNo10th);
      const d10DomainNo10th = domainEvidenceNo10th.find((e) => e.id === 'RAW-D10');
      expect(d10DomainNo10th?.relatedEvidenceIds).toEqual([]);
    });
  });

  // 5. D10 evaluation matrix (§27)
  describe('D10 Varga relationship evaluation', () => {
    it('evaluates D10 CONFIRMS when supporting', () => {
      const rel = evaluateD10Relationship([], 'CONFIRMED');
      expect(rel).toBe('CONFIRMS');
    });

    it('evaluates D10 MODIFIES when mixed', () => {
      const d10Item: readonly DomainEvidence[] = [
        createDomainEvidence({
          id: 'D10-MOD',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 modifies role',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 50
        }),
        createDomainEvidence({
          id: 'D10-CHALL',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 challenge',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 50
        })
      ];
      const rel = evaluateD10Relationship([], undefined, d10Item);
      expect(rel).toBe('MODIFIES');
    });

    it('evaluates D10 CONFLICTS when challenging', () => {
      const rel = evaluateD10Relationship([], 'CONFLICTED');
      expect(rel).toBe('CONFLICTS');
    });

    it('evaluates D10 UNAVAILABLE when no D10 data exists', () => {
      const rel = evaluateD10Relationship([], 'NOT_APPLICABLE');
      expect(rel).toBe('UNAVAILABLE');
    });

    it('evaluates D10 CONFIRMS when linked to natal promise evidence ids', () => {
      const natalPromiseIds = ['PROMISE-10H', 'PROMISE-10L'];
      const linkedD10: readonly DomainEvidence[] = [
        createDomainEvidence({
          id: 'D10-SUPP',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 supports career',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: ['PROMISE-10H']
        })
      ];
      const rel = evaluateD10Relationship([], undefined, linkedD10, natalPromiseIds);
      expect(rel).toBe('CONFIRMS');
    });

    it('evaluates D10 UNAVAILABLE when D10 evidence has no intersecting links to natalPromiseEvidenceIds and no raw hints', () => {
      const natalPromiseIds = ['PROMISE-10H', 'PROMISE-10L'];
      const unlinkedD10: readonly DomainEvidence[] = [
        createDomainEvidence({
          id: 'D10-UNLINKED-SUPP',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 supports unrelated pattern',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: ['SOME-UNRELATED-ID']
        }),
        createDomainEvidence({
          id: 'D10-UNLINKED-CHALL',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 challenges unrelated pattern',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 50,
          relatedEvidenceIds: []
        })
      ];

      const rel = evaluateD10Relationship([], undefined, unlinkedD10, natalPromiseIds);
      expect(rel).toBe('UNAVAILABLE');
    });
  });

  // 6. Dasha timing activation MD / AD / PD & negative test (§28, §29)
  describe('Dasha timing activation & MD/AD/PD separation', () => {
    const natalPromiseIds = ['CAREER-NATAL-01', 'CAREER-NATAL-02'];

    it('evaluates MD ACTIVATES when Mahadasha supports and links to natal promise', () => {
      const dashaEvidence = [
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:MAHADASHA:SUN',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active MAHADASHA period lord Sun activates natal career factors',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01'],
          timing: { period: 'MD' }
        })
      ];

      const md = evaluateCareerTimingActivation('MD', dashaEvidence, natalPromiseIds);
      expect(md.period).toBe('MD');
      expect(md.effect).toBe('ACTIVATES');
      expect(md.activatedPromiseEvidenceIds).toEqual(['CAREER-NATAL-01']);
    });

    it('evaluates AD PARTIALLY_ACTIVATES when Antardasha has mixed polarity and links', () => {
      const dashaEvidence = [
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:ANTARDASHA:MARS',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active ANTARDASHA period lord Mars brings career drive',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01'],
          timing: { period: 'AD' }
        }),
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:ANTARDASHA:RAHU',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active ANTARDASHA period lord Rahu creates sudden changes',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01'],
          timing: { period: 'AD' }
        })
      ];

      const ad = evaluateCareerTimingActivation('AD', dashaEvidence, natalPromiseIds);
      expect(ad.period).toBe('AD');
      expect(ad.effect).toBe('PARTIALLY_ACTIVATES');
      expect(ad.activatedPromiseEvidenceIds).toEqual(['CAREER-NATAL-01']);
    });

    it('evaluates PD INSUFFICIENT_DATA when no PD timing evidence is present', () => {
      const dashaEvidence = [
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:MAHADASHA:SUN',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active MAHADASHA period lord Sun activates natal career factors',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01'],
          timing: { period: 'MD' }
        })
      ];

      const pd = evaluateCareerTimingActivation('PD', dashaEvidence, natalPromiseIds);
      expect(pd.period).toBe('PD');
      expect(pd.effect).toBe('INSUFFICIENT_DATA');
      expect(pd.activatedPromiseEvidenceIds).toEqual([]);
    });

    // MANDATORY NEGATIVE TEST (§29)
    it('produces activatedPromiseEvidenceIds = [] and effect = UNKNOWN when Dasha evidence has no linked natal evidence', () => {
      const unlinkedDashaEvidence = [
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:MAHADASHA:VENUS',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active MAHADASHA period lord Venus in 5th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: [], // No link to natal career promise!
          timing: { period: 'MD' }
        })
      ];

      const md = evaluateCareerTimingActivation('MD', unlinkedDashaEvidence, natalPromiseIds);
      expect(md.effect).toBe('UNKNOWN');
      expect(md.activatedPromiseEvidenceIds).toEqual([]);
      expect(md.activatedPromiseEvidenceIds).not.toContain(natalPromiseIds[0]);

      const generalDashaEffect = evaluateDashaEffect(unlinkedDashaEvidence, []);
      expect(generalDashaEffect).toBe('UNKNOWN');
    });
  });

  // 7. Transit trigger matrix & negative test (§30)
  describe('Transit trigger evaluation', () => {
    const natalPromiseIds = ['CAREER-NATAL-01'];

    it('evaluates TRIGGER when transit supports and links to natal promise', () => {
      const transitEvidence = [
        createDomainEvidence({
          id: 'TRANSIT-JUPITER',
          sourceType: 'TRANSIT',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Jupiter transit 10th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01']
        })
      ];

      const effect = evaluateTransitEffect(transitEvidence, ['CAREER-NATAL-01']);
      expect(effect).toBe('TRIGGER');
    });

    it('evaluates CHALLENGE when transit challenges and links to natal promise', () => {
      const transitEvidence = [
        createDomainEvidence({
          id: 'TRANSIT-SATURN',
          sourceType: 'TRANSIT',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Saturn transit 10th house delays',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01']
        })
      ];

      const effect = evaluateTransitEffect(transitEvidence, ['CAREER-NATAL-01']);
      expect(effect).toBe('CHALLENGE');
    });

    it('returns UNKNOWN / NO_MATERIAL_TRIGGER when transit has no linked natal evidence', () => {
      const unlinkedTransit = [
        createDomainEvidence({
          id: 'TRANSIT-MARS',
          sourceType: 'TRANSIT',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Mars transit 8th house',
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

  // 8. Conflict tiers and natal promise preservation (§32)
  describe('Conflict tiers & Natal Promise preservation', () => {
    it('detects all conflict tiers and preserves strong natal promise through transit pressure', () => {
      const evidence = [
        createDomainEvidence({
          id: 'P1',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 95
        }),
        createDomainEvidence({
          id: 'P2',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house exalted occupant',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        }),
        createDomainEvidence({
          id: 'V1',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 challenge',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 70,
          relatedEvidenceIds: ['P1']
        }),
        createDomainEvidence({
          id: 'T1',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha 8th lord challenge',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['P1']
        }),
        createDomainEvidence({
          id: 'TR1',
          sourceType: 'TRANSIT',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Transit pressure',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['P1']
        })
      ];

      const conflicts = detectDomainConflicts('CAREER', evidence);
      const tiers = conflicts.map((c) => c.tier);

      expect(tiers).toContain('PRIMARY_VS_VARGA');
      expect(tiers).toContain('PRIMARY_VS_TIMING');
      expect(tiers).toContain('PRIMARY_VS_TRANSIT');

      // Natal strength calculated solely from natal evidence remains VERY_STRONG
      const natalSupporting = evidence.filter((e) => e.phase === 'NATAL_PROMISE' && e.polarity === 'SUPPORTING');
      const natalStrength = calculateDomainStrength(natalSupporting, []);
      expect(natalStrength).toBe('VERY_STRONG');

      // D10 downgrade test: VERY_STRONG -> STRONG
      const withVarga = resolveCareerConclusionStrength(natalStrength, 'CONFLICTS', conflicts);
      expect(withVarga).toBe('STRONG');

      // Transit only conflict preserves strong natal promise
      const transitOnlyConflicts = conflicts.filter((c) => c.tier === 'PRIMARY_VS_TRANSIT');
      const withTransitOnly = resolveCareerConclusionStrength('STRONG', 'CONFIRMS', transitOnlyConflicts);
      expect(withTransitOnly).toBe('STRONG');
    });
  });

  // 9. Confidence rules (§33)
  describe('Confidence evaluation rules', () => {
    it('single weak primary evidence does not yield HIGH', () => {
      const weakPrimary = [
        createDomainEvidence({
          id: 'WEAK-10L',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord placed in weak house',
          polarity: 'SUPPORTING',
          strength: 'WEAK',
          priority: 90
        })
      ];
      const confidence = calculateEvidenceConfidence(weakPrimary);
      expect(confidence).toBe('LOW');
      expect(confidence).not.toBe('HIGH');
      expect(confidence).not.toBe('VERY_HIGH');
    });

    it('multiple strong primary factors with D10 confirmation yields HIGH or VERY_HIGH', () => {
      const strongPrimary = [
        createDomainEvidence({
          id: 'STRONG-10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house strong',
          polarity: 'SUPPORTING',
          strength: 'VERY_STRONG',
          priority: 95
        }),
        createDomainEvidence({
          id: 'STRONG-10L',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord exalted',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90
        }),
        createDomainEvidence({
          id: 'SUPPORT-6H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'SECONDARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '6th house support',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 70
        })
      ];
      const confidence = calculateEvidenceConfidence(strongPrimary, {
        dataCompleteness: 'COMPLETE',
        hasVargaConflict: false,
        hasPrimaryChallenge: false
      });
      expect(['HIGH', 'VERY_HIGH']).toContain(confidence);
    });

    it('missing data or varga conflict reduces confidence', () => {
      const evidence = [
        createDomainEvidence({
          id: 'STRONG-10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house strong',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 95
        })
      ];
      const confInsufficient = calculateEvidenceConfidence(evidence, {
        dataCompleteness: 'INSUFFICIENT'
      });
      expect(confInsufficient).toBe('LOW');

      const confVargaConflict = calculateEvidenceConfidence(evidence, {
        hasVargaConflict: true
      });
      expect(confVargaConflict).toBe('LOW');
    });
  });

  // 10. Manifestation determinism (§31)
  describe('Manifestation determinism', () => {
    it('derives technical specialization from structured Mercury/Mars evidence', () => {
      const techEvidence = [
        createDomainEvidence({
          id: 'MERCURY_RULE',
          sourceType: 'PLANET',
          domain: 'CAREER',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Mercury karaka for analytical intellect connects to career',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 60,
          ruleId: 'CAREER_MERCURY_RELEVANCE_001'
        })
      ];
      const manifestations = deriveCareerManifestations(techEvidence);
      const tech = manifestations.find((m) => m.mode === 'TECHNICAL_SPECIALIZATION');
      expect(tech).toBeDefined();
      expect(tech?.evidenceIds).toContain('MERCURY_RULE');
    });

    it('derives employment from structured 6th house / service evidence', () => {
      const serviceEvidence = [
        createDomainEvidence({
          id: '6H_SERVICE',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'SECONDARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '6th house indicates daily service and structured employment',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 70,
          ruleId: 'CAREER_6H_SERVICE_001'
        })
      ];
      const manifestations = deriveCareerManifestations(serviceEvidence);
      const emp = manifestations.find((m) => m.mode === 'EMPLOYMENT');
      expect(emp).toBeDefined();
      expect(emp?.evidenceIds).toContain('6H_SERVICE');
    });

    it('does not infer EMPLOYMENT simply from an unrelated Saturn rule', () => {
      const unrelatedSaturn = [
        createDomainEvidence({
          id: 'UNRELATED_SATURN',
          sourceType: 'PLANET',
          domain: 'CAREER',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Saturn placed in 12th house isolated',
          polarity: 'NEUTRAL',
          strength: 'WEAK',
          priority: 30,
          ruleId: 'LONGEVITY_SATURN_001' // Not a career service rule!
        })
      ];
      const manifestations = deriveCareerManifestations(unrelatedSaturn);
      const emp = manifestations.find((m) => m.mode === 'EMPLOYMENT');
      expect(emp?.evidenceIds).not.toContain('UNRELATED_SATURN');
    });

    it('does not produce TECHNICAL_SPECIALIZATION or EMPLOYMENT from challenging Mercury or Saturn rules', () => {
      const challengingRules = [
        createDomainEvidence({
          id: 'CHALLENGING_MERCURY',
          sourceType: 'PLANET',
          domain: 'CAREER',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Mercury afflicted in 8th house causing cognitive disorientation',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 60,
          ruleId: 'CAREER_MERCURY_RELEVANCE_001'
        }),
        createDomainEvidence({
          id: 'CHALLENGING_SATURN',
          sourceType: 'PLANET',
          domain: 'CAREER',
          role: 'MODIFIER',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Saturn debilitated causing labor exhaustion',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 60,
          ruleId: 'CAREER_6H_SERVICE_001'
        })
      ];

      const manifestations = deriveCareerManifestations(challengingRules);
      const tech = manifestations.find((m) => m.mode === 'TECHNICAL_SPECIALIZATION');
      const emp = manifestations.find((m) => m.mode === 'EMPLOYMENT');

      expect(tech?.evidenceIds).not.toContain('CHALLENGING_MERCURY');
      expect(emp?.evidenceIds).not.toContain('CHALLENGING_SATURN');
    });

    it('does not produce LEADERSHIP from generic PRIMARY evidence without leadership family or rule', () => {
      const nonLeadershipPrimary = [
        createDomainEvidence({
          id: 'PRIMARY_2H_WEALTH',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '2nd house financial accumulation support',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          ruleId: 'CAREER_HOUSE_PROMISE_2H_001'
        })
      ];

      const manifestations = deriveCareerManifestations(nonLeadershipPrimary);
      const lead = manifestations.find((m) => m.mode === 'LEADERSHIP');
      expect(lead).toBeDefined();
      expect(lead?.evidenceIds).toEqual([]);
      expect(lead?.confidence).toBe('LOW');

      // Conversely, explicit leadership rule / family produces LEADERSHIP
      const explicitLeadership = [
        createDomainEvidence({
          id: 'LEADERSHIP_10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house executive leadership authority',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          ruleId: 'CAREER_10H_STRONG_001'
        })
      ];
      const manifestationsExplicit = deriveCareerManifestations(explicitLeadership);
      const leadExplicit = manifestationsExplicit.find((m) => m.mode === 'LEADERSHIP');
      expect(leadExplicit).toBeDefined();
      expect(leadExplicit?.evidenceIds).toContain('LEADERSHIP_10H');
      expect(leadExplicit?.confidence).toBe('HIGH');
    });
  });

  // 11. Data completeness (§18)
  describe('Data completeness', () => {
    it('accurately reports COMPLETE when 10th house, 10th lord, D10, Dasha, Transit are present', () => {
      const evidence = [
        createDomainEvidence({
          id: '10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          ruleId: 'CAREER_10H_STRONG_001'
        }),
        createDomainEvidence({
          id: '10L',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          ruleId: 'CAREER_10L_DIGNITY_001'
        }),
        createDomainEvidence({
          id: 'D10',
          sourceType: 'VARGA',
          domain: 'CAREER',
          role: 'CONFIRMATION',
          phase: 'VARGA_CONFIRMATION',
          source: 'D10',
          statement: 'D10 confirmation',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          ruleId: 'CAREER_D10_CONFIRMATION_001'
        }),
        createDomainEvidence({
          id: 'DASHA',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Dasha timing',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          ruleId: 'CAREER_DASHA_TIMING_001'
        }),
        createDomainEvidence({
          id: 'TRANSIT',
          sourceType: 'TRANSIT',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Transit timing',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 30,
          ruleId: 'CAREER_TRANSIT_SATURN'
        })
      ];

      const completeness = calculateCareerDataCompleteness(evidence);
      expect(completeness.primaryFactors).toBe('COMPLETE');
      expect(completeness.d10).toBe('AVAILABLE');
      expect(completeness.dasha).toBe('AVAILABLE');
      expect(completeness.transit).toBe('AVAILABLE');
    });

    it('reports PARTIAL / UNAVAILABLE when factors are missing', () => {
      const partialEvidence = [
        createDomainEvidence({
          id: '10H',
          sourceType: 'HOUSE',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          ruleId: 'CAREER_10H_STRONG_001'
        })
      ];

      const completeness = calculateCareerDataCompleteness(partialEvidence);
      expect(completeness.primaryFactors).toBe('PARTIAL');
      expect(completeness.d10).toBe('UNAVAILABLE');
      expect(completeness.dasha).toBe('UNAVAILABLE');
      expect(completeness.transit).toBe('UNAVAILABLE');
    });
  });

  // 12. Full Traceability Invariant (§34)
  describe('Evidence Traceability Invariant', () => {
    it('guarantees every evidence ID referenced anywhere in the interpretation exists in result.evidence', () => {
      const v2 = interpretCareerV2(horoscope);
      const allEvidenceIds = new Set(v2.evidence.map((e) => e.id));

      // 1. Conclusion supporting IDs
      for (const id of v2.conclusion.supportingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // 2. Conclusion challenging IDs
      for (const id of v2.conclusion.challengingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // 3. Conclusion primary IDs
      for (const id of v2.conclusion.primaryEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // 4. Natal promise evidence IDs
      for (const id of v2.natalPromise.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.natalPromise.supportingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.natalPromise.challengingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // 5. Dasha evidence IDs & activated IDs
      for (const id of v2.dashaActivation.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.dashaActivation.activatedPromiseEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // 6. Transit evidence IDs & triggered IDs
      for (const id of v2.transitTrigger.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.transitTrigger.triggeredPromiseEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }

      // 7. Varga confirmation evidence IDs
      for (const varga of v2.vargaConfirmations) {
        for (const id of varga.evidenceIds) {
          expect(allEvidenceIds.has(id)).toBe(true);
        }
      }

      // 8. Manifestation evidence IDs
      for (const manifestation of v2.manifestations) {
        for (const id of manifestation.evidenceIds) {
          expect(allEvidenceIds.has(id)).toBe(true);
        }
      }

      // 9. Conflict evidence IDs
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

  // 13. AI Projection (§24, §35)
  describe('AI Projection', () => {
    it('projects domain interpretation cleanly for AI without raw horoscope and without unknown evidence IDs', () => {
      const v2 = interpretCareerV2(horoscope);
      const projection = projectDomainInterpretationForAi(v2);

      expect(projection.domain).toBe('CAREER');
      expect(projection.natalPromise).toBeDefined();
      expect(projection.natalPromise.strength).toBe(v2.natalPromise.strength);
      expect(projection.dashaActivation).toBeDefined();
      expect(projection.transitTrigger).toBeDefined();
      expect(projection.conclusion).toBeDefined();
      expect(projection.vargaConfirmations.length).toBeGreaterThan(0);
      expect(projection.manifestations.length).toBeGreaterThan(0);

      // Verify no raw horoscope properties leaked into AI projection
      const projRecord = projection as unknown as Record<string, unknown>;
      expect(projRecord.horoscope).toBeUndefined();
      expect(projRecord.planetFacts).toBeUndefined();
      expect(projRecord.rasiChart).toBeUndefined();

      // Verify all evidence IDs in projection are known and valid
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

  // 14. Career Timing & Transit statement generation (P1-8)
  describe('Career timing and transit statement generation', () => {
    const dummyEvidence = [
      createDomainEvidence({
        id: 'DUMMY-EVID',
        sourceType: 'DASHA',
        domain: 'CAREER',
        role: 'TIMING',
        phase: 'DASHA_ACTIVATION',
        source: 'DASHA',
        statement: 'Dasha timing effect',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 30
      })
    ];

    it('generates Dasha statements consistent with each computed effect and never falsely claims active support on UNKNOWN', () => {
      expect(buildCareerDashaStatement(dummyEvidence, 'ACTIVATES')).toContain('actively supports');
      expect(buildCareerDashaStatement(dummyEvidence, 'PARTIALLY_ACTIVATES')).toContain('mixed support');
      expect(buildCareerDashaStatement(dummyEvidence, 'CHALLENGES')).toContain('challenging timing');
      expect(buildCareerDashaStatement(dummyEvidence, 'DOES_NOT_ACTIVATE')).toContain('no active support');
      expect(buildCareerDashaStatement(dummyEvidence, 'UNKNOWN')).toContain('could not be established');
      expect(buildCareerDashaStatement(dummyEvidence, 'UNKNOWN')).not.toContain('actively supports');
    });

    it('generates Transit statements consistent with each computed effect', () => {
      const transitDummy = [
        createDomainEvidence({
          id: 'DUMMY-TRANSIT',
          sourceType: 'TRANSIT',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'TRANSIT_TRIGGER',
          source: 'TRANSIT',
          statement: 'Transit trigger effect',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30
        })
      ];

      expect(buildCareerTransitStatement(transitDummy, 'TRIGGER')).toContain('stimulating career');
      expect(buildCareerTransitStatement(transitDummy, 'MODIFIER')).toContain('modifying influence');
      expect(buildCareerTransitStatement(transitDummy, 'CHALLENGE')).toContain('transit pressure');
      expect(buildCareerTransitStatement(transitDummy, 'NO_MATERIAL_TRIGGER')).toContain('No material transit trigger');
      expect(buildCareerTransitStatement(transitDummy, 'UNKNOWN')).toContain('could not be confirmed');
    });
  });

  // 15. Explicit Transit Source Mapping (P1-9)
  describe('Explicit transit source mapping', () => {
    it('maps transit evidence items to source TRANSIT and phase TRANSIT_TRIGGER', () => {
      const transitRawItem: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        id: 'CAREER_TRANSIT_JUPITER_10H',
        ruleId: 'CAREER_TRANSIT_TRIGGER_10H',
        evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
        priority: 'TIMING',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: 'Jupiter transit stimulates 10th house',
        transitEvidence: {
          planet: Planet.JUPITER,
          house: 10,
          effect: 'SUPPORT',
          relevanceReason: 'Jupiter transiting 10th house'
        }
      };

      expect(mapCareerSource(transitRawItem)).toBe('TRANSIT');
      expect(mapCareerPhase(transitRawItem)).toBe('TRANSIT_TRIGGER');
    });

    it('correctly maps structured transitEvidence without relying on ruleId/id naming conventions', () => {
      const customTransitItem: ThemeInterpretationEvidence<CareerEvidenceFamily> = {
        id: 'CUSTOM_JUPITER_INFLUENCE_001',
        ruleId: 'CUSTOM_RULE_001',
        evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
        priority: 'TIMING',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: 'Planetary transit influence active',
        transitEvidence: {
          planet: Planet.JUPITER,
          house: 10,
          effect: 'SUPPORT',
          relevanceReason: 'Transit triggers career'
        }
      };

      expect(mapCareerSource(customTransitItem)).toBe('TRANSIT');
      expect(mapCareerPhase(customTransitItem)).toBe('TRANSIT_TRIGGER');
    });
  });

  // 16. Structured CareerConclusionData & Traceability (P1-6 & P1-7)
  describe('Structured CareerConclusionData and evidence traceability', () => {
    it('constructs structured CareerConclusionData and preserves strict evidence traceability', () => {
      const v2 = interpretCareerV2(horoscope);
      expect(v2.conclusionData).toBeDefined();

      const cd: CareerConclusionData = v2.conclusionData as CareerConclusionData;
      expect(cd.natalStatus).toBe(v2.natalPromise.strength);
      expect(['ACTIVE', 'PARTIALLY_ACTIVE', 'INACTIVE', 'UNKNOWN']).toContain(cd.currentActivation);
      expect(['LOW', 'MODERATE', 'HIGH', 'UNKNOWN']).toContain(cd.currentPressure);
      expect(['CONFIRMS', 'CONFLICTS', 'MODIFIES', 'PARTIALLY_CONFIRMS', 'UNAVAILABLE']).toContain(cd.d10Relationship);
      expect(cd.headline).toBeDefined();
      expect(typeof cd.headline).toBe('string');
      expect(cd.headline.length).toBeGreaterThan(10);

      // Verify all evidence IDs in conclusionData exist in result.evidence
      const allEvidenceIds = new Set(v2.evidence.map((e) => e.id));
      for (const id of cd.supportingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of cd.challengingEvidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
    });

    it('resolves currentActivation and currentPressure correctly under various conditions', () => {
      expect(resolveCurrentActivation([])).toBe('UNKNOWN');
      expect(
        resolveCurrentActivation([
          { period: 'MD', effect: 'ACTIVATES', activatedPromiseEvidenceIds: [], evidenceIds: [], statement: '' }
        ])
      ).toBe('ACTIVE');
      expect(
        resolveCurrentActivation([
          { period: 'MD', effect: 'PARTIALLY_ACTIVATES', activatedPromiseEvidenceIds: [], evidenceIds: [], statement: '' }
        ])
      ).toBe('PARTIALLY_ACTIVE');
      expect(
        resolveCurrentActivation([
          { period: 'MD', effect: 'DOES_NOT_ACTIVATE', activatedPromiseEvidenceIds: [], evidenceIds: [], statement: '' }
        ])
      ).toBe('INACTIVE');

      expect(resolveCurrentPressure(undefined, [])).toBe('LOW');
      expect(
        resolveCurrentPressure(
          createTransitTrigger({
            domain: 'CAREER',
            active: true,
            effect: 'CHALLENGE',
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: '',
            evidenceIds: [],
            triggeredPromiseEvidenceIds: []
          }),
          []
        )
      ).toBe('MODERATE');
      expect(
        resolveCurrentPressure(
          createTransitTrigger({
            domain: 'CAREER',
            active: true,
            effect: 'TRIGGER',
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: '',
            evidenceIds: [],
            triggeredPromiseEvidenceIds: []
          }),
          []
        )
      ).toBe('LOW');
    });
  });

  // 17. DomainInterpreter service & registry integration
  it('implements DomainInterpreter and works via registry service', () => {
    const interpreter = new CareerDomainInterpreter();
    expect(interpreter.domain).toBe('CAREER');

    const result = interpreter.interpret(horoscope);
    expect(result.domain).toBe('CAREER');

    const registry = createDefaultDomainInterpreterRegistry();
    expect(registry.has('CAREER')).toBe(true);

    const serviceResult = interpretDomain({
      horoscope,
      domain: 'CAREER',
      registry
    });
    expect(serviceResult.domain).toBe('CAREER');
    expect(serviceResult.conclusion).toBeDefined();
  });

  // 18. End-to-end CW-04 Career Manifestation Pipeline Test
  it('CW-04 end-to-end pipeline: produces deterministic career manifestation synthesis with explicit asOf date', () => {
    const asOf = '2024-06-15T12:00:00.000Z';
    const result1 = interpretCareerV2(horoscope, { asOf });
    const result2 = interpretCareerV2(horoscope, { asOf });

    // Verify presence and reasoning version
    const manifestations = result1.conclusionData?.careerManifestationSynthesis;
    expect(manifestations).toBeDefined();
    expect(Array.isArray(manifestations)).toBe(true);
    expect(manifestations?.length).toBe(7);

    // Verify canonical modes
    const typedManifestations: readonly CareerManifestationSynthesis[] | undefined = (result1.conclusionData as CareerConclusionData)?.careerManifestationSynthesis;
    expect(typedManifestations).toBeDefined();
    const modes = typedManifestations?.map((m: CareerManifestationSynthesis) => m.mode);
    expect(modes).toEqual([
      'LEADERSHIP',
      'MANAGEMENT',
      'TECHNICAL_SPECIALIZATION',
      'SERVICE_EMPLOYMENT',
      'AUTHORITY',
      'INDEPENDENT_WORK',
      'BUSINESS_ENTREPRENEURSHIP'
    ]);

    // Pin deterministic per-mode statuses for canonical chart at asOf date
    const byMode = Object.fromEntries(
      (typedManifestations ?? []).map((m: CareerManifestationSynthesis) => [m.mode, m])
    );
    expect(typedManifestations).toHaveLength(7);
    expect(byMode).toHaveProperty('LEADERSHIP');
    expect(byMode).toHaveProperty('MANAGEMENT');
    expect(byMode).toHaveProperty('TECHNICAL_SPECIALIZATION');
    expect(byMode).toHaveProperty('SERVICE_EMPLOYMENT');
    expect(byMode).toHaveProperty('AUTHORITY');
    expect(byMode).toHaveProperty('INDEPENDENT_WORK');
    expect(byMode).toHaveProperty('BUSINESS_ENTREPRENEURSHIP');
    expect(byMode.LEADERSHIP.status).toBe('STRONGLY_SUPPORTED');
    expect(byMode.MANAGEMENT.status).toBe('STRONGLY_SUPPORTED');
    expect(byMode.TECHNICAL_SPECIALIZATION.status).toBe('STRONGLY_SUPPORTED');
    expect(byMode.SERVICE_EMPLOYMENT.status).toBe('STRONGLY_SUPPORTED');
    expect(byMode.AUTHORITY.status).toBe('STRONGLY_SUPPORTED');
    expect(byMode.INDEPENDENT_WORK.status).toBe('STRONGLY_SUPPORTED');
    expect(byMode.BUSINESS_ENTREPRENEURSHIP.status).toBe('MIXED');

    // Verify structure and contracts for each mode
    for (const syn of manifestations ?? []) {
      expect(syn.reasoningVersion).toBe('CW-04');
      expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'MIXED', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(syn.status);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(syn.confidence);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.natalSupport);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.dashaSupport);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.transitSupport);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(syn.d10Support);
      expect(typeof syn.summary).toBe('string');
      expect(syn.summary.length).toBeGreaterThan(0);

      // Verify factors
      for (const factor of syn.factors) {
        expect(factor.mode).toBe(syn.mode);
        expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL']).toContain(factor.direction);
        expect(['NATAL', 'DASHA', 'TRANSIT', 'D10']).toContain(factor.source);
        expect(typeof factor.statement).toBe('string');
      }
    }

    // Verify strict determinism
    expect(result1.conclusionData?.careerManifestationSynthesis).toEqual(
      result2.conclusionData?.careerManifestationSynthesis
    );
  });

  // End-to-end CW-05 Career Final Synthesis Pipeline Test
  it('CW-05 end-to-end pipeline: produces deterministic career final synthesis with multi-axis evaluation and provenance', () => {
    const asOf = '2024-06-15T12:00:00.000Z';
    const result1 = interpretCareerV2(horoscope, { asOf });
    const result2 = interpretCareerV2(horoscope, { asOf });

    const finalSynthesis = result1.conclusionData?.careerFinalSynthesis;
    expect(finalSynthesis).toBeDefined();
    expect(finalSynthesis?.domain).toBe('CAREER');
    expect(finalSynthesis?.reasoningVersion).toBe('CW-05');
    expect(typeof finalSynthesis?.summary).toBe('string');
    expect(finalSynthesis?.summary.length).toBeGreaterThan(0);

    // Verify all 6 axes are populated
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.promiseStatus);
    expect(['SUPPORT', 'CHALLENGE', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.activationStatus);
    expect(['SUPPORT', 'CHALLENGE', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.timingStatus);
    expect(['CONFIRMS', 'PARTIALLY_CONFIRMS', 'MODIFIES', 'CONFLICTS', 'UNAVAILABLE']).toContain(finalSynthesis?.divisionalStatus);
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.manifestationStatus);
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'CHALLENGED', 'INSUFFICIENT_DATA']).toContain(finalSynthesis?.finalStatus);

    // Verify backward compatibility aliases
    expect(finalSynthesis?.status).toBe(finalSynthesis?.finalStatus);
    expect(['VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK', 'VERY_WEAK', 'UNDETERMINED']).toContain(finalSynthesis?.primaryPromise);

    // Verify structured lists and metadata
    expect(Array.isArray(finalSynthesis?.strongestAreas)).toBe(true);
    expect(Array.isArray(finalSynthesis?.challengedAreas)).toBe(true);
    expect(Array.isArray(finalSynthesis?.keySupport)).toBe(true);
    expect(Array.isArray(finalSynthesis?.keyChallenges)).toBe(true);
    expect(Array.isArray(finalSynthesis?.manifestationSummary)).toBe(true);

    // Verify provenance fields
    expect(Array.isArray(finalSynthesis?.natalEvidenceIds)).toBe(true);
    expect(Array.isArray(finalSynthesis?.natalRuleIds)).toBe(true);
    expect(Array.isArray(finalSynthesis?.dashaFactors)).toBe(true);
    expect(Array.isArray(finalSynthesis?.timingFactors)).toBe(true);
    expect(Array.isArray(finalSynthesis?.manifestationFactors)).toBe(true);
    expect(Array.isArray(finalSynthesis?.d10Evidence)).toBe(true);
    expect(Array.isArray(finalSynthesis?.ruleIds)).toBe(true);
    expect(Array.isArray(finalSynthesis?.evidenceIds)).toBe(true);

    expect(finalSynthesis?.ruleIds).toContain('CW-05-CAREER-SYNTHESIS');

    // Strict determinism
    expect(result1.conclusionData?.careerFinalSynthesis).toEqual(
      result2.conclusionData?.careerFinalSynthesis
    );
  });
});
