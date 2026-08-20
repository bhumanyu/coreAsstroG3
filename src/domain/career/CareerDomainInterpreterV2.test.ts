import { describe, expect, it } from 'vitest';
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
  calculateCareerDataCompleteness
} from './CareerDomainInterpreterV2';
import { CareerDomainInterpreter } from './CareerDomainInterpreter';
import { interpretDomain } from '../interpretation/DomainInterpretationService';
import { createDefaultDomainInterpreterRegistry } from '../interpretation/createDefaultDomainInterpreterRegistry';
import {
  createDomainEvidence,
  detectDomainConflicts,
  calculateEvidenceConfidence,
  projectDomainInterpretationForAi
} from '../interpretation';
import {
  buildGoldenCareerInterpretation,
  GOLDEN_CAREER_EVIDENCE
} from './career-v2-golden.fixture';
import { deriveCareerManifestations } from './careerManifestations';

describe('CareerDomainInterpreterV2', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  // 1. Core integration & legacy preservation
  it('preserves existing career conclusion and version V2', () => {
    const legacy = interpretCareerTheme(horoscope);
    const v2 = interpretCareerV2(horoscope);

    expect(v2.domain).toBe('CAREER');
    expect(v2.version).toBe('V2');
    expect(v2.conclusion.statement).toContain(legacy.conclusion.summary);
    expect(v2.generatedAt).toBeDefined();
  });

  // 2. Golden fixture test (§5, §36)
  it('correctly constructs and evaluates the Golden Career interpretation fixture', () => {
    const golden = buildGoldenCareerInterpretation();

    expect(golden.domain).toBe('CAREER');
    expect(golden.natalPromise.strength).toBe('VERY_STRONG');
    expect(golden.natalPromise.confidence).toBe('VERY_HIGH');
    expect(golden.vargaConfirmations[0].relationship).toBe('CONFIRMS');

    expect(golden.timingActivations).toBeDefined();
    expect(golden.timingActivations?.length).toBe(3);

    const md = golden.timingActivations?.find((t) => t.period === 'MD');
    const ad = golden.timingActivations?.find((t) => t.period === 'AD');
    const pd = golden.timingActivations?.find((t) => t.period === 'PD');

    expect(md?.effect).toBe('ACTIVATES');
    expect(md?.activatedPromiseEvidenceIds).toContain('GOLDEN_CAREER_10H_STRONG');

    expect(ad?.effect).toBe('PARTIALLY_ACTIVATES');
    expect(ad?.activatedPromiseEvidenceIds).toContain('GOLDEN_CAREER_10H_STRONG');

    expect(pd?.effect).toBe('DOES_NOT_ACTIVATE');

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
  });

  // 5. D10 evaluation matrix (§27)
  describe('D10 Varga relationship evaluation', () => {
    it('evaluates D10 CONFIRMS when supporting', () => {
      const rel = evaluateD10Relationship([], 'CONFIRMED');
      expect(rel).toBe('CONFIRMS');
    });

    it('evaluates D10 MODIFIES when mixed', () => {
      const d10Item: any = [
        createDomainEvidence({
          id: 'D10-MOD',
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
  });

  // 6. Dasha timing activation MD / AD / PD & negative test (§28, §29)
  describe('Dasha timing activation & MD/AD/PD separation', () => {
    const natalPromiseIds = ['CAREER-NATAL-01', 'CAREER-NATAL-02'];

    it('evaluates MD ACTIVATES when Mahadasha supports and links to natal promise', () => {
      const dashaEvidence = [
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:MAHADASHA:SUN',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active MAHADASHA period lord Sun activates natal career factors',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01']
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
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active ANTARDASHA period lord Mars brings career drive',
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01']
        }),
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:ANTARDASHA:RAHU',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active ANTARDASHA period lord Rahu creates sudden changes',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: ['CAREER-NATAL-01']
        })
      ];

      const ad = evaluateCareerTimingActivation('AD', dashaEvidence, natalPromiseIds);
      expect(ad.period).toBe('AD');
      expect(ad.effect).toBe('PARTIALLY_ACTIVATES');
      expect(ad.activatedPromiseEvidenceIds).toEqual(['CAREER-NATAL-01']);
    });

    // MANDATORY NEGATIVE TEST (§29)
    it('produces activatedPromiseEvidenceIds = [] and effect = UNKNOWN when Dasha evidence has no linked natal evidence', () => {
      const unlinkedDashaEvidence = [
        createDomainEvidence({
          id: 'CAREER_DASHA_TIMING_001:MAHADASHA:VENUS',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Active MAHADASHA period lord Venus in 5th house',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: [] // No link to natal career promise!
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
  });

  // 11. Data completeness (§18)
  describe('Data completeness', () => {
    it('accurately reports COMPLETE when 10th house, 10th lord, D10, Dasha, Transit are present', () => {
      const evidence = [
        createDomainEvidence({
          id: '10H',
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
      expect((projection as any).horoscope).toBeUndefined();
      expect((projection as any).planetFacts).toBeUndefined();
      expect((projection as any).rasiChart).toBeUndefined();

      // Verify all evidence IDs in projection are known and valid
      const allEvidenceIds = new Set(v2.evidence.map((e) => e.id));
      for (const id of projection.evidenceIds) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
    });
  });

  // 14. DomainInterpreter service & registry integration
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
});
