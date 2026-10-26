import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('requires confirmation before deletion and reports unavailable/corrupt storage recoverably', () => {
    const storage = new MemoryStorage();
    const service = new ChartProfileService(storage, () => new Date(), () => 'profile');
    service.saveProfile('My chart', birth);
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()} service={service} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalled();
    expect(service.listProfiles()).toMatchObject({ ok: true, value: [{ id: 'profile' }] });
    confirm.mockRestore();

    const corruptStorage = new MemoryStorage();
    corruptStorage.setItem(CHART_PROFILE_STORAGE_KEY, 'broken');
    render(<ChartProfileManager currentBirthDetails={birth} onRestoreBirthDetails={vi.fn()}
      service={new ChartProfileService(corruptStorage)} />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts[alerts.length - 1]).toHaveTextContent(/damaged/i);
  });
});
