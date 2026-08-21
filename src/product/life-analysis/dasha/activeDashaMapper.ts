import type { ActiveDashaInterpretation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type { DashaInterpretationProduct } from './dashaInterpretationProductTypes';
import { buildDashaInterpretationProduct } from './buildDashaInterpretationProduct';

export function mapActiveDasha(
  current?: ActiveDashaInterpretation
): DashaInterpretationProduct | undefined {
  if (!current) {
    return undefined;
  }
  return buildDashaInterpretationProduct(current);
}

export { buildDashaInterpretationProduct };
export * from './dashaInterpretationProductTypes';
