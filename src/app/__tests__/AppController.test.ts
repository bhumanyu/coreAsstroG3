import { describe, it, expect, vi } from 'vitest';
import { createAppController } from '../AppController';
import { INITIAL_APP_STATE, AppState } from '../AppState';
import type { Dispatch, SetStateAction } from 'react';

describe('AppController', () => {
  it('updates activePage via functional updater when navigate is called', () => {
    let currentState: AppState = { ...INITIAL_APP_STATE };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.navigate('career');

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.activePage).toBe('career');
    expect(currentState.birthDetails).toEqual(INITIAL_APP_STATE.birthDetails);
    expect(currentState.isBirthFormOpen).toBe(false);
  });

  it('updates isBirthFormOpen to true when openBirthForm is called', () => {
    let currentState: AppState = { ...INITIAL_APP_STATE, isBirthFormOpen: false };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.openBirthForm();

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.isBirthFormOpen).toBe(true);
  });

  it('updates isBirthFormOpen to false when closeBirthForm is called', () => {
    let currentState: AppState = { ...INITIAL_APP_STATE, isBirthFormOpen: true };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.closeBirthForm();

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.isBirthFormOpen).toBe(false);
  });

  it('navigates to overview when resetPreset is called', () => {
    let currentState: AppState = {
      ...INITIAL_APP_STATE,
      activePage: 'wealth'
    };
    const setState: Dispatch<SetStateAction<AppState>> = vi.fn(
      (update: SetStateAction<AppState>) => {
        currentState =
          typeof update === 'function'
            ? (update as (prev: AppState) => AppState)(currentState)
            : update;
      }
    );

    const controller = createAppController(setState);
    controller.resetPreset();

    expect(setState).toHaveBeenCalledTimes(1);
    expect(currentState.activePage).toBe('overview');
  });

  it('uses functional update pattern preserving other state properties', () => {
    const setState = vi.fn();
    const controller = createAppController(setState);

    controller.navigate('detailed');
    expect(setState).toHaveBeenCalledWith(expect.any(Function));

    const updater = setState.mock.calls[0][0] as (prev: AppState) => AppState;
    const previousState: AppState = {
      activePage: 'overview',
      birthDetails: INITIAL_APP_STATE.birthDetails,
      isBirthFormOpen: true,
      productAnalysis: { status: 'IDLE' },
      lifeAnalysisState: { status: 'LOADING' }
    };

    const nextState = updater(previousState);
    expect(nextState.activePage).toBe('detailed');
    expect(nextState.birthDetails).toBe(previousState.birthDetails);
    expect(nextState.isBirthFormOpen).toBe(true);
    expect(nextState.productAnalysis).toBe(previousState.productAnalysis);
    expect(nextState.lifeAnalysisState).toBe(previousState.lifeAnalysisState);
  });
});
