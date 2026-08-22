import type {
  DashaTimingViewModel,
  DashaCurrentPeriodProduct,
  DashaTimelinePeriodProduct,
  DashaBirthAnchorProduct,
  DashaInterpretationProduct,
  CareerTimingProduct,
  WealthTimingProduct
} from './dashaTimingTypes';

/**
 * Selects the active Mahadasha (major period) product from the view model.
 */
export function selectCurrentMahadasha(
  viewModel: DashaTimingViewModel
): DashaCurrentPeriodProduct | undefined {
  return viewModel.current?.mahadasha;
}

/**
 * Selects the active Antardasha (sub-period) product from the view model.
 */
export function selectCurrentAntardasha(
  viewModel: DashaTimingViewModel
): DashaCurrentPeriodProduct | undefined {
  return viewModel.current?.antardasha;
}

/**
 * Selects the active Pratyantardasha (sub-sub-period) product from the view model.
 */
export function selectCurrentPratyantardasha(
  viewModel: DashaTimingViewModel
): DashaCurrentPeriodProduct | undefined {
  return viewModel.current?.pratyantardasha;
}

/**
 * Selects the Vimshottari Mahadasha timeline periods from the view model.
 */
export function selectDashaTimelinePeriods(
  viewModel: DashaTimingViewModel
): readonly DashaTimelinePeriodProduct[] {
  return viewModel.timeline.periods;
}

/**
 * Selects the birth dasha anchor from the view model.
 */
export function selectDashaBirthAnchor(
  viewModel: DashaTimingViewModel
): DashaBirthAnchorProduct | undefined {
  return viewModel.timeline.birthAnchor;
}

/**
 * Selects the active Dasha interpretation product from the view model.
 */
export function selectDashaInterpretation(
  viewModel: DashaTimingViewModel
): DashaInterpretationProduct | undefined {
  return viewModel.interpretation;
}

/**
 * Selects the career domain timing product from the view model.
 */
export function selectCareerTiming(
  viewModel: DashaTimingViewModel
): CareerTimingProduct | undefined {
  return viewModel.career;
}

/**
 * Selects the wealth domain timing product from the view model.
 */
export function selectWealthTiming(
  viewModel: DashaTimingViewModel
): WealthTimingProduct | undefined {
  return viewModel.wealth;
}
