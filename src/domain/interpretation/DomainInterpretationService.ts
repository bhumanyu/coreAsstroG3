import type { Horoscope } from '../../types';
import type { DomainId } from './DomainInterpretationTypes';
import type { DomainInterpretation } from './DomainInterpretation';
import { createDefaultDomainInterpreterRegistry } from './createDefaultDomainInterpreterRegistry';
import type { DomainInterpreterRegistry } from './DomainInterpreterRegistry';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import type { AnalysisContext, ProductMethodology } from '../../core/analysis/AnalysisContext';
import type { AnalysisTemporalState } from '../../core/analysis/AnalysisTemporalState';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';

const CANONICAL_METHODOLOGY: ProductMethodology = Object.freeze({
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
});

export interface InterpretDomainOptions {
  readonly horoscope: Horoscope;
  readonly domain: DomainId;
  readonly registry?: DomainInterpreterRegistry;
  readonly options?: DomainReasoningOptions;
  readonly context?: AnalysisContext;
  readonly temporalState?: AnalysisTemporalState;
}

export function interpretDomain(
  options: InterpretDomainOptions
): DomainInterpretation {
  const registry =
    options.registry ?? createDefaultDomainInterpreterRegistry();

  const reasoningOptions: DomainReasoningOptions =
    options.options ??
    (() => {
      const asOf =
        options.horoscope.dashaInterpretation?.current?.at ??
        (options.horoscope.dashaInterpretation?.current as any)?.asOf ??
        (options.horoscope.dashaInterpretation as any)?.asOf ??
        options.horoscope.birthDetails?.dateTimeStr;
      const context =
        options.context ??
        createAnalysisContext({
          asOf,
          methodology: CANONICAL_METHODOLOGY
        });
      const temporalState =
        options.temporalState ??
        (options.horoscope.dashaInterpretation
          ? Object.freeze({
              asOf: context.asOf,
              dashaInterpretation: options.horoscope.dashaInterpretation
            })
          : resolveAnalysisTemporalState(options.horoscope, context));
      return { context, temporalState };
    })();

  return registry.get(options.domain).interpret(options.horoscope, reasoningOptions);
}

