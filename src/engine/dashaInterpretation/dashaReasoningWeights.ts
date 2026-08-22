import { DashaReasoningBasis } from './dashaReasoningTypes';

/**
 * Baseline weighting parameters for dasha directional reasoning bases.
 *
 * NOTE: These weights represent engineering defaults calibrated for directional
 * synthesis scoring and are not fixed astrological doctrine.
 */
export const DASHA_REASONING_WEIGHTS: Readonly<Record<DashaReasoningBasis, number>> = Object.freeze({
  PLACEMENT: 1.0,
  OWNERSHIP: 1.0,
  FUNCTIONAL_ROLE: 1.25,
  FUNCTIONAL_NATURE: 1.25,
  DIGNITY: 1.5,
  STATE: 1.25,
  STRENGTH: 1.5,
  ASPECT: 1.0,
  YOGA: 1.5,
  HOUSE_DOMAIN: 1.25,
  COMBINATION: 2.0
});
