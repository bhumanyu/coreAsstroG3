import { validateBirthDetails } from '../../core/validation/birthDetailsValidation';
import type { BirthDetails } from '../../types';
import {
  CHART_PROFILE_SCHEMA_VERSION,
  MAX_SAVED_PROFILES,
  copyBirthDetails,
  isValidProfileLabel,
  isChartProfileStoreV0,
  isChartProfileStoreV1,
  type ChartProfile,
  type ChartProfileStoreV0,
  type ChartProfileStoreV1
} from './chartProfileSchema';
import {
  readChartProfileStore,
  writeChartProfileStore,
  type ProfileStoreReadResult,
  type StorageLike
} from './chartProfileStorage';

export type ChartProfileOperationError =
  | 'DUPLICATE_ID'
  | 'LIMIT_REACHED'
  | 'INVALID_LABEL'
  | 'NOT_FOUND'
  | 'INVALID_BIRTH_DETAILS'
  | 'CORRUPT'
  | 'UNAVAILABLE'
  | 'QUOTA'
  | 'UNSUPPORTED_VERSION'
  | 'MIGRATION_REQUIRED'
  | 'INVALID_IMPORT';

export type ChartProfileResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ChartProfileOperationError };

function mapReadError(result: ProfileStoreReadResult): ChartProfileOperationError | undefined {
  switch (result.status) {
    case 'CORRUPT': return 'CORRUPT';
    case 'UNAVAILABLE': return 'UNAVAILABLE';
    case 'UNSUPPORTED_VERSION': return 'UNSUPPORTED_VERSION';
    case 'LEGACY': return 'MIGRATION_REQUIRED';
    case 'EMPTY':
    case 'READY': return undefined;
  }
}

function toV1(store: ChartProfileStoreV0): ChartProfileStoreV1 {
  return {
    schemaVersion: CHART_PROFILE_SCHEMA_VERSION,
    profiles: store.profiles.map(({ birth, ...profile }) => ({
      ...profile,
      birthDetails: copyBirthDetails(birth)
    }))
  };
}

function cloneProfile(profile: ChartProfile): ChartProfile {
  return { ...profile, birthDetails: copyBirthDetails(profile.birthDetails) };
}

