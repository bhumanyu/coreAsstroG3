import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AyanamsaType, type BirthDetails } from '../../types';
import { encodeChartShare } from './chartShareCodec';
import { ChartShareControls } from './ChartShareControls';

const current: BirthDetails = {
  name: 'Excluded name',
  placeOfBirth: 'Excluded place',
  dateTimeStr: '2024-05-15T12:00:00Z',
  timeZone: 'UTC',
  latitude: 23.17,
  longitude: 75.78,
  ayanamsa: AyanamsaType.LAHIRI
};

describe('ChartShareControls', () => {
  it('shows the privacy warning before explicit creation and does not rewrite location', () => {
    window.history.replaceState(null, '', '/?private=query');
    const initialHash = window.location.hash;
    const { getByRole } = render(<ChartShareControls currentBirthDetails={current} onLoadBirthDetails={vi.fn()} />);
    expect(screen.getByText(/browser history, screenshots, or copying\/pasting/i)).toBeInTheDocument();
    expect(screen.getByText(/name and place of birth are excluded/i)).toBeInTheDocument();
    fireEvent.click(getByRole('button', { name: 'Create share link' }));
    expect((getByRole('textbox', { name: 'Created share link' }) as HTMLInputElement).value).toContain('#chart=v1.');
    expect((getByRole('textbox', { name: 'Created share link' }) as HTMLInputElement).value).not.toContain('private=query');
    expect(window.location.hash).toBe(initialHash);
    expect(screen.getByText(/not been added to the address bar/i)).toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });

  it('offers valid fragment inputs to the user and does not load until explicitly selected', () => {
    const token = encodeChartShare(current);
    if (!token.ok) throw new Error(token.error);
    window.history.replaceState(null, '', `/#chart=${token.value}`);
    const onLoad = vi.fn();
    render(<ChartShareControls currentBirthDetails={current} onLoadBirthDetails={onLoad} />);
    expect(screen.getByRole('status')).toHaveTextContent(/available to load/i);
    expect(onLoad).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Load shared chart inputs' }));
    expect(onLoad).toHaveBeenCalledWith({
      dateTimeStr: current.dateTimeStr, timeZone: current.timeZone, latitude: current.latitude,
      longitude: current.longitude, ayanamsa: current.ayanamsa
    });
  });

  it('shows a safe error and keeps current chart untouched for malformed fragments; clear is explicit', () => {
    window.history.replaceState(null, '', '/#chart=v2.invalid');
    const onLoad = vi.fn();
    render(<ChartShareControls currentBirthDetails={current} onLoadBirthDetails={onLoad} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/does not support/i);
    expect(onLoad).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear share link' }));
    expect(window.location.hash).toBe('');
  });

  it('removes only chart share data while preserving unrelated fragment parameters', () => {
    const token = encodeChartShare(current);
    if (!token.ok) throw new Error(token.error);
    window.history.replaceState(null, '', `/#chart=${token.value}&section=report`);
    render(<ChartShareControls currentBirthDetails={current} onLoadBirthDetails={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear share link' }));
    expect(window.location.hash).toBe('#section=report');
    window.history.replaceState(null, '', '/');
  });
});
