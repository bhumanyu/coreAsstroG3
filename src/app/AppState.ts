import type { BirthDetails, Horoscope } from '../types';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import type { ProductAnalysis } from '../product/analysis';
import type { AppPage } from './navigation/navigationTypes';
import type { DashaTimingViewModel } from '../product/dasha-timing';
import { PRESET_PROFILES } from '../components/BirthFormModal';

export interface ProductAnalysisState {
  readonly status: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  readonly analysis?: ProductAnalysis;
  readonly error?: string;
  readonly horoscope?: Horoscope;
}

export interface SelectionState {
  readonly status: 'IDLE' | 'SUBMITTING' | 'READY' | 'ERROR';
  readonly error?: string;
}

export const INITIAL_SELECTION_STATE: SelectionState = {
  status: 'IDLE'
};

export const INITIAL_PRODUCT_ANALYSIS_STATE: ProductAnalysisState = {
  status: 'IDLE'
};

export interface AppState {
  readonly activePage: AppPage;
  readonly birthDetails: BirthDetails;
  readonly isBirthFormOpen: boolean;
  /**
   * Canonical aggregate state for product views (P-UI-02).
   */
  readonly productAnalysis: ProductAnalysisState;
  /**
   * Transitional compatibility state retained for legacy product views
   * and backward-compatible test assertions.
   */
  readonly lifeAnalysisState: LifeAnalysisProductState;
  /**
   * Sourced directly from single ProductAnalysis pipeline
   */
  readonly horoscope?: Horoscope;
  /**
   * Sourced directly from single ProductAnalysis pipeline
   */
  readonly dashaTimingViewModel?: DashaTimingViewModel;
  /**
   * Selection state for period selection - separate from productAnalysis.status
   * to avoid clobbering the baseline view on selection errors.
   */
  readonly selectionState: SelectionState;
}

export const INITIAL_APP_STATE: AppState = {
  activePage: 'overview',
  birthDetails: PRESET_PROFILES[0].details,
  isBirthFormOpen: false,
  productAnalysis: INITIAL_PRODUCT_ANALYSIS_STATE,
  lifeAnalysisState: { status: 'LOADING' },
  selectionState: INITIAL_SELECTION_STATE
};

export type { BirthDetails, LifeAnalysisProductState, AppPage };

