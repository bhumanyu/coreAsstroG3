import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { searchPlacesDetailed, type GeocodingOutcome, type PlaceResult } from '../services/geocoding';

vi.mock('../services/geocoding', () => ({
  searchPlacesDetailed: vi.fn()
}));

const searchMock = vi.mocked(searchPlacesDetailed);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function place(name: string): PlaceResult {
  return {
    name,
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles'
  };
}

async function enterQuery(query: string) {
  fireEvent.change(screen.getByPlaceholderText(/search city/i), { target: { value: query } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  searchMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PlaceAutocomplete', () => {
  it('ignores an older response when searches resolve out of order', async () => {
    const first = deferred<GeocodingOutcome>();
    const second = deferred<GeocodingOutcome>();
    searchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<PlaceAutocomplete onSelect={vi.fn()} />);

    await enterQuery('San');
    await enterQuery('San Francisco');
    await act(async () => {
      first.resolve({ status: 'SUCCESS', places: [place('San')] });
      second.resolve({ status: 'SUCCESS', places: [place('San Francisco')] });
    });

    expect(screen.getByRole('button', { name: /San Francisco/ })).toBeInTheDocument();
    expect(screen.queryByText('San', { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('aborts the active search on unmount and ignores its late completion', async () => {
    const pending = deferred<GeocodingOutcome>();
    searchMock.mockReturnValueOnce(pending.promise);
    const { unmount } = render(<PlaceAutocomplete onSelect={vi.fn()} />);
    await enterQuery('London');
    const signal = searchMock.mock.calls[0][1]?.signal;

    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      pending.resolve({ status: 'SUCCESS', places: [place('London')] });
    });
  });

  it('shows an accessible no-results message that preserves manual entry', async () => {
    searchMock.mockResolvedValueOnce({ status: 'NO_RESULTS', places: [] });
    render(<PlaceAutocomplete onSelect={vi.fn()} />);

    await enterQuery('Unknown place');

    expect(screen.getByRole('status')).toHaveTextContent(/no places found/i);
    expect(screen.getByRole('status')).toHaveTextContent(/enter coordinates and time zone manually/i);
  });

  it('shows a service-unavailable error and a retry control for provider failures', async () => {
    searchMock.mockResolvedValueOnce({ status: 'HTTP_ERROR', statusCode: 503 });
    render(<PlaceAutocomplete onSelect={vi.fn()} />);

    await enterQuery('London');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Place search is temporarily unavailable. Please try again.'
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('clears loading after a superseded request and displays only the current search result', async () => {
    const superseded = deferred<GeocodingOutcome>();
    const active = deferred<GeocodingOutcome>();
    searchMock.mockReturnValueOnce(superseded.promise).mockReturnValueOnce(active.promise);
    render(<PlaceAutocomplete onSelect={vi.fn()} />);

    await enterQuery('San');
    expect(screen.getByRole('status')).toHaveTextContent(/searching places/i);
    await enterQuery('San Francisco');
    await act(async () => {
      superseded.resolve({ status: 'ABORTED' });
      active.resolve({ status: 'SUCCESS', places: [place('San Francisco')] });
    });

    expect(screen.getByRole('button', { name: /San Francisco/ })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
