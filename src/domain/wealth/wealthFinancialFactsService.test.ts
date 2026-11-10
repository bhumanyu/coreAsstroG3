import { describe, expect, it } from 'vitest';
import {
  WEALTH_FINANCIAL_FACTS_STORAGE_KEY,
  WealthFinancialFactsService,
  type WealthFinancialFactsStorage
} from './wealthFinancialFactsService';
import { validateWealthFinancialDatum } from './wealthFinancialData';

class MemoryStorage implements WealthFinancialFactsStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const input = {
  concept: 'INCOME' as const,
  value: 125000,
  currency: 'INR',
  period: 'MONTHLY' as const,
  asOf: '2026-11-01T00:00:00Z',
  label: 'Monthly salary',
  sourceNote: 'User supplied'
};

describe('WealthFinancialFactsService (C01 user fact management)', () => {
  it('creates, lists, updates and deletes only validated user-reported facts', () => {
    const storage = new MemoryStorage();
    const service = new WealthFinancialFactsService(
      storage,
      () => new Date('2026-11-10T05:00:00Z'),
      () => 'fact-1'
    );

    const created = service.saveFact(input);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.sourceClassification).toBe('USER_REPORTED_FINANCIAL_FACT');
    expect(validateWealthFinancialDatum(created.value)).toBe(true);
    expect(created.value.userReportedProvenance?.reportId).toBe('fact-1');

    const listed = service.listFacts();
    expect(listed).toMatchObject({ ok: true, value: [{ id: 'fact-1', value: 125000 }] });

    const updated = service.saveFact({ ...input, value: 140000 }, 'fact-1');
    expect(updated).toMatchObject({ ok: true, value: { id: 'fact-1', value: 140000 } });
    expect(service.listFacts()).toMatchObject({ ok: true, value: [{ id: 'fact-1', value: 140000 }] });

    expect(service.deleteFact('fact-1')).toMatchObject({ ok: true });
    expect(service.listFacts()).toMatchObject({ ok: true, value: [] });
  });

  it('supports descriptive asset ownership and trading history without inventing monetary values', () => {
    const service = new WealthFinancialFactsService(new MemoryStorage(), () => new Date('2026-11-10T05:00:00Z'), () => 'description-1');
    const result = service.saveFact({
      concept: 'ASSET_OWNERSHIP',
      value: 'One jointly owned residential property',
      asOf: '2026-11-01T00:00:00Z',
      label: 'Property ownership'
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        concept: 'ASSET_OWNERSHIP',
        value: 'One jointly owned residential property',
        sourceClassification: 'USER_REPORTED_FINANCIAL_FACT'
      }
    });
  });

  it('rejects negative, non-finite, missing-currency and invalid-date monetary inputs', () => {
    const service = new WealthFinancialFactsService(new MemoryStorage());
    expect(service.saveFact({ ...input, value: -1 })).toEqual({ ok: false, error: 'INVALID_FACT' });
    expect(service.saveFact({ ...input, value: Number.NaN })).toEqual({ ok: false, error: 'INVALID_FACT' });
    expect(service.saveFact({ ...input, currency: 'rupee' })).toEqual({ ok: false, error: 'INVALID_FACT' });
    expect(service.saveFact({ ...input, asOf: '2026-02-30T00:00:00Z' })).toEqual({ ok: false, error: 'INVALID_FACT' });
  });

  it('rejects an update for an unknown ID rather than creating a new record under that ID', () => {
    const service = new WealthFinancialFactsService(new MemoryStorage());
    expect(service.saveFact(input, 'missing-id')).toEqual({ ok: false, error: 'INVALID_FACT' });
  });

  it('fails closed on corrupt stored data without overwriting it', () => {
    const storage = new MemoryStorage();
    storage.setItem(WEALTH_FINANCIAL_FACTS_STORAGE_KEY, '{broken');
    const service = new WealthFinancialFactsService(storage);
    expect(service.listFacts()).toEqual({ ok: false, error: 'CORRUPT' });
    expect(service.saveFact(input)).toEqual({ ok: false, error: 'CORRUPT' });
    expect(storage.getItem(WEALTH_FINANCIAL_FACTS_STORAGE_KEY)).toBe('{broken');
  });

  it('surfaces storage quota and permission failures without claiming success', () => {
    const quotaStorage: WealthFinancialFactsStorage = {
      getItem: () => null,
      setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); }
    };
    expect(new WealthFinancialFactsService(quotaStorage).saveFact(input)).toEqual({ ok: false, error: 'QUOTA' });

    const deniedStorage: WealthFinancialFactsStorage = {
      getItem: () => { throw new DOMException('denied', 'SecurityError'); },
      setItem: () => undefined
    };
    expect(new WealthFinancialFactsService(deniedStorage).listFacts()).toEqual({ ok: false, error: 'UNAVAILABLE' });
  });
});
