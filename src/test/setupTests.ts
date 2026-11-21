// Test setup
import '@testing-library/jest-dom/vitest';
import i18n from '../i18n/i18n';
import { ensureSwissEphemerisAdapter } from '../engine/ephemeris/swissEphemerisAdapter';
import { afterEach } from 'vitest';

// The ephemeris adapter initializes lazily; tests exercise the synchronous
// engine surface, so resolve it once per test-file module graph up front.
await ensureSwissEphemerisAdapter();

afterEach(() => {
  void i18n.changeLanguage('en');
});
