import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BirthFormModal } from './BirthFormModal';
import { ChartProfileService } from '../features/chart-profiles/chartProfileService';
import { DEFAULT_BIRTH_DETAILS } from '../app/AppState';
import { AyanamsaType, type BirthDetails } from '../types';

const currentDetails = DEFAULT_BIRTH_DETAILS;

function renderModal(service?: ChartProfileService) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <BirthFormModal
      isOpen
      onClose={onClose}
      currentDetails={currentDetails}
      onSave={onSave}
      service={service}
    />
  );
  return { onSave, onClose };
}

afterEach(() => {
  window.localStorage.clear();
});

describe('BirthFormModal saved chart profiles', () => {
  it('lists saved profiles, populates the form on click, and deletes them', async () => {
    const service = new ChartProfileService(window.localStorage, () => new Date(), () => 'profile-1');
    const savedBirth: BirthDetails = {
      name: 'Restored Person',
      placeOfBirth: 'Mumbai, India',
      dateTimeStr: '1990-01-15T05:30:00Z',
      timeZone: 'Asia/Kolkata',
      latitude: 19.076,
      longitude: 72.8777,
      ayanamsa: AyanamsaType.LAHIRI
    };
    service.saveProfile('Mumbai Chart', savedBirth);

    renderModal(service);

    expect(screen.getByRole('heading', { name: 'Saved Chart Profiles' })).toBeInTheDocument();
    expect(screen.getByText(/Saved on this browser\/device only/)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: 'Mumbai Chart' }));

    expect(screen.getByPlaceholderText('e.g. CoreAstro Test Vector 1')).toHaveValue('Restored Person');
    expect(screen.getByPlaceholderText('e.g. 23.1793')).toHaveValue(19.076);
    expect(screen.getByPlaceholderText('e.g. 75.7849')).toHaveValue(72.8777);

    fireEvent.click(screen.getByRole('button', { name: 'Delete profile Mumbai Chart' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Mumbai Chart' })).not.toBeInTheDocument();
    });
    const listed = service.listProfiles();
    expect(listed.ok && listed.value).toHaveLength(0);
  });

  it('persists a profile via the service when the save checkbox is checked', () => {
    const service = new ChartProfileService(window.localStorage, () => new Date(), () => 'saved-1');
    const { onSave, onClose } = renderModal(service);

    fireEvent.click(screen.getByRole('checkbox', { name: /save as chart profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /calculate chart/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    const listed = service.listProfiles();
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.value).toHaveLength(1);
      expect(listed.value[0].label).toBe('CoreAstro Test Chart');
      expect(listed.value[0].birthDetails.latitude).toBe(currentDetails.latitude);
    }
  });

  it('does not save a profile when the checkbox is unchecked', () => {
    const service = new ChartProfileService(window.localStorage, () => new Date(), () => 'saved-2');
    const { onSave } = renderModal(service);

    fireEvent.click(screen.getByRole('button', { name: /calculate chart/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const listed = service.listProfiles();
    expect(listed.ok && listed.value).toHaveLength(0);
  });

  it('surfaces a save failure without blocking onSave or onClose', async () => {
    const failingService = {
      listProfiles: () => ({ ok: true as const, value: [] }),
      migrateProfileStore: () => ({ ok: true as const, value: [] }),
      saveProfile: () => ({ ok: false as const, error: 'LIMIT_REACHED' as const }),
      deleteProfile: () => ({ ok: true as const, value: undefined })
    } as unknown as ChartProfileService;
    const { onSave, onClose } = renderModal(failingService);

    fireEvent.click(screen.getByRole('checkbox', { name: /save as chart profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /calculate chart/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent('Profile limit reached');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1), { timeout: 4000 });
  });
});
