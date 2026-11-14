import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../CareerDomainInterpreterV2';
import { getCareerConclusionData } from '../../interpretation';
import type { CareerDashaCanonicalLevel } from '../careerDasha/careerDashaCanonicalTypes';

const FIXED_AS_OF = '2026-11-14T00:00:00.000Z';
const LEVELS: readonly CareerDashaCanonicalLevel[] = ['MD', 'AD', 'PD'];

describe('Career/Dasha reconciliation trace', () => {
  it('records canonical C5-C9 and legacy CW-09 outputs for Jupiter, Mercury, and Venus', () => {
    const context = createAnalysisContext({
      asOf: FIXED_AS_OF,
      methodology: {
        zodiacSystem: 'SIDEREAL',
        houseSystem: 'WHOLE_SIGN',
        ayanamsa: 'LAHIRI',
        calculationEngine: 'ASTRO_CORE_V1',
        rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
        vargaRules: 'PARASHARA_D10_D2',
        dashaSystem: 'VIMSHOTTARI'
      }
    });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: FIXED_AS_OF });
    const temporalState = resolveAnalysisTemporalState(horoscope, context);
    const career = interpretCareerV2(horoscope, { context, temporalState });
    const conclusionData = getCareerConclusionData(career);
    const artifacts = conclusionData?.internalArtifacts;
    const canonicalDasha = artifacts?.canonicalDashaAnalysis;
    const natal = artifacts?.natal;
    const canonicalExpression = artifacts?.canonicalExpressionAnalysis;
    const legacy = conclusionData?.careerDashaSynthesis;
    const current = temporalState.dashaInterpretation?.current;

    expect(canonicalDasha).toBeDefined();
    expect(natal).toBeDefined();
    expect(legacy).toBeDefined();
    expect(current).toBeDefined();

    const periodInputs = {
      MD: current?.mahadasha,
      AD: current?.antardasha,
      PD: current?.pratyantardasha
    };
    const report = LEVELS.map((level) => {
      const canonicalPeriod = canonicalDasha![level.toLowerCase() as 'md' | 'ad' | 'pd'];
      const planet = canonicalPeriod.planet;
      const condition = planet ? natal!.condition.find((item) => item.planet === planet) : undefined;
      const relevance = planet ? natal!.relevance.find((item) => item.planet === planet) : undefined;
      const expressionEvidence = (canonicalExpression?.expressions ?? [])
        .flatMap((expression) => expression.evidence.map((item) => ({
          expressionId: expression.expressionId,
          expressionType: expression.expressionType,
          qualificationStatus: expression.qualificationStatus,
          evidenceId: item.evidenceId,
          ruleId: item.ruleId,
          sourceEvidenceIds: item.sourceEvidenceIds
        })));
      const legacyPeriod = legacy![level.toLowerCase() as 'md' | 'ad' | 'pd'];
      const enginePeriod = periodInputs[level];
      const legacyDomainCareer = enginePeriod?.domainSynthesis?.find(
        (item) => item.domain === 'CAREER'
      );

      return {
        level,
        planet,
        c6: condition ? {
          dignity: condition.dignity,
          combustion: condition.combustion,
          aspectPressure: condition.negativeFactors
            .filter((factor) => factor.type === 'MALEFIC_PRESSURE')
            .map((factor) => factor.statement),
          affliction: condition.affliction,
          condition: condition.condition,
          assessment: condition.assessment,
          afflictionAssessed: condition.afflictionAssessed
        } : null,
        c5: relevance ? {
          relevance: relevance.relevance,
          effect: relevance.effect,
          roles: relevance.roles,
          relatedHouses: relevance.relatedHouses,
          reasons: relevance.reasons
        } : null,
        c8: {
          status: canonicalExpression?.status ?? null,
          expressionCount: canonicalExpression?.expressions.length ?? 0,
          expressionEvidence
        },
        c9: {
          direction: canonicalPeriod.direction,
          effect: canonicalPeriod.effect,
          conditionAssessment: canonicalPeriod.conditionAssessment,
          evidence: canonicalDasha!.evidence
            .filter((item) => item.level === level)
            .map((item) => ({
              id: item.id,
              effect: item.effect,
              direction: item.direction,
              conditionAssessment: item.conditionAssessment,
              sourceIds: item.sourceIds,
              ruleIds: item.provenance.ruleIds
            }))
        },
        cw09: {
          effect: legacyPeriod.effect,
          supportScore: legacyPeriod.supportScore,
          challengeScore: legacyPeriod.challengeScore,
          factors: legacyPeriod.factors.map((factor) => ({
            id: factor.id,
            category: factor.category,
            direction: factor.direction,
            weight: factor.weight,
            ruleId: factor.ruleId,
            houses: factor.houses,
            planets: factor.planets,
            evidenceIds: factor.evidenceIds ?? [],
            derivedFromIds: factor.derivedFromIds ?? [],
            meta: factor.meta ?? null,
            provenanceCompleteness: factor.ruleId
              ? (factor.evidenceIds?.length || factor.derivedFromIds?.length ? 'EVIDENCE_LINKED' : 'RULE_ID_ONLY')
              : 'MISSING',
            statement: factor.statement
          }))
        },
        productFields: {
          careerActivation: {
            field: 'ProductAnalysis.career.activation.dasha.periods',
            renderedBy: 'CareerActivationSection / CareerDashaSection',
            effect: canonicalPeriod.effect
          },
          lifeAnalysis: {
            field: `LifeAnalysis.activeDasha.${level.toLowerCase()}.domainSynthesis[CAREER]`,
            renderedBy: 'LifeAnalysis activeDasha product (legacy engine domain synthesis)',
            effect: legacyDomainCareer?.effect ?? null
          },
          cw09Source: {
            field: `DomainInterpretation.conclusionData.careerDashaSynthesis.${level.toLowerCase()}`,
            forwardedToProduct: false
          }
        }
      };
    });

    expect(report.map((item) => item.planet)).toEqual(['JUPITER', 'MERCURY', 'VENUS']);
    expect(report[0].c9.effect).toBe('CHALLENGES');
    expect(report[0].cw09.effect).toBe('STRONGLY_SUPPORTS');
    expect(report[2].c9.effect).toBe('CHALLENGES');
    expect(report[2].cw09.effect).toBe('DOES_NOT_ACTIVATE');
    expect(report).toMatchSnapshot();
  });
});
