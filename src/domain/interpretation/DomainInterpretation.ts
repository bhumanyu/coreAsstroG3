import type { DomainConflict } from './DomainConflict';
import type { DomainConclusion } from './DomainConclusion';
import type { DomainEvidence } from './DomainEvidence';
import type { DashaActivation } from './DashaActivation';
import type { DomainManifestation } from './ManifestationMode';
import type { NatalPromise } from './NatalPromise';
import type { TransitTrigger } from './TransitTrigger';
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
  readonly generatedAt: string;
}

export function createDomainInterpretation(
  interpretation: DomainInterpretation
): DomainInterpretation {
  return Object.freeze({
    ...interpretation,
    evidence: Object.freeze([
      ...interpretation.evidence
    ]),
    vargaConfirmations: Object.freeze([
      ...interpretation.vargaConfirmations
    ]),
    manifestations: Object.freeze([
      ...interpretation.manifestations
    ]),
    conflicts: Object.freeze([
      ...interpretation.conflicts
    ])
  });
}
