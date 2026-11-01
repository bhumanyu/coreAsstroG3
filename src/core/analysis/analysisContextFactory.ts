import type { AnalysisContext, ProductMethodology } from './AnalysisContext';
import { systemClock } from './Clock';
import type { Clock } from './Clock';

/**
 * Active runtime engine and rules versions. These serve as the single sanctioned
 * default fallback when not explicitly supplied in the methodology or input context.
 */
export const DEFAULT_ENGINE_VERSION = 'ASTRO_CORE_V1';
export const DEFAULT_RULES_VERSION = 'PARASHARA_CLASSICAL_RULES_V2';

export const DEFAULT_METHODOLOGY: ProductMethodology = Object.freeze({
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: DEFAULT_ENGINE_VERSION,
  rulesEngine: DEFAULT_RULES_VERSION,
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
});

export function normalizeAsOf(asOf?: Date | string | null, clock: Clock = systemClock): string {
  if (asOf === undefined || asOf === null) {
    const now = clock.now();
    if (typeof now !== 'string') {
      throw new Error(`Invalid clock value for asOf: expected string, received ${typeof now}`);
    }
    // Re-enter the explicit-string path so injected clocks receive the same
    // validation and UTC canonicalization as caller-supplied timestamps.
    return normalizeAsOf(now, clock);
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
  readonly methodology?: ProductMethodology;
  readonly engineVersion?: string;
  readonly rulesVersion?: string;
}

export function createAnalysisContext(
  input?: CreateAnalysisContextInput,
  clock: Clock = systemClock
): AnalysisContext {
  // Invalid explicit input must fail at context construction. Never create an
  // AnalysisContext containing an invalid or placeholder timestamp.
  const asOf = normalizeAsOf(input?.asOf, clock);
  const methodology = Object.freeze({ ...(input?.methodology ?? DEFAULT_METHODOLOGY) });
  const engineVersion = input?.engineVersion ?? methodology.calculationEngine ?? DEFAULT_ENGINE_VERSION;
  const rulesVersion = input?.rulesVersion ?? methodology.rulesEngine ?? DEFAULT_RULES_VERSION;

  return Object.freeze({
    asOf,
    methodology,
    engineVersion,
    rulesVersion
  });
}
