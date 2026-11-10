import {
  createUserReportedFinancialDatum,
  validateWealthFinancialDatum,
  type WealthFinancialConcept,
  type WealthFinancialDatum,
  type WealthFinancialPeriod
} from '../../domain/wealth/wealthFinancialData';

export const WEALTH_FINANCIAL_FACTS_STORAGE_KEY = 'coreastro.wealthFinancialFacts.v1';
const STORE_SCHEMA = 'C01-USER-FACTS-v1' as const;

export interface WealthFinancialFactsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type WealthFinancialFactsError = 'INVALID_FACT' | 'CORRUPT' | 'UNAVAILABLE' | 'QUOTA';

export type WealthFinancialFactsResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: WealthFinancialFactsError };

export interface WealthFinancialFactInput {
  readonly concept: WealthFinancialConcept;
  readonly value: number | string;
  readonly currency?: string;
  readonly period?: WealthFinancialPeriod;
  readonly asOf: string;
  readonly label?: string;
  readonly sourceNote?: string;
}

interface StoredWealthFinancialFacts {
  readonly schemaVersion: typeof STORE_SCHEMA;
  readonly facts: readonly WealthFinancialDatum<unknown>[];
}

const MONETARY_CONCEPTS: ReadonlySet<WealthFinancialConcept> = new Set([
  'INCOME', 'SAVINGS', 'ASSETS', 'INHERITANCE', 'DEBT_LIABILITIES',
  'CASH_FLOW', 'LIQUIDITY', 'NET_WORTH', 'CONSUMPTION_LUXURY', 'TRADING_EXPOSURE'
]);

function isQuotaError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }
  return Boolean(error && typeof error === 'object' && 'name' in error
    && (error as { name?: unknown }).name === 'QuotaExceededError');
}

function defaultStorage(): WealthFinancialFactsStorage {
  // Resolve localStorage lazily so a browser permission exception is reported
  // through listFacts/saveFact rather than thrown while constructing the UI.
  return {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value)
  };
}

function validInput(input: WealthFinancialFactInput): boolean {
  if (!input.asOf || Number.isNaN(Date.parse(input.asOf))) return false;
  if (MONETARY_CONCEPTS.has(input.concept)) {
    return typeof input.value === 'number' && Number.isFinite(input.value) && input.value >= 0
      && typeof input.currency === 'string' && /^[A-Z]{3}$/.test(input.currency);
  }
  return typeof input.value === 'string' && input.value.trim().length > 0;
}

export class WealthFinancialFactsService {
  constructor(
    private readonly storage: WealthFinancialFactsStorage = defaultStorage(),
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID()
  ) {}

  listFacts(): WealthFinancialFactsResult<readonly WealthFinancialDatum<unknown>[]> {
    let serialized: string | null;
    try {
      serialized = this.storage.getItem(WEALTH_FINANCIAL_FACTS_STORAGE_KEY);
    } catch {
      return { ok: false, error: 'UNAVAILABLE' };
    }
    if (serialized === null) return { ok: true, value: Object.freeze([]) };

    try {
      const parsed = JSON.parse(serialized) as Partial<StoredWealthFinancialFacts>;
      if (parsed.schemaVersion !== STORE_SCHEMA || !Array.isArray(parsed.facts)) {
        return { ok: false, error: 'CORRUPT' };
      }
      const seen = new Set<string>();
      for (const fact of parsed.facts) {
        if (!validateWealthFinancialDatum(fact)
          || fact.sourceClassification !== 'USER_REPORTED_FINANCIAL_FACT'
          || seen.has(fact.id)) {
          return { ok: false, error: 'CORRUPT' };
        }
        seen.add(fact.id);
      }
      return { ok: true, value: Object.freeze(parsed.facts.map(fact => Object.freeze({ ...fact }))) };
    } catch {
      return { ok: false, error: 'CORRUPT' };
    }
  }

  saveFact(input: WealthFinancialFactInput, existingId?: string): WealthFinancialFactsResult<WealthFinancialDatum<unknown>> {
    if (!validInput(input)) return { ok: false, error: 'INVALID_FACT' };
    const current = this.listFacts();
    if (!current.ok) return current;

    if (existingId && !current.value.some(item => item.id === existingId)) {
      return { ok: false, error: 'INVALID_FACT' };
    }
    const id = existingId ?? this.createId();
    const reportedAt = this.now().toISOString();
    let fact: WealthFinancialDatum<unknown>;
    try {
      fact = createUserReportedFinancialDatum({
        id,
        concept: input.concept,
        value: input.value,
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.period ? { period: input.period } : {}),
        asOf: input.asOf,
        provenance: {
          reportedBy: 'USER',
          reportId: id,
          reportedAt,
          ...(input.label?.trim() ? { label: input.label.trim() } : {}),
          ...(input.sourceNote?.trim() ? { sourceNote: input.sourceNote.trim() } : {})
        }
      });
    } catch {
      return { ok: false, error: 'INVALID_FACT' };
    }

    const exists = current.value.some(item => item.id === id);
    const facts = exists
      ? current.value.map(item => item.id === id ? fact : item)
      : [...current.value, fact];
    const persisted = this.persist(facts);
    return persisted.ok ? { ok: true, value: fact } : persisted;
  }

  deleteFact(id: string): WealthFinancialFactsResult<void> {
    const current = this.listFacts();
    if (!current.ok) return current;
    if (!current.value.some(item => item.id === id)) return { ok: false, error: 'INVALID_FACT' };
    return this.persist(current.value.filter(item => item.id !== id));
  }

  private persist(facts: readonly WealthFinancialDatum<unknown>[]): WealthFinancialFactsResult<void> {
    const payload: StoredWealthFinancialFacts = { schemaVersion: STORE_SCHEMA, facts };
    try {
      this.storage.setItem(WEALTH_FINANCIAL_FACTS_STORAGE_KEY, JSON.stringify(payload));
      return { ok: true, value: undefined };
    } catch (error) {
      return { ok: false, error: isQuotaError(error) ? 'QUOTA' : 'UNAVAILABLE' };
    }
  }
}
