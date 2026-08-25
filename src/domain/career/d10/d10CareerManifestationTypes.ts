import type { Planet } from '../../../types';
import type { CareerManifestationMode } from '../careerTypes';

export interface D10ManifestationFactor {
  readonly id: string;
  readonly mode: CareerManifestationMode;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly weight: number;
  readonly planet?: Planet;
  readonly house?: number;
  readonly statement: string;
  readonly evidenceIds?: readonly string[];
}
