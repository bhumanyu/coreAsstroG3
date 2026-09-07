import type { Dispatch, SetStateAction } from 'react';
import type { AppState } from './AppState';
import type { AppPage } from './navigation/navigationTypes';

export interface AppController {
  navigate: (page: AppPage) => void;
  openBirthForm: () => void;
  closeBirthForm: () => void;
  resetPreset: () => void;
}

export function createAppController(
  setState: Dispatch<SetStateAction<AppState>>
): AppController {
  return {
    navigate: (page: AppPage) => {
      setState((prev) => ({ ...prev, activePage: page }));
    },
    openBirthForm: () => {
      setState((prev) => ({ ...prev, isBirthFormOpen: true }));
    },
    closeBirthForm: () => {
      setState((prev) => ({ ...prev, isBirthFormOpen: false }));
    },
    resetPreset: () => {
      setState((prev) => ({ ...prev, activePage: 'overview' }));
    }
  };
}
