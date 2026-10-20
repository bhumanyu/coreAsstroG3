import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimeSelector } from './DateTimeSelector';

describe('DateTimeSelector', () => {
  it('renders the incoming date and emits zero-padded date-time values', () => {
    const onChange = vi.fn();
    render(<DateTimeSelector dateTimeStr="2024-05-15T12:03" onChange={onChange} />);

    expect(screen.getByLabelText('Day')).toHaveValue('15');
    expect(screen.getByLabelText('Month')).toHaveValue('5');
    expect(screen.getByLabelText('Year')).toHaveValue('2024');
    expect(screen.getByLabelText('Hour')).toHaveValue('12');
    expect(screen.getByLabelText('Minute')).toHaveValue('3');

    fireEvent.change(screen.getByLabelText('Hour'), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith('2024-05-15T03:03');
  });

  it('clamps the day when changing to a shorter month and accounts for leap years', () => {
    const commonYearChange = vi.fn();
    const { rerender } = render(
      <DateTimeSelector dateTimeStr="2023-01-31T12:00" onChange={commonYearChange} />
    );

    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2' } });
    expect(commonYearChange).toHaveBeenCalledWith('2023-02-28T12:00');

    const leapYearChange = vi.fn();
    rerender(
      <DateTimeSelector dateTimeStr="2024-01-31T12:00" onChange={leapYearChange} />
    );
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2' } });
    expect(leapYearChange).toHaveBeenCalledWith('2024-02-29T12:00');
  });

  it('clamps leap day when changing to a non-leap year', () => {
    const onChange = vi.fn();
    render(<DateTimeSelector dateTimeStr="2024-02-29T12:00" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2023' } });
    expect(onChange).toHaveBeenCalledWith('2023-02-28T12:00');
  });
});
