import type { ThemeInterpretationContext } from './themeInterpretationContext';
import type {
  ThemeInterpretationEvidence
} from './themeInterpretationTypes';
import {
  WealthEvidenceFamily,
  type WealthEvidence,
  WEALTH_FAMILY_RANK
} from './wealthThemeInterpretationTypes';
import { WEALTH_RULES } from './rules/wealth/wealthRules';
import {
  deduplicateEvidenceById,
  evaluateRule,
  isPresentEvidence,
  sortEvidenceDeterministically
} from './themeInterpretationUtils';

export interface WealthEvidenceProduction {
  readonly evidence: readonly WealthEvidence[];
  readonly evaluatedRulesCount: number;
  readonly triggeredRulesCount: number;
  readonly ruleErrors: readonly {
    readonly ruleId: string;
    readonly error: string;
    readonly evidenceFamily: WealthEvidenceFamily;
  }[];
  readonly dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
}

export function checkWealthProducerDataCompleteness(
  context: ThemeInterpretationContext
): WealthEvidenceProduction['dataCompleteness'] {
  const hasHouseInt = Boolean(context.houseInterpretation);
  const hasPlanetInt = Boolean(context.planetInterpretation);
  const hasYogas = Boolean(context.yogas);
  const hasDivisional = Boolean(context.divisionalInterpretation);
  const hasRoles = Boolean(context.functionalRoles);
  const hasStrength = Boolean(context.planetaryStrength);
  const hasDasha = Boolean(context.dashaInterpretation);
  const hasDrishti = Boolean(context.natalGrahaDrishti);

  if (!hasHouseInt || !hasPlanetInt) return 'INSUFFICIENT';
  if (!hasYogas || !hasDivisional || !hasRoles || !hasStrength || !hasDasha || !hasDrishti) {
    return 'PARTIAL';
  }
  return 'COMPLETE';
}

export function produceWealthEvidence(
  context: ThemeInterpretationContext
): WealthEvidenceProduction {
  const rawEvidence: WealthEvidence[] = [];
  let evaluatedRulesCount = 0;
  let triggeredRulesCount = 0;
  const ruleErrors: {
    ruleId: string;
    error: string;
    evidenceFamily: WealthEvidenceFamily;
  }[] = [];

  for (const rule of WEALTH_RULES) {
    evaluatedRulesCount++;
    const ruleErrorsForRule: { ruleId: string; error: string }[] = [];
    const result = evaluateRule(rule, context, undefined, ruleErrorsForRule);
    ruleErrors.push(
      ...ruleErrorsForRule.map((ruleError) => ({
        ...ruleError,
        evidenceFamily: rule.evidenceFamily
      }))
    );
    if (!isPresentEvidence(result)) continue;

    triggeredRulesCount++;
    if (Array.isArray(result.evidence)) {
      rawEvidence.push(...result.evidence as readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]);
    } else if (result.evidence) {
      rawEvidence.push(result.evidence as ThemeInterpretationEvidence<WealthEvidenceFamily>);
    }
  }

  const evidence = sortEvidenceDeterministically(
    deduplicateEvidenceById(rawEvidence),
    WEALTH_FAMILY_RANK
  );
  const dataCompleteness = checkWealthProducerDataCompleteness(context);

  return Object.freeze({
    evidence,
    evaluatedRulesCount,
    triggeredRulesCount,
    ruleErrors: Object.freeze(ruleErrors),
    dataCompleteness
  });
}
