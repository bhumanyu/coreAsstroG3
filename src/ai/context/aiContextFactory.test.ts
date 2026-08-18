import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet } from '../../types';
import { AI_CONTEXT_SCHEMA_VERSION } from '../types/aiTypes';
import { buildAiContext } from './aiContextFactory';
import { createAiRequest } from '../api/createAiRequest';

describe('AI Context Factory', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = buildAiContext(horoscope);

  it('should include correct schema version and source engine metadata', () => {
    expect(context.schemaVersion).toBe(AI_CONTEXT_SCHEMA_VERSION);
    expect(context.schemaVersion).toBe('1.0.0');
    expect(context.source).toEqual({
      engine: 'CORE_ASTRO',
      deterministic: true,
      astrologySystem: 'VEDIC'
    });
  });

  it('should include canonical methodology configuration', () => {
    expect(context.methodology).toEqual({
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      houseSystem: 'WHOLE_SIGN',
      dashaSystem: 'VIMSHOTTARI',
      aspectSystem: 'PARASHARI'
    });
  });

  it('should project ascendant sign matching rasiChart.ascendantSign', () => {
    expect(context.ascendant.sign).toBe(horoscope.rasiChart.ascendantSign);
    expect(context.ascendant.lord).toBeDefined();
  });

  it('should project exactly 9 planets in standard Vedic sequence', () => {
    expect(context.planets).toHaveLength(9);
    expect(context.planets.map((p) => p.planet)).toEqual([
      Planet.SUN,
      Planet.MOON,
      Planet.MARS,
      Planet.MERCURY,
      Planet.JUPITER,
      Planet.VENUS,
      Planet.SATURN,
      Planet.RAHU,
      Planet.KETU
    ]);
  });

  it('should project exactly 12 house summaries', () => {
    expect(context.houses).toHaveLength(12);
    for (let h = 1; h <= 12; h++) {
      const houseFact = context.houses.find((hf) => hf.house === h);
      expect(houseFact).toBeDefined();
      expect(houseFact?.sign).toBeDefined();
      expect(houseFact?.lord).toBeDefined();
      expect(Array.isArray(houseFact?.occupants)).toBe(true);
      expect(Array.isArray(houseFact?.aspectingPlanets)).toBe(true);
    }
  });

  it('should project exactly 12 life theme facts', () => {
    expect(context.lifeThemes).toHaveLength(12);
    for (const theme of context.lifeThemes) {
      expect(typeof theme.theme).toBe('string');
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL', 'MIXED', 'UNKNOWN']).toContain(theme.effect);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(theme.confidence);
      expect(typeof theme.evidenceCount).toBe('number');
    }
  });

  it('should project career and wealth facts with valid status and factors', () => {
    expect(context.career).toBeDefined();
    expect(context.career?.status).toBeDefined();
    expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'NEUTRAL', 'MIXED', 'CHALLENGED', 'LIMITED_EVIDENCE']).toContain(
      context.career?.status
    );
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(context.career?.confidence);
    expect(Array.isArray(context.career?.supportingFactors)).toBe(true);
    expect(Array.isArray(context.career?.challengingFactors)).toBe(true);
    expect(['STRONG', 'SUPPORTED', 'MIXED', 'ADVERSE', 'UNAVAILABLE']).toContain(
      context.career?.natalPromise
    );
    expect(['CONFIRMS', 'PARTIALLY_CONFIRMS', 'MODIFIES', 'CONFLICTS', 'UNAVAILABLE']).toContain(
      context.career?.d10Relationship
    );
    expect(context.career?.natalPromise).toBe(
      horoscope.themeInterpretationV2?.career?.careerNatalPromise.status
    );
    expect(context.career?.d10Relationship).toBe(
      horoscope.themeInterpretationV2?.career?.metadata.vargaConfirmationStatus
    );

    expect(context.wealth).toBeDefined();
    expect(context.wealth?.status).toBeDefined();
    expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'NEUTRAL', 'MIXED', 'CHALLENGED', 'LIMITED_EVIDENCE']).toContain(
      context.wealth?.status
    );
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(context.wealth?.confidence);
    expect(Array.isArray(context.wealth?.supportingFactors)).toBe(true);
    expect(Array.isArray(context.wealth?.challengingFactors)).toBe(true);
    expect(context.wealth?.status).toBe(
      horoscope.themeInterpretationV2?.wealth?.conclusion.status
    );
    expect(context.wealth?.subthemes).toBeDefined();
    expect(context.wealth?.subthemes).toHaveLength(4);
    const subthemeNames = context.wealth?.subthemes?.map((st) => st.subtheme);
    expect(subthemeNames).toEqual(['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION']);
    for (const subtheme of context.wealth?.subthemes || []) {
      expect(['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION']).toContain(subtheme.subtheme);
      expect(typeof subtheme.house).toBe('number');
      expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'NEUTRAL', 'MIXED', 'CHALLENGED', 'LIMITED_EVIDENCE']).toContain(
        subtheme.status
      );
      expect(typeof subtheme.primaryFamily).toBe('string');
      expect(typeof subtheme.supportingCount).toBe('number');
      expect(typeof subtheme.challengingCount).toBe('number');
      expect(typeof subtheme.summary).toBe('string');
    }

    const accumSubtheme = context.wealth?.subthemes?.find((st) => st.subtheme === 'ACCUMULATION');
    expect(accumSubtheme?.house).toBe(
      horoscope.themeInterpretationV2?.wealth?.subthemes?.ACCUMULATION?.houseNumber
    );
    const gainsSubtheme = context.wealth?.subthemes?.find((st) => st.subtheme === 'GAINS');
    expect(gainsSubtheme?.house).toBe(
      horoscope.themeInterpretationV2?.wealth?.subthemes?.GAINS?.houseNumber
    );
    const fortuneSubtheme = context.wealth?.subthemes?.find((st) => st.subtheme === 'FORTUNE');
    expect(fortuneSubtheme?.house).toBe(
      horoscope.themeInterpretationV2?.wealth?.subthemes?.FORTUNE?.houseNumber
    );
    const specSubtheme = context.wealth?.subthemes?.find((st) => st.subtheme === 'SPECULATION');
    expect(specSubtheme?.house).toBe(
      horoscope.themeInterpretationV2?.wealth?.subthemes?.SPECULATION?.houseNumber
    );
  });

  it('should project divisional facts for D9 and D10', () => {
    expect(context.divisional.d9).toBeDefined();
    expect(context.divisional.d9.status).toBe('AVAILABLE');
    expect(context.divisional.d10).toBeDefined();
    expect(context.divisional.d10.status).toBe('AVAILABLE');
    expect(context.divisional.d2).toBeUndefined();
  });

  it('should project vimshottari dasha facts with periods', () => {
    expect(context.dasha.system).toBe('VIMSHOTTARI');
    expect(context.dasha.periods.length).toBeGreaterThan(0);
  });

  it('should project active dasha periods when available from engine', () => {
    const horoscopeWithActive = {
      ...horoscope,
      dashaInterpretation: {
        ...horoscope.dashaInterpretation,
        current: {
          mahadasha: { planet: Planet.MARS },
          antardasha: { planet: Planet.JUPITER },
          pratyantardasha: { planet: Planet.SATURN }
        }
      }
    } as any;
    const activeContext = buildAiContext(horoscopeWithActive);
    expect(activeContext.dasha.active).toBeDefined();
    expect(activeContext.dasha.active?.mahadasha).toBe(Planet.MARS);
    expect(activeContext.dasha.active?.antardasha).toBe(Planet.JUPITER);
    expect(activeContext.dasha.active?.pratyantardasha).toBe(Planet.SATURN);
  });

  it('should project career and wealth evidence items with matching engine IDs and enriched metadata', () => {
    const careerEvidence = horoscope.themeInterpretationV2?.career?.evidence || [];
    const wealthEvidence = horoscope.themeInterpretationV2?.wealth?.evidence || [];

    expect(careerEvidence.length).toBeGreaterThan(0);
    expect(wealthEvidence.length).toBeGreaterThan(0);

    const contextEvidenceIds = new Set(context.evidence.map((e) => e.id));

    // Verify all career engine evidence IDs appear in context.evidence
    for (const cEv of careerEvidence) {
      expect(contextEvidenceIds.has(cEv.id)).toBe(true);
      const projected = context.evidence.find((e) => e.id === cEv.id);
      expect(projected).toBeDefined();
      expect(projected?.statement).toBe(cEv.statement);
      if (projected?.priority !== undefined) {
        expect(['PRIMARY', 'SECONDARY', 'CONFIRMATORY', 'TIMING']).toContain(projected.priority);
      }
      if (projected?.dimension !== undefined) {
        expect(['NATAL_STRUCTURE', 'MODIFIER', 'CONFIRMATION', 'TIMING']).toContain(projected.dimension);
      }
      if (projected?.varga !== undefined) {
        expect(['D9', 'D10']).toContain(projected.varga);
      }
      if (projected?.dashaLevel !== undefined) {
        expect(['MAHADASHA', 'ANTARDASHA', 'PRATYANTARDASHA']).toContain(projected.dashaLevel);
      }
    }

    // Verify all wealth engine evidence IDs appear in context.evidence
    for (const wEv of wealthEvidence) {
      expect(contextEvidenceIds.has(wEv.id)).toBe(true);
      const projected = context.evidence.find((e) => e.id === wEv.id);
      expect(projected).toBeDefined();
      expect(projected?.statement).toBe(wEv.statement);
    }
  });

  it('should throw an error on conflicting evidence ID with different payload', () => {
    const horoscopeWithConflict = {
      ...horoscope,
      themeInterpretationV2: {
        ...horoscope.themeInterpretationV2,
        career: {
          ...horoscope.themeInterpretationV2?.career,
          evidence: [
            {
              id: 'test-conflict-id',
              ruleId: 'RULE_A',
              evidenceFamily: 'TENTH_HOUSE',
              priority: 'PRIMARY',
              strength: 'STRONG',
              effect: 'SUPPORT',
              statement: 'Statement A'
            },
            {
              id: 'test-conflict-id',
              ruleId: 'RULE_B',
              evidenceFamily: 'SIXTH_HOUSE',
              priority: 'SECONDARY',
              strength: 'WEAK',
              effect: 'CHALLENGE',
              statement: 'Statement B (Conflicting)'
            }
          ]
        }
      }
    } as any;

    expect(() => buildAiContext(horoscopeWithConflict)).toThrowError(
      /Cannot build AiContext: conflicting evidence id test-conflict-id/
    );
  });

  it('should deduplicate identical evidence items silently', () => {
    const identicalItem = {
      id: 'test-identical-id',
      ruleId: 'RULE_A',
      evidenceFamily: 'TENTH_HOUSE',
      priority: 'PRIMARY',
      strength: 'STRONG',
      effect: 'SUPPORT',
      statement: 'Statement A'
    };
    const horoscopeWithDuplicates = {
      ...horoscope,
      themeInterpretationV2: {
        ...horoscope.themeInterpretationV2,
        career: {
          ...horoscope.themeInterpretationV2?.career,
          evidence: [identicalItem, identicalItem]
        }
      }
    } as any;

    const ctx = buildAiContext(horoscopeWithDuplicates);
    const matches = ctx.evidence.filter((e) => e.id === 'test-identical-id');
    expect(matches).toHaveLength(1);
  });

  it('should project evidence items with normalized sources, effects, and strengths without fabricated certainty', () => {
    expect(context.evidence).toBeDefined();
    for (const ev of context.evidence) {
      expect([
        'PLANET',
        'HOUSE',
        'YOGA',
        'FUNCTIONAL_ROLE',
        'STRENGTH',
        'DASHA',
        'D9',
        'D10',
        'CAREER',
        'WEALTH',
        'LIFE_THEME',
        'ASPECT',
        'D2',
        'TRANSIT',
        'UNKNOWN'
      ]).toContain(ev.source);
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL', 'MIXED', 'UNKNOWN']).toContain(ev.effect);
      expect(['STRONG', 'MODERATE', 'WEAK', 'UNKNOWN']).toContain(ev.strength);
    }
  });

  it('should project timing evidence with dashaLevel and timingPlanet', () => {
    const careerEvidence = horoscope.themeInterpretationV2?.career?.evidence || [];
    const dashaEvidence = careerEvidence.find((e) => e.timingEvidence);
    if (dashaEvidence && dashaEvidence.timingEvidence) {
      const projected = context.evidence.find((e) => e.id === dashaEvidence.id);
      expect(projected).toBeDefined();
      expect(projected?.dashaLevel).toBe(dashaEvidence.timingEvidence.dashaLevel);
      expect(projected?.timingPlanet).toBe(dashaEvidence.timingEvidence.planet);
    }

    // Also test explicitly with simulated timing evidence
    const simulatedTimingHoroscope = {
      ...horoscope,
      themeInterpretationV2: {
        ...horoscope.themeInterpretationV2,
        career: {
          ...horoscope.themeInterpretationV2?.career,
          evidence: [
            {
              id: 'test-timing-id',
              ruleId: 'RULE_TIMING_TEST',
              evidenceFamily: 'DASHA',
              priority: 'TIMING',
              strength: 'STRONG',
              effect: 'SUPPORT',
              statement: 'Timing test statement',
              timingEvidence: {
                dashaLevel: 'MAHADASHA',
                planet: Planet.JUPITER,
                relevanceReason: 'Career timing lord',
                houses: [10]
              }
            }
          ]
        }
      }
    } as any;
    const simContext = buildAiContext(simulatedTimingHoroscope);
    const simProjected = simContext.evidence.find((e) => e.id === 'test-timing-id');
    expect(simProjected).toBeDefined();
    expect(simProjected?.dashaLevel).toBe('MAHADASHA');
    expect(simProjected?.timingPlanet).toBe(Planet.JUPITER);
  });

  it('should project planet facts without synthetic NORMAL fallbacks when fact properties are missing', () => {
    for (const planetFact of context.planets) {
      if (planetFact.dignity !== undefined) {
        expect(typeof planetFact.dignity).toBe('string');
      }
      if (planetFact.state !== undefined) {
        expect(typeof planetFact.state).toBe('string');
      }
    }
  });

  it('should be a pure, deterministic factory producing equal output for identical input', () => {
    const context2 = buildAiContext(horoscope);
    expect(context).toEqual(context2);
  });

  it('should create an immutable AI request with createAiRequest helper', () => {
    const customId = 'test-request-123';
    const request = createAiRequest('CAREER_ANALYSIS', context, 'STRUCTURED', customId);

    expect(request.requestId).toBe(customId);
    expect(request.schemaVersion).toBe('1.0.0');
    expect(request.task).toBe('CAREER_ANALYSIS');
    expect(request.context).toBe(context);
    expect(request.responseFormat).toBe('STRUCTURED');
    expect(Object.isFrozen(request)).toBe(true);
  });
});
