import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BirthFormModal } from './BirthFormModal';
import { lookupTimeZoneByCoordinates, searchPlacesDetailed, type PlaceResult } from '../services/geocoding';

vi.mock('../services/geocoding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/geocoding')>();
  return {
    ...actual,
    searchPlacesDetailed: vi.fn(),
    lookupTimeZoneByCoordinates: vi.fn()
  };
});

const searchMock = vi.mocked(searchPlacesDetailed);
const lookupMock = vi.mocked(lookupTimeZoneByCoordinates);

const timeZoneInput = () =>
  screen.getByPlaceholderText('Enter IANA timezone, e.g. Asia/Kolkata') as HTMLInputElement;
const placeInput = () =>
  screen.getByPlaceholderText('e.g. Ujjain, Muzaffarpur, London...') as HTMLInputElement;

function place(overrides: Partial<PlaceResult> = {}): PlaceResult {
  return {
    name: 'London',
    admin1: 'England',
    country: 'United Kingdom',
    latitude: 51.5072,
    longitude: -0.1276,
    ...overrides
  };
}

function renderModal() {
  return render(
    <BirthFormModal isOpen onClose={vi.fn()} onSave={vi.fn()} />
  );
}

async function searchAndSelect(target: PlaceResult) {
  searchMock.mockResolvedValueOnce({ status: 'SUCCESS', places: [target] });
  fireEvent.change(placeInput(), { target: { value: 'London' } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(target.name) }));
  await act(async () => {});
}

beforeEach(() => {
  vi.useFakeTimers();
  searchMock.mockReset();
  lookupMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('BirthFormModal place timezone handling', () => {
  it('fills the timezone when the provider supplies one', async () => {
    lookupMock.mockResolvedValue(undefined);
    renderModal();

    await searchAndSelect(place({ timezone: 'Europe/London' }));

    expect(timeZoneInput()).toHaveValue('Europe/London');
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('preserves a user-entered timezone when the provider omits one', async () => {
    renderModal();
    fireEvent.change(timeZoneInput(), { target: { value: 'Asia/Kolkata' } });

    await searchAndSelect(place());

    expect(timeZoneInput()).toHaveValue('Asia/Kolkata');
    expect(lookupMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/timezone is unresolved/i)).not.toBeInTheDocument();
  });

  it('derives the timezone from coordinates when the provider omits one and the field is empty', async () => {
    lookupMock.mockResolvedValue('America/New_York');
    renderModal();

    await searchAndSelect(place());

    expect(lookupMock).toHaveBeenCalledWith(51.5072, -0.1276);
    expect(timeZoneInput()).toHaveValue('America/New_York');
  });

  it('leaves the field unresolved and offers the browser timezone when lookup fails', async () => {
    lookupMock.mockResolvedValue(undefined);
    renderModal();

    await searchAndSelect(place());

    expect(timeZoneInput()).toHaveValue('');
    expect(screen.getByText(/timezone is unresolved/i)).toBeInTheDocument();

    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    const hint = screen.queryByRole('button', { name: 'Use suggested timezone' });
    if (browserZone) {
      expect(hint).toBeInTheDocument();
      fireEvent.click(hint!);
      expect(timeZoneInput()).toHaveValue(browserZone);
      expect(screen.queryByText(/timezone is unresolved/i)).not.toBeInTheDocument();
    }
  });

  it('does not change the timezone when a place query is typed but never selected', async () => {
    renderModal();
    fireEvent.change(timeZoneInput(), { target: { value: 'Asia/Tokyo' } });
    searchMock.mockResolvedValue({ status: 'SUCCESS', places: [place()] });

    fireEvent.change(placeInput(), { target: { value: 'London' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByRole('button', { name: /London/ })).toBeInTheDocument();
    expect(timeZoneInput()).toHaveValue('Asia/Tokyo');
    expect(lookupMock).not.toHaveBeenCalled();
  });
});
