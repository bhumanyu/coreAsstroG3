import { describe, expect, it } from 'vitest';
import { Planet } from '../../../../types';
import { createDomainEvidence } from '../../../interpretation/DomainEvidence';
import { evaluateCareerReasoningHierarchy, deriveDashaTimingConfidence } from '../../careerReasoningHierarchy';
import { buildCareerAnalyticalAxes } from '../../careerFinalSynthesis/careerAnalyticalAxes';
import { synthesizeCareerFinal } from '../../careerFinalSynthesis/careerFinalSynthesis';
import type {
  CareerFinalSynthesisInput,
  CareerFinalSynthesisResult
} from '../../careerFinalSynthesis/careerFinalSynthesisTypes';
import type { CareerDashaActivation } from '../../careerDasha/careerDashaActivationTypes';
import type { CareerDashaCanonicalAnalysis } from '../../careerDasha/careerDashaCanonicalTypes';
import type { Career10HFoundation } from '../../career10h/career10HFoundationTypes';
import type { Career10LFoundation } from '../../career10h/career10LFoundationTypes';
import type { CareerNatalAnalysis } from '../../careerNatalAnalysis';
import type { CareerD10CanonicalAnalysis } from '../../careerD10/careerD10CanonicalTypes';
import type { CareerProfessionInput } from '../../careerProfession/careerProfessionTypes';
import { buildCareerProfessionAnalysis } from '../../careerProfession/careerProfessionEngine';
import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate
} from '../../careerExpression/careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismType
} from '../../careerMechanism/careerMechanismTypes';
import { selectCareerViewModel } from '../../../../product/analysis/careerViewModel';
import { createProductAnalysis } from '../../../../product/analysis/__tests__/testHelpers';

function makeDashaActivation(
  level: 'MD' | 'AD' | 'PD',
  effect: 'ACTIVATES' | 'CHALLENGES' | 'INSUFFICIENT_DATA',
  direction: 'SUPPORT' | 'CHALLENGE' | 'UNAVAILABLE',
  strength: 'STRONG' | 'UNDETERMINED'
): CareerDashaActivation {
  const role = level === 'MD' ? 'PRIMARY_DRIVER' : level === 'AD' ? 'MODIFIER' : 'REFINEMENT';
  return {
    level,
    planet: Planet.JUPITER,
    role,
    effect,
    direction,
    strength,
    evidence: [],
    statement: `${level} fixture`,
    active: effect !== 'INSUFFICIENT_DATA',
    activatedPromiseEvidenceIds: [],
    challengedPromiseEvidenceIds: [],
    expressionEvidenceIds: []
  };
}

function makeSynthesisInput(
  overrides: Partial<CareerFinalSynthesisInput> = {}
): CareerFinalSynthesisInput {
  return {
    natalDirection: 'SUPPORT',
    natalStrength: 'STRONG',
    ...overrides
  };
}

function makeProfessionInput(
  expression: CareerExpressionCandidate,
  mechanisms: readonly CareerMechanismCandidate[],
  overrides: Partial<CareerProfessionInput> = {}
): CareerProfessionInput {
  const expressions: CareerExpressionAnalysisResult = {
    expressions: [expression],
    status: 'COMPLETE',
    sourceMechanismIds: expression.sourceMechanismIds,
    missingInputs: [],
    unmappedMechanismTypes: [],
    provenance: {
      mechanismIds: expression.sourceMechanismIds,
      patternIds: expression.provenance.patternIds,
      relationshipIds: expression.provenance.relationshipIds,
      evidenceIds: expression.provenance.evidenceIds,
      sourceStages: ['PATTERN']
    }
  };
  return {
    expressions,
    mechanisms,
    natalPromiseDirection: 'SUPPORT',
    ...overrides
  };
}

function makeAuthorityMechanism(): CareerMechanismCandidate {
  return {
    candidateId: 'CAREER_MECHANISM_CANDIDATE:PATTERN_1:AUTHORITY',
    patternId: 'PATTERN_1',
    mechanismType: 'AUTHORITY' as CareerMechanismType,
    pathway: 'PATTERN',
    evidence: [],
    provenance: {
      patternIds: ['PATTERN_1'],
      relationshipIds: [],
      participantIds: [],
      evidenceIds: [],
      sourceStages: ['PATTERN']
    },
    explanation: 'Authority mechanism fixture'
  };
}

function makeAuthorityExpression(sourceMechanismIds: readonly string[]): CareerExpressionCandidate {
  return {
    expressionId: 'EXPR:AUTHORITY_EXPRESSION',
    expressionType: 'AUTHORITY_EXPRESSION',
    sourceMechanismIds,
    mechanismTypes: ['AUTHORITY' as CareerMechanismType],
    status: 'CANDIDATE',
    pathway: 'PATTERN',
    evidence: [],
    provenance: {
      mechanismIds: sourceMechanismIds,
      patternIds: ['PATTERN_1'],
      relationshipIds: [],
      evidenceIds: ['expression-evidence'],
      sourceStages: ['PATTERN']
    }
  };
}

