import { describe, it, expect } from 'vitest';
import { selectCareerViewModel } from '../careerViewModel';
import { createProductAnalysis } from './testHelpers';
import type {
  ProductCareerPatternQualification,
  ProductDashaPeriod
} from '../productAnalysisTypes';
import {
  ENGLISH_USER_FACING_COPY,
  HINDI_USER_FACING_COPY
} from '../../life-analysis/userFacingInterpretation';

describe('CareerViewModel pure projection selectors (P-UI-04)', () => {
  it('1. natal promise preserves strength and confidence while formatting its statement', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.promise.strength).toBe('STRONG');
    expect(vm.promise.confidence).toBe('HIGH');
    expect(vm.promise.headline).toBe('Supportive outlook');
    expect(vm.promise.statement).toContain('Strong');
    expect(vm.promise.statement).toContain('Career outcome: Supportive outlook');
    expect(vm.promise.statement).toContain('Dasha support: supportive indications');
    expect(vm.promise.statement).not.toContain('SUPPORTED');
    expect(vm.promise.statement).not.toContain('SUPPORT');
  });

  it('formats raw natal promise enum values instead of exposing them to the card', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        promise: { ...base.career.promise, status: 'MIXED', statement: 'MIXED / NEUTRAL / NOT_ACTIVE' },
        synthesis: {
          ...base.career.synthesis,
          finalStatus: 'MIXED',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG'
        }
      }
    });

    const vm = selectCareerViewModel(analysis);

    expect(vm.promise.statement).toContain('Mixed');
    expect(vm.promise.statement).not.toMatch(/\b(MIXED|NEUTRAL|NOT_ACTIVE)\b/);
  });

  it('preserves canonical expression candidate qualification without promoting candidates', () => {
    const base = createProductAnalysis();
    const candidates = [
      { expressionId: 'expr-qualified', expressionType: 'AUTHORITY_EXPRESSION', qualificationStatus: 'QUALIFIED' as const },
      { expressionId: 'expr-candidate', expressionType: 'LEADERSHIP_EXPRESSION', qualificationStatus: 'CANDIDATE' as const },
      { expressionId: 'expr-unresolved', expressionType: 'RESEARCH_WORK', qualificationStatus: 'UNRESOLVED' as const },
      { expressionId: 'expr-not-applicable', expressionType: 'SERVICE_WORK', qualificationStatus: 'NOT_APPLICABLE' as const }
    ];
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        expression: { candidates }
      }
    });

    const vm = selectCareerViewModel(analysis);

    expect(vm.expression.available).toBe(true);
    expect(vm.expression.candidates).toEqual(candidates);
    expect(vm.expression.candidates.find(candidate => candidate.expressionId === 'expr-candidate')?.qualificationStatus)
      .toBe('CANDIDATE');
  });

  it('distinguishes an executed C8 analysis with no candidates from absent analysis', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        expression: {
          analysisStatus: 'EXECUTED',
          candidates: []
        }
      }
    });

    const expression = selectCareerViewModel(analysis).expression;

    expect(expression.status).toBe('EXECUTED_NO_CANDIDATES');
    expect(expression.available).toBe(false);
    expect(expression.candidates).toEqual([]);
  });

  it('preserves C8 coverage summary for an executed-empty expression analysis', () => {
    const base = createProductAnalysis();
    const coverageSummary = {
      mechanismCandidateCount: 0,
      patternCandidateCount: 0,
      patternCandidateRecordCount: 0,
      distinctCandidateIdCount: 0,
      conflictedCandidateCount: 0,
      conflictedQualificationCount: 0,
      qualificationResultMissingCount: 0,
      qualifiedPatternCount: 0,
      eligiblePatternCount: 0,
      invalidRolePatternCount: 0,
      roleAssignmentSkippedPatternCount: 0,
      resolvedMechanismCount: 0,
      networkResolutionStatus: 'NOT_REQUIRED' as const,
      expressionCount: 0,
      expressionsWithEvidenceCount: 0,
      evidenceCount: 0,
      evidenceWithPlanetAttributionCount: 0
    };
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        expression: { analysisStatus: 'EXECUTED', candidates: [], coverageSummary }
      }
    });

    expect(selectCareerViewModel(analysis).expression.coverageSummary).toEqual(coverageSummary);
  });

  it('forwards profession stage counts unchanged and leaves legacy counts absent', () => {
    const stageCounts = Object.freeze({
      inputExpressions: 5,
      matchedRules: 3,
      generatedCandidates: 2,
      d10QualifiedCandidates: 1,
      d10RemovedCandidates: 1,
      rankingEligibleCandidates: 1,
      rankedCandidates: 1
    });
    const profession = {
      available: true,
      status: 'PARTIAL' as const,
      candidates: [],
      unresolvedExpressionTypes: [],
      mappedTypes: [],
      missingInputs: [],
      diagnostics: [],
      d10Status: 'QUALIFIED',
      ranking: {
        policyVersion: 'B04-PROFESSION-RANKING-v1' as const,
        status: 'PARTIAL' as const,
        rankedCandidates: [],
        diagnostics: []
      }
    };
    const legacyAnalysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        profession: {
          ...profession,
          stageCounts: undefined
        }
      }
    });
    const analysisWithCounts = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        profession: { ...profession, stageCounts }
      }
    });

    expect(selectCareerViewModel(legacyAnalysis).profession.stageCounts).toBeUndefined();
    expect(selectCareerViewModel(analysisWithCounts).profession.stageCounts).toBe(stageCounts);
  });

  it('forwards pattern qualifications unchanged and leaves legacy projections absent', () => {
    const patternQualifications: readonly ProductCareerPatternQualification[] = [{
      patternId: 'PATTERN_1',
      classification: 'CAREER_HOUSE_NETWORK',
      name: 'Career-house network',
      status: 'UNQUALIFIED',
      decisionBlockingReasons: [{
        kind: 'INSUFFICIENT_STRUCTURAL_EVIDENCE',
        reason: 'Structural evidence was insufficient.'
      }],
      deferredDimensions: ['ACTIVATION_POTENTIAL'],
      participants: [{
        planet: 'JUPITER',
        relevance: 'PRIMARY',
        condition: 'WEAK',
        conditionAssessment: 'FULL',
        combustion: 'COMBUST',
        affliction: 'MILD',
        dignity: 'ENEMY_SIGN',
        positiveFactorLabels: ['DIGNITY'],
        negativeFactorLabels: ['COMBUSTION', 'MALEFIC_PRESSURE']
      }]
    }];
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        profession: {
          ...base.career.profession!,
          patternQualifications
        }
      }
    });

    expect(selectCareerViewModel(analysis).profession.patternQualifications).toBe(patternQualifications);
    expect(selectCareerViewModel(base).profession.patternQualifications).toBeUndefined();
  });

  it('keeps canonical promise fields localized and excludes enum tokens from headline and statement', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        promise: {
          ...base.career.promise,
          status: 'MIXED',
          headline: 'MIXED / CHALLENGE',
          statement: 'INSUFFICIENT_DATA / NOT_ACTIVE'
        },
        synthesis: {
          ...base.career.synthesis,
          finalStatus: 'MIXED',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG',
          dashaDirection: 'CHALLENGE',
          confidence: 'MEDIUM'
        }
      }
    });

    const promise = selectCareerViewModel(analysis).promise;

    expect(promise.headline).toBe('Mixed outlook');
    expect(promise.statement).toContain('Career outcome: Mixed outlook');
    expect(promise.statement).toContain('Dasha support: challenging indications');
    expect(promise.headline).not.toMatch(/\b(MIXED|CHALLENGE|SUPPORT|INSUFFICIENT_DATA|NOT_ACTIVE)\b/);
    expect(promise.statement).not.toMatch(/\b(MIXED|CHALLENGE|SUPPORT|INSUFFICIENT_DATA|NOT_ACTIVE)\b/);
  });

  it('labels each unassessed promise dimension separately', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        promise: {
          ...base.career.promise,
          status: undefined,
          strength: 'UNAVAILABLE',
          confidence: 'UNAVAILABLE'
        },
        synthesis: {
          ...base.career.synthesis,
          finalStatus: undefined,
          natalDirection: undefined,
          natalStrength: undefined,
          dashaDirection: undefined,
          confidence: undefined
        }
      }
    });

    const statement = selectCareerViewModel(analysis).promise.statement ?? '';

    expect(statement).toContain('Career outcome: Not assessed');
    expect(statement).toContain('Foundation: Not assessed');
    expect(statement).toContain('Dasha support: Not assessed');
    expect(statement).toContain('Evidence confidence: Not assessed');
    expect(statement).not.toMatch(/\. Not assessed\. Not assessed/);
  });

  it('sanitizes enum-like legacy headlines with the active locale fallback', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        promise: {
          ...base.career.promise,
          headline: 'MIXED / NOT_ACTIVE'
        },
        synthesis: {
          ...base.career.synthesis,
          finalStatus: undefined
        }
      }
    });

    expect(selectCareerViewModel(analysis).promise.headline).toBe('Not assessed');
    expect(selectCareerViewModel(analysis, HINDI_USER_FACING_COPY).promise.headline)
      .toBe('आकलन नहीं किया गया');
  });

  it('preserves condition assessment metadata on Dasha period view models', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        activation: {
          ...base.career.activation,
          dasha: {
            ...base.career.activation.dasha,
            periods: [{
              level: 'MD',
              planet: 'Jupiter',
              role: 'PRIMARY',
              direction: 'CHALLENGE',
              effect: 'CHALLENGES',
              evidenceIds: [],
              conditionAssessment: 'PARTIAL',
              afflictionAssessed: false
            }]
          }
        }
      }
    });

    expect(selectCareerViewModel(analysis).dasha.periods[0]).toMatchObject({
      level: 'MD',
      conditionAssessment: 'PARTIAL',
      afflictionAssessed: false
    });
  });

  it('passes through the canonical C9 evidence tally on dasha period view models', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        activation: {
          ...base.career.activation,
          dasha: {
            ...base.career.activation.dasha,
            periods: base.career.activation.dasha.periods.map((period) =>
              period.level === 'MD'
                ? {
                    ...period,
                    evidenceTally: { supportingCount: 2, challengingCount: 1, neutralCount: 0 }
                  }
                : period
            )
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);

    expect(vm.dasha.md?.evidenceTally).toEqual({
      supportingCount: 2,
      challengingCount: 1,
      neutralCount: 0
    });
    // Levels without a projected tally stay absent (persisted records
    // without the new field render unchanged).
    expect(vm.dasha.ad?.evidenceTally).toBeUndefined();
    expect(vm.dasha.pd?.evidenceTally).toBeUndefined();
  });

  it('surfaces B06 diagnostics through the career view model', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        eventTimeline: {
          reasoningVersion: 'B06',
          methodVersion: 'B06-EVENT-SPECIFIC-TIMELINE-v1',
          status: 'UNAVAILABLE',
          taxonomy: [],
          eventCandidates: [],
          genericWindows: [],
          observedOutcomeReportIds: [],
          diagnostics: ['NO_P2_09B_SOURCE_WINDOWS_AVAILABLE'],
          guaranteedEventsAvailable: false,
          numericProbabilityAvailable: false,
          statement: 'No source windows were supplied.'
        }
      }
    });

    expect(selectCareerViewModel(analysis).eventTimelineDiagnostics)
      .toEqual(['NO_P2_09B_SOURCE_WINDOWS_AVAILABLE']);
  });

  it('2. manifestations: preserves dominantManifestations array and handles undefined', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);
    expect(vm.promise.manifestations).toEqual(['Corporate Leadership']);

    const analysisWithoutManifestations = createProductAnalysis({
      career: {
        ...analysis.career,
        promise: {
          ...analysis.career.promise,
          dominantManifestations: undefined
        }
      }
    });
    const vm2 = selectCareerViewModel(analysisWithoutManifestations);
    expect(vm2.promise.manifestations).toEqual([]);
  });

  it('3. D10 relationship preserved: preserves relationship value and statement', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.d10.relationship).toBe('CONFIRMS');
    expect(vm.d10.statement).toBe('Dasamsa confirms strong 10th house status.');
  });

  it('4. UNAVAILABLE D10: preserves UNAVAILABLE relationship without strength coercion', () => {
    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        d10: {
          relationship: 'UNAVAILABLE',
          statement: 'D10 divisional assessment unavailable'
        }
      }
    });
    const vm = selectCareerViewModel(analysis);

    expect(vm.d10.relationship).toBe('UNAVAILABLE');
    expect(vm.d10.statement).toBe('D10 divisional assessment unavailable');
  });

  it('5. MD>AD>PD order: guarantees strictly hierarchical period ordering regardless of input ordering', () => {
    const defaultAnalysis = createProductAnalysis();
    const shuffledPeriods: ProductDashaPeriod[] = [
      {
        level: 'PD',
        planet: 'Mercury',
        role: 'REFINEMENT',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: ['ev_pd']
      },
      {
        level: 'MD',
        planet: 'Jupiter',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: ['ev_md']
      },
      {
        level: 'AD',
        planet: 'Saturn',
        role: 'MODIFIER',
        direction: 'CHALLENGE',
        effect: 'CHALLENGES',
        evidenceIds: ['ev_ad']
      }
    ];

    const analysis = createProductAnalysis({
      career: {
        ...defaultAnalysis.career,
        activation: {
          ...defaultAnalysis.career.activation,
          dasha: {
            ...defaultAnalysis.career.activation.dasha,
            periods: shuffledPeriods
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);
    expect(vm.dasha.periods.map((p) => p.level)).toEqual(['MD', 'AD', 'PD']);
  });

  it('6. MD/AD/PD planets Jupiter/Saturn/Mercury: matches canonical planetary rulers', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.dasha.md?.planet).toBe('Jupiter');
    expect(vm.dasha.ad?.planet).toBe('Saturn');
    expect(vm.dasha.pd?.planet).toBe('Mercury');
  });

  it('7. role vs direction independence: ensures roles (PRIMARY, MODIFIER, REFINEMENT) are independent of directions', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.dasha.md?.role).toBe('PRIMARY');
    expect(vm.dasha.md?.direction).toBe('SUPPORT');

    expect(vm.dasha.ad?.role).toBe('MODIFIER');
    expect(vm.dasha.ad?.direction).toBe('CHALLENGE');

    expect(vm.dasha.pd?.role).toBe('REFINEMENT');
    expect(vm.dasha.pd?.direction).toBe('SUPPORT');
  });

  it('8. unavailable dasha: preserves UNAVAILABLE status', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...defaultAnalysis.career,
        activation: {
          ...defaultAnalysis.career.activation,
          dasha: {
            status: 'UNAVAILABLE',
            periods: []
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);
    expect(vm.dasha.status).toBe('UNAVAILABLE');
  });

  it('9. unavailable transit: preserves UNAVAILABLE status', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...defaultAnalysis.career,
        activation: {
          ...defaultAnalysis.career.activation,
          transit: {
            status: 'UNAVAILABLE',
            effect: 'UNAVAILABLE',
            statement: 'Transit data unavailable'
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);
    expect(vm.transit.status).toBe('UNAVAILABLE');
    expect(vm.transit.effect).toBe('UNAVAILABLE');
  });

  it('10. qualification severity passthrough: passes qualification details and severity without modification', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.qualifications).toHaveLength(1);
    expect(vm.qualifications[0].type).toBe('COMBUSTION');
    expect(vm.qualifications[0].severity).toBe('LOW');
    expect(vm.qualifications[0].description).toBe('Mercury combust by 8 degrees.');
  });

  it('11. evidence direction/role passthrough: passes all evidential roles and directions', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.evidence).toHaveLength(2);
    expect(vm.evidence[0]).toMatchObject({
      id: 'ev_career_1',
      direction: 'SUPPORT',
      role: 'PRIMARY',
      technical: { source: 'CAREER_ENGINE', statement: 'Mars exalted in 1st house.' }
    });
    expect(vm.evidence[1]).toMatchObject({
      id: 'ev_career_2',
      direction: 'CHALLENGE',
      role: 'MODIFIER',
      technical: { source: 'CAREER_ENGINE', statement: 'Saturn aspects 10th house.' }
    });
  });

  it('counts unique evidence from the displayed list and retains challenge-direction factors', () => {
    const base = createProductAnalysis();
    const jupiterChallenge = {
      ...base.career.evidence[0],
      id: 'ev_jupiter_challenge_150',
      planet: 'Jupiter',
      direction: 'CHALLENGE' as const,
      statement: 'Jupiter challenge component: 1.50.'
    };
    const duplicateWithOtherDirection = {
      ...jupiterChallenge,
      direction: 'SUPPORT' as const
    };
    const dashaPeriods = base.career.activation.dasha.periods.map(period =>
      period.level === 'MD'
        ? { ...period, evidenceIds: [jupiterChallenge.id] }
        : period
    );
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        activation: {
          ...base.career.activation,
          dasha: {
            ...base.career.activation.dasha,
            periods: dashaPeriods
          }
        },
        evidence: [
          jupiterChallenge,
          duplicateWithOtherDirection,
          base.career.evidence[0]
        ]
      }
    });

    const vm = selectCareerViewModel(analysis);

    expect(vm.evidence).toHaveLength(2);
    expect(vm.evidence.find(item => item.id === jupiterChallenge.id)).toMatchObject({
      direction: 'CHALLENGE',
      explanation: 'Jupiter challenge component: 1.50'
    });
    expect(vm.dasha.md?.evidence).toContainEqual(expect.objectContaining({
      id: jupiterChallenge.id,
      explanation: 'Jupiter challenge component: 1.50'
    }));
    expect(vm.conclusion.supportingEvidenceCount).toBe(1);
    expect(vm.conclusion.challengingEvidenceCount).toBe(1);
  });

  it('12. evidence provenance passthrough: preserves derivedFromIds and handles empty arrays', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.evidence[0].derivedFromIds).toEqual(['ev_mars_exalted']);
    expect(vm.evidence[1].derivedFromIds).toEqual([]);
  });

  it('13. defensive dasha hierarchy: asserts exactly one MD, one AD, and one PD in normal fixture', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    const mdCount = vm.dasha.periods.filter((p) => p.level === 'MD').length;
    const adCount = vm.dasha.periods.filter((p) => p.level === 'AD').length;
    const pdCount = vm.dasha.periods.filter((p) => p.level === 'PD').length;

    expect(mdCount).toBe(1);
    expect(adCount).toBe(1);
    expect(pdCount).toBe(1);
    expect(vm.dasha.md).toBeDefined();
    expect(vm.dasha.ad).toBeDefined();
    expect(vm.dasha.pd).toBeDefined();
  });

  it('14. anti-overclaim: uses a not-assessed fallback when structured synthesis is absent', () => {
    const base = createProductAnalysis();
    const analysisWithoutSynthesis = createProductAnalysis({
      career: {
        ...base.career,
        synthesis: undefined
      }
    });

    const vm = selectCareerViewModel(analysisWithoutSynthesis);

    expect(vm.conclusion.statement).toContain('Not assessed');
    expect(vm.conclusion.headline).toBe(base.career.promise.headline);
    expect(vm.conclusion.integratedSynthesisAvailable).toBe(false);
  });

  it('builds a non-enum conclusion from structured career synthesis fields', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        synthesis: {
          ...base.career.synthesis,
          finalStatus: 'MIXED',
          finalDirection: 'MIXED',
          finalStrength: 'MIXED',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG',
          dashaDirection: 'SUPPORT',
          timingStatus: 'NOT_ACTIVE',
          confidence: 'HIGH'
        }
      }
    });
    const vm = selectCareerViewModel(analysis);

    expect(vm.conclusion.statement).toContain('Mixed outlook');
    expect(vm.conclusion.statement).not.toContain('MIXED (');
    expect(vm.conclusion.statement).not.toContain('NOT_ACTIVE');
    expect(JSON.stringify(vm.conclusion)).not.toContain('NOT_ACTIVE');
    expect(vm.conclusion.integratedSynthesisAvailable).toBe(true);
  });

  it('passes a non-default copy provider to the career assessment', () => {
    const copy = {
      ...ENGLISH_USER_FACING_COPY,
      outcomes: {
        ...ENGLISH_USER_FACING_COPY.outcomes,
        SUPPORTED: 'Custom supportive outlook'
      }
    };
    const vm = selectCareerViewModel(createProductAnalysis(), copy);

    expect(vm.conclusion.statement).toContain('Custom supportive outlook');
  });
});
