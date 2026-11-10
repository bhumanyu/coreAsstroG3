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
  it('renders nothing when there is no chart share fragment', () => {
    window.history.replaceState(null, '', '/?private=query');
    const { container } = render(<ChartShareControls onLoadBirthDetails={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    window.history.replaceState(null, '', '/');
  });

  it('offers valid fragment inputs to the user and does not load until explicitly selected', () => {
    const token = encodeChartShare(current);
    if (!token.ok) throw new Error(token.error);
    window.history.replaceState(null, '', `/#chart=${token.value}`);
    const onLoad = vi.fn();
    render(<ChartShareControls onLoadBirthDetails={onLoad} />);
    expect(screen.getByRole('status')).toHaveTextContent(/available to load/i);
    expect(onLoad).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Load shared chart inputs' }));
    expect(onLoad).toHaveBeenCalledWith({
      dateTimeStr: current.dateTimeStr, timeZone: current.timeZone, latitude: current.latitude,
      longitude: current.longitude, ayanamsa: current.ayanamsa
    });
    expect(window.location.hash).toBe('');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });

  it('shows a safe error for malformed fragments and clears it via Dismiss', () => {
    window.history.replaceState(null, '', '/#chart=v2.invalid');
    const onLoad = vi.fn();
    render(<ChartShareControls onLoadBirthDetails={onLoad} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/does not support/i);
    expect(onLoad).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(window.location.hash).toBe('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('removes only chart share data while preserving unrelated fragment parameters', () => {
    const token = encodeChartShare(current);
    if (!token.ok) throw new Error(token.error);
    window.history.replaceState(null, '', `/#chart=${token.value}&section=report`);
    render(<ChartShareControls onLoadBirthDetails={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Load shared chart inputs' }));
    expect(window.location.hash).toBe('#section=report');
    window.history.replaceState(null, '', '/');
  });
});
