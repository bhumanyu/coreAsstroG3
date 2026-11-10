import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '../../i18n/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

afterEach(async () => {
  await i18n.changeLanguage('en');
  window.localStorage.clear();
});

describe('LanguageSwitcher', () => {
  it('exposes the active language and switches without reloading', async () => {
    render(<LanguageSwitcher />);
    const english = screen.getByRole('button', { name: 'EN' });
    const hindi = screen.getByRole('button', { name: 'हिन्दी' });
    expect(english).toHaveAttribute('aria-pressed', 'true');
    expect(hindi).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(hindi);
    await waitFor(() => expect(hindi).toHaveAttribute('aria-pressed', 'true'));
    expect(english).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.lang).toBe('hi');
  });
});
