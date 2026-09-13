import type { AnalysisContext, ProductMethodology } from './AnalysisContext';

/**
 * Active runtime engine and rules versions. These serve as the single sanctioned
 * default fallback when not explicitly supplied in the methodology or input context.
 */
export const DEFAULT_ENGINE_VERSION = 'ASTRO_CORE_V1';
export const DEFAULT_RULES_VERSION = 'PARASHARA_CLASSICAL_RULES_V2';

export function normalizeAsOf(asOf?: Date | string | null): string {
  if (asOf === undefined || asOf === null) {
    // Option A: assign the current instant exactly once at the product boundary.
    // This is the ONLY sanctioned wall-clock use for analysis semantics.
    return new Date().toISOString();
  }

  if (asOf instanceof Date) {
    if (isNaN(asOf.getTime())) {
      throw new Error('Invalid asOf Date: NaN');
    }
    return asOf.toISOString();
  }

  if (typeof asOf === 'string') {
    const trimmed = asOf.trim();
    if (trimmed.length === 0) {
      throw new Error('Invalid asOf string: empty string');
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid asOf timestamp: "${asOf}"`);
    }
    return d.toISOString();
  }

  throw new Error(`Invalid asOf type: expected Date or string, received ${typeof asOf}`);
}

export interface CreateAnalysisContextInput {
  readonly asOf?: Date | string | null;
  readonly methodology: ProductMethodology;
  readonly engineVersion?: string;
  readonly rulesVersion?: string;
}

export function createAnalysisContext(input: CreateAnalysisContextInput): AnalysisContext {
  const asOf = normalizeAsOf(input.asOf);
  const methodology = Object.freeze({ ...input.methodology });
  const engineVersion = input.engineVersion ?? DEFAULT_ENGINE_VERSION;
  const rulesVersion = input.rulesVersion ?? DEFAULT_RULES_VERSION;

  return Object.freeze({
    asOf,
    methodology,
    engineVersion,
    rulesVersion
  });
}
