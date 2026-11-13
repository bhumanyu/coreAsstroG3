import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n';
import { changeAppLanguage, getCurrentLanguage } from './languageManager';
import { LANGUAGE_STORAGE_KEY } from './config';

afterEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage('en');
});

describe('language preference manager', () => {
  it('starts in English unless a valid explicit preference is saved', () => {
    expect(i18n.resolvedLanguage).toBe('en');
    expect(getCurrentLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('changes language immediately and persists explicit selection', async () => {
    await changeAppLanguage('hi');
    expect(i18n.resolvedLanguage).toBe('hi');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');
    expect(document.documentElement.lang).toBe('hi');
  });

  it('returns to English when the user chooses English', async () => {
    await changeAppLanguage('hi');
    await changeAppLanguage('en');
    expect(getCurrentLanguage()).toBe('en');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('continues to switch for the active session if storage is unavailable', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied');
    });
    await expect(changeAppLanguage('hi')).resolves.toBeUndefined();
    expect(getCurrentLanguage()).toBe('hi');
    expect(document.documentElement.lang).toBe('hi');
    setItem.mockRestore();
  });
});
