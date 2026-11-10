import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AyanamsaType, type BirthDetails } from '../../types';
import { ChartProfileManager } from './ChartProfileManager';
import { ChartProfileService } from './chartProfileService';
import { CHART_PROFILE_STORAGE_KEY, type StorageLike } from './chartProfileStorage';

const birth: BirthDetails = {
  name: 'Chart name',
  dateTimeStr: '2024-05-15T12:00:00Z',
  timeZone: 'UTC',
  latitude: 23.17,
  longitude: 75.78,
  ayanamsa: AyanamsaType.LAHIRI
};

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

describe('ChartProfileManager', () => {
  it('discloses local-only storage and routes a validated restore through its callback', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'profile');
    service.saveProfile('My chart', birth);
    const onRestore = vi.fn();
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={onRestore} service={service} />);
    expect(screen.getByText(/Saved on this browser\/device only/i)).toBeInTheDocument();
    expect(screen.getByText(/not backed up or synced/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(onRestore).toHaveBeenCalledWith(birth);
  });

  it('uses an integrated rename dialog and persists the edited name', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'profile');
    service.saveProfile('My chart', birth);
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = screen.getByRole('dialog', { name: 'Rename saved profile' });
    fireEvent.change(within(dialog).getByLabelText('New profile name'), { target: { value: 'Renamed chart' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save name' }));

    expect(service.listProfiles()).toMatchObject({ ok: true, value: [{ label: 'Renamed chart' }] });
    expect(screen.getByRole('status')).toHaveTextContent('Renamed profile to "Renamed chart"');
  });

  it('requires an explicit in-app delete confirmation and supports cancellation', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'profile');
    service.saveProfile('My chart', birth);
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete saved profile?' });
    expect(service.listProfiles()).toMatchObject({ ok: true, value: [{ id: 'profile' }] });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(service.listProfiles()).toMatchObject({ ok: true, value: [{ id: 'profile' }] });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete profile' }));
    expect(service.listProfiles()).toMatchObject({ ok: true, value: [] });
  });

  it('searches profiles and sorts the visible list alphabetically', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), (() => {
      let id = 0;
      return () => 'profile-' + (++id);
    })());
    service.saveProfile('Zebra chart', birth);
    service.saveProfile('Alpha chart', birth);
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);

    const list = screen.getByRole('list');
    expect(within(list).getAllByText(/chart/).map(item => item.textContent)).toEqual(['Alpha chart', 'Zebra chart']);
    fireEvent.change(screen.getByLabelText('Search saved profiles'), { target: { value: 'zeb' } });
    expect(within(list).getByText('Zebra chart')).toBeInTheDocument();
    expect(within(list).queryByText('Alpha chart')).not.toBeInTheDocument();
  });

  it('imports a validated JSON file using the selected duplicate policy', async () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'imported');
    const importedProfile = {
      id: 'imported', label: 'Imported chart', createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z', birthDetails: birth
    };
    const file = new File([JSON.stringify({ schemaVersion: 1, profiles: [importedProfile] })], 'profiles.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify({ schemaVersion: 1, profiles: [importedProfile] }) });
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);

    fireEvent.change(screen.getByLabelText('Import profile JSON'), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Imported 1 profile(s)'));
    expect(service.listProfiles()).toMatchObject({ ok: true, value: [{ id: 'imported', label: 'Imported chart', birthDetails: birth }] });
  });

  it('exports a versioned JSON file and explains that the file contains private birth details', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'profile');
    service.saveProfile('My chart', birth);
    const createObjectURL = vi.fn(() => 'blob:chart-profiles');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent(/file contains the birth details/i);
    click.mockRestore();
  });

  it('reports corrupt storage recoverably without mutating it', () => {
    const corruptStorage = new MemoryStorage();
    corruptStorage.setItem(CHART_PROFILE_STORAGE_KEY, 'broken');
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()}
      service={new ChartProfileService(corruptStorage)} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/damaged/i);
    expect(corruptStorage.getItem(CHART_PROFILE_STORAGE_KEY)).toBe('broken');
  });

  it('shows a recoverable quota error and does not claim that a profile was saved', () => {
    class QuotaStorage extends MemoryStorage {
      setItem(_key: string, _value: string): void {
        throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
      }
    }
    const service = new ChartProfileService(new QuotaStorage(), () => new Date(), () => 'quota-profile');
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);

    fireEvent.change(screen.getByLabelText('Profile name'), { target: { value: 'Quota chart' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save current chart' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Browser storage is full/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lets the user explicitly rename duplicate IDs or names during import', async () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date('2026-02-01T00:00:00Z'), () => 'renamed-import-id');
    service.saveProfile('My chart', birth, 'existing-id');
    const importedProfile = {
      id: 'existing-id',
      label: 'My chart',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      birthDetails: { ...birth, latitude: 10 }
    };
    const serialized = JSON.stringify({ schemaVersion: 1, profiles: [importedProfile] });
    const file = new File([serialized], 'profiles.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => serialized });
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);

    fireEvent.change(screen.getByLabelText('Import duplicate handling'), { target: { value: 'RENAME_DUPLICATES' } });
    fireEvent.change(screen.getByLabelText('Import profile JSON'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('renamed 1 duplicate(s)'));
    expect(service.listProfiles()).toMatchObject({
      ok: true,
      value: [
        { id: 'existing-id', label: 'My chart', birthDetails: birth },
        { id: 'renamed-import-id', label: 'My chart (Imported 2)', birthDetails: { ...birth, latitude: 10 } }
      ]
    });
  });
});
