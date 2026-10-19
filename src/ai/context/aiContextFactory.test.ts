import { describe, it, expect, vi } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet } from '../../types';
import { AI_CONTEXT_SCHEMA_VERSION } from '../types/aiTypes';
import {
  buildAiContext,
  buildEvidenceFromDomainInterpretations,
  projectDomainEvidenceToAi,
  projectDashaEvidenceToAi,
  buildDashaEvidence
} from './aiContextFactory';
import {
  DomainInterpretation,
  createDomainInterpretation,
  createDomainEvidence,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createDomainConclusion,
  mapPeriodToCanonicalEvidenceIds
} from '../../domain/interpretation';
import { createAiRequest } from '../api/createAiRequest';
import { YogaType, YogaCategory, YogaStrength, YogaStrengthLevel } from '../../engine/yoga/yogaTypes';
import {
  analyzeDashaInterpretation,
  analyzeActiveDasha
} from '../../engine/dashaInterpretation/dashaInterpretation';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { mapMethodology } from '../../product/analysis/productAnalysisMapper';
import type { DomainReasoningOptions } from '../../domain/reasoning/reasoningTypes';

describe('AI Context Factory', () => {
  const horoscope = calculateHoroscope(
    CANONICAL_BIRTH_DETAILS,
    undefined,
    CANONICAL_BIRTH_DETAILS.dateTimeStr
  );

  function makeDomainOptions(asOf?: string): DomainReasoningOptions {
    const context = createAnalysisContext({
      asOf: asOf || CANONICAL_BIRTH_DETAILS.dateTimeStr,
      methodology: mapMethodology(CANONICAL_BIRTH_DETAILS)
    });
    const temporalState = resolveAnalysisTemporalState(horoscope, context);
    return { context, temporalState };
  }

  const analysisContext = createAnalysisContext({
    asOf: CANONICAL_BIRTH_DETAILS.dateTimeStr,
    methodology: mapMethodology(CANONICAL_BIRTH_DETAILS)
  });
  const temporalState = resolveAnalysisTemporalState(horoscope, analysisContext);
  const career = interpretCareerV2(horoscope, { context: analysisContext, temporalState });
  const wealth = interpretWealthV2(horoscope, { context: analysisContext, temporalState });
  const context = buildAiContext(horoscope, {
    domainInterpretations: [career, wealth],
    temporalState
  });

  it('should include correct schema version and source engine metadata', () => {
    expect(context.schemaVersion).toBe(AI_CONTEXT_SCHEMA_VERSION);
    expect(context.schemaVersion).toBe('1.1.0');
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

  it('should project yoga assessment status and strength from engine output', () => {
    for (const yoga of horoscope.yogas?.yogas || []) {
      const projected = context.yogas.find(
        (y) => y.type === String(yoga.type)
      );

      expect(projected).toBeDefined();

      const expectedStatus =
        yoga.assessment?.finalStatus ||
        yoga.finalStatus ||
        'UNKNOWN';

      expect(projected?.status).toBe(expectedStatus);

      if (yoga.assessment?.strength) {
        expect(projected?.strength).toBe(
          yoga.assessment.strength
        );
      }
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

  it('should project active dasha periods when available from temporalState and omit when absent', () => {
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
    const activeContext = buildAiContext(horoscopeWithActive, {
      temporalState: {
        dashaInterpretation: horoscopeWithActive.dashaInterpretation
      } as any
    });
    expect(activeContext.dasha.active).toBeDefined();
    expect(activeContext.dasha.active?.mahadasha).toBe(Planet.MARS);
    expect(activeContext.dasha.active?.antardasha).toBe(Planet.JUPITER);
    expect(activeContext.dasha.active?.pratyantardasha).toBe(Planet.SATURN);

    // Legacy low-level caller without temporalState: omits active dasha, never falls back to embedded horoscope
    const legacyContext = buildAiContext(horoscopeWithActive);
    expect(legacyContext.dasha.active).toBeUndefined();
    expect(legacyContext.dasha.interpretation).toBeUndefined();
    expect(legacyContext.dasha.periods).toHaveLength(0);
  });

  it('should project career and wealth evidence items with matching engine IDs and enriched metadata', () => {
    const careerEvidence = horoscope.themeInterpretationV2?.career?.evidence || [];
    const wealthEvidence = horoscope.themeInterpretationV2?.wealth?.evidence || [];

    expect(careerEvidence.length).toBeGreaterThan(0);
    expect(wealthEvidence.length).toBeGreaterThan(0);

    const contextEvidenceIds = new Set(context.evidence.map((e) => e.id));

    // P2-11C Gate 5: Canonical evidence uses different ID namespace (CAREER_STRUCTURAL_*, CAREER_DASHA:*, etc.)
    // Verify that context.evidence is populated with canonical evidence
    expect(context.evidence.length).toBeGreaterThan(0);

    // Verify evidence has proper metadata structure
    const careerContextEvidence = context.evidence.filter(e => e.id.startsWith('CAREER_'));
    const wealthContextEvidence = context.evidence.filter(e => e.id.startsWith('WEALTH_'));

    expect(careerContextEvidence.length).toBeGreaterThan(0);
    expect(wealthContextEvidence.length).toBeGreaterThan(0);

    // Validate metadata fields on a sample of evidence
    const sampleCareer = careerContextEvidence[0];
    expect(sampleCareer).toBeDefined();
    expect(sampleCareer.statement).toBeTruthy();
    if (sampleCareer.priority !== undefined) {
      expect(['PRIMARY', 'SECONDARY', 'CONFIRMATORY', 'TIMING']).toContain(sampleCareer.priority);
    }
  });

  it('should expose hierarchy-level traceability signal (Finding 2)', () => {
    // Use the STAGE1 golden fixture or create a test case with known hierarchy
    // For now, remove vacuous guards and document that this test needs a fixture
    // that produces an AVAILABLE timing hierarchy
    if (context.career?.timing?.hierarchy) {
      expect(context.career.timing.hierarchy.traceability).toBeDefined();
      expect(['RESOLVED', 'DEGRADED']).toContain(context.career.timing.hierarchy.traceability);
    }

    if (context.wealth?.timing?.hierarchy) {
      expect(context.wealth.timing.hierarchy.traceability).toBeDefined();
      expect(['RESOLVED', 'DEGRADED']).toContain(context.wealth.timing.hierarchy.traceability);
    }
  });

  it('should expose RESOLVED hierarchy-level traceability when all periods have canonical evidence (Finding 2)', () => {
    // Construct a domain interpretation with career dasha synthesis that produces an AVAILABLE hierarchy
    // Using timingActivations (legacy path) which is simpler and doesn't require careerDashaSynthesis
    const careerWithTiming = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        // MD canonical evidence
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:MD_JUPITER',
            ruleId: 'CAREER_DASHA_TIMING_001',
            sourceType: 'DASHA',
            role: 'TIMING',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'Jupiter Mahadasha activates career timing'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: { level: 'MD', planet: Planet.JUPITER }
        } as any,
        // AD canonical evidence
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:AD_VENUS',
            ruleId: 'CAREER_DASHA_TIMING_001',
            sourceType: 'DASHA',
            role: 'TIMING',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'Venus Antardasha activates career timing'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: { level: 'AD', planet: Planet.VENUS }
        } as any,
        // PD canonical evidence
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:PD_MARS',
            ruleId: 'CAREER_DASHA_TIMING_001',
            sourceType: 'DASHA',
            role: 'TIMING',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'Mars Pratyantardasha activates career timing'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: { level: 'PD', planet: Planet.MARS }
        } as any
      ],
      timingActivations: [
        {
          period: 'MD',
          planet: Planet.JUPITER,
          effect: 'ACTIVATES',
          evidenceIds: ['CAREER_DASHA:MD_JUPITER']
        } as any,
        {
          period: 'AD',
          planet: Planet.VENUS,
          effect: 'ACTIVATES',
          evidenceIds: ['CAREER_DASHA:AD_VENUS']
        } as any,
        {
          period: 'PD',
          planet: Planet.MARS,
          effect: 'ACTIVATES',
          evidenceIds: ['CAREER_DASHA:PD_MARS']
        } as any
      ]
    });

    const ctxWithHierarchy = buildAiContext(horoscope, {
      domainInterpretations: [careerWithTiming]
    });

    // Assert hierarchy exists
    expect(ctxWithHierarchy.career?.timing?.hierarchy).toBeDefined();

    // Assert traceability is RESOLVED because all three periods have canonical evidence
    expect(ctxWithHierarchy.career!.timing!.hierarchy!.traceability).toBe('RESOLVED');
  });

  it('should expose DEGRADED hierarchy-level traceability when PD lacks canonical evidence (Finding 2)', () => {
    // Construct a domain interpretation where MD and AD have canonical evidence but PD does not
    const careerWithMixedEvidence = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        // MD canonical evidence
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:MD_JUPITER',
            ruleId: 'CAREER_DASHA_TIMING_001',
            sourceType: 'DASHA',
            role: 'TIMING',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'Jupiter Mahadasha activates career timing'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: { level: 'MD', planet: Planet.JUPITER }
        } as any,
        // AD canonical evidence
        {
          ...createDomainEvidence({
            id: 'CAREER_DASHA:AD_VENUS',
            ruleId: 'CAREER_DASHA_TIMING_001',
            sourceType: 'DASHA',
            role: 'TIMING',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'Venus Antardasha activates career timing'
          }),
          source: 'DASHA',
          phase: 'DASHA_ACTIVATION',
          timing: { level: 'AD', planet: Planet.VENUS }
        } as any
        // PD canonical evidence is intentionally missing to create DEGRADED traceability
      ],
      timingActivations: [
        {
          period: 'MD',
          planet: Planet.JUPITER,
          effect: 'ACTIVATES',
          evidenceIds: ['CAREER_DASHA:MD_JUPITER']
        } as any,
        {
          period: 'AD',
          planet: Planet.VENUS,
          effect: 'ACTIVATES',
          evidenceIds: ['CAREER_DASHA:AD_VENUS']
        } as any,
        {
          period: 'PD',
          planet: Planet.MARS,
          effect: 'ACTIVATES',
          evidenceIds: [] // No canonical evidence for PD
        } as any
      ]
    });

    const ctxWithMixedHierarchy = buildAiContext(horoscope, {
      domainInterpretations: [careerWithMixedEvidence]
    });

    // Assert hierarchy exists
    expect(ctxWithMixedHierarchy.career?.timing?.hierarchy).toBeDefined();

    // Assert traceability is DEGRADED because PD lacks canonical evidence
    expect(ctxWithMixedHierarchy.career!.timing!.hierarchy!.traceability).toBe('DEGRADED');
  });

  it('should throw an error on conflicting evidence ID with different payload', () => {
    const conflictingCareer = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: ['test-conflict-id'], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [
        createDomainEvidence({
          id: 'test-conflict-id',
          ruleId: 'RULE_A',
          sourceType: 'HOUSE',
          role: 'PRIMARY',
          strength: 'STRONG',
          polarity: 'SUPPORTING',
          statement: 'Statement A'
        }),
        createDomainEvidence({
          id: 'test-conflict-id',
          ruleId: 'RULE_B',
          sourceType: 'HOUSE',
          role: 'SECONDARY',
          strength: 'WEAK',
          polarity: 'CHALLENGING',
          statement: 'Statement B (Conflicting)'
        })
      ]
    });

    expect(() =>
      buildAiContext(horoscope, { domainInterpretations: [conflictingCareer] })
    ).toThrowError(/Cannot build AiContext: conflicting evidence id test-conflict-id/);
  });

  it('should deduplicate identical evidence items silently', () => {
    const identicalItem = createDomainEvidence({
      id: 'test-identical-id',
      ruleId: 'RULE_A',
      sourceType: 'HOUSE',
      role: 'PRIMARY',
      strength: 'STRONG',
      polarity: 'SUPPORTING',
      statement: 'Statement A'
    });
    const duplicateCareer = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: ['test-identical-id'], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test', confidence: 'HIGH' }),
      evidence: [identicalItem, identicalItem]
    });

    const ctx = buildAiContext(horoscope, { domainInterpretations: [duplicateCareer] });
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

  it('should project vargaEvidence relationship accurately from engine evidence', () => {
    const simulatedVargaCareer = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: ['test-varga-id'], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'D10 test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'test-varga-id',
            ruleId: 'RULE_VARGA_TEST',
            sourceType: 'VARGA',
            role: 'CONFIRMATION',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'D10 confirmation statement'
          }),
          varga: 'D10',
          vargaRelationship: 'CONFIRMS'
        } as any
      ]
    });

    const simContext = buildAiContext(horoscope, {
      domainInterpretations: [simulatedVargaCareer]
    });
    const simProjected = simContext.evidence.find((e) => e.id === 'test-varga-id');
    expect(simProjected).toBeDefined();
    expect(simProjected?.varga).toBe('D10');
    expect(simProjected?.vargaRelationship).toBe('CONFIRMS');
  });

  it('should project timing evidence with all timing fields accurately from engine evidence', () => {
    const simulatedTimingCareer = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: ['test-timing-id'], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Timing test', confidence: 'HIGH' }),
      evidence: [
        {
          ...createDomainEvidence({
            id: 'test-timing-id',
            ruleId: 'RULE_TIMING_TEST',
            sourceType: 'DASHA',
            role: 'TIMING',
            strength: 'STRONG',
            polarity: 'SUPPORTING',
            statement: 'Timing test statement'
          }),
          dashaLevel: 'MAHADASHA',
          timingPlanet: Planet.JUPITER,
          timingReason: 'Career timing lord',
          timingRelevanceType: 'CAREER_LORD',
          timingHouses: [10, 11]
        } as any
      ]
    });

    const simContext = buildAiContext(horoscope, {
      domainInterpretations: [simulatedTimingCareer]
    });
    const simProjected = simContext.evidence.find((e) => e.id === 'test-timing-id');
    expect(simProjected).toBeDefined();
    expect(simProjected?.dashaLevel).toBe('MAHADASHA');
    expect(simProjected?.timingPlanet).toBe(Planet.JUPITER);
    expect(simProjected?.timingReason).toBe('Career timing lord');
    expect(simProjected?.timingRelevanceType).toBe('CAREER_LORD');
    expect(simProjected?.timingHouses).toEqual([10, 11]);
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
    const context2 = buildAiContext(horoscope, {
      domainInterpretations: [career, wealth],
      temporalState
    });
    expect(context).toEqual(context2);
  });

  it('should create an immutable AI request with createAiRequest helper', () => {
    const customId = 'test-request-123';
    const request = createAiRequest('CAREER_ANALYSIS', context, 'STRUCTURED', customId);

    expect(request.requestId).toBe(customId);
    expect(request.schemaVersion).toBe('1.1.0');
    expect(request.task).toBe('CAREER_ANALYSIS');
    expect(request.context).toBe(context);
    expect(request.responseFormat).toBe('STRUCTURED');
    expect(Object.isFrozen(request)).toBe(true);
  });

  it('should fail fast when a mandatory planet fact is unavailable', () => {
    const brokenHoroscope = {
      ...horoscope,
      planetFacts: {
        ...horoscope.planetFacts,
        [Planet.MARS]: {
          ...horoscope.planetFacts?.[Planet.MARS],
          sign: undefined
        }
      }
    } as any;
    expect(() => buildAiContext(brokenHoroscope)).toThrow(/missing sign for/);
  });

  it('should fail fast when a mandatory planet house is unavailable', () => {
    const brokenHoroscope = {
      ...horoscope,
      planetFacts: {
        ...horoscope.planetFacts,
        [Planet.MARS]: {
          ...horoscope.planetFacts?.[Planet.MARS],
          house: undefined
        }
      }
    } as any;
    expect(() => buildAiContext(brokenHoroscope)).toThrow(/missing house for/);
  });

  it('should fail fast when a mandatory house lord is unavailable', () => {
    const brokenHoroscope = {
      ...horoscope,
      houseInterpretation: {
        ...horoscope.houseInterpretation,
        houses: {
          ...horoscope.houseInterpretation?.houses,
          2: {
            ...horoscope.houseInterpretation?.houses?.[2],
            lord: {
              ...horoscope.houseInterpretation?.houses?.[2]?.lord,
              planet: undefined
            }
          }
        }
      },
      houseAnalysis: {
        ...horoscope.houseAnalysis,
        houses: {
          ...horoscope.houseAnalysis?.houses,
          2: {
            ...horoscope.houseAnalysis?.houses?.[2],
            lord: undefined
          }
        }
      },
      houseLordship: {
        ...horoscope.houseLordship,
        houseLords: {
          ...horoscope.houseLordship?.houseLords,
          2: undefined
        }
      }
    } as any;
    expect(() => buildAiContext(brokenHoroscope)).toThrow(/missing lord for house/);
  });

  it('should project enriched domain interpretations for AI including vargas, conflicts, and manifestations', () => {
    const aiContext = buildAiContext(horoscope, {
      domainInterpretations: [career, wealth],
      temporalState
    });
    expect(aiContext.domainInterpretations).toBeDefined();
    expect(aiContext.domainInterpretations?.length).toBeGreaterThanOrEqual(2);

    const careerDomain = aiContext.domainInterpretations?.find((d) => d.domain === 'CAREER');
    expect(careerDomain).toBeDefined();
    expect(careerDomain?.natalPromise).toBeDefined();
    expect(careerDomain?.dashaActivation).toBeDefined();
    expect(careerDomain?.transitTrigger).toBeDefined();
    expect(careerDomain?.conclusion).toBeDefined();
    expect(careerDomain?.vargaConfirmations).toBeDefined();
    expect(careerDomain?.conflicts).toBeDefined();
    expect(careerDomain?.manifestations).toBeDefined();
    expect(careerDomain?.manifestations.length).toBeGreaterThan(0);

    const wealthDomain = aiContext.domainInterpretations?.find((d) => d.domain === 'WEALTH');
    expect(wealthDomain).toBeDefined();
    expect(wealthDomain?.manifestations.length).toBeGreaterThan(0);
  });

  it('should project DomainEvidence to AiEvidence preserving ID, polarity, strength, and source', () => {
    const domainEvidence = createDomainEvidence({
      id: 'CUSTOM_CAREER_EVID_1',
      sourceType: 'HOUSE',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      statement: '10th lord strong in kendra',
      ruleId: 'RULE_10L_KENDRA',
      planet: Planet.JUPITER,
      house: 10,
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE'
    });

    const aiEvidence = projectDomainEvidenceToAi(domainEvidence);
    expect(aiEvidence.id).toBe('CUSTOM_CAREER_EVID_1');
    expect(aiEvidence.source).toBe('HOUSE');
    expect(aiEvidence.effect).toBe('SUPPORT');
    expect(aiEvidence.strength).toBe('STRONG');
    expect(aiEvidence.statement).toBe('10th lord strong in kendra');
    expect(aiEvidence.ruleId).toBe('RULE_10L_KENDRA');
    expect(aiEvidence.identityKey).toBe('CW-CAREER-NATAL-D1-RULE_10L_KENDRA-JUPITER-HOUSE_10');
    expect(aiEvidence.priority).toBe('PRIMARY');
    expect(aiEvidence.dimension).toBe('NATAL_STRUCTURE');
  });

  it('should guarantee invariant: every context.domainInterpretations[].evidence[].id exists in context.evidence', () => {
    const aiContext = buildAiContext(horoscope);
    const contextEvidenceIds = new Set(aiContext.evidence.map((e) => e.id));

    expect(aiContext.domainInterpretations).toBeDefined();
    for (const domainInterp of aiContext.domainInterpretations!) {
      for (const ev of domainInterp.evidence) {
        expect(contextEvidenceIds.has(ev.id)).toBe(true);
      }
    }
  });

  it('should use precomputed domain interpretations when supplied (precomputed-wins test)', () => {
    const distinctiveId = 'DISTINCTIVE_PRECOMPUTED_EVIDENCE_999';
    const customCareer = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({
        strength: 'VERY_STRONG',
        supportingEvidenceIds: [distinctiveId],
        challengingEvidenceIds: []
      }),
      dashaActivation: createDashaActivation({
        effect: 'ACTIVATES',
        evidenceIds: []
      }),
      transitTrigger: createTransitTrigger({
        effect: 'TRIGGER',
        evidenceIds: []
      }),
      conclusion: createDomainConclusion({
        statement: 'Precomputed career interpretation statement.',
        confidence: 'HIGH'
      }),
      evidence: [
        createDomainEvidence({
          id: distinctiveId,
          sourceType: 'PLANET',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          statement: 'Precomputed distinctive planetary evidence'
        })
      ]
    });

    const aiContext = buildAiContext(horoscope, {
      domainInterpretations: [customCareer]
    });

    const foundInContext = aiContext.evidence.find((e) => e.id === distinctiveId);
    expect(foundInContext).toBeDefined();
    expect(foundInContext?.statement).toBe('Precomputed distinctive planetary evidence');
    expect(aiContext.domainInterpretations?.some((d) => d.domain === 'CAREER')).toBe(true);
  });

  it('should throw error when conflicting evidence with same ID but different contents is supplied', () => {
    const duplicateId = 'DUP_EVIDENCE_CONFLICT';
    const interp1 = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test 1', confidence: 'HIGH' }),
      evidence: [
        createDomainEvidence({
          id: duplicateId,
          sourceType: 'HOUSE',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          statement: 'Statement version A'
        })
      ]
    });

    const interp2 = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
      dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
      transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
      conclusion: createDomainConclusion({ statement: 'Test 2', confidence: 'HIGH' }),
      evidence: [
        createDomainEvidence({
          id: duplicateId,
          sourceType: 'HOUSE',
          polarity: 'CHALLENGING',
          strength: 'WEAK',
          statement: 'Statement version B'
        })
      ]
    });

    expect(() => buildEvidenceFromDomainInterpretations([interp1, interp2])).toThrow(
      /conflicting evidence id DUP_EVIDENCE_CONFLICT/
    );
  });

  describe('D04 Dasha Context & Evidence Projection', () => {
    it('should project rich dasha interpretation facts when active dasha interpretation is present', () => {
      expect(context.dasha.interpretation).toBeDefined();
      expect(context.dasha.interpretation?.status).toBe('AVAILABLE');

      const md = context.dasha.interpretation?.mahadasha;
      expect(md).toBeDefined();
      expect(md?.level).toBe('MAHADASHA');
      expect(md?.planet).toBeDefined();
      expect(md?.placement.house).toBeGreaterThanOrEqual(1);
      expect(md?.placement.sign).toBeDefined();
      expect(Array.isArray(md?.ownedHouses)).toBe(true);
      expect(Array.isArray(md?.functionalRoles)).toBe(true);
      expect(md?.strength).toBeDefined();
      expect(md?.confidence).toBeDefined();
      expect(Array.isArray(md?.evidenceIds)).toBe(true);

      const ad = context.dasha.interpretation?.antardasha;
      expect(ad).toBeDefined();
      expect(ad?.level).toBe('ANTARDASHA');
      expect(ad?.planet).toBeDefined();

      const pd = context.dasha.interpretation?.pratyantardasha;
      expect(pd).toBeDefined();
      expect(pd?.level).toBe('PRATYANTARDASHA');
      expect(pd?.planet).toBeDefined();

      const pair = context.dasha.interpretation?.pair;
      expect(pair).toBeDefined();
      expect(pair?.mahadashaLord).toBe(md?.planet);
      expect(pair?.antardashaLord).toBe(ad?.planet);
      expect(Array.isArray(pair?.sharedHouses)).toBe(true);
      expect(Array.isArray(pair?.combinedHouseSet)).toBe(true);
      expect(Array.isArray(pair?.relationshipEvidenceIds)).toBe(true);
    });

    it('should bind all dasha interpretation evidence into context.evidence and ensure resolution', () => {
      const contextEvidenceIds = new Set(context.evidence.map((e) => e.id));
      const interp = context.dasha.interpretation;
      expect(interp).toBeDefined();

      for (const evId of interp!.evidenceIds) {
        expect(contextEvidenceIds.has(evId)).toBe(true);
      }
      if (interp!.mahadasha) {
        for (const evId of interp!.mahadasha.evidenceIds) {
          expect(contextEvidenceIds.has(evId)).toBe(true);
        }
      }
      if (interp!.antardasha) {
        for (const evId of interp!.antardasha.evidenceIds) {
          expect(contextEvidenceIds.has(evId)).toBe(true);
        }
      }
      if (interp!.pratyantardasha) {
        for (const evId of interp!.pratyantardasha.evidenceIds) {
          expect(contextEvidenceIds.has(evId)).toBe(true);
        }
      }
      if (interp!.pair) {
        for (const evId of interp!.pair.relationshipEvidenceIds) {
          expect(contextEvidenceIds.has(evId)).toBe(true);
        }
      }
    });

    it('should synthesize deterministic evidence IDs identically for equal inputs and distinctly for different inputs', () => {
      const ev1 = {
        level: 'MAHADASHA' as const,
        ruleId: 'D-MD-01',
        statement: 'Jupiter in 9th house brings expansion',
        planets: [Planet.JUPITER],
        houses: [9],
        effect: 'SUPPORT' as const,
        type: 'HOUSE_PLACEMENT' as const,
        source: 'DASHA_MAHADASHA'
      };

      const ev1Duplicate = {
        level: 'MAHADASHA' as const,
        ruleId: 'D-MD-01',
        statement: 'Jupiter in 9th house brings expansion',
        planets: [Planet.JUPITER],
        houses: [9],
        effect: 'SUPPORT' as const,
        type: 'HOUSE_PLACEMENT' as const,
        source: 'DASHA_MAHADASHA'
      };

      const ev2Different = {
        level: 'ANTARDASHA' as const,
        ruleId: 'D-AD-01',
        statement: 'Saturn transit delay',
        planets: [Planet.SATURN],
        houses: [10],
        effect: 'CHALLENGE' as const,
        type: 'HOUSE_PLACEMENT' as const,
        source: 'DASHA_ANTARDASHA'
      };

      const projected1 = projectDashaEvidenceToAi(ev1);
      const projected1Dup = projectDashaEvidenceToAi(ev1Duplicate);
      const projected2 = projectDashaEvidenceToAi(ev2Different);

      expect(projected1.id).toBe(projected1Dup.id);
      expect(projected1.id).toBe('DASHA:MAHADASHA:D-MD-01:JUPITER:9:SUPPORT');
      expect(projected1.id).not.toBe(projected2.id);
      expect(projected1.source).toBe('DASHA');
      expect(projected1.priority).toBe('TIMING');
      expect(projected1.dimension).toBe('TIMING');
      expect(projected1.dashaLevel).toBe('MAHADASHA');
      expect(projected1.timingPlanet).toBe(Planet.JUPITER);
    });

    it('should handle gracefully missing periods without fabricating fallback data', () => {
      const partialHoroscope = {
        ...horoscope,
        dashaInterpretation: {
          status: 'AVAILABLE',
          at: '2026-08-22',
          confidence: 'HIGH',
          evidence: [],
          activePeriods: {
            mahadasha: {
              planet: Planet.SUN,
              level: 'MAHADASHA',
              start: '2020-01-01',
              end: '2026-01-01',
              natal: {
                planet: Planet.SUN,
                placement: { house: 1, sign: 'ARIES' },
                ownedHouses: [5],
                functionalRoles: ['TRIKONA_LORD'],
                evidence: []
              }
            }
            // antardasha and pratyantardasha are missing
          },
          current: {
            status: 'AVAILABLE',
            at: '2026-08-22',
            confidence: 'HIGH',
            evidence: [],
            mahadasha: {
              planet: Planet.SUN,
              level: 'MAHADASHA',
              start: '2020-01-01',
              end: '2026-01-01',
              natal: {
                planet: Planet.SUN,
                placement: { house: 1, sign: 'ARIES' },
                ownedHouses: [5],
                functionalRoles: ['TRIKONA_LORD'],
                evidence: []
              }
            }
            // antardasha, pratyantardasha, pairInterpretation omitted
          }
        }
      } as any;

      const partialContext = buildAiContext(partialHoroscope, {
        temporalState: {
          dashaInterpretation: partialHoroscope.dashaInterpretation
        } as any
      });
      expect(partialContext.dasha.interpretation).toBeDefined();
      expect(partialContext.dasha.interpretation?.mahadasha).toBeDefined();
      expect(partialContext.dasha.interpretation?.mahadasha?.planet).toBe(Planet.SUN);
      expect(partialContext.dasha.interpretation?.antardasha).toBeUndefined();
      expect(partialContext.dasha.interpretation?.pratyantardasha).toBeUndefined();
      expect(partialContext.dasha.interpretation?.pair).toBeUndefined();
    });

    it('never reinterprets factor direction or category when mapping CareerDashaSynthesisFactorFact', () => {
      const customCareerInterpretation = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
        dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
        transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
        conclusion: createDomainConclusion({ statement: 'Career active', confidence: 'HIGH' }),
        evidence: [
          createDomainEvidence({
            id: 'F_SUPPORT_1',
            sourceType: 'HOUSE',
            polarity: 'SUPPORTING',
            strength: 'STRONG',
            statement: 'Owns 10th house'
          }),
          createDomainEvidence({
            id: 'F_CHALLENGE_1',
            sourceType: 'PLANET',
            polarity: 'CHALLENGING',
            strength: 'MODERATE',
            statement: 'Malefic functional nature'
          })
        ],
        conclusionData: {
          careerDashaSynthesis: {
            md: {
              planet: Planet.SATURN,
              effect: 'SUPPORTS',
              factors: [
                {
                  id: 'F_SUPPORT_1',
                  period: 'MD',
                  planet: Planet.SATURN,
                  category: 'HOUSE_OWNERSHIP',
                  direction: 'SUPPORT',
                  weight: 2.5,
                  statement: 'Owns 10th house',
                  houses: [10]
                },
                {
                  id: 'F_CHALLENGE_1',
                  period: 'MD',
                  planet: Planet.SATURN,
                  category: 'FUNCTIONAL_NATURE',
                  direction: 'CHALLENGE',
                  weight: 0.5,
                  statement: 'Malefic functional nature',
                  houses: []
                }
              ]
            },
            ad: {
              planet: Planet.MERCURY,
              effect: 'NEUTRAL',
              factors: []
            },
            pd: {
              planet: Planet.VENUS,
              effect: 'NEUTRAL',
              factors: []
            },
            combined: {
              md: {
                planet: Planet.SATURN,
                effect: 'SUPPORTS',
                factors: [
                  {
                    id: 'F_SUPPORT_1',
                    period: 'MD',
                    planet: Planet.SATURN,
                    category: 'HOUSE_OWNERSHIP',
                    direction: 'SUPPORT',
                    weight: 2.5,
                    statement: 'Owns 10th house',
                    houses: [10]
                  },
                  {
                    id: 'F_CHALLENGE_1',
                    period: 'MD',
                    planet: Planet.SATURN,
                    category: 'FUNCTIONAL_NATURE',
                    direction: 'CHALLENGE',
                    weight: 0.5,
                    statement: 'Malefic functional nature',
                    houses: []
                  }
                ]
              },
              ad: {
                planet: Planet.MERCURY,
                effect: 'NEUTRAL',
                factors: []
              },
              pd: {
                planet: Planet.VENUS,
                effect: 'NEUTRAL',
                factors: []
              },
              hierarchy: {
                mdRole: 'PRIMARY_DRIVER',
                adRole: 'MODIFIER',
                pdRole: 'TRIGGER',
                combinedEffect: 'SUPPORTS'
              }
            },
            factors: [],
            summary: 'Career synthesis summary'
          }
        }
      });

      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [customCareerInterpretation]
      });

      const synFact = aiContext.career?.dashaSynthesis;
      expect(synFact).toBeDefined();
      expect(synFact?.md.factors).toHaveLength(2);

      const supportFactor = synFact?.md.factors.find((f) => f.id === 'F_SUPPORT_1');
      const challengeFactor = synFact?.md.factors.find((f) => f.id === 'F_CHALLENGE_1');

      expect(supportFactor?.direction).toBe('SUPPORT');
      expect(supportFactor?.category).toBe('HOUSE_OWNERSHIP');

      expect(challengeFactor?.direction).toBe('CHALLENGE');
      expect(challengeFactor?.category).toBe('FUNCTIONAL_NATURE');
    });

    it('should map Career CW-04 manifestationSynthesis with full fidelity as passthrough', () => {
      const customCareerInterpretation: DomainInterpretation = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({
          strength: 'STRONG',
          statement: 'Natal promise is strong.'
        }),
        dashaActivation: createDashaActivation({
          effect: 'ACTIVATES',
          statement: 'Sun activates 10th house.'
        }),
        transitTrigger: createTransitTrigger({
          effect: 'TRIGGER',
          statement: 'Jupiter triggers career growth.'
        }),
        vargaConfirmations: [
          {
            varga: 'D10',
            domain: 'CAREER',
            relationship: 'CONFIRMS',
            strength: 'STRONG',
            confidence: 'HIGH',
            evidenceIds: [],
            statement: 'D10 confirms leadership capability.'
          }
        ],
        manifestations: [],
        conflicts: [],
        conclusion: createDomainConclusion({
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'Career leadership is strongly supported.'
        }),
        conclusionData: {
          careerManifestationSynthesis: [
            {
              reasoningVersion: 'CW-04',
              mode: 'LEADERSHIP',
              status: 'STRONGLY_SUPPORTED',
              confidence: 'HIGH',
              natalSupport: 'SUPPORT',
              dashaSupport: 'SUPPORT',
              transitSupport: 'SUPPORT',
              d10Support: 'SUPPORT',
              factors: [
                {
                  id: 'NATAL_LEADERSHIP_1',
                  mode: 'LEADERSHIP',
                  direction: 'SUPPORT',
                  weight: 2.0,
                  source: 'NATAL',
                  statement: 'Sun placed in 10th house with high digbala.',
                  evidenceIds: ['EV_NAT_SUN_10']
                },
                {
                  id: 'DASHA_LEADERSHIP_1',
                  mode: 'LEADERSHIP',
                  direction: 'SUPPORT',
                  weight: 1.5,
                  source: 'DASHA',
                  statement: 'Sun MD activates authority.',
                  dashaEvidenceIds: ['D_SUN_MD']
                },
                {
                  id: 'TRANSIT_LEADERSHIP_1',
                  mode: 'LEADERSHIP',
                  direction: 'SUPPORT',
                  weight: 1.0,
                  source: 'TRANSIT',
                  statement: 'Jupiter transit supports 10th house.',
                  transitEvidenceIds: ['TR_JUP_10']
                },
                {
                  id: 'D10_LEADERSHIP_1',
                  mode: 'LEADERSHIP',
                  direction: 'SUPPORT',
                  weight: 1.5,
                  source: 'D10',
                  statement: 'Sun strong in D10 career chart.'
                }
              ],
              summary: 'Executive leadership is strongly supported across all four analytical dimensions.'
            }
          ]
        }
      });

      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [customCareerInterpretation]
      });

      const careerFact = aiContext.career;
      expect(careerFact).toBeDefined();
      expect(careerFact?.manifestationSynthesis).toBeDefined();
      expect(careerFact?.manifestationSynthesis).toHaveLength(1);

      const leadership = careerFact?.manifestationSynthesis?.[0];
      expect(leadership?.reasoningVersion).toBe('CW-04');
      expect(leadership?.mode).toBe('LEADERSHIP');
      expect(leadership?.status).toBe('STRONGLY_SUPPORTED');
      expect(leadership?.confidence).toBe('HIGH');
      expect(leadership?.natalSupport).toBe('SUPPORT');
      expect(leadership?.dashaSupport).toBe('SUPPORT');
      expect(leadership?.transitSupport).toBe('SUPPORT');
      expect(leadership?.d10Support).toBe('SUPPORT');
      expect(leadership?.summary).toBe('Executive leadership is strongly supported across all four analytical dimensions.');

      expect(leadership?.factors).toHaveLength(4);
      const natalFactor = leadership?.factors.find((f) => f.id === 'NATAL_LEADERSHIP_1');
      expect(natalFactor).toEqual({
        id: 'NATAL_LEADERSHIP_1',
        mode: 'LEADERSHIP',
        direction: 'SUPPORT',
        weight: 2.0,
        source: 'NATAL',
        statement: 'Sun placed in 10th house with high digbala.',
        evidenceIds: ['EV_NAT_SUN_10']
      });

      const dashaFactor = leadership?.factors.find((f) => f.id === 'DASHA_LEADERSHIP_1');
      expect(dashaFactor?.dashaEvidenceIds).toEqual(['D_SUN_MD']);

      const transitFactor = leadership?.factors.find((f) => f.id === 'TRANSIT_LEADERSHIP_1');
      expect(transitFactor?.transitEvidenceIds).toEqual(['TR_JUP_10']);
    });

    it('should map Wealth CW-04 manifestationSynthesis with all 4 dimensions surviving and SPECULATION isolated', () => {
      const customWealthInterpretation: DomainInterpretation = createDomainInterpretation({
        domain: 'WEALTH',
        natalPromise: createNatalPromise({
          strength: 'STRONG',
          statement: 'Natal wealth promise is solid.'
        }),
        dashaActivation: createDashaActivation({
          domain: 'WEALTH',
          effect: 'ACTIVATES',
          statement: 'Jupiter activates 2nd house.'
        }),
        transitTrigger: createTransitTrigger({
          domain: 'WEALTH',
          effect: 'TRIGGER',
          statement: 'Jupiter triggers wealth expansion.'
        }),
        vargaConfirmations: [
          {
            varga: 'D2',
            domain: 'WEALTH',
            relationship: 'CONFIRMS',
            strength: 'STRONG',
            confidence: 'HIGH',
            evidenceIds: [],
            statement: 'D2 confirms wealth capacity.'
          }
        ],
        manifestations: [],
        conflicts: [],
        conclusion: createDomainConclusion({
          domain: 'WEALTH',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'Wealth generation is supported.'
        }),
        conclusionData: {
          wealthManifestationSynthesis: {
            reasoningVersion: 'CW-04',
            dimensions: {
              ACCUMULATION: {
                reasoningVersion: 'CW-04',
                dimension: 'ACCUMULATION',
                status: 'STRONGLY_SUPPORTED',
                confidence: 'HIGH',
                natalSupport: 'SUPPORT',
                dashaSupport: 'SUPPORT',
                transitSupport: 'SUPPORT',
                d2Support: 'SUPPORT',
                factors: [
                  {
                    id: 'W_NAT_ACC_1',
                    dimension: 'ACCUMULATION',
                    direction: 'SUPPORT',
                    weight: 2.0,
                    source: 'NATAL',
                    statement: 'Lord of 2nd exalted.',
                    evidenceIds: ['EV_W_2']
                  }
                ],
                summary: 'Asset accumulation is strongly supported.'
              },
              GAINS: {
                reasoningVersion: 'CW-04',
                dimension: 'GAINS',
                status: 'SUPPORTED',
                confidence: 'MEDIUM',
                natalSupport: 'SUPPORT',
                dashaSupport: 'SUPPORT',
                transitSupport: 'NEUTRAL',
                d2Support: 'NEUTRAL',
                factors: [
                  {
                    id: 'W_NAT_GAINS_1',
                    dimension: 'GAINS',
                    direction: 'SUPPORT',
                    weight: 1.5,
                    source: 'NATAL',
                    statement: '11th house strong.',
                    evidenceIds: ['EV_W_11']
                  }
                ],
                summary: 'Revenue gains are supported.'
              },
              FORTUNE: {
                reasoningVersion: 'CW-04',
                dimension: 'FORTUNE',
                status: 'MIXED',
                confidence: 'MEDIUM',
                natalSupport: 'SUPPORT',
                dashaSupport: 'CHALLENGE',
                transitSupport: 'NEUTRAL',
                d2Support: 'NEUTRAL',
                factors: [
                  {
                    id: 'W_NAT_FORT_1',
                    dimension: 'FORTUNE',
                    direction: 'SUPPORT',
                    weight: 1.0,
                    source: 'NATAL',
                    statement: '9th lord well-aspected.'
                  }
                ],
                summary: 'Long-term fortune faces mixed timing.'
              },
              SPECULATION: {
                reasoningVersion: 'CW-04',
                dimension: 'SPECULATION',
                status: 'INSUFFICIENT_DATA',
                confidence: 'LOW',
                natalSupport: 'NEUTRAL',
                dashaSupport: 'CHALLENGE',
                transitSupport: 'CHALLENGE',
                d2Support: 'NEUTRAL',
                factors: [
                  {
                    id: 'W_TR_SPEC_1',
                    dimension: 'SPECULATION',
                    direction: 'CHALLENGE',
                    weight: 1.0,
                    source: 'TRANSIT',
                    statement: 'Saturn transiting 5th house restricts speculation.',
                    transitEvidenceIds: ['TR_SAT_5']
                  }
                ],
                summary: 'Speculative ventures lack natal foundation.'
              }
            },
            summary: 'Wealth synthesis across all four dimensions.'
          }
        }
      });

      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [customWealthInterpretation]
      });

      const wealthFact = aiContext.wealth;
      expect(wealthFact).toBeDefined();
      expect(wealthFact?.manifestationSynthesis).toBeDefined();
      expect(wealthFact?.manifestationSynthesis?.reasoningVersion).toBe('CW-04');
      expect(wealthFact?.manifestationSynthesis?.summary).toBe('Wealth synthesis across all four dimensions.');

      const dims = wealthFact?.manifestationSynthesis?.dimensions;
      expect(dims).toBeDefined();
      expect(dims?.ACCUMULATION).toBeDefined();
      expect(dims?.GAINS).toBeDefined();
      expect(dims?.FORTUNE).toBeDefined();
      expect(dims?.SPECULATION).toBeDefined();

      expect(dims?.ACCUMULATION?.status).toBe('STRONGLY_SUPPORTED');
      expect(dims?.ACCUMULATION?.natalSupport).toBe('SUPPORT');
      expect(dims?.ACCUMULATION?.d2Support).toBe('SUPPORT');
      expect(dims?.ACCUMULATION?.factors[0].evidenceIds).toEqual(['EV_W_2']);

      expect(dims?.GAINS?.status).toBe('SUPPORTED');
      expect(dims?.FORTUNE?.status).toBe('MIXED');

      // SPECULATION is isolated from ACCUMULATION and GAINS
      expect(dims?.SPECULATION?.status).toBe('INSUFFICIENT_DATA');
      expect(dims?.SPECULATION?.natalSupport).toBe('NEUTRAL');
      expect(dims?.SPECULATION?.factors[0].transitEvidenceIds).toEqual(['TR_SAT_5']);
    });

    it('should map Career and Wealth CW-05 finalSynthesis facts with activation hierarchy and confidence preserved', () => {
      const customCareerInterpretation: DomainInterpretation = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        dashaActivation: createDashaActivation({ effect: 'ACTIVATES' }),
        transitTrigger: createTransitTrigger({ effect: 'TRIGGER' }),
        conclusion: createDomainConclusion({ statement: 'Career strong', confidence: 'HIGH' }),
        evidence: [],
        conclusionData: {
          careerFinalSynthesis: {
            reasoningVersion: 'CW-05',
            domain: 'CAREER',
            status: 'STRONG',
            finalStatus: 'STRONG',
            promiseStatus: 'STRONG',
            activationStatus: 'SUPPORT',
            activationConfidence: 'HIGH',
            activationStrength: 2.75,
            activationSummary: 'MD Jupiter provides primary SUPPORT; AD Sun reinforces support; PD Mars introduces short-term CHALLENGE qualification',
            activationHierarchy: {
              md: { effect: 'SUPPORTS', role: 'PRIMARY' },
              ad: { effect: 'SUPPORTS', role: 'MODIFIER' },
              pd: { effect: 'CHALLENGES', role: 'REFINEMENT' }
            },
            timingStatus: 'SUPPORT',
            divisionalStatus: 'CONFIRMS',
            manifestationStatus: 'STRONG',
            confidence: 'HIGH',
            primaryPromise: 'STRONG',
            primaryStrength: 2.5,
            manifestationSummary: [],
            strongestAreas: ['LEADERSHIP'],
            challengedAreas: [],
            dashaEffect: 'SUPPORTS',
            timingEffect: 'ACTIVATES',
            divisionalEffect: 'CONFIRMS',
            keySupport: ['Jupiter 10H'],
            keyChallenges: [],
            summary: 'Career final synthesis',
            ruleIds: ['CW-05-CAREER-SYNTHESIS'],
            evidenceIds: ['EV-1']
          }
        }
      });

      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [customCareerInterpretation]
      });

      const finalSyn = aiContext.career?.finalSynthesis;
      expect(finalSyn).toBeDefined();
      expect(finalSyn?.reasoningVersion).toBe('CW-05');
      expect(finalSyn?.activationStatus).toBe('SUPPORT');
      expect(finalSyn?.activationConfidence).toBe('HIGH');
      expect(finalSyn?.activationStrength).toBe(2.75);
      expect(finalSyn?.activationSummary).toContain('MD Jupiter provides primary SUPPORT');
      expect(finalSyn?.activationHierarchy).toEqual({
        md: { effect: 'SUPPORTS', role: 'PRIMARY' },
        ad: { effect: 'SUPPORTS', role: 'MODIFIER' },
        pd: { effect: 'CHALLENGES', role: 'REFINEMENT' }
      });
    });

    it('should not throw conflicting evidence id when Pratyantardasha lord participates in multiple same-type yogas', () => {
      // Reproduce scenario where Pratyantardasha lord (e.g. SUN) participates in multiple same-type yogas (e.g. RAJA_YOGA)
      const canonicalYogaId1 = 'RAJA_YOGA|CATEGORY=RAJA|PLANETS=JUPITER,SUN|HOUSES=1,5';
      const canonicalYogaId2 = 'RAJA_YOGA|CATEGORY=RAJA|PLANETS=MARS,SUN|HOUSES=1,9';

      const pdYogaEvidence1 = {
        ruleId: `DASHA_LORD_YOGA:${canonicalYogaId1}`,
        type: 'YOGA' as const,
        level: 'PRATYANTARDASHA' as const,
        planets: [Planet.SUN],
        houses: [1, 5],
        statement: 'Dasha lord SUN participates in RAJA_YOGA yoga (status: STRONG).',
        effect: 'NEUTRAL' as const,
        source: 'Yoga Engine'
      };

      const pdYogaEvidence2 = {
        ruleId: `DASHA_LORD_YOGA:${canonicalYogaId2}`,
        type: 'YOGA' as const,
        level: 'PRATYANTARDASHA' as const,
        planets: [Planet.SUN],
        houses: [1, 9],
        statement: 'Dasha lord SUN participates in RAJA_YOGA yoga (status: PRESENT).',
        effect: 'NEUTRAL' as const,
        source: 'Yoga Engine'
      };

      const currentWithMultipleYogas = {
        ...horoscope.dashaInterpretation!.current!,
        evidence: (horoscope.dashaInterpretation!.current!.evidence || [])
          .filter((e: any) => e.level !== 'PRATYANTARDASHA')
          .concat([pdYogaEvidence1, pdYogaEvidence2]),
        pratyantardasha: {
          ...horoscope.dashaInterpretation!.current!.pratyantardasha!,
          planet: Planet.SUN,
          evidence: [pdYogaEvidence1, pdYogaEvidence2],
          natal: {
            ...horoscope.dashaInterpretation!.current!.pratyantardasha!.natal,
            planet: Planet.SUN,
            yogaParticipation: [
              {
                yogaType: 'RAJA_YOGA' as any,
                yogaId: canonicalYogaId1,
                finalStatus: 'STRONG' as const,
                relationship: 'PLANET' as const,
                houses: [1, 5]
              },
              {
                yogaType: 'RAJA_YOGA' as any,
                yogaId: canonicalYogaId2,
                finalStatus: 'PRESENT' as const,
                relationship: 'PLANET' as const,
                houses: [1, 9]
              }
            ],
            evidence: [pdYogaEvidence1, pdYogaEvidence2]
          }
        }
      };

      // 1. Direct buildDashaEvidence verification
      expect(() => buildDashaEvidence(currentWithMultipleYogas as any)).not.toThrow();
      const dashaEvidence = buildDashaEvidence(currentWithMultipleYogas as any);
      const yogaEvs = dashaEvidence.filter(
        e => e.dashaLevel === 'PRATYANTARDASHA' && e.id.includes('DASHA_LORD_YOGA')
      );
      expect(yogaEvs.length).toBe(2);
      expect(yogaEvs[0].id).not.toBe(yogaEvs[1].id);

      // 2. End-to-end buildAiContext verification
      const horoscopeWithPdYogas = {
        ...horoscope,
        dashaInterpretation: {
          ...horoscope.dashaInterpretation!,
          current: currentWithMultipleYogas as any
        }
      };

      let aiCtx: any;
      expect(() => {
        aiCtx = buildAiContext(horoscopeWithPdYogas, {
          temporalState: {
            dashaInterpretation: horoscopeWithPdYogas.dashaInterpretation
          } as any
        });
      }).not.toThrow();

      const contextYogaEvs = aiCtx.evidence.filter(
        (e: any) => e.dashaLevel === 'PRATYANTARDASHA' && e.id.includes('DASHA_LORD_YOGA')
      );
      expect(contextYogaEvs.length).toBe(2);
      expect(contextYogaEvs[0].id).not.toBe(contextYogaEvs[1].id);
    });

    it('preserves fail-loud invariant when genuinely conflicting evidence IDs are encountered', () => {
      const conflictingEvidence1 = {
        ruleId: 'CONFLICTING_RULE',
        type: 'YOGA' as const,
        level: 'PRATYANTARDASHA' as const,
        planets: [Planet.SUN],
        houses: [1],
        statement: 'Statement A',
        effect: 'NEUTRAL' as const,
        source: 'Yoga Engine'
      };
      const conflictingEvidence2 = {
        ruleId: 'CONFLICTING_RULE',
        type: 'YOGA' as const,
        level: 'PRATYANTARDASHA' as const,
        planets: [Planet.SUN],
        houses: [1],
        statement: 'Statement B (conflicting)',
        effect: 'NEUTRAL' as const,
        source: 'Yoga Engine'
      };
      const currentConflicting = {
        ...horoscope.dashaInterpretation!.current!,
        pratyantardasha: {
          ...horoscope.dashaInterpretation!.current!.pratyantardasha!,
          natal: {
            ...horoscope.dashaInterpretation!.current!.pratyantardasha!.natal,
            evidence: [conflictingEvidence1, conflictingEvidence2]
          }
        }
      };

      expect(() => buildDashaEvidence(currentConflicting as any)).toThrow(
        /Cannot build AiContext: conflicting evidence id/
      );
    });

    it('full-path integration regression: yoga engine -> dasha interpretation -> dasha evidence -> AI-context projection', () => {
      const activeDate = CANONICAL_BIRTH_DETAILS.dateTimeStr;
      const initialActive = analyzeActiveDasha(
        {
          vimshottari: horoscope.vimshottari,
          planetInterpretation: horoscope.planetInterpretation,
          houseInterpretation: horoscope.houseInterpretation,
          functionalRoles: horoscope.functionalRoles,
          natalGrahaDrishti: (horoscope.natalGrahaDrishti ?? { aspects: [] }) as any,
          yogas: { yogas: [] },
          planetAnalysis: horoscope.planetAnalysis,
          planetaryStrength: horoscope.planetaryStrength
        },
        activeDate
      )!;
      expect(initialActive).not.toBeNull();
      const mdLord = initialActive.mahadasha.planet;
      const otherPlanet = mdLord === Planet.JUPITER ? Planet.SUN : Planet.JUPITER;

      // Two same-fingerprint RAJA_YOGA records with conflicting finalStatus and strength
      const sameFingerprintYoga1 = {
        type: YogaType.RAJA_YOGA,
        category: YogaCategory.RAJA,
        strength: YogaStrength.STRONG,
        planets: [mdLord, otherPlanet],
        houses: [1, 5],
        evidence: [
          { ruleId: 'rajaKendraTrikonaRule', evidenceType: 'FORMATION' as const }
        ] as any,
        assessment: {
          formationPresent: true,
          strength: YogaStrengthLevel.VERY_STRONG,
          finalStatus: 'STRONG' as const,
          confidence: 'HIGH' as const,
          supportingFactors: [],
          weakeningFactors: [],
          cancellationFactors: []
        }
      };

      const sameFingerprintYoga2 = {
        type: YogaType.RAJA_YOGA,
        category: YogaCategory.RAJA,
        strength: YogaStrength.STRONG,
        planets: [otherPlanet, mdLord], // reversed order produces same canonical id
        houses: [5, 1], // reversed houses produce same canonical id
        evidence: [
          { ruleId: 'rajaBhangaCombustionRule', evidenceType: 'CANCELLATION' as const }
        ] as any,
        assessment: {
          formationPresent: false,
          strength: YogaStrengthLevel.MODERATE,
          finalStatus: 'CANCELLED' as const,
          confidence: 'HIGH' as const,
          supportingFactors: [],
          weakeningFactors: [],
          cancellationFactors: []
        }
      };

      const dashaInput = {
        vimshottari: horoscope.vimshottari,
        planetInterpretation: horoscope.planetInterpretation,
        houseInterpretation: horoscope.houseInterpretation,
        functionalRoles: horoscope.functionalRoles,
        natalGrahaDrishti: (horoscope.natalGrahaDrishti ?? { aspects: [] }) as any,
        yogas: { yogas: [sameFingerprintYoga1, sameFingerprintYoga2] },
        planetAnalysis: horoscope.planetAnalysis,
        planetaryStrength: horoscope.planetaryStrength
      };

      const dashaReport = analyzeDashaInterpretation(dashaInput);
      const activeDasha = analyzeActiveDasha(dashaInput, activeDate)!;
      expect(activeDasha).not.toBeNull();

      const fullHoroscope = {
        ...horoscope,
        yogas: { yogas: [sameFingerprintYoga1, sameFingerprintYoga2] },
        dashaInterpretation: {
          ...dashaReport,
          current: activeDasha
        }
      };

      // 1. Direct buildDashaEvidence does not throw conflicting-evidence-id
      expect(() => buildDashaEvidence(activeDasha)).not.toThrow();

      // 2. buildAiContext does not throw conflicting-evidence-id
      let aiContext: any;
      expect(() => {
        aiContext = buildAiContext(fullHoroscope, {
          temporalState: {
            dashaInterpretation: fullHoroscope.dashaInterpretation
          } as any
        });
      }).not.toThrow();

      // 3. Merged yoga participation verification in AI Context and Active Dasha
      expect(activeDasha.mahadasha.natal.yogaParticipation.length).toBe(1);
      const mdYogaPart = aiContext.dasha?.interpretation?.mahadasha?.yogaParticipation;
      expect(mdYogaPart).toBeDefined();
      expect(mdYogaPart.length).toBe(1);

      const mergedYoga = mdYogaPart[0];
      // Option-A contract: cancellation-dominant status, highest intrinsic strength
      expect(mergedYoga.finalStatus).toBe('CANCELLED');
      expect(mergedYoga.strength).toBe(YogaStrengthLevel.VERY_STRONG);

      // Provenance retention: contributingRuleIds unioned, deduped, and sorted in structured provenance
      const expectedRuleIds = ['rajaBhangaCombustionRule', 'rajaKendraTrikonaRule'].sort();
      expect(mergedYoga.provenance).toBeDefined();
      expect(mergedYoga.provenance?.contributingRuleIds).toEqual(expectedRuleIds);
      expect(mergedYoga.provenance?.formationRuleIds).toEqual(['rajaKendraTrikonaRule']);
      expect(mergedYoga.provenance?.cancellationRuleIds).toEqual(['rajaBhangaCombustionRule']);

      // 4. Emitted AI evidence: exactly 1 merged evidence per participating dasha level (no duplicate conflicting IDs)
      const mdYogaEvs = aiContext.evidence.filter(
        (e: any) => e.source === 'DASHA' && e.dashaLevel === 'MAHADASHA' && e.ruleId?.startsWith('DASHA_LORD_YOGA')
      );
      expect(mdYogaEvs.length).toBe(1);
      expect(mdYogaEvs[0].statement).toContain('(status: CANCELLED)');
      expect(mdYogaEvs[0].derivedFromIds).toEqual(expectedRuleIds);

      // Verify every projected dasha yoga evidence item has the merged provenance
      const allDashaYogaEvs = aiContext.evidence.filter(
        (e: any) => e.source === 'DASHA' && e.ruleId?.startsWith('DASHA_LORD_YOGA')
      );
      expect(allDashaYogaEvs.length).toBeGreaterThanOrEqual(1);
      for (const ev of allDashaYogaEvs) {
        expect(ev.statement).toContain('(status: CANCELLED)');
        expect(ev.derivedFromIds).toEqual(expectedRuleIds);
      }
    });

    it('should scope hierarchy evidenceIds to period and planet (Finding 2)', () => {
      const customCareerInterpretation = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG', supportingEvidenceIds: [], challengingEvidenceIds: [] }),
        dashaActivation: createDashaActivation({ effect: 'ACTIVATES', evidenceIds: [] }),
        transitTrigger: createTransitTrigger({ effect: 'TRIGGER', evidenceIds: [] }),
        conclusion: createDomainConclusion({ statement: 'Career active', confidence: 'HIGH' }),
        evidence: [
          {
            ...createDomainEvidence({
              id: 'CAREER_DASHA:MD:JUPITER:SUPPORT',
              sourceType: 'DASHA',
              polarity: 'SUPPORTING',
              strength: 'STRONG',
              statement: 'Jupiter Mahadasha activates career'
            }),
            source: 'DASHA',
            phase: 'DASHA_ACTIVATION',
            timing: {
              level: 'MD',
              planet: Planet.JUPITER
            }
          } as any,
          {
            ...createDomainEvidence({
              id: 'CAREER_DASHA:AD:SATURN:SUPPORT',
              sourceType: 'DASHA',
              polarity: 'SUPPORTING',
              strength: 'STRONG',
              statement: 'Saturn Antardasha modifies career'
            }),
            source: 'DASHA',
            phase: 'DASHA_ACTIVATION',
            timing: {
              level: 'AD',
              planet: Planet.SATURN
            }
          } as any,
          {
            ...createDomainEvidence({
              id: 'CAREER_DASHA:PD:MARS:SUPPORT',
              sourceType: 'DASHA',
              polarity: 'SUPPORTING',
              strength: 'STRONG',
              statement: 'Mars Pratyantardasha triggers career'
            }),
            source: 'DASHA',
            phase: 'DASHA_ACTIVATION',
            timing: {
              level: 'PD',
              planet: Planet.MARS
            }
          } as any,
          {
            ...createDomainEvidence({
              id: 'CAREER_DASHA:MD:VENUS:SUPPORT',
              sourceType: 'DASHA',
              polarity: 'SUPPORTING',
              strength: 'STRONG',
              statement: 'Venus Mahadasha - unrelated period'
            }),
            source: 'DASHA',
            phase: 'DASHA_ACTIVATION',
            timing: {
              level: 'MD',
              planet: Planet.VENUS
            }
          } as any
        ],
        conclusionData: {
          careerDashaSynthesis: {
            md: {
              planet: Planet.JUPITER,
              effect: 'SUPPORTS',
              factors: [{ id: 'F_MD', period: 'MD', planet: Planet.JUPITER, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }],
              summary: 'MD summary'
            },
            ad: {
              planet: Planet.SATURN,
              effect: 'SUPPORTS',
              factors: [{ id: 'F_AD', period: 'AD', planet: Planet.SATURN, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }],
              summary: 'AD summary'
            },
            pd: {
              planet: Planet.MARS,
              effect: 'NEUTRAL',
              factors: [{ id: 'F_PD', period: 'PD', planet: Planet.MARS, category: 'TEST', direction: 'NEUTRAL', weight: 1.0, statement: 'Test' }],
              summary: 'PD summary'
            },
            combined: {
              md: {
                planet: Planet.JUPITER,
                effect: 'SUPPORTS',
                factors: [{ id: 'F_MD', period: 'MD', planet: Planet.JUPITER, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }]
              },
              ad: {
                planet: Planet.SATURN,
                effect: 'SUPPORTS',
                factors: [{ id: 'F_AD', period: 'AD', planet: Planet.SATURN, category: 'TEST', direction: 'SUPPORT', weight: 1.0, statement: 'Test' }]
              },
              pd: {
                planet: Planet.MARS,
                effect: 'NEUTRAL',
                factors: [{ id: 'F_PD', period: 'PD', planet: Planet.MARS, category: 'TEST', direction: 'NEUTRAL', weight: 1.0, statement: 'Test' }]
              },
              combinedEffect: 'SUPPORTS',
              hierarchy: {
                mdRole: 'PRIMARY_DRIVER',
                adRole: 'MODIFIER',
                pdRole: 'TRIGGER',
                combinedEffect: 'SUPPORTS'
              }
            },
            asOf: '2024-01-01T00:00:00.000Z'
          }
        }
      });

      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [customCareerInterpretation]
      });

      const hierarchyEvidenceIds = aiContext.career?.timing?.hierarchy?.evidenceIds ?? [];

      // Should include MD (Jupiter), AD (Saturn), and PD (Mars) evidence
      expect(hierarchyEvidenceIds).toContain('CAREER_DASHA:MD:JUPITER:SUPPORT');
      expect(hierarchyEvidenceIds).toContain('CAREER_DASHA:AD:SATURN:SUPPORT');
      expect(hierarchyEvidenceIds).toContain('CAREER_DASHA:PD:MARS:SUPPORT');

      // Should NOT include unrelated Venus MD evidence
      expect(hierarchyEvidenceIds).not.toContain('CAREER_DASHA:MD:VENUS:SUPPORT');

      // Verify the helper function behavior independently
      const mdResult = mapPeriodToCanonicalEvidenceIds(customCareerInterpretation, 'MD', Planet.JUPITER);
      expect(mdResult.evidenceIds).toEqual(['CAREER_DASHA:MD:JUPITER:SUPPORT']);
      expect(mdResult.traceability).toBe('RESOLVED');

      const venusResult = mapPeriodToCanonicalEvidenceIds(customCareerInterpretation, 'MD', Planet.VENUS);
      expect(venusResult.evidenceIds).toEqual(['CAREER_DASHA:MD:VENUS:SUPPORT']);
      expect(venusResult.traceability).toBe('RESOLVED');

      const unknownResult = mapPeriodToCanonicalEvidenceIds(customCareerInterpretation, 'MD', Planet.MERCURY);
      expect(unknownResult.evidenceIds).toEqual([]);
      expect(unknownResult.traceability).toBe('DEGRADED');
    });
  });

  // P2-11F Gate F: Career Profession Analysis AI Context Projection Test
  describe('P2-11F Gate F: Career Profession Analysis AI Context Projection', () => {
    it('when careerProfessionAnalysis is present, AI context reflects it without re-invoking engine', async () => {
      // Build a career interpretation with profession analysis already computed
      const v2 = interpretCareerV2(horoscope, makeDomainOptions());

      // Verify profession analysis is present in conclusionData
      expect(v2.conclusionData?.careerProfessionAnalysis).toBeDefined();

      // Spy on buildCareerProfessionAnalysis to ensure it's not called during AI context building
      // Install spy AFTER interpretCareerV2 completes, since that legitimately calls buildCareerProfessionAnalysis
      const professionEngine = await import('../../domain/career/careerProfession/careerProfessionEngine');
      const professionSpy = vi.spyOn(professionEngine, 'buildCareerProfessionAnalysis');

      // Build AI context with the pre-computed profession analysis
      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [career],
        temporalState,
        careerProfessionAnalysis: v2.conclusionData?.careerProfessionAnalysis
      });

      // Verify profession fact is present in AI context
      expect(aiContext.career?.profession).toBeDefined();
      expect(aiContext.career?.profession?.availability).toBe('AVAILABLE');
      expect(aiContext.career?.profession?.status).toBeDefined();
      expect(Array.isArray(aiContext.career?.profession?.candidates)).toBe(true);

      // Assert buildCareerProfessionAnalysis was NOT called during AI context building
      // (it should use the pre-computed analysis from the options)
      expect(professionSpy).not.toHaveBeenCalled();

      // Cleanup
      professionSpy.mockRestore();
    });

    it('when careerProfessionAnalysis is absent, AI context reflects UNAVAILABLE status', () => {
      // Create a career interpretation without careerProfessionAnalysis in conclusionData
      const careerWithoutProfessionAnalysis = {
        ...career,
        conclusionData: {
          ...career.conclusionData,
          careerProfessionAnalysis: undefined
        }
      };

      // Build AI context without pre-computed profession analysis
      const aiContext = buildAiContext(horoscope, {
        domainInterpretations: [careerWithoutProfessionAnalysis],
        temporalState
      });

      // Verify profession fact is present but UNAVAILABLE
      expect(aiContext.career?.profession).toBeDefined();
      expect(aiContext.career?.profession?.availability).toBe('UNAVAILABLE');
      expect(aiContext.career?.profession?.status).toBe('INSUFFICIENT_DATA');
      expect(aiContext.career?.profession?.candidates).toEqual([]);
    });
  });
});

