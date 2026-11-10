import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimeSelector } from './DateTimeSelector';

describe('DateTimeSelector', () => {
  it('preserves a blank value instead of inventing a birth date', () => {
    const onChange = vi.fn();
    render(<DateTimeSelector dateTimeStr="" onChange={onChange} />);
    expect(screen.getByLabelText('Birth date and time')).toHaveValue('');
    expect(screen.getByLabelText('Birth date and time')).toBeRequired();
  });

  it('collects local wall-clock time including seconds without applying a timezone', () => {
    const onChange = vi.fn();
    render(<DateTimeSelector dateTimeStr="2024-05-15T12:03" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Birth date and time'), {
      target: { value: '2024-05-15T12:03:45' }
    });
    expect(onChange).toHaveBeenCalledWith('2024-05-15T12:03:45');
  });
});