export class ChartProfileService {
  constructor(
    private readonly storage?: StorageLike | null,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () =>
      globalThis.crypto?.randomUUID?.()
        ?? `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  ) {}

  listProfiles(): ChartProfileResult<readonly ChartProfile[]> {
    const read = readChartProfileStore(this.storage);
    const readError = mapReadError(read);
    if (readError) return { ok: false, error: readError };
    return { ok: true, value: read.status === 'READY' ? read.store.profiles.map(cloneProfile) : [] };
  }

  saveProfile(label: string, birthDetails: BirthDetails, id = this.createId()): ChartProfileResult<ChartProfile> {
    const normalizedLabel = label.trim();
    if (!isValidProfileLabel(normalizedLabel)) return { ok: false, error: 'INVALID_LABEL' };
    if (validateBirthDetails(birthDetails).length > 0) return { ok: false, error: 'INVALID_BIRTH_DETAILS' };
    const read = readChartProfileStore(this.storage);
    const readError = mapReadError(read);
    if (readError) return { ok: false, error: readError };
    const profiles = read.status === 'READY' ? [...read.store.profiles] : [];
    if (profiles.some((profile) => profile.id === id)) return { ok: false, error: 'DUPLICATE_ID' };
    if (profiles.length >= MAX_SAVED_PROFILES) return { ok: false, error: 'LIMIT_REACHED' };

    const createdAt = this.now().toISOString();
    const profile: ChartProfile = {
      id,
      label: normalizedLabel,
      createdAt,
      updatedAt: createdAt,
      birthDetails: copyBirthDetails(birthDetails)
    };
    const write = writeChartProfileStore({ schemaVersion: CHART_PROFILE_SCHEMA_VERSION, profiles: [...profiles, profile] }, this.storage);
    if (write.status !== 'SAVED') return { ok: false, error: write.status };
    return { ok: true, value: cloneProfile(profile) };
  }

  renameProfile(id: string, label: string): ChartProfileResult<ChartProfile> {
    const normalizedLabel = label.trim();
    if (!isValidProfileLabel(normalizedLabel)) return { ok: false, error: 'INVALID_LABEL' };
    const existing = this.readForMutation();
    if (!existing.ok) return existing;
    const index = existing.value.findIndex((profile) => profile.id === id);
    if (index < 0) return { ok: false, error: 'NOT_FOUND' };
    const updated = { ...existing.value[index], label: normalizedLabel, updatedAt: this.now().toISOString() };
    const profiles = existing.value.map((profile, i) => i === index ? updated : profile);
    const write = writeChartProfileStore({ schemaVersion: CHART_PROFILE_SCHEMA_VERSION, profiles }, this.storage);
    return write.status === 'SAVED'
      ? { ok: true, value: cloneProfile(updated) }
      : { ok: false, error: write.status };
  }

  restoreProfile(id: string): ChartProfileResult<BirthDetails> {
    const existing = this.readForMutation();
    if (!existing.ok) return existing;
    const profile = existing.value.find((item) => item.id === id);
    if (!profile) return { ok: false, error: 'NOT_FOUND' };
    if (validateBirthDetails(profile.birthDetails).length > 0) return { ok: false, error: 'INVALID_BIRTH_DETAILS' };
    return { ok: true, value: copyBirthDetails(profile.birthDetails) };
  }

  deleteProfile(id: string): ChartProfileResult<void> {
    const existing = this.readForMutation();
    if (!existing.ok) return existing;
    if (!existing.value.some((profile) => profile.id === id)) return { ok: false, error: 'NOT_FOUND' };
    const profiles = existing.value.filter((profile) => profile.id !== id);
    const write = writeChartProfileStore({ schemaVersion: CHART_PROFILE_SCHEMA_VERSION, profiles }, this.storage);
    return write.status === 'SAVED' ? { ok: true, value: undefined } : { ok: false, error: write.status };
  }

  migrateProfileStore(): ChartProfileResult<readonly ChartProfile[]> {
    const read = readChartProfileStore(this.storage);
    if (read.status === 'READY' || read.status === 'EMPTY') {
      return { ok: true, value: read.status === 'READY' ? read.store.profiles.map(cloneProfile) : [] };
    }
    if (read.status !== 'LEGACY') {
      const error = mapReadError(read);
      return { ok: false, error: error ?? 'CORRUPT' };
    }
    const migrated = toV1(read.store);
    const write = writeChartProfileStore(migrated, this.storage);
    return write.status === 'SAVED'
      ? { ok: true, value: migrated.profiles.map(cloneProfile) }
      : { ok: false, error: write.status };
  }

  exportProfiles(): ChartProfileResult<string> {
    const listed = this.listProfiles();
    if (!listed.ok) return listed;
    const store: ChartProfileStoreV1 = {
      schemaVersion: CHART_PROFILE_SCHEMA_VERSION,
      profiles: listed.value
    };
    return { ok: true, value: JSON.stringify(store, null, 2) };
  }

  importProfiles(
    serialized: string,
    strategy: 'SKIP_DUPLICATES' | 'RENAME_DUPLICATES' = 'SKIP_DUPLICATES'
  ): ChartProfileResult<{ readonly importedCount: number; readonly skippedCount: number; readonly renamedCount: number }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch {
      return { ok: false, error: 'INVALID_IMPORT' };
    }

    if (!isChartProfileStoreV1(parsed) && !isChartProfileStoreV0(parsed)) {
      return { ok: false, error: 'INVALID_IMPORT' };
    }
    const imported = isChartProfileStoreV0(parsed)
      ? toV1(parsed).profiles
      : parsed.profiles.map(cloneProfile);
    const existing = this.readForMutation();
    if (!existing.ok) return existing;

    const profiles = [...existing.value];
    let importedCount = 0;
    let skippedCount = 0;
    let renamedCount = 0;
    const normalizedLabel = (label: string) => label.trim().toLocaleLowerCase();

    for (const source of imported) {
      if (validateBirthDetails(source.birthDetails).length > 0) {
        return { ok: false, error: 'INVALID_IMPORT' };
      }
      const idCollision = profiles.some(profile => profile.id === source.id);
      const labelCollision = profiles.some(profile => normalizedLabel(profile.label) === normalizedLabel(source.label));
      if (idCollision || labelCollision) {
        if (strategy === 'SKIP_DUPLICATES') {
          skippedCount += 1;
          continue;
        }
        let nextId = source.id;
        if (idCollision) {
          do { nextId = this.createId(); } while (profiles.some(profile => profile.id === nextId));
        }
        let nextLabel = source.label;
        if (labelCollision) {
          let suffix = 2;
          do {
            nextLabel = source.label + ' (Imported ' + suffix + ')';
            suffix += 1;
          } while (profiles.some(profile => normalizedLabel(profile.label) === normalizedLabel(nextLabel)));
        }
        profiles.push({
          ...cloneProfile(source),
          id: nextId,
          label: nextLabel,
          updatedAt: this.now().toISOString()
        });
        importedCount += 1;
        renamedCount += 1;
      } else {
        profiles.push(cloneProfile(source));
        importedCount += 1;
      }
    }

    if (profiles.length > MAX_SAVED_PROFILES) return { ok: false, error: 'LIMIT_REACHED' };
    const write = writeChartProfileStore({ schemaVersion: CHART_PROFILE_SCHEMA_VERSION, profiles }, this.storage);
    if (write.status !== 'SAVED') return { ok: false, error: write.status };
    return { ok: true, value: { importedCount, skippedCount, renamedCount } };
  }

  deleteAllProfiles(): ChartProfileResult<void> {
    const read = readChartProfileStore(this.storage);
    const readError = mapReadError(read);
    if (readError) return { ok: false, error: readError };
    const write = writeChartProfileStore({ schemaVersion: CHART_PROFILE_SCHEMA_VERSION, profiles: [] }, this.storage);
    return write.status === 'SAVED' ? { ok: true, value: undefined } : { ok: false, error: write.status };
  }

  private readForMutation(): ChartProfileResult<readonly ChartProfile[]> {
    const read = readChartProfileStore(this.storage);
    const readError = mapReadError(read);
    if (readError) return { ok: false, error: readError };
    return { ok: true, value: read.status === 'READY' ? [...read.store.profiles] : [] };
  }
}
