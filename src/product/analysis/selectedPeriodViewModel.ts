import type {
  ProductDashaPeriodOptions,
  ProductSelectableAntardasha,
  ProductSelectableMahadasha
} from './productAnalysisTypes';

export type SelectedPeriodViewStatus = 'LOADING' | 'ERROR' | 'EMPTY' | 'READY';

export interface SelectedPeriodSelection {
  readonly mahadashaId: string;
  readonly antardashaId: string;
}

export type SelectedPeriodValidationError =
  | 'OPTIONS_UNAVAILABLE'
  | 'MAHADASHA_NOT_FOUND'
  | 'MAHADASHA_INVALID'
  | 'ANTARDASHA_NOT_FOUND'
  | 'ANTARDASHA_INVALID';

export type SelectedPeriodValidationResult =
  | {
      readonly ok: true;
      readonly mahadasha: ProductSelectableMahadasha;
      readonly antardasha: ProductSelectableAntardasha;
      readonly interval: { readonly start: string; readonly end: string };
    }
  | { readonly ok: false; readonly error: SelectedPeriodValidationError };

export interface SelectedPeriodViewModel {
  readonly status: SelectedPeriodViewStatus;
  readonly canSubmit: boolean;
  readonly mahadasha?: ProductSelectableMahadasha;
  readonly antardasha?: ProductSelectableAntardasha;
  readonly interval?: { readonly start: string; readonly end: string };
  readonly validationError?: SelectedPeriodValidationError;
}

export interface BuildSelectedPeriodViewModelInput {
  readonly options?: ProductDashaPeriodOptions;
  readonly optionsStatus?: 'LOADING' | 'ERROR';
  readonly selection?: SelectedPeriodSelection;
  readonly isSubmitting?: boolean;
}

/**
 * Revalidates identifiers against the current options snapshot. IDs from a
 * previous render, URL, or other MD are never trusted.
 */
export function validateSelectedPeriod(
  options: ProductDashaPeriodOptions | undefined,
  selection: SelectedPeriodSelection
): SelectedPeriodValidationResult {
  if (!options) {
    return { ok: false, error: 'OPTIONS_UNAVAILABLE' };
  }

  const mahadasha = options.mahadashas.find(({ id }) => id === selection.mahadashaId);
  if (!mahadasha) {
    return { ok: false, error: 'MAHADASHA_NOT_FOUND' };
  }
  if (!mahadasha.valid) {
    return { ok: false, error: 'MAHADASHA_INVALID' };
  }

  const antardasha = mahadasha.antardashas.find(({ id }) => id === selection.antardashaId);
  if (!antardasha) {
    return { ok: false, error: 'ANTARDASHA_NOT_FOUND' };
  }
  if (!antardasha.valid) {
    return { ok: false, error: 'ANTARDASHA_INVALID' };
  }

  return {
    ok: true,
    mahadasha,
    antardasha,
    interval: { start: antardasha.start, end: antardasha.end }
  };
}

export function buildSelectedPeriodViewModel(
  input: BuildSelectedPeriodViewModelInput
): SelectedPeriodViewModel {
  if (input.optionsStatus === 'LOADING') {
    return { status: 'LOADING', canSubmit: false };
  }
  if (input.optionsStatus === 'ERROR') {
    return { status: 'ERROR', canSubmit: false };
  }
  if (!input.options || input.options.mahadashas.length === 0) {
    return { status: 'EMPTY', canSubmit: false };
  }
  if (!input.selection) {
    return { status: 'READY', canSubmit: false };
  }

  const validation = validateSelectedPeriod(input.options, input.selection);
  if (!validation.ok) {
    return {
      status: 'READY',
      canSubmit: false,
      validationError: validation.error
    };
  }

  return {
    status: 'READY',
    canSubmit: !input.isSubmitting,
    mahadasha: validation.mahadasha,
    antardasha: validation.antardasha,
    interval: validation.interval
  };
}
