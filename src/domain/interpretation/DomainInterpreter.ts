import type { Horoscope } from '../../types';
import type { DomainId } from './DomainInterpretationTypes';
import type { DomainInterpretation } from './DomainInterpretation';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';

export interface DomainInterpreter {
  readonly domain: DomainId;

  interpret(
    horoscope: Horoscope,
    options: DomainReasoningOptions
  ): DomainInterpretation;
}

