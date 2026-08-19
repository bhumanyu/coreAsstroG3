import type { Horoscope } from '../../types';
import type { DomainInterpreter } from '../interpretation/DomainInterpreter';
import type { DomainInterpretation } from '../interpretation';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';

export class CareerDomainInterpreter implements DomainInterpreter {
  readonly domain = 'CAREER' as const;

  interpret(horoscope: Horoscope): DomainInterpretation {
    return interpretCareerV2(horoscope);
  }
}
