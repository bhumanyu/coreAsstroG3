import type { ParityDifference } from './goldenAcceptanceTypes';

export type GateStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';

export interface AcceptanceGate {
  readonly name: string;
  readonly status: GateStatus;
  readonly details?: string;
}

export interface GoldenAcceptanceReport {
  readonly gates: readonly AcceptanceGate[];
  readonly status: GateStatus;
  readonly differences: readonly ParityDifference[];
}

export function aggregateGateStatus(gates: readonly AcceptanceGate[]): GateStatus {
  if (gates.length === 0) return 'NOT_RUN';
  if (gates.some(gate => gate.status === 'FAIL')) return 'FAIL';
  if (gates.some(gate => gate.status === 'BLOCKED')) return 'BLOCKED';
  if (gates.some(gate => gate.status === 'NOT_RUN')) return 'NOT_RUN';
  return 'PASS';
}

export function buildGoldenAcceptanceReport(
  gates: readonly AcceptanceGate[],
  differences: readonly ParityDifference[] = []
): GoldenAcceptanceReport {
  const gateStatus = aggregateGateStatus(gates);
  const status: GateStatus = differences.length > 0 && gateStatus === 'PASS'
    ? 'FAIL'
    : gateStatus;
  return Object.freeze({
    gates: Object.freeze([...gates]),
    status,
    differences: Object.freeze([...differences])
  });
}
