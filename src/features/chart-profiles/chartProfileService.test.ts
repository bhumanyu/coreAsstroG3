import { describe, expect, it } from 'vitest';
import { AyanamsaType, type BirthDetails } from '../../types';
import { ChartProfileService } from './chartProfileService';
import { CHART_PROFILE_STORAGE_KEY, type StorageLike } from './chartProfileStorage';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const birth: BirthDetails = {
  name: 'Private name',
  placeOfBirth: 'Private place',
  dateTimeStr: '2024-05-15T12:00:00Z',
  timeZone: 'UTC',
  latitude: 23.17,
  longitude: 75.78,
  ayanamsa: AyanamsaType.LAHIRI
};

describe('ChartProfileService', () => {
  it('saves only birth inputs in a versioned envelope and lists them after service recreation', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date('2026-01-01T00:00:00Z'), () => 'profile-1');
    expect(service.saveProfile(' First ', birth).ok).toBe(true);
    const stored = JSON.parse(storage.getItem(CHART_PROFILE_STORAGE_KEY)!);
    expect(stored.schemaVersion).toBe(1);
    expect(stored.profiles[0].label).toBe('First');
    expect(stored.profiles[0].birthDetails).toEqual(birth);
    expect(stored.profiles[0]).not.toHaveProperty('analysis');
    expect(new ChartProfileService(storage).listProfiles()).toMatchObject({ ok: true, value: [{ id: 'profile-1' }] });
  });

  it('rejects duplicate IDs and enforces the profile limit', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'fixed');
    expect(service.saveProfile('One', birth).ok).toBe(true);
    expect(service.saveProfile('Two', birth)).toEqual({ ok: false, error: 'DUPLICATE_ID' });
    const profiles = Array.from({ length: 50 }, (_, index) => ({
      id: `p${index}`, label: `P${index}`, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), birthDetails: birth
    }));
    storage.setItem(CHART_PROFILE_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, profiles }));
    expect(service.saveProfile('Limit', birth, 'new-id')).toEqual({ ok: false, error: 'LIMIT_REACHED' });
  });

  it('trims and validates labels, then bumps updatedAt on rename', () => {
    let current = new Date('2026-01-01T00:00:00Z');
    const service = new ChartProfileService(new MemoryStorage(), () => current, () => 'id');
    const saved = service.saveProfile('Before', birth);
    if (!saved.ok) throw new Error(saved.error);
    current = new Date('2026-01-02T00:00:00Z');
    expect(service.renameProfile('id', ' After ')).toMatchObject({
      ok: true, value: { label: 'After', updatedAt: '2026-01-02T00:00:00.000Z' }
    });
    expect(service.renameProfile('id', '  ')).toEqual({ ok: false, error: 'INVALID_LABEL' });
    expect(service.renameProfile('id', 'x'.repeat(81))).toEqual({ ok: false, error: 'INVALID_LABEL' });
  });

  it('restores a validated defensive copy without altering the stored profile', () => {
    const service = new ChartProfileService(new MemoryStorage(), () => new Date(), () => 'id');
    expect(service.saveProfile('Chart', birth).ok).toBe(true);
    const restored = service.restoreProfile('id');
    expect(restored).toEqual({ ok: true, value: birth });
    if (restored.ok) restored.value.latitude = 0;
    expect(service.restoreProfile('id')).toEqual({ ok: true, value: birth });
  });

  it('deletes individual/all profiles and migrates only the recognized v0 shape', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'id');
    expect(service.saveProfile('Chart', birth).ok).toBe(true);
    expect(service.deleteProfile('id')).toEqual({ ok: true, value: undefined });
    storage.setItem(CHART_PROFILE_STORAGE_KEY, JSON.stringify({
      schemaVersion: 0,
      profiles: [{ id: 'old', label: 'Old', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', birth }]
    }));
    expect(service.migrateProfileStore()).toMatchObject({ ok: true, value: [{ id: 'old', birthDetails: birth }] });
    expect(JSON.parse(storage.getItem(CHART_PROFILE_STORAGE_KEY)!).schemaVersion).toBe(1);
    expect(service.deleteAllProfiles()).toEqual({ ok: true, value: undefined });
    expect(service.listProfiles()).toEqual({ ok: true, value: [] });
  });

  it('fails closed for malformed and future stores without overwriting their bytes', () => {
    const storage = new MemoryStorage();
    storage.setItem(CHART_PROFILE_STORAGE_KEY, '{broken');
    const service = new ChartProfileService(storage, () => new Date(), () => 'id');
    expect(service.saveProfile('Chart', birth)).toEqual({ ok: false, error: 'CORRUPT' });
    expect(storage.getItem(CHART_PROFILE_STORAGE_KEY)).toBe('{broken');
    const future = JSON.stringify({ schemaVersion: 7, profiles: [] });
    storage.setItem(CHART_PROFILE_STORAGE_KEY, future);
    expect(service.saveProfile('Chart', birth)).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(storage.getItem(CHART_PROFILE_STORAGE_KEY)).toBe(future);
    expect(service.migrateProfileStore()).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
  });
});
