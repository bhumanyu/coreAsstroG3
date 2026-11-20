export type Gate0ReadinessStatus = 'READY' | 'PENDING_REVIEW' | 'BLOCKED';
export type Rg09OverallStatus = Gate0ReadinessStatus;

export function deriveGate0OverallStatus(
  rg09OverallStatus: Rg09OverallStatus,
  missingMoonBrackets: number
): Gate0ReadinessStatus {
  if (!Number.isInteger(missingMoonBrackets) || missingMoonBrackets < 0) {
    throw new RangeError('missingMoonBrackets must be a non-negative integer.');
  }
  if (rg09OverallStatus === 'BLOCKED') return 'BLOCKED';
  return rg09OverallStatus === 'READY' && missingMoonBrackets === 0
    ? 'READY'
    : 'PENDING_REVIEW';
}
