// Test setup
import '@testing-library/jest-dom/vitest';
import i18n from '../i18n/i18n';
import { afterEach } from 'vitest';

afterEach(() => {
  void i18n.changeLanguage('en');
});
