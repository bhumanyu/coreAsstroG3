import {
  isChartProfileStoreV0,
  isChartProfileStoreV1,
  type ChartProfileStoreV0,
  type ChartProfileStoreV1
} from './chartProfileSchema';

export const CHART_PROFILE_STORAGE_KEY = 'coreastro.chartProfiles';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type ProfileStoreReadResult =
  | { readonly status: 'EMPTY' }
  | { readonly status: 'READY'; readonly store: ChartProfileStoreV1 }
  | { readonly status: 'LEGACY'; readonly store: ChartProfileStoreV0 }
  | { readonly status: 'CORRUPT' }
  | { readonly status: 'UNAVAILABLE' }
  | { readonly status: 'UNSUPPORTED_VERSION'; readonly version: number };

export type ProfileStoreWriteResult =
  | { readonly status: 'SAVED' }
  | { readonly status: 'QUOTA' }
  | { readonly status: 'UNAVAILABLE' };

function browserStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function readChartProfileStore(storage: StorageLike | null | undefined = browserStorage()): ProfileStoreReadResult {
  if (!storage) return { status: 'UNAVAILABLE' };
  let raw: string | null;
  try {
    raw = storage.getItem(CHART_PROFILE_STORAGE_KEY);
  } catch {
    return { status: 'UNAVAILABLE' };
  }
  if (raw === null) return { status: 'EMPTY' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'CORRUPT' };
  }
  if (isChartProfileStoreV1(parsed)) return { status: 'READY', store: parsed };
  if (isChartProfileStoreV0(parsed)) return { status: 'LEGACY', store: parsed };
  if (typeof parsed === 'object' && parsed !== null && 'schemaVersion' in parsed) {
    const version = (parsed as { schemaVersion?: unknown }).schemaVersion;
    if (typeof version === 'number' && Number.isInteger(version) && version > 1) {
      return { status: 'UNSUPPORTED_VERSION', version };
    }
  }
  return { status: 'CORRUPT' };
}

export function writeChartProfileStore(
  store: ChartProfileStoreV1,
  storage: StorageLike | null | undefined = browserStorage()
): ProfileStoreWriteResult {
  if (!storage) return { status: 'UNAVAILABLE' };
  try {
    storage.setItem(CHART_PROFILE_STORAGE_KEY, JSON.stringify(store));
    return { status: 'SAVED' };
  } catch (error) {
    const isQuota = error instanceof DOMException
      ? error.name === 'QuotaExceededError'
      : typeof error === 'object' && error !== null && 'name' in error && error.name === 'QuotaExceededError';
    return isQuota ? { status: 'QUOTA' } : { status: 'UNAVAILABLE' };
  }
}

export function deleteChartProfileStore(
  storage: StorageLike | null | undefined = browserStorage()
): ProfileStoreWriteResult {
  if (!storage) return { status: 'UNAVAILABLE' };
  try {
    storage.removeItem(CHART_PROFILE_STORAGE_KEY);
    return { status: 'SAVED' };
  } catch {
    return { status: 'UNAVAILABLE' };
  }
}