describe('normalizeTimingActivationEffect', () => {
  it('should return exact matches for known values', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect('ACTIVATES')).toBe('ACTIVATES');
    expect(normalizeTimingActivationEffect('PARTIALLY_ACTIVATES')).toBe('PARTIALLY_ACTIVATES');
    expect(normalizeTimingActivationEffect('DOES_NOT_ACTIVATE')).toBe('DOES_NOT_ACTIVATE');
    expect(normalizeTimingActivationEffect('CHALLENGES')).toBe('CHALLENGES');
    expect(normalizeTimingActivationEffect('UNKNOWN')).toBe('UNKNOWN');
    expect(normalizeTimingActivationEffect('INSUFFICIENT_DATA')).toBe('INSUFFICIENT_DATA');
  });

  it('should fuzzy-match confident free-form strings to ACTIVATES', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect('activate')).toBe('ACTIVATES');
    expect(normalizeTimingActivationEffect('active')).toBe('ACTIVATES');
    expect(normalizeTimingActivationEffect('strong activation')).toBe('ACTIVATES');
    expect(normalizeTimingActivationEffect('yes')).toBe('ACTIVATES');
  });

  it('should fuzzy-match partial strings to PARTIALLY_ACTIVATES', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect('partial')).toBe('PARTIALLY_ACTIVATES');
    expect(normalizeTimingActivationEffect('some activation')).toBe('PARTIALLY_ACTIVATES');
    expect(normalizeTimingActivationEffect('moderate')).toBe('PARTIALLY_ACTIVATES');
    expect(normalizeTimingActivationEffect('mixed')).toBe('PARTIALLY_ACTIVATES');
  });

  it('should fuzzy-match challenge strings to CHALLENGES', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect('challenge')).toBe('CHALLENGES');
    expect(normalizeTimingActivationEffect('weak')).toBe('CHALLENGES');
    expect(normalizeTimingActivationEffect('negative')).toBe('CHALLENGES');
    expect(normalizeTimingActivationEffect('no')).toBe('CHALLENGES');
  });

  it('should fuzzy-match inactive strings to DOES_NOT_ACTIVATE', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect('inactive')).toBe('DOES_NOT_ACTIVATE');
    expect(normalizeTimingActivationEffect('not activate')).toBe('DOES_NOT_ACTIVATE');
    expect(normalizeTimingActivationEffect('none')).toBe('DOES_NOT_ACTIVATE');
  });

  it('should return UNKNOWN for unrecognized strings', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect('random text')).toBe('UNKNOWN');
    expect(normalizeTimingActivationEffect('foo bar')).toBe('UNKNOWN');
    expect(normalizeTimingActivationEffect('')).toBe('UNKNOWN');
  });

  it('should return UNKNOWN for non-string inputs', async () => {
    const { normalizeTimingActivationEffect } = await import('./aiContextFactory');

    expect(normalizeTimingActivationEffect(null)).toBe('UNKNOWN');
    expect(normalizeTimingActivationEffect(undefined)).toBe('UNKNOWN');
    expect(normalizeTimingActivationEffect(123)).toBe('UNKNOWN');
    expect(normalizeTimingActivationEffect({})).toBe('UNKNOWN');
  });
});
