import type { DomainConflict } from './DomainConflict';
import { createDomainConclusion, type DomainConclusion } from './DomainConclusion';
import type { DomainEvidence } from './DomainEvidence';
import { createDashaActivation, type DashaActivation } from './DashaActivation';
import type { DomainManifestation } from './ManifestationMode';
import type { NatalPromise } from './NatalPromise';
import { createTransitTrigger, type TransitTrigger } from './TransitTrigger';
import type { VargaConfirmation } from './VargaConfirmation';
import type { DomainId } from './DomainInterpretationTypes';
import type { CareerTimingActivation, CareerConclusionData, CareerDataCompleteness } from '../career/careerTypes';
import type {
  WealthTimingActivation,
  WealthPeriodTimingActivation,
  WealthConclusionData,
  WealthDataCompleteness
} from '../wealth/wealthTypes';
import type { ReasoningTrace } from '../reasoning/reasoningTypes';

export type DomainTimingActivation = CareerTimingActivation | WealthTimingActivation;

export interface CommonDomainConclusionFields {
  readonly natalStatus?: string;
  readonly overallStatus?: string;
  readonly accumulationStatus?: string;
  readonly gainsStatus?: string;
  readonly fortuneStatus?: string;
  readonly speculationStatus?: string;
  readonly d2Relationship?: string;
  readonly d10Relationship?: string;
  readonly currentActivation?: string;
  readonly currentPressure?: string;
  readonly [key: string]: any;
}

export type DomainConclusionData =
  | (CareerConclusionData & CommonDomainConclusionFields)
  | (WealthConclusionData & CommonDomainConclusionFields)
  | CommonDomainConclusionFields;
export type DomainDataCompleteness =
  | (CareerDataCompleteness & { readonly d2?: string })
  | (WealthDataCompleteness & { readonly d10?: string })
  | Record<string, any>;

export interface DomainInterpretation {
  readonly domain: DomainId;
  readonly version: 'V2';
  readonly evidence: readonly DomainEvidence[];
  readonly natalPromise: NatalPromise;
  readonly dashaActivation: DashaActivation;
  readonly transitTrigger: TransitTrigger;
  readonly vargaConfirmations: readonly VargaConfirmation[];
  readonly manifestations: readonly DomainManifestation[];
  readonly conflicts: readonly DomainConflict[];
  readonly conclusion: DomainConclusion;
  readonly timingActivations?: readonly DomainTimingActivation[];
  readonly periodTimingActivations?: readonly WealthPeriodTimingActivation[];
  readonly dataCompleteness?: DomainDataCompleteness;
  readonly conclusionData?: DomainConclusionData;
  readonly reasoningTrace?: ReasoningTrace;
  readonly reasoningVersion?: 'CW-01' | 'CW-02' | 'CW-03' | 'CW-04' | 'CW-05' | string;
  readonly generatedAt: string;
}

export function createDomainInterpretation(
  interpretation: Partial<DomainInterpretation> & {
    domain: DomainId;
    natalPromise: NatalPromise;
  }
): DomainInterpretation {
  const evidence = interpretation.evidence ?? [];
  const vargaConfirmations = interpretation.vargaConfirmations ?? [];
  const manifestations = interpretation.manifestations ?? [];
  const conflicts = interpretation.conflicts ?? [];

  return Object.freeze({
    domain: interpretation.domain,
    version: interpretation.version ?? 'V2',
    evidence: Object.freeze([...evidence]),
    natalPromise: interpretation.natalPromise,
    dashaActivation:
      interpretation.dashaActivation ??
      createDashaActivation({
        domain: interpretation.domain,
        active: false,
        effect: 'INSUFFICIENT_DATA',
        strength: 'UNDETERMINED',
        confidence: 'UNDETERMINED',
        statement: '',
        evidenceIds: [],
        activatedPromiseEvidenceIds: []
      }),
    transitTrigger:
      interpretation.transitTrigger ??
      createTransitTrigger({
        domain: interpretation.domain,
        active: false,
        effect: 'NO_MATERIAL_TRIGGER',
        strength: 'UNDETERMINED',
        confidence: 'UNDETERMINED',
        statement: '',
        evidenceIds: [],
        triggeredPromiseEvidenceIds: []
      }),
    vargaConfirmations: Object.freeze([...vargaConfirmations]),
    manifestations: Object.freeze([...manifestations]),
    conflicts: Object.freeze([...conflicts]),
    conclusion:
      interpretation.conclusion ??
      createDomainConclusion({
        domain: interpretation.domain,
        strength: interpretation.natalPromise.strength,
        confidence: interpretation.natalPromise.confidence,
        statement: interpretation.natalPromise.statement,
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        unresolvedQuestions: []
      }),
    ...(interpretation.timingActivations
      ? {
          timingActivations: Object.freeze([
            ...interpretation.timingActivations
          ])
        }
      : {}),
    ...(interpretation.periodTimingActivations
      ? {
          periodTimingActivations: Object.freeze([
            ...interpretation.periodTimingActivations
          ])
        }
      : {}),
    ...(interpretation.conclusionData
      ? {
          conclusionData: Object.freeze({
            ...interpretation.conclusionData
          })
        }
      : {}),
    ...(interpretation.dataCompleteness
      ? {
          dataCompleteness: Object.freeze({
            ...interpretation.dataCompleteness
          })
        }
      : {}),
    ...(interpretation.reasoningTrace
      ? {
          reasoningTrace: interpretation.reasoningTrace
        }
      : {}),
    ...(interpretation.reasoningVersion
      ? {
          reasoningVersion: interpretation.reasoningVersion
        }
      : {}),
    generatedAt:
      interpretation.generatedAt ?? new Date().toISOString()
  });
}
