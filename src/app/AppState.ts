import type { BirthDetails } from '../types';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import type { AppPage } from './navigation/navigationTypes';
import { PRESET_PROFILES } from '../components/BirthFormModal';

export interface AppState {
  activePage: AppPage;
  birthDetails: BirthDetails;
  isBirthFormOpen: boolean;
  lifeAnalysisState: LifeAnalysisProductState;
}

export const INITIAL_APP_STATE: AppState = {
  activePage: 'overview',
  birthDetails: PRESET_PROFILES[0].details,
  isBirthFormOpen: false,
  lifeAnalysisState: { status: 'LOADING' }
};

export type { BirthDetails, LifeAnalysisProductState, AppPage };
