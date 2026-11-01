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

export function resolveD2ProducerRelationship(
  evidence: readonly WealthEvidenceProducerRecord[]
): VargaRelationship {
  if (evidence.length === 0) return 'UNAVAILABLE';

  const declaredRelationships = new Set(
    evidence
      .map((item) => item.vargaEvidence?.relationship)
      .filter((relationship): relationship is VargaRelationship => Boolean(relationship))
  );
  if (declaredRelationships.size > 1) return 'UNAVAILABLE';
  // One declared relationship is authoritative; undeclared effect evidence must not override it.
  if (declaredRelationships.size === 1) return Array.from(declaredRelationships)[0];

  const supports = evidence.some((item) => item.effect === 'SUPPORT');
  const challenges = evidence.some((item) => item.effect === 'CHALLENGE');
  if (supports && challenges) return 'PARTIALLY_CONFIRMS';
  if (supports) return 'CONFIRMS';
  if (challenges) return 'CONFLICTS';
  return 'UNAVAILABLE';
}
