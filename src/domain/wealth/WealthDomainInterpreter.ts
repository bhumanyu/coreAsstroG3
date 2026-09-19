import type { Horoscope } from '../../types';
import type { DomainInterpreter } from '../interpretation/DomainInterpreter';
import type { DomainInterpretation } from '../interpretation';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { interpretWealthV2 } from './WealthDomainInterpreterV2';

export class WealthDomainInterpreter implements DomainInterpreter {
  readonly domain = 'WEALTH' as const;

  interpret(horoscope: Horoscope, options: DomainReasoningOptions): DomainInterpretation {
    return interpretWealthV2(horoscope, options);
  }
}

