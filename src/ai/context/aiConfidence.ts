import type { AiConfidence } from '../types/aiTypes';

export function toAiConfidence(value: unknown): AiConfidence {
  switch (value) {
    case 'VERY_HIGH':
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
    case 'MODERATE':
      return 'MEDIUM';
    case 'LOW':
      return 'LOW';
    default:
      throw new Error(`Unsupported confidence at AI boundary: ${String(value)}`);
  }
}
