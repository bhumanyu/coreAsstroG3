import type { Horoscope } from '../../types';
import type { DashaInterpretationReport } from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  buildThemeInterpretationContext
} from '../../engine/themeInterpretation/themeInterpretationContext';
import {
  produceWealthEvidence as produceRegisteredWealthEvidence
} from '../../engine/themeInterpretation/wealthEvidenceProducer';
import type {
  ThemeEvidenceEffect,
  ThemeEvidenceFactor,
  ThemeEvidencePriority,
  ThemeEvidenceStrength,
  ThemeTimingEvidence,
  ThemeTransitEvidence,
  VargaRelationship,
  VargaThemeEvidence
} from '../../engine/themeInterpretation/themeInterpretationTypes';
import { WealthEvidenceFamily } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationContextInput } from '../../engine/themeInterpretation/themeInterpretationContext';
import type { Planet } from '../../types';

export interface WealthEvidenceProducerRecord {
  readonly id: string;
  readonly ruleId: string;
  readonly evidenceFamily: WealthEvidenceFamily;
  readonly priority: ThemeEvidencePriority;
  readonly strength: ThemeEvidenceStrength;
  readonly effect: ThemeEvidenceEffect;
  readonly statement: string;
  readonly planets?: readonly Planet[];
  readonly houses?: readonly number[];
  readonly factors?: readonly ThemeEvidenceFactor[];
  readonly conditional?: boolean;
  readonly dimension?: 'NATAL_STRUCTURE' | 'MODIFIER' | 'CONFIRMATION' | 'TIMING';
  readonly vargaEvidence?: VargaThemeEvidence;
  readonly timingEvidence?: ThemeTimingEvidence;
  readonly transitEvidence?: ThemeTransitEvidence;
  readonly identityKey?: string;
}

export interface WealthEvidenceProducerOutput {
  readonly evidence: readonly WealthEvidenceProducerRecord[];
  readonly d2Relationship: VargaRelationship;
  readonly referenceDatasetAvailable: boolean;
}

export interface WealthEvidenceProducerInput {
  readonly horoscope: Horoscope;
  readonly dashaInterpretation?: DashaInterpretationReport;
}

export function produceWealthDomainEvidence(
  input: WealthEvidenceProducerInput
): WealthEvidenceProducerOutput {
  const contextInput: ThemeInterpretationContextInput = {
    horoscope: input.horoscope,
    dashaInterpretation: input.dashaInterpretation
  };
  const context = buildThemeInterpretationContext(contextInput);
  const production = produceRegisteredWealthEvidence(context);
  const evidence = Object.freeze(
    production.evidence.map((record): WealthEvidenceProducerRecord => ({
      id: record.id,
      ruleId: record.ruleId,
      evidenceFamily: record.evidenceFamily,
      priority: record.priority,
      strength: record.strength,
      effect: record.effect,
      statement: record.statement,
      ...(record.planets ? { planets: record.planets } : {}),
      ...(record.houses ? { houses: record.houses } : {}),
      ...(record.factors ? { factors: record.factors } : {}),
      ...(record.conditional !== undefined ? { conditional: record.conditional } : {}),
      ...(record.dimension ? { dimension: record.dimension } : {}),
      ...(record.vargaEvidence ? { vargaEvidence: record.vargaEvidence } : {}),
      ...(record.timingEvidence ? { timingEvidence: record.timingEvidence } : {}),
      ...(record.transitEvidence ? { transitEvidence: record.transitEvidence } : {}),
      ...(record.identityKey ? { identityKey: record.identityKey } : {})
    }))
  );
  const d2Records = evidence.filter(
    (record) =>
      record.evidenceFamily === WealthEvidenceFamily.D2 ||
      record.vargaEvidence?.varga === 'D2'
  );

  return Object.freeze({
    evidence,
    d2Relationship: resolveD2ProducerRelationship(d2Records),
    referenceDatasetAvailable: production.dataCompleteness === 'COMPLETE'
  });
}

function resolveD2ProducerRelationship(
  evidence: readonly WealthEvidenceProducerRecord[]
): VargaRelationship {
  if (evidence.length === 0) return 'UNAVAILABLE';

  const declaredRelationship = evidence.find((item) => item.vargaEvidence?.relationship)
    ?.vargaEvidence?.relationship;
  if (declaredRelationship) return declaredRelationship;

  const supports = evidence.some((item) => item.effect === 'SUPPORT');
  const challenges = evidence.some((item) => item.effect === 'CHALLENGE');
  if (supports && challenges) return 'PARTIALLY_CONFIRMS';
  if (supports) return 'CONFIRMS';
  if (challenges) return 'CONFLICTS';
  return 'UNAVAILABLE';
}
