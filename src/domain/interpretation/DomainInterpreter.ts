import type { Horoscope } from '../../types';
import type { DomainId } from './DomainInterpretationTypes';
import type { DomainInterpretation } from './DomainInterpretation';

export interface DomainInterpreter {
  readonly domain: DomainId;

  interpret(
    horoscope: Horoscope
  ): DomainInterpretation;
}
