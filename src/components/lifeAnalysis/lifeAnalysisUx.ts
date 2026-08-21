/**
 * Presentation-only UX helpers for Life Domain Analysis.
 * Strictly presentational formatting and color badge class mappings.
 * Contains NO astrology calculations or domain synthesis logic.
 */

/**
 * Formats enum values into clean human-readable Title Case strings.
 * E.g., 'STRONGLY_SUPPORTED' -> 'Strongly Supported', 'CONFIRMS' -> 'Confirms'.
 * Returns 'Unavailable' if null, undefined, or empty.
 */
export function formatEnum(value: string | undefined | null): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return 'Unavailable';
  }

  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Classifies an astrological effect / status string into a high-level tone.
 */
export function getEffectTone(
  effect: string | undefined | null
): 'positive' | 'warning' | 'negative' | 'neutral' {
  if (!effect) return 'neutral';
  const normalized = effect.toUpperCase();

  switch (normalized) {
    case 'STRONGLY_SUPPORTED':
    case 'SUPPORTED':
    case 'SUPPORT':
    case 'TRIGGER':
    case 'CONFIRMS':
    case 'CONFIRMED':
    case 'VERY_HIGH':
    case 'HIGH':
    case 'VERY_STRONG':
    case 'STRONG':
    case 'COMPLETE':
      return 'positive';

    case 'MIXED':
    case 'MODIFIES':
    case 'MODIFIER':
    case 'MODERATE':
    case 'PARTIAL':
      return 'warning';

    case 'CHALLENGED':
    case 'CHALLENGE':
    case 'CONFLICTS':
    case 'CONFLICTING':
    case 'LIMITED':
    case 'WEAK':
    case 'LOW':
    case 'VERY_LOW':
    case 'INSUFFICIENT_DATA':
      return 'negative';

    default:
      return 'neutral';
  }
}

/**
 * Returns Tailwind badge classes for timing and directional effects (SUPPORT, CHALLENGE, etc.).
 */
export function getEffectBadgeClass(effect: string | undefined | null): string {
  const tone = getEffectTone(effect);
  switch (tone) {
    case 'positive':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'negative':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'warning':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'neutral':
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

/**
 * Returns Tailwind badge classes for overall/domain synthesis status.
 */
export function getStatusBadgeClass(status: string | undefined | null): string {
  if (!status) return 'bg-slate-800 text-slate-300 border-slate-700';
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'STRONGLY_SUPPORTED':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    case 'SUPPORTED':
      return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    case 'MIXED':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'CHALLENGED':
    case 'LIMITED':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

/**
 * Returns Tailwind badge classes for divisional varga validation relationships (CONFIRMS, MODIFIES, CONFLICTS).
 */
export function getVargaBadgeClass(relationship: string | undefined | null): string {
  if (!relationship) return 'bg-slate-800 text-slate-400 border-slate-700';
  const normalized = relationship.toUpperCase();

  switch (normalized) {
    case 'CONFIRMS':
    case 'CONFIRMED':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'MODIFIES':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'CONFLICTS':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

/**
 * Returns Tailwind badge classes for cross-domain conflict severity levels.
 */
export function getSeverityBadgeClass(severity: string | undefined | null): string {
  if (!severity) return 'bg-slate-800 text-slate-400 border-slate-700';
  const normalized = severity.toUpperCase();

  switch (normalized) {
    case 'HIGH':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'MODERATE':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'LOW':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

/**
 * Returns text color styling for classical wealth dimensions.
 */
export function getWealthDimensionColor(status: string | undefined | null): string {
  if (!status) return 'text-slate-400';
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'STRONGLY_SUPPORTED':
      return 'text-emerald-400';
    case 'SUPPORTED':
      return 'text-indigo-400';
    case 'MIXED':
      return 'text-amber-400';
    case 'CHALLENGED':
    case 'LIMITED':
      return 'text-rose-400';
    default:
      return 'text-slate-400';
  }
}

/**
 * Returns badge styling for synthesis confidence levels.
 */
export function getConfidenceBadgeClass(confidence: string | undefined | null): string {
  if (!confidence) return 'bg-slate-800 text-slate-400 border-slate-700';
  const normalized = confidence.toUpperCase();

  switch (normalized) {
    case 'VERY_HIGH':
    case 'HIGH':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'MODERATE':
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'LOW':
    case 'VERY_LOW':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}
