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
  readonly rootEvidenceIds?: readonly string[];
}

export interface WealthEvidenceProducerOutput {
  readonly evidence: readonly WealthEvidenceProducerRecord[];
  readonly ruleErrors: readonly WealthEvidenceProducerRuleError[];
  readonly d2Relationship: VargaRelationship;
  readonly referenceDatasetAvailable: boolean;
}

export interface WealthEvidenceProducerRuleError {
  readonly ruleId: string;
  readonly error: string;
  readonly evidenceFamily: WealthEvidenceFamily;
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
      ...(record.identityKey ? { identityKey: record.identityKey } : {}),
      ...(record.rootEvidenceIds ? { rootEvidenceIds: record.rootEvidenceIds } : {})
    }))
  );
  const d2Records = evidence.filter(
    (record) =>
      record.evidenceFamily === WealthEvidenceFamily.D2 ||
      record.vargaEvidence?.varga === 'D2'
  );

  return Object.freeze({
    evidence,
    ruleErrors: Object.freeze(
      production.ruleErrors.map((ruleError) => Object.freeze({ ...ruleError }))
    ),
    d2Relationship: resolveD2ProducerRelationship(d2Records),
    referenceDatasetAvailable: production.dataCompleteness === 'COMPLETE'
  });
}

/**
 * D2 is intentionally contained as UNAVAILABLE until its calculation and interpretation
 * validation gates are independently approved. Producer declarations and polarity alone
 * are not sufficient to promote canonical Wealth D2 availability.
 */
export function resolveD2ProducerRelationship(
  _evidence: readonly WealthEvidenceProducerRecord[]
): VargaRelationship {
  return 'UNAVAILABLE';
}
