import type { DomainInterpretation } from './DomainInterpretation';
import type { DomainEvidence } from './DomainEvidence';
import type { NatalPromise } from './NatalPromise';
import type { DashaActivation } from './DashaActivation';
import type { TransitTrigger } from './TransitTrigger';
import type { VargaConfirmation } from './VargaConfirmation';
import type { DomainConflict } from './DomainConflict';
import type { DomainManifestation } from './ManifestationMode';
import type { DomainConclusion } from './DomainConclusion';
import type { DomainId } from './DomainInterpretationTypes';

export interface DomainInterpretationParts {
  readonly domain: DomainId;
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
}

export interface BuildDomainInterpretationOptions {
  readonly clock?: () => string;
}

export function buildDomainInterpretation(
  parts: DomainInterpretationParts,
  options?: BuildDomainInterpretationOptions
): DomainInterpretation {
  validateDomainInterpretationParts(parts);

  const timestamp = options?.clock ? options.clock() : new Date().toISOString();

  return Object.freeze({
    domain: parts.domain,
    version: 'V2' as const,
    evidence: Object.freeze([
      ...parts.evidence
    ]),
    natalPromise: parts.natalPromise,
    dashaActivation: parts.dashaActivation,
    transitTrigger: parts.transitTrigger,
    vargaConfirmations: Object.freeze([
      ...parts.vargaConfirmations
    ]),
    manifestations: Object.freeze([
      ...parts.manifestations
    ]),
    conflicts: Object.freeze([
      ...parts.conflicts
    ]),
    conclusion: parts.conclusion,
    ...(parts.timingActivations ? { timingActivations: Object.freeze([...parts.timingActivations]) } : {}),
    ...(parts.dataCompleteness !== undefined ? { dataCompleteness: parts.dataCompleteness } : {}),
    generatedAt: timestamp
  });
}

export function validateDomainInterpretationParts(
  parts: DomainInterpretationParts
): void {
  if (parts.natalPromise.domain !== parts.domain) {
    throw new Error(
      'Natal promise domain does not match interpretation domain.'
    );
  }

  if (parts.dashaActivation.domain !== parts.domain) {
    throw new Error(
      'Dasha activation domain does not match interpretation domain.'
    );
  }

  if (parts.transitTrigger.domain !== parts.domain) {
    throw new Error(
      'Transit trigger domain does not match interpretation domain.'
    );
  }

  if (parts.conclusion.domain !== parts.domain) {
    throw new Error(
      'Domain conclusion does not match interpretation domain.'
    );
  }

  for (const confirmation of parts.vargaConfirmations) {
    if (confirmation.domain !== parts.domain) {
      throw new Error(
        'Varga confirmation domain does not match interpretation domain.'
      );
    }
  }

  for (const manifestation of parts.manifestations) {
    if (!manifestation.statement.trim()) {
      throw new Error(
        'Domain manifestation statement cannot be empty.'
      );
    }
  }
}
