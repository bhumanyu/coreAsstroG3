import type { Horoscope } from '../../types';
import type { DomainId } from './DomainInterpretationTypes';
import type { DomainInterpretation } from './DomainInterpretation';
import { createDefaultDomainInterpreterRegistry } from './createDefaultDomainInterpreterRegistry';
import type { DomainInterpreterRegistry } from './DomainInterpreterRegistry';

export interface InterpretDomainOptions {
  readonly horoscope: Horoscope;
  readonly domain: DomainId;
  readonly registry?: DomainInterpreterRegistry;
}

export function interpretDomain(
  options: InterpretDomainOptions
): DomainInterpretation {
  const registry =
    options.registry ?? createDefaultDomainInterpreterRegistry();

  return registry.get(options.domain).interpret(options.horoscope);
}
