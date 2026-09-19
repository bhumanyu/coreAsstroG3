import type { Horoscope } from '../../types';
import type { DomainInterpreter } from '../interpretation/DomainInterpreter';
import type { DomainInterpretation } from '../interpretation';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { interpretWealthV2 } from './WealthDomainInterpreterV2';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';

const DEFAULT_METHODOLOGY = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
};

export class WealthDomainInterpreter implements DomainInterpreter {
  readonly domain = 'WEALTH' as const;

  interpret(horoscope: Horoscope, options?: DomainReasoningOptions): DomainInterpretation {
    const opts = options ?? (() => {
      const asOf =
        horoscope.dashaInterpretation?.current?.at ??
        (horoscope.dashaInterpretation as any)?.asOf;
      const context = createAnalysisContext({
        asOf,
        methodology: DEFAULT_METHODOLOGY
      });
      const temporalState = resolveAnalysisTemporalState(horoscope, context);
      return { context, temporalState };
    })();
    return interpretWealthV2(horoscope, opts);
  }
}
