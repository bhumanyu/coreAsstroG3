import type {
  EvidenceStrength,
  ReasoningLayer,
  TimingLevel
} from './reasoningTypes';

export const REASONING_LAYER_WEIGHTS: Readonly<
  Record<ReasoningLayer, number>
> = Object.freeze({
  PRIMARY_PROMISE: 5.0,
  SECONDARY_SUPPORT: 2.5,
  MODIFIER: 1.5,
  YOGA: 2.5,
  VARGA: 2.5,
  DASHA: 2.0,
  TRANSIT: 1.0
});

export const EVIDENCE_STRENGTH_WEIGHTS: Readonly<
  Record<EvidenceStrength, number>
> = Object.freeze({
  VERY_STRONG: 1.5,
  STRONG: 1.25,
  MODERATE: 1.0,
  WEAK: 0.5
});

export const EVIDENCE_PRIORITY_FLOOR = 1;

export const MD_AD_PD_FACTOR: Readonly<
  Record<TimingLevel, number>
> = Object.freeze({
  MD: 1.0,
  AD: 0.70,
  PD: 0.40
});
