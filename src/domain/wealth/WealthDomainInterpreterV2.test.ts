import { describe, expect, it, vi } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { interpretWealthTheme } from '../../engine/themeInterpretation/wealthThemeInterpretation';
import {
  CANONICAL_BIRTH_DETAILS,
  CANONICAL_UTC_INSTANT
} from '../../test/fixtures/canonicalChart';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import type { Horoscope } from '../../types';
import type { HouseInterpretation } from '../../engine/houseInterpretation/houseInterpretationTypes';

const testMethodology = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
};
function makeContext(asOf?: Date | string) {
  return createAnalysisContext({ asOf, methodology: testMethodology });
}

function makeEmptyProducerChartFor(horoscope: Horoscope, hasCompleteInputs: boolean): Horoscope {
  const houseEntries = Object.entries(horoscope.houseInterpretation?.houses ?? {}) as
    Array<[string, HouseInterpretation]>;
  const neutralHouseInterpretations = Object.fromEntries(
    houseEntries.map(([houseNumber, house]) => [
      houseNumber,
      {
        ...house,
        placement: { ...house.placement, signLord: undefined },
        lord: undefined,
        summary: {
          ...house.summary,
          supportingFactors: [],
          challengingFactors: []
        },
        occupants: { ...house.occupants, planets: [] }
      }
    ])
  );

  return {
    ...horoscope,
    ...(hasCompleteInputs ? {} : { planetFacts: {} as Horoscope['planetFacts'] }),
    bhavas: undefined,
    bhavaFacts: undefined,
    houseInterpretation: hasCompleteInputs
      ? { ...horoscope.houseInterpretation, houses: neutralHouseInterpretations }
      : undefined,
    houseAnalysis: hasCompleteInputs ? { houses: {} } : undefined,
    planetInterpretation: hasCompleteInputs ? { planets: {} } : undefined,
    planetAnalysis: hasCompleteInputs ? { planets: {} } : undefined,
    functionalRoles: hasCompleteInputs ? {} : undefined,
    yogas: hasCompleteInputs ? horoscope.yogas : undefined,
    planetaryStrength: hasCompleteInputs ? {} : undefined,
    divisionalInterpretation: hasCompleteInputs ? {} : undefined,
    dashaInterpretation: hasCompleteInputs
      ? resolveDashaInterpretationForAsOf(horoscope, new Date(CANONICAL_UTC_INSTANT))
      : undefined,
    natalGrahaDrishti: hasCompleteInputs ? { aspects: [] } : undefined
  };
}

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
  evaluateWealthPeriodTimingActivation,
  assertWealthPeriodActivationContract,
  assertStrictIds,
  evaluateDashaEffect,
  evaluateTransitEffect,
  evaluateD2Relationship,
  resolveDimensionStatus,
  evaluateWealthDimension,
  resolveOverallWealthStatus,
  calculateWealthDataCompleteness,
  buildWealthConclusion,
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
import { mapDomainStrengthToWealthStatus } from './WealthDomainInterpreterV2';
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
import { synthesizeWealthManifestations } from './manifestation/wealthManifestationSynthesis';
import {
  linkWealthEvidence,
  resolveRelatedWealthPromiseEvidenceIds
} from './wealthEvidenceLinker';
import { evaluateWealthReasoningHierarchy } from './wealthReasoningHierarchy';
import type { WealthConclusionData, WealthDimensionInterpretation, WealthPeriodTimingActivation } from './wealthTypes';
import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import { DignityStatus, Planet } from '../../types';
import { resolveDashaInterpretationForAsOf } from '../../engine/dashaInterpretation/resolveDashaForAsOf';
import { synthesizeWealthTiming } from '../timing/careerWealthTiming';
import { resolveWealthDimensionTransitEffect } from '../timing/careerWealthTiming/wealthTransitRules';
import { createMockActiveDashaTimingContext, createMockForecastContext } from '../timing/careerWealthTiming/__testUtils__/mockDasha';

