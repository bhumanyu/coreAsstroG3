import { describe, it, expect, vi } from 'vitest';
import {
  createAnalysisContext,
  normalizeAsOf,
  DEFAULT_ENGINE_VERSION,
  DEFAULT_RULES_VERSION,
  analysisAsOfDate,
  analysisAsOfEpochMs,
  systemClock,
  type ProductMethodology
} from './index';

const mockMethodology: ProductMethodology = Object.freeze({
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
});

describe('AnalysisContext and AnalysisContextFactory (P0-02A)', () => {
  describe('normalizeAsOf', () => {
    it('normalizes Date instances to canonical UTC ISO string', () => {
      const d = new Date('2024-06-15T14:30:00.000Z');
      expect(normalizeAsOf(d)).toBe('2024-06-15T14:30:00.000Z');
    });

    it('normalizes string dates and offsets to canonical UTC ISO string with Z', () => {
      const offsetStr = '2024-06-15T20:00:00+05:30';
      const expectedUtc = new Date(offsetStr).toISOString();
      expect(normalizeAsOf(offsetStr)).toBe(expectedUtc);
      expect(expectedUtc.endsWith('Z')).toBe(true);
    });

    it('normalizes leap year and edge date strings properly', () => {
      const leapStr = '2024-02-29T23:59:59.999Z';
      expect(normalizeAsOf(leapStr)).toBe('2024-02-29T23:59:59.999Z');
    });

    it('throws on invalid Date instances', () => {
      expect(() => normalizeAsOf(new Date(NaN))).toThrow('Invalid asOf Date');
    });

    it('throws on invalid string dates', () => {
      expect(() => normalizeAsOf('not-a-valid-date')).toThrow('Invalid asOf timestamp');
      expect(() => normalizeAsOf('')).toThrow('empty string');
      expect(() => normalizeAsOf('   ')).toThrow('empty string');
    });

    it('assigns the current instant when asOf is omitted or null (Option A)', () => {
      const before = Date.now();
      const asOf = normalizeAsOf();
      const after = Date.now();
      const asOfMs = new Date(asOf).getTime();

      expect(asOfMs).toBeGreaterThanOrEqual(before);
      expect(asOfMs).toBeLessThanOrEqual(after);
      expect(asOf.endsWith('Z')).toBe(true);
    });

    it('uses an injected fixed clock for omitted asOf values', () => {
      const clock = { now: vi.fn(() => '2040-03-04T05:06:07.000Z') };

      expect(normalizeAsOf(undefined, clock)).toBe('2040-03-04T05:06:07.000Z');
      expect(normalizeAsOf(null, clock)).toBe('2040-03-04T05:06:07.000Z');
      expect(clock.now).toHaveBeenCalledTimes(2);
    });

    it.each(['', 'not-a-valid-date'])('rejects invalid injected clock values: %s', (now) => {
      const clock = { now: vi.fn(() => now) };
      expect(() => normalizeAsOf(undefined, clock)).toThrow();
    });

    it('rejects a runtime clock value that is not a string', () => {
      const clock = { now: vi.fn(() => 123 as unknown as string) };
      expect(() => normalizeAsOf(undefined, clock)).toThrow(
        'Invalid clock value for asOf: expected string, received number'
      );
    });
  });

  describe('createAnalysisContext', () => {
    it('uses the injected clock once when asOf is omitted', () => {
      const clock = { now: vi.fn(() => '2040-03-04T05:06:07.000Z') };

      const context = createAnalysisContext({ methodology: mockMethodology }, clock);

      expect(context.asOf).toBe('2040-03-04T05:06:07.000Z');
      expect(clock.now).toHaveBeenCalledTimes(1);
    });

    it('does not call the clock when explicit asOf is supplied and is deterministic', () => {
      const clock = { now: vi.fn(() => '2040-03-04T05:06:07.000Z') };
      const input = { asOf: '2024-06-15T20:00:00+05:30', methodology: mockMethodology };

      const first = createAnalysisContext(input, clock);
      const second = createAnalysisContext(input, clock);

      expect(first.asOf).toBe('2024-06-15T14:30:00.000Z');
      expect(second.asOf).toBe(first.asOf);
      expect(clock.now).not.toHaveBeenCalled();
    });

    it.each(['', '   ', 'not-a-valid-date'])(
      'fails immediately when constructing a context with invalid asOf "%s"',
      (asOf) => {
        expect(() => createAnalysisContext({ asOf, methodology: mockMethodology })).toThrow();
      }
    );

    it('fails immediately for an invalid Date instead of creating a placeholder context', () => {
      expect(() => createAnalysisContext({
        asOf: new Date(NaN),
        methodology: mockMethodology
      })).toThrow('Invalid asOf Date');
    });

    it('creates an immutable context with frozen methodology and context', () => {
      const context = createAnalysisContext({
        asOf: '2024-01-01T00:00:00.000Z',
        methodology: mockMethodology
      });

      expect(context.asOf).toBe('2024-01-01T00:00:00.000Z');
      expect(context.engineVersion).toBe(DEFAULT_ENGINE_VERSION);
      expect(context.rulesVersion).toBe(DEFAULT_RULES_VERSION);
      expect(Object.isFrozen(context)).toBe(true);
      expect(Object.isFrozen(context.methodology)).toBe(true);

      // Attempting to modify properties should fail in strict mode
      expect(() => {
        // @ts-expect-error mutating readonly property
        context.asOf = '2025-01-01T00:00:00.000Z';
      }).toThrow();
    });

    it('respects custom engineVersion and rulesVersion if provided', () => {
      const context = createAnalysisContext({
        asOf: '2024-01-01T00:00:00.000Z',
        methodology: mockMethodology,
        engineVersion: 'CUSTOM_ENGINE_V3',
        rulesVersion: 'CUSTOM_RULES_V4'
      });

      expect(context.engineVersion).toBe('CUSTOM_ENGINE_V3');
      expect(context.rulesVersion).toBe('CUSTOM_RULES_V4');
    });
  });

  describe('analysisTime helpers', () => {
    it('extracts Date and epoch ms matching context.asOf', () => {
      const iso = '2024-05-10T12:00:00.000Z';
      const context = createAnalysisContext({
        asOf: iso,
        methodology: mockMethodology
      });

      const d = analysisAsOfDate(context);
      expect(d instanceof Date).toBe(true);
      expect(d.toISOString()).toBe(iso);

      const ms = analysisAsOfEpochMs(context);
      expect(ms).toBe(new Date(iso).getTime());
    });
  });

  describe('Clock abstraction', () => {
    it('systemClock returns valid ISO string', () => {
      const now = systemClock.now();
      expect(typeof now).toBe('string');
      expect(new Date(now).toISOString()).toBe(now);
    });
  });
});
