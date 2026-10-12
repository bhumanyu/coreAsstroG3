import { calculateHoroscope } from '../src/engine/astroEngine';
import { interpretCareerV2 } from '../src/domain/career/CareerDomainInterpreterV2';
import { CANONICAL_BIRTH_DETAILS } from '../src/test/fixtures/canonicalChart';
import { createAnalysisContext } from '../src/core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../src/core/analysis/resolveAnalysisTemporalState';

const testMethodology = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
};

async function main() {
  const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = createAnalysisContext({ asOf: '2024-01-01T00:00:00Z', methodology: testMethodology });
  const temporalState = resolveAnalysisTemporalState(horoscope, context);
  const options = { context, temporalState };
  const interpretation = interpretCareerV2(horoscope, options);

  // Extract the relevant fields for the golden baseline
  const goldenBaseline = {
    placeholder: false,
    conclusion: {
      strength: interpretation.conclusion.strength,
      confidence: interpretation.conclusion.confidence,
      statement: interpretation.conclusion.statement,
      primaryEvidenceIds: interpretation.conclusion.primaryEvidenceIds,
      supportingEvidenceIds: interpretation.conclusion.supportingEvidenceIds,
      challengingEvidenceIds: interpretation.conclusion.challengingEvidenceIds
    },
    natalPromise: {
      strength: interpretation.natalPromise.strength,
      confidence: interpretation.natalPromise.confidence,
      statement: interpretation.natalPromise.statement,
      evidenceIds: interpretation.natalPromise.evidenceIds,
      supportingEvidenceIds: interpretation.natalPromise.supportingEvidenceIds,
      challengingEvidenceIds: interpretation.natalPromise.challengingEvidenceIds
    },
    dashaActivation: {
      active: interpretation.dashaActivation.active,
      effect: interpretation.dashaActivation.effect,
      strength: interpretation.dashaActivation.strength,
      confidence: interpretation.dashaActivation.confidence,
      statement: interpretation.dashaActivation.statement,
      evidenceIds: interpretation.dashaActivation.evidenceIds,
      activatedPromiseEvidenceIds: interpretation.dashaActivation.activatedPromiseEvidenceIds
    },
    transitTrigger: {
      active: interpretation.transitTrigger.active,
      effect: interpretation.transitTrigger.effect,
      strength: interpretation.transitTrigger.strength,
      confidence: interpretation.transitTrigger.confidence,
      statement: interpretation.transitTrigger.statement,
      evidenceIds: interpretation.transitTrigger.evidenceIds,
      triggeredPromiseEvidenceIds: interpretation.transitTrigger.triggeredPromiseEvidenceIds
    },
    vargaConfirmations: interpretation.vargaConfirmations,
    timingActivations: interpretation.timingActivations,
    evidenceCount: interpretation.evidence.length,
    evidenceIds: interpretation.evidence.map(e => e.id).sort(),
    canonicalC11Synthesis: interpretation.conclusionData?.canonicalCareerFinalSynthesis,
    reasoningTrace: interpretation.reasoningTrace
  };

  console.log(JSON.stringify(goldenBaseline, null, 2));
}

main().catch(console.error);