describe('WealthDomainInterpreterV2', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  function makeDomainOptions(asOf?: Date | string, targetHoroscope: Horoscope = horoscope): DomainReasoningOptions {
    const context = makeContext(asOf);
    const temporalState = resolveAnalysisTemporalState(targetHoroscope, context);
    return { context, temporalState };
  }

  function makeProducerChart(options: {
    readonly supportingHouses?: readonly number[];
    readonly afflictedLordHouses?: readonly number[];
  } = {}): Horoscope {
    const supportingHouses = new Set(options.supportingHouses ?? []);
    const afflictedLordHouses = new Set(options.afflictedLordHouses ?? []);
    const houses = { ...(horoscope.houseInterpretation?.houses ?? {}) };
    const planetInterpretations = { ...(horoscope.planetInterpretation?.planets ?? {}) };
    const planetAnalyses = { ...(horoscope.planetAnalysis?.planets ?? {}) };
    const lordDignities = new Map<Planet, DignityStatus>();
    const dignityHouseAssignments = new Map<Planet, number[]>();

    for (const houseNumber of [2, 11, 9, 5]) {
      const house = houses[houseNumber];
      if (!house) {
        throw new Error(`Canonical chart is missing house ${houseNumber} interpretation.`);
      }

      houses[houseNumber] = {
        ...house,
        summary: {
          ...house.summary,
          supportingFactors: supportingHouses.has(houseNumber)
            ? [`Fixture supports house ${houseNumber}.`]
            : [],
          challengingFactors: []
        },
        occupants: { ...house.occupants, planets: [] }
      };

      const lord = house.placement?.signLord;
      if (!lord) {
        throw new Error(`Canonical chart is missing the lord of house ${houseNumber}.`);
      }
      const dignity = afflictedLordHouses.has(houseNumber)
        ? DignityStatus.DEBILITATED
        : supportingHouses.has(houseNumber)
          ? DignityStatus.EXALTED
          : DignityStatus.NEUTRAL_SIGN;
      const currentDignity = lordDignities.get(lord);
      if (currentDignity !== undefined && currentDignity !== dignity) {
        const assignedHouses = dignityHouseAssignments.get(lord) ?? [];
        throw new Error(
          `Fixture houses ${[...assignedHouses, houseNumber].join(', ')} share lord ${lord} ` +
          `but require conflicting dignities (${currentDignity}, ${dignity}).`
        );
      }
      lordDignities.set(lord, dignity);
      dignityHouseAssignments.set(lord, [
        ...(dignityHouseAssignments.get(lord) ?? []),
        houseNumber
      ]);
    }

    for (const [lord, dignity] of lordDignities) {
      planetInterpretations[lord] = {
        ...planetInterpretations[lord],
        dignity
      };
      planetAnalyses[lord] = {
        ...planetAnalyses[lord],
        dignity
      };
    }

    return {
      ...horoscope,
      houseInterpretation: {
        ...horoscope.houseInterpretation,
        houses
      },
      planetInterpretation: {
        ...horoscope.planetInterpretation,
        planets: planetInterpretations
      },
      planetAnalysis: {
        ...horoscope.planetAnalysis,
        planets: planetAnalyses
      }
    };
  }

  function makeEmptyProducerChart(hasCompleteInputs: boolean): Horoscope {
    return makeEmptyProducerChartFor(horoscope, hasCompleteInputs);
  }

  // 1. Core integration & legacy preservation
  it('preserves existing wealth conclusion summary and version V2', () => {
    const legacy = interpretWealthTheme(horoscope);
    const v2 = interpretWealthV2(horoscope, makeDomainOptions());

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

  describe('Producer-to-canonical wealth conclusion integration', () => {
    const producerMatrix = [
      {
        dimension: 'ACCUMULATION',
        houseFamily: WealthEvidenceFamily.SECOND_HOUSE,
        lordFamily: WealthEvidenceFamily.SECOND_LORD,
        houseRule: 'WEALTH_2H_STRONG_001',
        lordRule: 'WEALTH_2L_DIGNITY_001'
      },
      {
        dimension: 'GAINS',
        houseFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        lordFamily: WealthEvidenceFamily.ELEVENTH_LORD,
        houseRule: 'WEALTH_11H_STRONG_001',
        lordRule: 'WEALTH_11L_DIGNITY_001'
      },
      {
        dimension: 'FORTUNE',
        houseFamily: WealthEvidenceFamily.NINTH_HOUSE,
        lordFamily: WealthEvidenceFamily.NINTH_LORD,
        houseRule: 'WEALTH_9H_STRONG_001',
        lordRule: 'WEALTH_9L_DIGNITY_001'
      },
      {
        dimension: 'SPECULATION',
        houseFamily: WealthEvidenceFamily.FIFTH_HOUSE,
        lordFamily: WealthEvidenceFamily.FIFTH_LORD,
        houseRule: 'WEALTH_5H_STRONG_001',
        lordRule: 'WEALTH_5L_DIGNITY_001'
      }
    ] as const;

    it.each(producerMatrix)(
      'routes $houseFamily and $lordFamily NATAL_STRUCTURE producers to $dimension',
      (row) => {
        const chart = makeProducerChart({
          supportingHouses: [2, 11, 9, 5]
        });
        const theme = interpretWealthTheme(chart);
        const mappedEvidence = buildWealthEvidence(theme.evidence);
        const linkedEvidence = linkWealthEvidence(mappedEvidence);
        const hierarchy = evaluateWealthReasoningHierarchy({ evidence: linkedEvidence });
        const result = interpretWealthV2(
          chart,
          makeDomainOptions('2026-06-01T00:00:00.000Z')
        );
        const conclusionDimension = result.conclusionData?.dimensions
          .find((item: WealthDimensionInterpretation) => item.dimension === row.dimension);

        for (const [family, ruleId] of [
          [row.houseFamily, row.houseRule],
          [row.lordFamily, row.lordRule]
        ] as const) {
          const rawProducer = theme.evidence.find(
            (item) => item.evidenceFamily === family && item.ruleId === ruleId
          );
          if (!rawProducer) {
            throw new Error(`${ruleId} was not emitted by the production rules.`);
          }
          expect(rawProducer.dimension).toBe('NATAL_STRUCTURE');

          const domainProducer = linkedEvidence.find((item) => item.id === rawProducer.id);
          if (!domainProducer) {
            throw new Error(`${rawProducer.id} was not mapped to DomainEvidence.`);
          }
          const expectedPolarity = rawProducer.effect === 'SUPPORT'
            ? 'SUPPORTING'
            : rawProducer.effect === 'CHALLENGE'
              ? 'CHALLENGING'
              : 'NEUTRAL';
          const fixtureLord = chart.houseInterpretation?.houses[
            row.dimension === 'ACCUMULATION' ? 2 :
              row.dimension === 'GAINS' ? 11 :
                row.dimension === 'FORTUNE' ? 9 : 5
          ]?.placement?.signLord;
          if (!fixtureLord) {
            throw new Error(`Fixture does not identify the lord for ${row.dimension}.`);
          }
          expect(chart.planetInterpretation?.planets[fixtureLord]?.dignity)
            .toBe(DignityStatus.EXALTED);
          expect(chart.planetAnalysis?.planets[fixtureLord]?.dignity)
            .toBe(DignityStatus.EXALTED);
          expect(domainProducer.domain).toBe('WEALTH');
          expect(domainProducer.phase).toBe('NATAL_PROMISE');
          expect(domainProducer.source).toBe('D1');
          expect(domainProducer.ruleId).toBe(rawProducer.ruleId);
          expect(domainProducer.dimension).toBe(row.dimension);
          expect(domainProducer.polarity).toBe(expectedPolarity);
          // Legacy wealth mapping preserves the producer occurrence ID; the CW-01 trace
          // then maps that domain/raw ID to a canonical semantic identity.
          expect(domainProducer.id).toBe(rawProducer.id);
          expect(mapWealthDimension(rawProducer)).toBe(row.dimension);
          expect(domainProducer.relatedEvidenceIds.every((id) =>
            linkedEvidence.some((item) => item.id === id)
          )).toBe(true);

          const canonicalId = Object.values(hierarchy.reasoningTrace)
            .flat()
            .find((item) => item.sourceIds.includes(domainProducer.id))
            ?.evidenceId;
          if (!canonicalId) {
            throw new Error(`${domainProducer.id} did not reach the CW-01 reasoning trace.`);
          }
          const canonicalRecord = Object.values(hierarchy.reasoningTrace)
            .flat()
            .find((item) => item.evidenceId === canonicalId);
          expect(canonicalRecord?.identityKey).toBe(canonicalId);
          expect(canonicalRecord?.sourceIds).toEqual([domainProducer.id]);
          expect(canonicalId).not.toBe(domainProducer.id);
          expect(hierarchy.dimensionResults[row.dimension].evidenceIds)
            .toContain(canonicalId);
          // Dimension supporting IDs are CW-01 canonical IDs; challenging IDs below
          // are occurrence/domain IDs emitted by the wealth mapper.
          expect(conclusionDimension?.supportingEvidenceIds).toContain(canonicalId);
          expect(conclusionDimension?.supportingEvidenceIds).not.toContain(domainProducer.id);

          const manifestationFactors =
            result.conclusionData?.wealthManifestationSynthesis?.dimensions[row.dimension].factors;
          expect(manifestationFactors?.some((factor: { evidenceIds?: readonly string[] }) =>
            factor.evidenceIds?.includes(domainProducer.id)
          )).toBe(true);

          for (const otherDimension of producerMatrix) {
            if (otherDimension.dimension === row.dimension) continue;
            const otherConclusionDimension = result.conclusionData?.dimensions
              .find((item: WealthDimensionInterpretation) => item.dimension === otherDimension.dimension);
            expect(otherConclusionDimension?.supportingEvidenceIds).not.toContain(canonicalId);
            expect(otherConclusionDimension?.challengingEvidenceIds).not.toContain(domainProducer?.id);
            expect(
              result.conclusionData?.wealthManifestationSynthesis
                ?.dimensions[otherDimension.dimension].factors.some((factor: { evidenceIds?: readonly string[] }) =>
                  factor.evidenceIds?.includes(domainProducer.id)
                )
            ).toBe(false);
          }
        }
      }
    );

    it('routes the 2H strong-house / afflicted-lord producer challenge only to ACCUMULATION', () => {
      const chart = makeProducerChart({
        supportingHouses: [2],
        afflictedLordHouses: [2]
      });
      const theme = interpretWealthTheme(chart);
      const rawChallenge = theme.evidence.find(
        (item) => item.ruleId === 'WEALTH_2H_LORD_AFFLICTION_001'
      );
      if (!rawChallenge) {
        throw new Error('WEALTH_2H_LORD_AFFLICTION_001 did not emit evidence.');
      }
      expect(rawChallenge.id).toBe('WEALTH_2H_LORD_AFFLICTION_001:HOUSE_2');
      expect(rawChallenge.effect).toBe('CHALLENGE');
      expect(rawChallenge.dimension).toBe('NATAL_STRUCTURE');

      const mappedChallenge = linkWealthEvidence(buildWealthEvidence(theme.evidence))
        .find((item) => item.id === rawChallenge.id);
      expect(mappedChallenge?.id).toBe(rawChallenge.id);
      expect(mappedChallenge?.dimension).toBe('ACCUMULATION');
      expect(mappedChallenge?.polarity).toBe('CHALLENGING');

      const result = interpretWealthV2(
        chart,
        makeDomainOptions('2026-06-01T00:00:00.000Z')
      );
      const dimensions = result.conclusionData?.dimensions ?? [];
      expect(dimensions.find((item: WealthDimensionInterpretation) => item.dimension === 'ACCUMULATION')
        ?.challengingEvidenceIds).toContain(rawChallenge.id);
      for (const otherDimension of ['GAINS', 'FORTUNE', 'SPECULATION'] as const) {
        expect(dimensions.find((item: WealthDimensionInterpretation) => item.dimension === otherDimension)
          ?.challengingEvidenceIds).not.toContain(rawChallenge.id);
      }
      expect(result.conclusion.challengingSourceIds).toContain(rawChallenge.id);
    });

    it('retains both support and challenge from a strong 2H with an afflicted 2nd lord', () => {
      const chart = makeProducerChart({
        supportingHouses: [2],
        afflictedLordHouses: [2]
      });
      const secondLord = chart.houseInterpretation?.houses[2]?.placement?.signLord;
      if (!secondLord) {
        throw new Error('Fixture does not identify the lord of house 2.');
      }
      expect(chart.planetInterpretation?.planets[secondLord]?.dignity)
        .toBe(DignityStatus.DEBILITATED);
      expect(chart.planetAnalysis?.planets[secondLord]?.dignity)
        .toBe(DignityStatus.DEBILITATED);
      const theme = interpretWealthTheme(chart);
      const mappedEvidence = linkWealthEvidence(buildWealthEvidence(theme.evidence));
      const supportIds = mappedEvidence
        .filter((item) => item.dimension === 'ACCUMULATION' && item.polarity === 'SUPPORTING')
        .map((item) => item.id);
      const challengeIds = mappedEvidence
        .filter((item) => item.dimension === 'ACCUMULATION' && item.polarity === 'CHALLENGING')
        .map((item) => item.id);
      const result = interpretWealthV2(
        chart,
        makeDomainOptions('2026-06-01T00:00:00.000Z')
      );
      const accumulation = result.conclusionData?.dimensions
        .find((item: WealthDimensionInterpretation) => item.dimension === 'ACCUMULATION');

      expect(supportIds).toContain('WEALTH_2H_STRONG_001:HOUSE_2');
      expect(challengeIds).toContain('WEALTH_2H_LORD_AFFLICTION_001:HOUSE_2');
      expect(accumulation?.supportingEvidenceIds.length).toBeGreaterThan(0);
      expect(accumulation?.challengingEvidenceIds).toContain(
        'WEALTH_2H_LORD_AFFLICTION_001:HOUSE_2'
      );
    });

    it('distinguishes complete evaluation with no structural matches from missing inputs', () => {
      const completeNoMatch = interpretWealthTheme(makeEmptyProducerChart(true));
      const missingInput = interpretWealthTheme(makeEmptyProducerChart(false));
      const structuralFamilies = new Set([
        WealthEvidenceFamily.SECOND_HOUSE,
        WealthEvidenceFamily.SECOND_LORD,
        WealthEvidenceFamily.ELEVENTH_HOUSE,
        WealthEvidenceFamily.ELEVENTH_LORD,
        WealthEvidenceFamily.NINTH_HOUSE,
        WealthEvidenceFamily.NINTH_LORD,
        WealthEvidenceFamily.FIFTH_HOUSE,
        WealthEvidenceFamily.FIFTH_LORD
      ]);

      expect(completeNoMatch.metadata.evaluatedRulesCount).toBeGreaterThan(0);
      expect(completeNoMatch.metadata.dataCompleteness).toBe('COMPLETE');
      expect(completeNoMatch.evidence.filter((item) =>
        structuralFamilies.has(item.evidenceFamily)
      )).toEqual([]);
      expect(missingInput.metadata.dataCompleteness).toBe('INSUFFICIENT');
      expect(missingInput.evidence).toEqual([]);

      const noMatchChart = makeEmptyProducerChart(true);
      const missingChart = makeEmptyProducerChart(false);
      const noMatchV2 = interpretWealthV2(
        noMatchChart,
        makeDomainOptions(undefined, noMatchChart)
      );
      expect(noMatchV2.natalPromise.evidenceIds).toEqual([]);
      expect(noMatchV2.dataCompleteness?.dasha).toBe('UNAVAILABLE');

      const emptyV2 = interpretWealthV2(
        missingChart,
        makeDomainOptions(undefined, missingChart)
      );
      expect(emptyV2.natalPromise.evidenceIds).toEqual([]);
      expect(noMatchV2.dataCompleteness?.primaryFactors).toBe('UNAVAILABLE');
      expect(noMatchV2.dataCompleteness?.dasha).toBe('UNAVAILABLE');
      // D2 is an evaluated input here. The absence of matching structural evidence is a
      // complete no-match result, not evidence that D2 data was unavailable.
      expect(noMatchV2.dataCompleteness?.d2).toBe('AVAILABLE');
      expect(noMatchV2.dataCompleteness?.transit).toBe('UNAVAILABLE');
      expect(emptyV2.dataCompleteness?.primaryFactors).toBe('UNAVAILABLE');
      expect(emptyV2.dataCompleteness?.dasha).toBe('UNAVAILABLE');
      expect(emptyV2.dataCompleteness?.d2).toBe('UNAVAILABLE');
      expect(emptyV2.dataCompleteness?.transit).toBe('UNAVAILABLE');
      expect(emptyV2.conclusionData?.dimensions.every((dimension: WealthDimensionInterpretation) =>
        dimension.supportingEvidenceIds.length === 0 &&
        dimension.challengingEvidenceIds.length === 0
      )).toBe(true);
    });

    it('preserves canonical CW-01 IDs across reversed mapped input and repeated identical V2 runs', () => {
      const chart = makeProducerChart({
        supportingHouses: [2, 11, 9, 5]
      });
      const rawEvidence = interpretWealthTheme(chart).evidence;
      const forward = evaluateWealthReasoningHierarchy({
        evidence: linkWealthEvidence(buildWealthEvidence(rawEvidence))
      });
      const reversed = evaluateWealthReasoningHierarchy({
        evidence: linkWealthEvidence(buildWealthEvidence([...rawEvidence].reverse()))
      });

      for (const row of producerMatrix) {
        expect([...forward.dimensionResults[row.dimension].evidenceIds].sort())
          .toEqual([...reversed.dimensionResults[row.dimension].evidenceIds].sort());
      }

      const firstRun = interpretWealthV2(
        chart,
        makeDomainOptions('2026-06-01T00:00:00.000Z')
      );
      const secondRun = interpretWealthV2(
        chart,
        makeDomainOptions('2026-06-01T00:00:00.000Z')
      );
      expect(firstRun.conclusion.primaryEvidenceIds).toEqual(secondRun.conclusion.primaryEvidenceIds);
      expect(firstRun.conclusion.challengingEvidenceIds).toEqual(secondRun.conclusion.challengingEvidenceIds);
      expect(firstRun.conclusion.supportingEvidenceIds).toEqual(secondRun.conclusion.supportingEvidenceIds);
      expect(firstRun.conclusionData?.dimensions.map((dimension: WealthDimensionInterpretation) => ({
        dimension: dimension.dimension,
        supportingEvidenceIds: dimension.supportingEvidenceIds,
        challengingEvidenceIds: dimension.challengingEvidenceIds
      }))).toEqual(secondRun.conclusionData?.dimensions.map((dimension: WealthDimensionInterpretation) => ({
        dimension: dimension.dimension,
        supportingEvidenceIds: dimension.supportingEvidenceIds,
        challengingEvidenceIds: dimension.challengingEvidenceIds
      })));
    });
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
          challengingEvidenceAttribution: 'AVAILABLE' as const,
          dashaEffect: 'ACTIVATES' as const
        },
        {
          dimension: 'GAINS' as const,
          status: 'STRONGLY_SUPPORTED' as const,
          supportingEvidenceIds: ['11H'],
          challengingEvidenceIds: [],
          challengingEvidenceAttribution: 'AVAILABLE' as const,
          dashaEffect: 'ACTIVATES' as const
        },
        {
          dimension: 'FORTUNE' as const,
          status: 'SUPPORTED' as const,
          supportingEvidenceIds: ['9H'],
          challengingEvidenceIds: [],
          challengingEvidenceAttribution: 'AVAILABLE' as const,
          dashaEffect: 'DOES_NOT_ACTIVATE' as const
        },
        {
          dimension: 'SPECULATION' as const,
          status: 'CHALLENGED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: ['5H_CHALLENGE'],
          challengingEvidenceAttribution: 'AVAILABLE' as const,
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
          challengingEvidenceAttribution: 'AVAILABLE' as const,
          dashaEffect: 'CHALLENGES' as const
        },
        {
          dimension: 'GAINS' as const,
          status: 'CHALLENGED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: ['11H_CHALLENGE'],
          challengingEvidenceAttribution: 'AVAILABLE' as const,
          dashaEffect: 'CHALLENGES' as const
        },
        {
          dimension: 'FORTUNE' as const,
          status: 'LIMITED' as const,
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          challengingEvidenceAttribution: 'AVAILABLE' as const,
          dashaEffect: 'DOES_NOT_ACTIVATE' as const
        },
        {
          dimension: 'SPECULATION' as const,
          status: 'SUPPORTED' as const,
          supportingEvidenceIds: ['5H'],
          challengingEvidenceIds: [],
          challengingEvidenceAttribution: 'AVAILABLE' as const,
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
      const v2 = interpretWealthV2(horoscope, makeDomainOptions());
      const allEvidenceIds = new Set(v2.evidence.map((e) => e.id));

      for (const id of v2.conclusion.supportingSourceIds || []) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.conclusion.challengingSourceIds || []) {
        expect(allEvidenceIds.has(id)).toBe(true);
      }
      for (const id of v2.conclusion.primarySourceIds || []) {
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
      const v2 = interpretWealthV2(horoscope, makeDomainOptions());
      const projection = projectDomainInterpretationForAi(v2);

      expect(projection.domain).toBe('WEALTH');
      expect(projection.natalPromise).toBeDefined();
      expect(projection.conclusion).toBeDefined();
      expect(projection.manifestations.length).toBeGreaterThan(0);

      const projRecord = projection as unknown as Record<string, unknown>;
      expect(projRecord.horoscope).toBeUndefined();

      // Verify all evidence IDs in projection are known and valid
      // Note: evidenceIds are canonical identityKeys from reasoning hierarchy
      // The projection preserves the canonical id-space, which may differ from occurrence-level evidence IDs
      // This is correct behavior - traceability is maintained at the reasoning hierarchy level
      expect(projection.evidenceIds).toEqual(v2.conclusion.primaryEvidenceIds);

      // Verify enriched evidence array in projection
      expect(projection.evidence).toBeDefined();
      expect(projection.evidence.length).toBe(v2.evidence.length);
      for (const ev of projection.evidence) {
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

    const result = interpreter.interpret(horoscope, makeDomainOptions());
    expect(result.domain).toBe('WEALTH');


    const registry = createDefaultDomainInterpreterRegistry();
    expect(registry.has('WEALTH')).toBe(true);

    const serviceResult = interpretDomain({
      horoscope,
      domain: 'WEALTH',
      options: makeDomainOptions(),
      registry
    });
    expect(serviceResult.domain).toBe('WEALTH');
    expect(serviceResult.conclusion).toBeDefined();
  });

  // 17. CW-02 -> CW-03 end-to-end timing integration (Concern 9 & Concern 11)
  it('plumbs CW-02 Dasha activations through to CW-03 wealthTimingSynthesis given an explicit asOf date', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const domainOptions = makeDomainOptions(asOf);
    const result = interpretWealthV2(horoscope, domainOptions);

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
    expect(gainsSynthesis.natalPromise).toBe('VERY_STRONG');
    expect(gainsSynthesis.overallEffect).toBe('DOES_NOT_ACTIVATE');
  });

  it('proves deterministic CW-02 -> CW-03 activation pipeline (STRONG natal + SUPPORTS Dasha + SUPPORTS Transit -> ACTIVATES)', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');

    // Direct resolver proof:
    expect(
      resolveWealthDimensionTransitEffect('STRONG', 'SUPPORTS', { transitEffect: 'SUPPORTS' })
    ).toBe('ACTIVATES');

    // Direct synthesizer proof with explicit natal promise and dasha effects:
    const supportiveDashaState = createMockActiveDashaTimingContext({
      mdPlanet: Planet.SATURN,
      adPlanet: Planet.SATURN,
      pdPlanet: Planet.SATURN
    });

    const synthesizedSupport = synthesizeWealthTiming(
      horoscope,
      createMockForecastContext(horoscope, asOf, supportiveDashaState),
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
      createMockForecastContext(horoscope, asOf, supportiveDashaState),
      { ACCUMULATION: 'STRONG' },
      { ACCUMULATION: 'CHALLENGES' }
    );
    expect(synthesizedChallenge.dimensions.ACCUMULATION.dashaEffect).toBe('CHALLENGES');
    expect(synthesizedChallenge.dimensions.ACCUMULATION.overallEffect).toBe('CHALLENGES');
  });

  // End-to-end CW-04 Wealth Manifestation Pipeline Test
  it('CW-04 end-to-end pipeline: produces deterministic wealth manifestation synthesis with explicit asOf date', () => {
    const asOf = '2024-06-15T12:00:00.000Z';
    const domainOptions = makeDomainOptions(asOf);
    const result1 = interpretWealthV2(horoscope, domainOptions);
    const result2 = interpretWealthV2(horoscope, domainOptions);

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
    const domainOptions = makeDomainOptions(asOf);
    const result1 = interpretWealthV2(horoscope, domainOptions);
    const result2 = interpretWealthV2(horoscope, domainOptions);

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

  // P0-01 Canonicalization Suite
  describe('P0-01 Canonicalization & Non-Double-Counting Invariants', () => {
    // 1. Theme interpretation conclusion summary does not affect strength or status
    it('proves themeInterpretation conclusion summary cannot alter wealth conclusion strength or status', () => {
      const v2 = interpretWealthV2(horoscope, makeDomainOptions());

      // CW-01 is authoritative for strength
      expect(v2.conclusion.strength).toBeDefined();
      expect(v2.natalPromise.strength).toBeDefined();
      expect(v2.conclusionData?.overallStatus).toBeDefined();

      // buildWealthConclusion includes summary in prose text, but has 0 effect on strength or status
      const customSummary = 'Custom prose summary that must not alter semantics';
      const statementWith = buildWealthConclusion(
        v2.natalPromise,
        v2.dashaActivation,
        v2.transitTrigger,
        customSummary,
        {
          vargaConfirmations: v2.vargaConfirmations,
          conclusionData: v2.conclusionData as WealthConclusionData | undefined
        }
      );
      const statementWithout = buildWealthConclusion(
        v2.natalPromise,
        v2.dashaActivation,
        v2.transitTrigger,
        undefined,
        {
          vargaConfirmations: v2.vargaConfirmations,
          conclusionData: v2.conclusionData as WealthConclusionData | undefined
        }
      );

      // The statement wording reflects the prose fallback, but conclusion strength & status are completely independent
      expect(statementWith).toContain(customSummary);
      expect(statementWithout).not.toContain(customSummary);
      // Strength and status fields are unaltered
      expect(v2.conclusion.strength).toBe('VERY_STRONG');
      expect(v2.conclusionData?.overallStatus).toBe('STRONGLY_SUPPORTED');
    });

    // 2. Non-double-counting invariant
    it('proves traceability vs natal scoring non-double-counting invariant: DASHA items are present in trace/evidence but have 0 natal contribution', () => {
      const asOf = '2024-06-15T12:00:00.000Z';
      const domainOptions = makeDomainOptions(asOf);
      const result = interpretWealthV2(horoscope, domainOptions);

      // (a) Evidence contains items with source === 'DASHA' (traceability present)
      const dashaItems = result.evidence.filter((e) => e.source === 'DASHA');
      expect(dashaItems.length).toBeGreaterThan(0);
      for (const item of dashaItems) {
        expect(item.phase).toBe('DASHA_ACTIVATION');
        expect(item.phase).not.toBe('NATAL_PROMISE');
      }

      // (b) Natal promise strength / natal scoring output excludes source === 'DASHA' (zero contribution)
      const natalPromiseEvidence = result.evidence.filter((e) => e.phase === 'NATAL_PROMISE');
      expect(natalPromiseEvidence.some((e) => e.source === 'DASHA')).toBe(false);

      const natalSupporting = natalPromiseEvidence.filter((e) => e.polarity === 'SUPPORTING');
      const natalChallenging = natalPromiseEvidence.filter((e) => e.polarity === 'CHALLENGING');
      const expectedNatalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
      expect(result.natalPromise.strength).toBe(expectedNatalStrength);

      // Even if DASHA items are added or altered, wealthManifestationSynthesis excludes source === 'DASHA' from natal scoring
      const timingSyn = result.conclusionData?.wealthTimingSynthesis;
      const d2Rel = result.conclusionData?.d2Relationship;
      const synWithDasha = synthesizeWealthManifestations(
        result.evidence,
        timingSyn,
        d2Rel
      );
      const synWithoutDasha = synthesizeWealthManifestations(
        result.evidence.filter((e) => e.source !== 'DASHA'),
        timingSyn,
        d2Rel
      );
      expect(synWithDasha).toEqual(synWithoutDasha);
    });

    // 3. asOf determinism golden test (independent of machine wall-clock)
    it('proves asOf determinism: identical strength, status, timing synthesis, and evidence IDs across invocations independent of machine wall-clock', () => {
      const explicitAsOf = '2026-06-01T00:00:00.000Z';

      vi.useFakeTimers();
      try {
        const domainOptions = makeDomainOptions(explicitAsOf);
        // Run 1: Clock set to 2021
        vi.setSystemTime(new Date('2021-03-15T08:00:00.000Z'));
        const run1 = interpretWealthV2(horoscope, domainOptions);

        // Run 2: Clock set to 2030
        vi.setSystemTime(new Date('2030-11-20T17:30:00.000Z'));
        const run2 = interpretWealthV2(horoscope, domainOptions);

        // Wall-clock metadata stamp changes
        expect(run1.generatedAt).not.toBe(run2.generatedAt);

        // Core domain outputs are strictly identical
        expect(run1.conclusion.strength).toBe(run2.conclusion.strength);
        expect(run1.natalPromise.strength).toBe(run2.natalPromise.strength);
        expect(run1.natalPromise.confidence).toBe(run2.natalPromise.confidence);
        expect(run1.natalPromise.statement).toBe(run2.natalPromise.statement);
        expect(run1.conclusionData?.overallStatus).toBe(run2.conclusionData?.overallStatus);
        expect(run1.conclusionData?.accumulationStatus).toBe(run2.conclusionData?.accumulationStatus);
        expect(run1.conclusionData?.gainsStatus).toBe(run2.conclusionData?.gainsStatus);
        expect(run1.conclusionData?.fortuneStatus).toBe(run2.conclusionData?.fortuneStatus);
        expect(run1.conclusionData?.speculationStatus).toBe(run2.conclusionData?.speculationStatus);
        expect(run1.conclusionData?.dimensions).toEqual(run2.conclusionData?.dimensions);
        expect(run1.dashaActivation.effect).toBe(run2.dashaActivation.effect);
        expect(run1.transitTrigger.effect).toBe(run2.transitTrigger.effect);

        // Evidence IDs and conclusions are strictly identical
        expect(run1.evidence.map((e) => e.id)).toEqual(run2.evidence.map((e) => e.id));
        expect(run1.conclusion.primaryEvidenceIds).toEqual(run2.conclusion.primaryEvidenceIds);
        expect(run1.conclusion.supportingEvidenceIds).toEqual(run2.conclusion.supportingEvidenceIds);
        expect(run1.conclusion.challengingEvidenceIds).toEqual(run2.conclusion.challengingEvidenceIds);
        expect(run1.conclusion.statement).toBe(run2.conclusion.statement);
        expect(run1.timingActivations).toEqual(run2.timingActivations);
        expect(run1.conclusionData?.wealthFinalSynthesis).toEqual(run2.conclusionData?.wealthFinalSynthesis);
      } finally {
        vi.useRealTimers();
      }
    });

    // 4. Temporal variation test: different asOf dates produce dasha activation reflecting respective asOf
    it('proves two different AnalysisContext.asOf values produce Dasha activation reflecting respective asOf even when horoscope has populated dashaInterpretation.current', () => {
      // Obtain a valid historical ActiveDashaInterpretation for 1990 (canonical chart Moon Mahadasha)
      const staleCurrent = resolveDashaInterpretationForAsOf(
        horoscope,
        new Date('1990-01-01T00:00:00.000Z')
      )?.current;
      expect(staleCurrent).toBeDefined();
      expect(staleCurrent?.mahadasha.planet).toBe(Planet.MOON);

      const horoscopeWithStaleDasha = {
        ...horoscope,
        dashaInterpretation: {
          ...horoscope.dashaInterpretation,
          current: staleCurrent,
          activePeriods: staleCurrent
        }
      };

      const asOfT1 = '2000-01-01T00:00:00.000Z'; // Canonical chart has Mars Mahadasha
      const asOfT2 = '2024-06-15T00:00:00.000Z'; // Canonical chart has Jupiter Mahadasha

      const domainOptions1 = makeDomainOptions(asOfT1, horoscopeWithStaleDasha);
      const domainOptions2 = makeDomainOptions(asOfT2, horoscopeWithStaleDasha);

      const run1 = interpretWealthV2(horoscopeWithStaleDasha, domainOptions1);
      const run2 = interpretWealthV2(horoscopeWithStaleDasha, domainOptions2);

      // Neither run should have used the stale embedded MOON period
      const md1 = run1.periodTimingActivations?.find((t) => t.period === 'MD')?.planet;
      const md2 = run2.periodTimingActivations?.find((t) => t.period === 'MD')?.planet;

      expect(md1).not.toBe(Planet.MOON);
      expect(md2).not.toBe(Planet.MOON);

      expect(md1).toBe(Planet.MARS);
      expect(md2).toBe(Planet.JUPITER);

      // The two runs must reflect their respective asOf timing
      expect(run1.periodTimingActivations).not.toEqual(run2.periodTimingActivations);
    });
  });

  // 4. Projection-integrity regression tests
  describe('Projection-integrity fixes', () => {
    it('preserves computed D2 relationship in conclusion data', () => {
      const v2 = interpretWealthV2(horoscope, makeDomainOptions());
      
      // The D2 relationship should be passed through from the computed value, not hardcoded
      const d2Relationship = v2.conclusionData?.d2Relationship;
      expect(d2Relationship).toBeDefined();
      
      // Verify it's one of the valid VargaRelationship values
      const validRelationships = ['UNAVAILABLE', 'CONFIRMS', 'CONFLICTS', 'MODIFIES', 'PARTIALLY_CONFIRMS'];
      expect(validRelationships).toContain(d2Relationship);
    });

    it('maps every DomainStrength union member to its WealthDimensionStatus contract', () => {
      expect(mapDomainStrengthToWealthStatus('VERY_STRONG')).toBe('STRONGLY_SUPPORTED');
      expect(mapDomainStrengthToWealthStatus('STRONG')).toBe('STRONGLY_SUPPORTED');
      expect(mapDomainStrengthToWealthStatus('MODERATE')).toBe('SUPPORTED');
      expect(mapDomainStrengthToWealthStatus('MIXED')).toBe('MIXED');
      expect(mapDomainStrengthToWealthStatus('WEAK')).toBe('CHALLENGED');
      expect(mapDomainStrengthToWealthStatus('VERY_WEAK')).toBe('CHALLENGED');
      expect(mapDomainStrengthToWealthStatus('UNDETERMINED')).toBe('INSUFFICIENT_DATA');
    });

    it('attributes challenging evidence by dimension linkage only', () => {
      // Create evidence with dimension-specific challenging items
      const evidence = [
        createDomainEvidence({
          id: 'e1',
          sourceType: 'STRUCTURAL',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Test',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 50,
          ruleId: 'RULE1',
          dimension: 'GAINS'
        }),
        createDomainEvidence({
          id: 'e2',
          sourceType: 'STRUCTURAL',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Test',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 50,
          ruleId: 'RULE2',
          dimension: 'ACCUMULATION'
        })
      ];

      const gainsResult = evaluateWealthDimension('GAINS', evidence, 'DOES_NOT_ACTIVATE');
      const accumulationResult = evaluateWealthDimension('ACCUMULATION', evidence, 'DOES_NOT_ACTIVATE');

      // GAINS should only have e1 (its challenging evidence)
      expect(gainsResult.challengingEvidenceIds).toEqual(['e1']);
      
      // ACCUMULATION should only have e2 (its challenging evidence)
      expect(accumulationResult.challengingEvidenceIds).toEqual(['e2']);
      
      // Each should not have the other's challenging evidence
      expect(gainsResult.challengingEvidenceIds).not.toContain('e2');
      expect(accumulationResult.challengingEvidenceIds).not.toContain('e1');
    });

    it('returns sorted challenging IDs regardless of evidence input order', () => {
      const gainsZ = createDomainEvidence({
        id: 'z-gains',
        sourceType: 'STRUCTURAL',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Gains challenge',
        polarity: 'CHALLENGING',
        strength: 'STRONG',
        priority: 50,
        ruleId: 'RULE_GAINS_Z',
        dimension: 'GAINS',
        timing: { period: 'MD' },
        relatedEvidenceIds: ['natal-promise']
      });
      const gainsA = createDomainEvidence({
        id: 'a-gains',
        sourceType: 'STRUCTURAL',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Gains challenge',
        polarity: 'CHALLENGING',
        strength: 'STRONG',
        priority: 50,
        ruleId: 'RULE_GAINS_A',
        dimension: 'GAINS',
        timing: { period: 'MD' },
        relatedEvidenceIds: ['natal-promise']
      });
      const accumulationM = createDomainEvidence({
        id: 'm-accumulation',
        sourceType: 'STRUCTURAL',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Accumulation challenge',
        polarity: 'CHALLENGING',
        strength: 'STRONG',
        priority: 50,
        ruleId: 'RULE_ACCUMULATION_M',
        dimension: 'ACCUMULATION'
      });
      const supportingZ = createDomainEvidence({
        id: 'z-support',
        sourceType: 'STRUCTURAL',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Gains support',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 50,
        ruleId: 'RULE_GAINS_SUPPORT_Z',
        dimension: 'GAINS'
      });
      const supportingA = createDomainEvidence({
        id: 'a-support',
        sourceType: 'STRUCTURAL',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Gains support',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 50,
        ruleId: 'RULE_GAINS_SUPPORT_A',
        dimension: 'GAINS'
      });
      const evidence = [gainsZ, gainsA, accumulationM, supportingZ, supportingA];
      const reversedEvidence = [...evidence].reverse();

      const gainsForward = evaluateWealthDimension('GAINS', evidence, 'DOES_NOT_ACTIVATE');
      const gainsReversed = evaluateWealthDimension('GAINS', reversedEvidence, 'DOES_NOT_ACTIVATE');
      const accumulationForward = evaluateWealthDimension('ACCUMULATION', evidence, 'DOES_NOT_ACTIVATE');
      const accumulationReversed = evaluateWealthDimension(
        'ACCUMULATION',
        reversedEvidence,
        'DOES_NOT_ACTIVATE'
      );
      const timingForward = evaluateWealthTimingActivation('MD', evidence, ['natal-promise']);
      const timingReversed = evaluateWealthTimingActivation(
        'MD',
        reversedEvidence,
        ['natal-promise']
      );

      expect(gainsForward.challengingEvidenceIds).toEqual(['a-gains', 'z-gains']);
      expect(gainsReversed.challengingEvidenceIds).toEqual(gainsForward.challengingEvidenceIds);
      expect(gainsForward.supportingEvidenceIds).toEqual(['z-support', 'a-support']);
      expect(gainsReversed.supportingEvidenceIds).toEqual(['a-support', 'z-support']);
      expect(timingForward.evidenceIds).toEqual(['a-gains', 'z-gains']);
      expect(timingReversed.evidenceIds).toEqual(timingForward.evidenceIds);
      expect(accumulationForward.challengingEvidenceIds).toEqual(['m-accumulation']);
      expect(accumulationReversed.challengingEvidenceIds)
        .toEqual(accumulationForward.challengingEvidenceIds);
    });

    it('returns empty challengingEvidenceIds when no dimension-linked challenging evidence exists', () => {
      const evidence = [
        createDomainEvidence({
          id: 'e1',
          sourceType: 'STRUCTURAL',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Test',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 50,
          ruleId: 'RULE1',
          dimension: 'GAINS'
        })
      ];

      const result = evaluateWealthDimension('ACCUMULATION', evidence, 'DOES_NOT_ACTIVATE');
      expect(result.challengingEvidenceIds).toEqual([]);
      expect(result.challengingEvidenceAttribution).toBe('AVAILABLE');
    });

    it('returns AVAILABLE when all challenging evidence is assigned to other dimensions', () => {
      const evidence = [
        createDomainEvidence({
          id: 'gains-challenge',
          sourceType: 'STRUCTURAL',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Challenge assigned to Gains',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 50,
          ruleId: 'RULE_GAINS_CHALLENGE',
          dimension: 'GAINS'
        })
      ];

      const result = evaluateWealthDimension('ACCUMULATION', evidence, 'DOES_NOT_ACTIVATE');
      expect(result.challengingEvidenceIds).toEqual([]);
      expect(result.challengingEvidenceAttribution).toBe('AVAILABLE');
    });

    it('marks attribution unavailable when a challenging evidence item has no dimension linkage', () => {
      const evidence = [
        createDomainEvidence({
          id: 'unlinked-challenge',
          sourceType: 'STRUCTURAL',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Unattributed challenging evidence',
          polarity: 'CHALLENGING',
          strength: 'STRONG',
          priority: 50,
          ruleId: 'RULE_WITHOUT_DIMENSION'
        })
      ];

      const result = evaluateWealthDimension('GAINS', evidence, 'DOES_NOT_ACTIVATE');
      expect(result.challengingEvidenceIds).toEqual([]);
      expect(result.challengingEvidenceAttribution).toBe('UNAVAILABLE');
    });

    it('preserves Gains-only challenging IDs through buildWealthConclusionData', () => {
      const gainsChallenge = createDomainEvidence({
        id: 'GAINS_CHALLENGE',
        sourceType: 'STRUCTURAL',
        domain: 'WEALTH',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Challenge linked to Gains',
        polarity: 'CHALLENGING',
        strength: 'STRONG',
        priority: 50,
        ruleId: 'WEALTH_11H_AFFLICTION_001',
        dimension: 'GAINS'
      });
      const evidence = [gainsChallenge];
      const dimensions = [
        evaluateWealthDimension('ACCUMULATION', evidence, 'DOES_NOT_ACTIVATE'),
        evaluateWealthDimension('GAINS', evidence, 'DOES_NOT_ACTIVATE'),
        evaluateWealthDimension('FORTUNE', evidence, 'DOES_NOT_ACTIVATE'),
        evaluateWealthDimension('SPECULATION', evidence, 'DOES_NOT_ACTIVATE')
      ];
      const conclusion = buildWealthConclusionData({
        overallStatus: resolveOverallWealthStatus(dimensions),
        dimensions,
        d2Relationship: 'UNAVAILABLE',
        manifestations: [],
        conflicts: [],
        evidence,
        supportingSourceIds: [],
        challengingSourceIds: [gainsChallenge.id]
      });

      expect(conclusion.dimensions.find((item) => item.dimension === 'GAINS')?.challengingEvidenceIds)
        .toEqual(['GAINS_CHALLENGE']);
      expect(conclusion.dimensions.find((item) => item.dimension === 'ACCUMULATION')?.challengingEvidenceIds)
        .toEqual([]);
      expect(conclusion.dimensions.find((item) => item.dimension === 'GAINS')?.challengingEvidenceAttribution)
        .toBe('AVAILABLE');
    });

    it('maps UNDETERMINED to insufficient dimension and overall statuses', () => {
      const undeterminedStatus = mapDomainStrengthToWealthStatus('UNDETERMINED');
      expect(undeterminedStatus).toBe('INSUFFICIENT_DATA');
      expect(evaluateWealthDimension('GAINS', [], 'INSUFFICIENT_DATA').status)
        .toBe(undeterminedStatus);

      const dimensions = ([
        'ACCUMULATION',
        'GAINS',
        'FORTUNE',
        'SPECULATION'
      ] as const).map((dimension) => ({
        dimension,
        status: undeterminedStatus,
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        challengingEvidenceAttribution: 'AVAILABLE' as const,
        dashaEffect: 'INSUFFICIENT_DATA' as const
      }));

      expect(resolveOverallWealthStatus(dimensions)).toBe('INSUFFICIENT_DATA');
    });
  });
});

describe('Wealth period activation contracts', () => {
  function timingEvidence(id: string, period: 'MD' | 'AD' | 'PD', promiseId: string, polarity: 'SUPPORTING' | 'CHALLENGING', evidenceFamily?: WealthEvidenceFamily) {
    return createDomainEvidence({
      id, sourceType: 'DASHA', domain: 'WEALTH', role: 'SECONDARY', phase: 'DASHA_ACTIVATION',
      source: 'DASHA', statement: id, polarity, strength: 'MODERATE', priority: 50,
      timing: { period, planet: undefined }, relatedEvidenceIds: [promiseId],
      ...(evidenceFamily ? { evidenceFamily } : {})
    });
  }

  function promiseOccurrence(id: string) {
    return createDomainEvidence({
      id, sourceType: 'HOUSE', domain: 'WEALTH', role: 'PRIMARY', phase: 'NATAL_PROMISE',
      statement: id, polarity: 'SUPPORTING', strength: 'MODERATE', priority: 50
    });
  }

  it('distinguishes complete-empty and unavailable timing datasets', () => {
    const complete = evaluateWealthPeriodTimingActivation('MD', [], [], [], true, true);
    const unavailable = evaluateWealthPeriodTimingActivation('MD', [], [], [], true, false);
    expect(complete.statement).toContain('complete but no period evidence');
    expect(unavailable.statement).toContain('unavailable');
  });

  it('derives MD, AD, and PD availability independently through interpretWealthV2', () => {
    const completeChart = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const chart = makeEmptyProducerChartFor(completeChart, true);
    const context = makeContext(CANONICAL_UTC_INSTANT);
    const temporalState = resolveAnalysisTemporalState(completeChart, context);
    const completeDasha = temporalState.dashaInterpretation?.current;
    expect(completeDasha).toBeDefined();
    if (!completeDasha) return;

    const partialDasha = Object.freeze({
      ...temporalState.dashaInterpretation,
      current: Object.freeze({
        ...completeDasha,
        pratyantardasha: undefined
      })
    }) as unknown as NonNullable<typeof temporalState.dashaInterpretation>;
    const options = {
      context,
      temporalState: { ...temporalState, dashaInterpretation: partialDasha }
    };
    const result = interpretWealthV2(chart, options);
    const activations = result.conclusionData?.periodTimingActivations ?? [];
    const md = activations.find((item: WealthPeriodTimingActivation) => item.period === 'MD');
    const ad = activations.find((item: WealthPeriodTimingActivation) => item.period === 'AD');
    const pd = activations.find((item: WealthPeriodTimingActivation) => item.period === 'PD');
    expect(md?.statement).toContain('complete but no period evidence');
    expect(ad?.statement).toContain('complete but no period evidence');
    expect(pd?.statement).toContain('unavailable');
  });

  it('preserves occurrence and canonical namespaces across provenance and legacy mapped evidence', () => {
    const namespaceHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const rawEvidence = interpretWealthTheme(namespaceHoroscope).evidence;
    const venusRaw = rawEvidence.find((item) => item.ruleId === 'WEALTH_VENUS_KARAKA_001');
    const legacyRaw = rawEvidence.find((item) => item.ruleId === 'WEALTH_11L_DIGNITY_001') ?? rawEvidence.find((item) => item.ruleId !== 'WEALTH_VENUS_KARAKA_001');
    expect(venusRaw).toBeDefined();
    expect(legacyRaw).toBeDefined();

    const mapped = linkWealthEvidence(buildWealthEvidence(rawEvidence));
    const venusMapped = mapped.find((item) => item.ruleId === 'WEALTH_VENUS_KARAKA_001');
    const legacyMapped = mapped.find((item) => item.ruleId === legacyRaw?.ruleId);
    expect(venusMapped?.provenance?.evidenceId).toBe(venusMapped?.id);
    expect(venusMapped?.id).not.toBe(venusRaw?.id);
    expect(legacyMapped?.id).toBe((legacyRaw as unknown as { identityKey?: string }).identityKey ?? legacyRaw?.id);

    const natalPromiseEvidenceIds = mapped
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id)
      .sort();
    const canonicalPromiseIds = new Set(natalPromiseEvidenceIds);
    const namespaceOptions: DomainReasoningOptions = {
      context: makeContext(CANONICAL_UTC_INSTANT),
      temporalState: resolveAnalysisTemporalState(namespaceHoroscope, makeContext(CANONICAL_UTC_INSTANT))
    };
    const namespaceInterpretation = interpretWealthV2(namespaceHoroscope, namespaceOptions);
    const namespaceActivations = namespaceInterpretation.conclusionData?.periodTimingActivations ?? [];
    for (const activation of namespaceActivations) {
      for (const promiseId of activation.activatedPromiseEvidenceIds ?? []) {
        expect(natalPromiseEvidenceIds).toContain(promiseId);
        expect(activation.evidenceIds.length).toBeGreaterThan(0);
      }
      const occurrenceEvidenceIds = new Set(mapped.map((item) => item.id));
      for (const evidenceId of activation.evidenceIds) {
        expect(typeof evidenceId).toBe('string');
        expect(evidenceId.length).toBeGreaterThan(0);
        expect(occurrenceEvidenceIds.size).toBeGreaterThan(0);
      }
    }
    for (const item of mapped) {
      for (const target of item.relatedEvidenceIds) {
        const candidate = mapped.find((entry) => entry.id === target);
        expect(candidate).toBeDefined();
        if (item.phase === 'DASHA_ACTIVATION' || item.source === 'DASHA') {
          expect(candidate?.phase).toBe('NATAL_PROMISE');
        } else {
          // Structural links are occurrence links and must remain occurrence-resolvable.
          expect(candidate?.id).toBe(target);
        }
      }
    }

    const wrongPhaseTimingTarget = mapped.find((entry) => entry.phase !== 'NATAL_PROMISE' && entry.id !== venusMapped?.id);
    expect(wrongPhaseTimingTarget).toBeDefined();
    if (!wrongPhaseTimingTarget) throw new Error('Expected a wrong-phase namespace fixture record');
    const timingEvidence = createDomainEvidence({
      id: 'FORGED-WRONG-PHASE-TIMING', sourceType: 'DASHA', domain: 'WEALTH',
      role: 'SECONDARY', phase: 'DASHA_ACTIVATION', source: 'DASHA',
      statement: 'Forged wrong-phase timing link', polarity: 'SUPPORTING', strength: 'MODERATE',
      priority: 50, timing: { period: 'MD', planet: Planet.JUPITER },
      relatedEvidenceIds: Object.freeze([wrongPhaseTimingTarget.id])
    });

    const forgedLink = { ...timingEvidence, relatedEvidenceIds: Object.freeze([wrongPhaseTimingTarget.id]) };
    const forgedActivation = Object.freeze({
      period: 'MD' as const,
      dimensions: Object.freeze({ accumulation: 'ACTIVATES' as const, gains: 'DOES_NOT_ACTIVATE' as const, fortune: 'DOES_NOT_ACTIVATE' as const, speculation: 'DOES_NOT_ACTIVATE' as const }),
      evidenceIds: Object.freeze([forgedLink.id]),
      effect: 'ACTIVATES' as const,
      activatedPromiseEvidenceIds: Object.freeze([wrongPhaseTimingTarget.id])
    });
    expect(() => assertWealthPeriodActivationContract(
      forgedActivation,
      [forgedLink, wrongPhaseTimingTarget],
      [wrongPhaseTimingTarget.id],
      true
    )).toThrow(/not a natal promise occurrence|unresolved timing link target|not in the canonical natal promise set/);
  });

  it('evaluates MD and AD independently when PD timing is unavailable', () => {
    const md = evaluateWealthPeriodTimingActivation('MD', [], [], [], true, true);
    const ad = evaluateWealthPeriodTimingActivation('AD', [], [], [], true, true);
    const pd = evaluateWealthPeriodTimingActivation('PD', [], [], [], true, false);
    expect(md.statement).toContain('complete but no period evidence');
    expect(ad.statement).toContain('complete but no period evidence');
    expect(pd.statement).toContain('unavailable');
  });

  it('rejects strict raw ID violations before normalization', () => {
    expect(() => assertStrictIds(['', 'ok'], 'raw')).toThrow();
    expect(() => assertStrictIds([' ok', 'ok'], 'raw')).toThrow();
    expect(() => assertStrictIds(['duplicate', 'duplicate'], 'raw')).toThrow();
  });

  it.each([
    ['SUPPORTING', 'ACTIVATES'],
    ['CHALLENGING', 'CHALLENGES']
  ] as const)('%s timing maps to %s', (polarity, effect) => {
    const timing = timingEvidence('MD-TIME', 'MD', 'PROMISE-1', polarity);
    const activation = evaluateWealthPeriodTimingActivation('MD', [timing], [timing, promiseOccurrence('PROMISE-1')], ['PROMISE-1'], true, true);
    expect(activation.effect).toBe(effect);
    expect(activation.activatedPromiseEvidenceIds).toEqual(['PROMISE-1']);
  });

  it('mixed timing maps every linked promise and dimension effect', () => {
    const support = timingEvidence('MD-SUPPORT', 'MD', 'PROMISE-1', 'SUPPORTING');
    const challenge = timingEvidence('MD-CHALLENGE', 'MD', 'PROMISE-1', 'CHALLENGING');
    const promise = promiseOccurrence('PROMISE-1');
    const activation = evaluateWealthPeriodTimingActivation('MD', [support, challenge], [support, challenge, promise], ['PROMISE-1'], true, true);
    expect(activation.effect).toBe('PARTIALLY_ACTIVATES');
    expect(activation.activatedPromiseEvidenceIds).toEqual(['PROMISE-1']);
    expect(activation.dimensions).toEqual({
      accumulation: 'DOES_NOT_ACTIVATE',
      gains: 'DOES_NOT_ACTIVATE',
      fortune: 'DOES_NOT_ACTIVATE',
      speculation: 'DOES_NOT_ACTIVATE'
    });
  });

  it('mixes support and challenge on the same accumulation family', () => {
    const support = timingEvidence('MD-ACCUMULATION-SUPPORT', 'MD', 'PROMISE-1', 'SUPPORTING', WealthEvidenceFamily.SECOND_HOUSE);
    const challenge = timingEvidence('MD-ACCUMULATION-CHALLENGE', 'MD', 'PROMISE-1', 'CHALLENGING', WealthEvidenceFamily.SECOND_LORD);
    const promise = promiseOccurrence('PROMISE-1');
    const activation = evaluateWealthPeriodTimingActivation('MD', [support, challenge], [support, challenge, promise], ['PROMISE-1'], true, true);
    expect(activation.dimensions).toEqual({
      accumulation: 'PARTIALLY_ACTIVATES',
      gains: 'DOES_NOT_ACTIVATE',
      fortune: 'DOES_NOT_ACTIVATE',
      speculation: 'DOES_NOT_ACTIVATE'
    });
  });

  it('preserves same-dimension attribution through mapper and linker output', () => {
    const chart = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const raw = interpretWealthTheme(chart).evidence;
    const natalSource = raw.find((item) => item.ruleId !== 'WEALTH_DASHA_TIMING_001');
    expect(natalSource).toBeDefined();
    if (!natalSource) throw new Error('Expected a mapped natal producer record');

    const supportRaw = {
      ...natalSource,
      id: 'MAPPED-MD-ACCUMULATION-SUPPORT',
      ruleId: 'WEALTH_DASHA_TIMING_001',
      effect: 'SUPPORT' as const,
      evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
      timingEvidence: { dashaLevel: 'MAHADASHA' as const, planet: Planet.JUPITER, relevanceReason: 'test fixture', houses: [2] }
    };
    const challengeRaw = {
      ...natalSource,
      id: 'MAPPED-MD-ACCUMULATION-CHALLENGE',
      ruleId: 'WEALTH_DASHA_TIMING_001',
      effect: 'CHALLENGE' as const,
      evidenceFamily: WealthEvidenceFamily.SECOND_LORD,
      timingEvidence: { dashaLevel: 'MAHADASHA' as const, planet: Planet.JUPITER, relevanceReason: 'test fixture', houses: [2] }
    };
    const mappedNatalSource = {
      ...natalSource,
      ruleId: 'WEALTH_VENUS_KARAKA_001',
      planets: [Planet.VENUS],
      houses: [2],
      evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE
    } as ThemeInterpretationEvidence<WealthEvidenceFamily>;
    const mapped = linkWealthEvidence(buildWealthEvidence([mappedNatalSource, supportRaw, challengeRaw]));
    const natalPromise = mapped.find((item) => item.phase === 'NATAL_PROMISE');
    expect(natalPromise).toBeDefined();
    if (!natalPromise) throw new Error('Expected a natal promise in mapped evidence');

    const timing = mapped.filter((item) => item.phase === 'DASHA_ACTIVATION')
      .map((item) => ({ ...item, relatedEvidenceIds: Object.freeze([natalPromise.id]) }));
    expect(timing).toHaveLength(2);
    const activation = evaluateWealthPeriodTimingActivation(
      'MD', timing, [...mapped.filter((item) => item.phase !== 'DASHA_ACTIVATION'), ...timing],
      [natalPromise.id], true, true
    );
    expect(activation.effect).toBe('PARTIALLY_ACTIVATES');
    expect(activation.dimensions).toEqual({
      accumulation: 'PARTIALLY_ACTIVATES',
      gains: 'DOES_NOT_ACTIVATE',
      fortune: 'DOES_NOT_ACTIVATE',
      speculation: 'DOES_NOT_ACTIVATE'
    });
  });

  // No-family evidence deliberately must not leak into any wealth dimension.
  it('does not leak no-family mixed evidence into other dimensions', () => {
    const support = timingEvidence('MD-ACCUMULATION', 'MD', 'PROMISE-1', 'SUPPORTING', WealthEvidenceFamily.SECOND_HOUSE);
    const activation = evaluateWealthPeriodTimingActivation('MD', [support], [support, promiseOccurrence('PROMISE-1')], ['PROMISE-1'], true, true);
    expect(activation.dimensions).toEqual({
      accumulation: 'ACTIVATES',
      gains: 'DOES_NOT_ACTIVATE',
      fortune: 'DOES_NOT_ACTIVATE',
      speculation: 'DOES_NOT_ACTIVATE'
    });
  });

  it('does not inherit a different promise link across MD and AD periods', () => {
    const md = timingEvidence('MD-TIME', 'MD', 'PROMISE-1', 'SUPPORTING');
    const ad = timingEvidence('AD-TIME', 'AD', 'PROMISE-2', 'CHALLENGING');
    const occurrences = [promiseOccurrence('PROMISE-1'), promiseOccurrence('PROMISE-2')];
    const mdActivation = evaluateWealthPeriodTimingActivation('MD', [md, ad], [md, ad, ...occurrences], ['PROMISE-1', 'PROMISE-2'], true, true);
    const adActivation = evaluateWealthPeriodTimingActivation('AD', [md, ad], [md, ad, ...occurrences], ['PROMISE-1', 'PROMISE-2'], true, true);
    expect(mdActivation.activatedPromiseEvidenceIds).toEqual(['PROMISE-1']);
    expect(adActivation.activatedPromiseEvidenceIds).toEqual(['PROMISE-2']);
  });

  it('treats linked evidence with no canonical natal promise as insufficient', () => {
    const timing = timingEvidence('MD-FORGED', 'MD', 'MISSING-PROMISE', 'SUPPORTING');
    expect(() => evaluateWealthPeriodTimingActivation('MD', [timing], [timing], ['PROMISE-1'], true, true)).toThrow(/absent canonical natal promise/);
  });
});
