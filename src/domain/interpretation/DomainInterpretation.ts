import type { DomainConflict } from './DomainConflict';
import { createDomainConclusion, type DomainConclusion } from './DomainConclusion';
import type { DomainEvidence } from './DomainEvidence';
import { createDashaActivation, type DashaActivation } from './DashaActivation';
import type { DomainManifestation } from './ManifestationMode';
import type { NatalPromise } from './NatalPromise';
import { createTransitTrigger, type TransitTrigger } from './TransitTrigger';
import type { VargaConfirmation } from './VargaConfirmation';
import type { DomainId } from './DomainInterpretationTypes';

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
  readonly timingActivations?: readonly any[];
  readonly dataCompleteness?: any;
  readonly conclusionData?: any;
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
    generatedAt:
      interpretation.generatedAt ?? new Date().toISOString()
  });
}
