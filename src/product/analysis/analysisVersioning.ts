import type {
  ProductAnalysis,
  ProductAnalysisVersionManifest,
  ProductAiExplanationVersionManifest,
  ProductDeterministicVersionManifest,
  ProductReplayAssessment,
  ProductVersionComponent
} from './productAnalysisTypes';

export const PRODUCT_ANALYSIS_SCHEMA_VERSION = 'ProductAnalysis-v1' as const;

const notRecorded = (reason: string, source = 'LEGACY_ANALYSIS_MIGRATION'): ProductVersionComponent =>
  Object.freeze({ status: 'NOT_RECORDED', reason, source });

/**
 * Adds explicit pre-D02 provenance states to a legacy ProductAnalysis without
 * fabricating versions. It never changes existing calculation outcomes.
 */
export function migrateLegacyProductAnalysis(value: ProductAnalysis): ProductAnalysis {
  if (value.versionManifest) return value;
  const unknown = notRecorded('PRE_D02_RECORD_DID_NOT_CAPTURE_THIS_VERSION');
  const deterministic: ProductDeterministicVersionManifest = Object.freeze({
    manifestVersion: 'D02-v1',
    calculationEngine: value.engineVersion
      ? Object.freeze({ status: 'RECORDED', version: value.engineVersion, source: 'LEGACY_AGGREGATE_FIELD' })
      : notRecorded('LEGACY_ENGINE_VERSION_MISSING'),
    referenceDatasets: Object.freeze({
      DEFAULT: notRecorded('LEGACY_REFERENCE_DATASET_VERSIONS_NOT_CAPTURED')
    }),
    ruleCatalogue: value.rulesVersion
      ? Object.freeze({ status: 'RECORDED', version: value.rulesVersion, source: 'LEGACY_AGGREGATE_FIELD' })
      : notRecorded('LEGACY_RULE_VERSION_MISSING'),
    careerLogic: unknown,
    wealthLogic: unknown,
    careerSynthesis: unknown,
    wealthSynthesis: unknown,
    outputSchema: Object.freeze({ status: 'RECORDED', version: PRODUCT_ANALYSIS_SCHEMA_VERSION, source: 'MIGRATION_CONTRACT' }),
    methodology: Object.freeze({
      zodiacSystem: value.methodology.zodiacSystem,
      houseSystem: value.methodology.houseSystem,
      ayanamsa: value.methodology.ayanamsa,
      vargaRules: value.methodology.vargaRules,
      dashaSystem: value.methodology.dashaSystem
    }),
    configuration: Object.freeze({}),
    inputRetention: 'UNKNOWN',
    replay: assessHistoricalReplay({
      requiredInputsRetained: null,
      requiredCodeAvailable: null,
      requiredDatasetsAvailable: null,
      manifestComplete: false
    })
  });
  return Object.freeze({
    ...value,
    versionManifest: Object.freeze({
      deterministic,
      aiExplanations: Object.freeze([])
    })
  });
}

export interface HistoricalReplayAvailability {
  readonly requiredInputsRetained: boolean | null;
  readonly requiredCodeAvailable: boolean | null;
  readonly requiredDatasetsAvailable: boolean | null;
  readonly manifestComplete: boolean;
}

/** Conservative policy: only explicit true for every prerequisite enables replay. */
export function assessHistoricalReplay(input: HistoricalReplayAvailability): ProductReplayAssessment {
  const reasonCodes: string[] = [];
  if (input.requiredInputsRetained !== true) reasonCodes.push('REQUIRED_INPUTS_NOT_CONFIRMED_RETAINED');
  if (input.requiredCodeAvailable !== true) reasonCodes.push('REQUIRED_CODE_NOT_CONFIRMED_AVAILABLE');
  if (input.requiredDatasetsAvailable !== true) reasonCodes.push('REQUIRED_DATASETS_NOT_CONFIRMED_AVAILABLE');
  if (!input.manifestComplete) reasonCodes.push('VERSION_MANIFEST_INCOMPLETE');
  const replayable = reasonCodes.length === 0;
  return Object.freeze({
    status: replayable ? 'REPLAYABLE_WITH_RETAINED_INPUTS' : 'NOT_REPLAYABLE',
    requiredInputsRetained: input.requiredInputsRetained,
    requiredCodeAvailable: input.requiredCodeAvailable,
    requiredDatasetsAvailable: input.requiredDatasetsAvailable,
    reasonCodes: Object.freeze(reasonCodes)
  });
}

/** AI explanation changes are compared independently from deterministic identity. */
export function sameDeterministicVersionManifest(
  left: ProductAnalysisVersionManifest,
  right: ProductAnalysisVersionManifest
): boolean {
  return JSON.stringify(left.deterministic) === JSON.stringify(right.deterministic);
}

export function aiExplanationVersionChanged(
  previous: readonly ProductAiExplanationVersionManifest[],
  next: readonly ProductAiExplanationVersionManifest[]
): boolean {
  return JSON.stringify(previous) !== JSON.stringify(next);
}
