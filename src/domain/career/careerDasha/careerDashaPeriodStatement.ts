import type { CareerDashaCanonicalPeriod } from './careerDashaCanonicalTypes';
import type { Planet } from '../../../types';

const humanizeToken = (value: string | undefined): string =>
  value ? value.toLowerCase().replace(/_/g, ' ') : 'unavailable';

const planetLabel = (planet: Planet | string | undefined): string => {
  if (!planet) return 'an unspecified planet';
  const lower = String(planet).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/**
 * Composes a human-readable statement for a canonical C9 dasha period.
 *
 * The domain-layer `period.statement` is diagnostic prose that embeds raw
 * enum tokens (e.g. "Role: PRIMARY_DRIVER. Effect: ACTIVATES."). This
 * projection rebuilds equivalent content with readable labels so the text is
 * safe to surface in product/UI and AI-context boundaries. The canonical
 * period object itself is left untouched.
 */
export function formatCanonicalDashaPeriodStatement(
  period: CareerDashaCanonicalPeriod,
  evidenceCount?: number
): string {
  if (!period.planet) {
    return 'No current Dasha period available.';
  }
  const parts = [
    `${period.level} period for planet ${planetLabel(period.planet)}.`,
    `Role: ${humanizeToken(period.role)}.`,
    `Effect: ${humanizeToken(period.effect)}.`,
    `Direction: ${humanizeToken(period.direction)}.`,
    `Strength: ${humanizeToken(period.strength)}.`
  ];
  if (typeof evidenceCount === 'number') {
    parts.push(`Evidence count: ${evidenceCount}.`);
  }
  if (period.afflictionAssessed === false) {
    parts.push('Affliction was not assessed; no affliction-based challenge is inferred.');
  }
  return parts.join(' ');
}
