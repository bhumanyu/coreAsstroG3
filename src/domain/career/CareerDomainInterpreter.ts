import type { Horoscope } from '../../types';
import type { DomainInterpreter } from '../interpretation/DomainInterpreter';
import type { DomainInterpretation } from '../interpretation';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';

export class CareerDomainInterpreter implements DomainInterpreter {
  readonly domain = 'CAREER' as const;

  interpret(horoscope: Horoscope, options: DomainReasoningOptions): DomainInterpretation {
    return interpretCareerV2(horoscope, options);
  }
}