function makeD10Analysis(
  availability: 'AVAILABLE' | 'UNAVAILABLE',
  expressionQualifications: CareerD10CanonicalAnalysis['expressionQualifications'] = []
): CareerD10CanonicalAnalysis {
  return {
    availability,
    natalDirection: 'SUPPORT',
    natalStrength: 'STRONG',
    d10Effect: 'UNAVAILABLE',
    d10Direction: 'UNDETERMINED',
    d10Strength: 'UNDETERMINED',
    qualifiedDirection: 'UNDETERMINED',
    qualifiedStrength: 'UNDETERMINED',
    natalPromisePreserved: true,
    relationship: 'UNAVAILABLE',
    evidence: [],
    conflicts: [],
    expressionQualifications,
    rootEvidenceIds: [],
    statement: 'D10 fixture'
  };
}

function makeCareer10HFoundation(): Career10HFoundation {
  return {
    lagnaContext: {
      referencePoint: 'LAGNA',
      referenceHouseNumber: 10,
      referenceHouseSign: 'CAPRICORN' as never,
      lagnaRelativeHouseNumber: 10,
      house10Lord: Planet.SATURN,
      lordHouse: 10,
      occupants: [],
      aspectsOn10H: [],
      aspectDataStatus: 'AVAILABLE',
      provenance: {
        houseLordshipEvidenceId: 'career-10h-lord',
        sourceHouseIndex: 10,
        drishtiSource: { reportPresent: true, aspectCount: 0 },
        drishtiAspectIds: []
      }
    },
    moonContext: null
  };
}

function makeCareer10LFoundation(): Career10LFoundation {
  return {
    lagnaContext: {
      referencePoint: 'LAGNA',
      house10Lord: Planet.SATURN,
      lordHouse: 10,
      condition: {
        status: 'AVAILABLE',
        dignity: 'OWN_SIGN' as never,
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        sign: 'CAPRICORN' as never,
        house: 10,
        sourceRuleIds: ['career-10l-condition']
      },
      relationships: [],
      relationshipDataStatus: 'UNAVAILABLE',
      provenance: {
        house10ContextRef: 'LAGNA',
        conditionSourceIds: ['career-10l-condition'],
        relationshipIds: []
      }
    },
    moonContext: null
  };
}

