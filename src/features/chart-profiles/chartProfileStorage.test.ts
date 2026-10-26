import { describe, expect, it } from 'vitest';
import { CHART_PROFILE_STORAGE_KEY, readChartProfileStore, writeChartProfileStore, type StorageLike } from './chartProfileStorage';

const store = { schemaVersion: 1 as const, profiles: [] };

describe('chart profile storage guards', () => {
  it('distinguishes empty, corrupt, and inaccessible storage', () => {
    const empty: StorageLike = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
    const corrupt: StorageLike = { ...empty, getItem: () => 'not json' };
    const inaccessible: StorageLike = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => undefined,
      removeItem: () => undefined
    };
    expect(readChartProfileStore(empty)).toEqual({ status: 'EMPTY' });
    expect(readChartProfileStore(corrupt)).toEqual({ status: 'CORRUPT' });
    expect(readChartProfileStore(inaccessible)).toEqual({ status: 'UNAVAILABLE' });
  });

  it('writes through local storage and fails soft for quota/security errors', () => {
    let persisted = '';
    const writable: StorageLike = {
      getItem: () => null,
      setItem: (key, value) => { expect(key).toBe(CHART_PROFILE_STORAGE_KEY); persisted = value; },
      removeItem: () => undefined
    };
    expect(writeChartProfileStore(store, writable)).toEqual({ status: 'SAVED' });
    expect(JSON.parse(persisted)).toEqual(store);
    const quota: StorageLike = { ...writable, setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } };
    const denied: StorageLike = { ...writable, setItem: () => { throw new Error('denied'); } };
    expect(writeChartProfileStore(store, quota)).toEqual({ status: 'QUOTA' });
    expect(writeChartProfileStore(store, denied)).toEqual({ status: 'UNAVAILABLE' });
    expect(writeChartProfileStore(store, null)).toEqual({ status: 'UNAVAILABLE' });
  });

  it('does not throw when browser storage getters throw', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        get: () => { throw new Error('storage denied'); }
      });
      expect(readChartProfileStore()).toEqual({ status: 'UNAVAILABLE' });
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });
});