describe('Career production-boundary acceptance (CAR)', () => {
  it('CAR-001: D10 support with unavailable D1 cannot create a career promise', () => {
    const result = synthesizeCareerFinal(makeSynthesisInput({
      natalDirection: 'UNAVAILABLE',
      natalStrength: 'UNDETERMINED',
      d10Direction: 'SUPPORT',
      d10Strength: 'STRONG',
      d10Effect: 'QUALIFIES'
    }));

    expect(result.finalStatus).toBe('INSUFFICIENT_DATA');
    expect(result.natalDirection).toBe('UNAVAILABLE');
    expect(result.finalDirection).toBe('UNAVAILABLE');
  });

  it('CAR-002: MIXED natal promise remains MIXED through final synthesis', () => {
    const result = synthesizeCareerFinal(makeSynthesisInput({
      natalDirection: 'MIXED',
      natalStrength: 'MIXED',
      dashaDirection: 'SUPPORT',
      dashaEffect: 'ACTIVATES',
      d10Direction: 'SUPPORT',
      d10Strength: 'STRONG',
      d10Effect: 'QUALIFIES'
    }));

    expect(result.natalDirection).toBe('MIXED');
    expect(result.finalDirection).toBe('MIXED');
    expect(result.finalStatus).toBe('MIXED');
  });

  it('CAR-003: promise and activation remain separate synthesis axes', () => {
    const result = synthesizeCareerFinal(makeSynthesisInput({
      dashaDirection: 'CHALLENGE',
      dashaEffect: 'CHALLENGES'
    }));

    expect(result.natalDirection).toBe('SUPPORT');
    expect(result.dashaDirection).toBe('CHALLENGE');
    expect(result.natalStrength).toBe('STRONG');
  });

  it('CAR-004: PARTIAL C9 condition assessment is preserved on the B01 activation axis', () => {
    const evidence = [{
      id: 'dasha-md-occurrence',
      identityKey: 'dasha-md-identity',
      level: 'MD',
      direction: 'SUPPORT',
      effect: 'ACTIVATES',
      strength: 'STRONG',
      sourceIds: [],
      activationRuleIds: [],
      provenance: { ruleIds: [] }
    }];
    const period = (level: 'MD' | 'AD' | 'PD', conditionAssessment: 'PARTIAL' | 'FULL') => ({
      level,
      planet: Planet.JUPITER,
      role: level === 'MD' ? 'PRIMARY_DRIVER' : level === 'AD' ? 'MODIFIER' : 'REFINEMENT',
      effect: 'ACTIVATES',
      direction: 'SUPPORT',
      strength: 'STRONG',
      evidence,
      conditionAssessment,
      activatedPromiseEvidenceIds: [],
      start: '2024-01-01',
      end: '2024-12-31'
    });
    const dasha = {
      overallEffect: 'ACTIVATES',
      overallDirection: 'SUPPORT',
      overallStrength: 'STRONG',
      dominantLevel: 'MD',
      md: period('MD', 'PARTIAL'),
      ad: period('AD', 'FULL'),
      pd: period('PD', 'FULL'),
      evidence,
      rootEvidenceIds: [],
      statement: 'Partial Dasha fixture',
      hierarchy: {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        md: period('MD', 'PARTIAL'),
        ad: period('AD', 'FULL'),
        pd: period('PD', 'FULL'),
        conditionAssessment: 'PARTIAL',
        statement: 'Partial Dasha fixture'
      }
    } as unknown as CareerDashaCanonicalAnalysis;
    const axes = buildCareerAnalyticalAxes({
      natal: {
        structural: { direction: 'SUPPORT', strength: 'STRONG' },
        evidence: []
      } as unknown as CareerNatalAnalysis,
      dasha,
      d10: { availability: 'UNAVAILABLE', evidence: [], conflicts: [] } as unknown as CareerD10CanonicalAnalysis,
      finalSynthesis: { conflicts: [] } as unknown as CareerFinalSynthesisResult
    });

    expect(axes.activation.status).toBe('PARTIAL');
    expect(axes.activation.result?.conditionAssessment).toBe('PARTIAL');
    expect(axes.activation.coverage.missingSources).toContain('C9_PARTIAL_CONDITION_ASSESSMENT');
  });

  it('CAR-005: absent transit evidence produces UNAVAILABLE direction', () => {
    const result = evaluateCareerReasoningHierarchy({ evidence: [] });
    expect(result.transitDirection).toBe('UNAVAILABLE');
  });

  it('CAR-006: present neutral-only transit evidence produces NEUTRAL direction', () => {
    const neutral = createDomainEvidence({
      id: 'transit-neutral',
      sourceType: 'TRANSIT',
      domain: 'CAREER',
      role: 'TIMING',
      phase: 'TRANSIT_TRIGGER',
      source: 'TRANSIT',
      statement: 'Neutral transit evidence',
      polarity: 'NEUTRAL',
      strength: 'MODERATE',
      priority: 50
    });
    const result = evaluateCareerReasoningHierarchy({ evidence: [], transitEvidence: [neutral] });
    expect(result.transitDirection).toBe('NEUTRAL');
  });

  it('CAR-007: an unavailable D10 assessment retains an existing profession candidate', () => {
    const mechanism = makeAuthorityMechanism();
    const result = buildCareerProfessionAnalysis(makeProfessionInput(
      makeAuthorityExpression([mechanism.candidateId]),
      [mechanism],
      { careerD10CanonicalAnalysis: makeD10Analysis('UNAVAILABLE') }
    ));

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].d10Status).toBe('UNAVAILABLE');
  });

  it('CAR-008: unavailable ranking prevents COMPLETE profession status', () => {
    const mechanism = makeAuthorityMechanism();
    const result = buildCareerProfessionAnalysis(makeProfessionInput(
      makeAuthorityExpression([mechanism.candidateId]),
      [mechanism],
      {
        career10HFoundation: makeCareer10HFoundation(),
        career10LFoundation: makeCareer10LFoundation(),
        careerD10CanonicalAnalysis: makeD10Analysis('AVAILABLE'),
        domainEvidence: [],
        natalPromiseDirection: 'UNAVAILABLE'
      }
    ));

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.ranking?.status).toBe('UNAVAILABLE');
    expect(result.status).toBe('PARTIAL');
    expect(result.status).not.toBe('COMPLETE');
  });

  it('CAR-009: partial expression-to-mechanism linkage is flagged on the candidate', () => {
    const mechanism = makeAuthorityMechanism();
    const expression = makeAuthorityExpression([mechanism.candidateId, 'missing-mechanism']);
    const result = buildCareerProfessionAnalysis(makeProfessionInput(expression, [mechanism]));

    expect(result.candidates[0]?.linkageCoverage).toBe('PARTIAL');
    expect(result.diagnostics).toContain('PROFESSION_PARTIAL_LINKAGE_CANDIDATES');
  });

  it('CAR-012: a missing PD level does not upgrade hierarchy confidence or activation', () => {
    const result = synthesizeCareerFinal(makeSynthesisInput({
      dashaHierarchy: {
        md: makeDashaActivation('MD', 'ACTIVATES', 'SUPPORT', 'STRONG'),
        ad: makeDashaActivation('AD', 'ACTIVATES', 'SUPPORT', 'STRONG'),
        pd: makeDashaActivation('PD', 'INSUFFICIENT_DATA', 'UNAVAILABLE', 'UNDETERMINED'),
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'MD and AD activate; PD is unavailable'
      }
    }));

    expect(result.dashaEffect).toBe('ACTIVATES');
    expect(result.dashaDirection).toBe('SUPPORT');
    expect(result.confidence).not.toBe('HIGH');
    expect(deriveDashaTimingConfidence('PARTIAL', true)).toBe(0.5);
    expect(deriveDashaTimingConfidence('UNAVAILABLE', false)).toBe(0);
  });

  it('CAR-015: executed C8 with zero candidates remains EXECUTED_NO_CANDIDATES in the career view model', () => {
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
});
