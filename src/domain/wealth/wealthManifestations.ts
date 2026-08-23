import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import { createDomainManifestation } from '../interpretation/ManifestationMode';
import type { DomainManifestation } from '../interpretation/ManifestationMode';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { ConfidenceLevel } from '../interpretation/DomainInterpretationTypes';
import type { WealthManifestationMode } from './wealthTypes';

export const WEALTH_ACCUMULATION_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set([
  WealthEvidenceFamily.SECOND_HOUSE,
  WealthEvidenceFamily.SECOND_LORD
]);

export const WEALTH_GAINS_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set([
  WealthEvidenceFamily.ELEVENTH_HOUSE,
  WealthEvidenceFamily.ELEVENTH_LORD
]);

export const WEALTH_FORTUNE_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set([
  WealthEvidenceFamily.NINTH_HOUSE,
  WealthEvidenceFamily.NINTH_LORD,
  WealthEvidenceFamily.JUPITER
]);

export const WEALTH_SPECULATION_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set([
  WealthEvidenceFamily.FIFTH_HOUSE,
  WealthEvidenceFamily.FIFTH_LORD
]);

export const WEALTH_ACCUMULATION_RULES: ReadonlySet<string> = new Set([
  'WEALTH_HOUSE_PROMISE_2H_001',
  'WEALTH_LORD_PROMISE_2L_001',
  'WEALTH_2H_STRONG_001',
  'WEALTH_2L_DIGNITY_001',
  'WEALTH_ACCUMULATION_001'
]);

export const WEALTH_GAINS_RULES: ReadonlySet<string> = new Set([
  'WEALTH_HOUSE_PROMISE_11H_001',
  'WEALTH_LORD_PROMISE_11L_001',
  'WEALTH_11H_STRONG_001',
  'WEALTH_11L_DIGNITY_001',
  'WEALTH_GAINS_001'
]);

export const WEALTH_FORTUNE_RULES: ReadonlySet<string> = new Set([
  'WEALTH_HOUSE_PROMISE_9H_001',
  'WEALTH_LORD_PROMISE_9L_001',
  'WEALTH_JUPITER_KARAKA_001',
  'WEALTH_9H_FORTUNE_001',
  'WEALTH_FORTUNE_001'
]);

export const WEALTH_SPECULATION_RULES: ReadonlySet<string> = new Set([
  'WEALTH_HOUSE_PROMISE_5H_001',
  'WEALTH_LORD_PROMISE_5L_001',
  'WEALTH_5H_SPECULATION_001',
  'WEALTH_5L_DIGNITY_001',
  'WEALTH_SPECULATION_001'
]);

export function calculateManifestationConfidence(
  evidence: readonly DomainEvidence[]
): 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW' {
  if (evidence.length === 0) {
    return 'VERY_LOW';
  }

  const primary = evidence.filter((e) => e.role === 'PRIMARY');
  const strong = evidence.filter(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );
  const supporting = evidence.filter((e) => e.polarity === 'SUPPORTING');

  if (primary.length >= 2 && strong.length >= 2) {
    return 'VERY_HIGH';
  }

  if ((primary.length >= 1 && strong.length >= 1) || (primary.length >= 2 && supporting.length >= 2)) {
    return 'HIGH';
  }

  if (primary.length >= 1 || strong.length >= 1 || supporting.length >= 2) {
    return 'MODERATE';
  }

  return 'LOW';
}

export function deriveWealthManifestations(
  evidence: readonly DomainEvidence[],
  rawEvidence?: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): readonly DomainManifestation[] {
  const manifestations: DomainManifestation[] = [];

  const rawById = new Map<string, ThemeInterpretationEvidence<WealthEvidenceFamily>>();
  if (rawEvidence) {
    for (const item of rawEvidence) {
      rawById.set(item.id, item);
    }
  }

  const getSupportingEvidence = (
    dimension: WealthManifestationMode,
    families: ReadonlySet<WealthEvidenceFamily>,
    ruleSet: ReadonlySet<string>
  ): DomainEvidence[] => {
    return evidence.filter((item) => {
      // Must be SUPPORTING
      if (item.polarity !== 'SUPPORTING') {
        return false;
      }

      // Check dimension property directly on DomainEvidence
      if (item.dimension === dimension) {
        return true;
      }

      // Check raw evidence if available
      const raw = rawById.get(item.id);
      if (raw) {
        if (raw.effect !== 'SUPPORT') {
          return false;
        }
        if (families.has(raw.evidenceFamily)) {
          return true;
        }
        const baseRawRule = raw.ruleId.split(':')[0];
        if (ruleSet.has(raw.ruleId) || ruleSet.has(baseRawRule)) {
          return true;
        }
      }

      // Check item evidenceFamily or ruleId
      if (item.evidenceFamily && families.has(item.evidenceFamily as WealthEvidenceFamily)) {
        return true;
      }

      if (item.ruleId) {
        const baseRule = item.ruleId.split(':')[0];
        if (ruleSet.has(item.ruleId) || ruleSet.has(baseRule)) {
          return true;
        }
      }

      return false;
    });
  };

  // 1. ACCUMULATION
  const accumulationEvidence = getSupportingEvidence(
    'ACCUMULATION',
    WEALTH_ACCUMULATION_FAMILIES,
    WEALTH_ACCUMULATION_RULES
  );
  const accumulationConfidence = calculateManifestationConfidence(accumulationEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'ACCUMULATION',
      confidence: accumulationConfidence,
      status: accumulationEvidence.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_DATA',
      statement: accumulationEvidence.length > 0
        ? 'Strong capacity for capital accumulation, liquid savings preservation, and tangible asset building.'
        : 'Limited or insufficient data for liquid savings and capital accumulation in the available evidence.',
      evidenceIds: accumulationEvidence.map((e) => e.id)
    })
  );

  // 2. GAINS
  const gainsEvidence = getSupportingEvidence(
    'GAINS',
    WEALTH_GAINS_FAMILIES,
    WEALTH_GAINS_RULES
  );
  const gainsConfidence = calculateManifestationConfidence(gainsEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'GAINS',
      confidence: gainsConfidence,
      status: gainsEvidence.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_DATA',
      statement: gainsEvidence.length > 0
        ? 'Active channels for recurring income, business revenues, and social network monetization.'
        : 'Limited or insufficient data for recurring gains and network monetization in the available evidence.',
      evidenceIds: gainsEvidence.map((e) => e.id)
    })
  );

  // 3. FORTUNE
  const fortuneEvidence = getSupportingEvidence(
    'FORTUNE',
    WEALTH_FORTUNE_FAMILIES,
    WEALTH_FORTUNE_RULES
  );
  const fortuneConfidence = calculateManifestationConfidence(fortuneEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'FORTUNE',
      confidence: fortuneConfidence,
      status: fortuneEvidence.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_DATA',
      statement: fortuneEvidence.length > 0
        ? 'Auspicious indications for long-term prosperity, luck, and hereditary or unearned fortune.'
        : 'Standard financial fortune trajectory without pronounced indicators in the available evidence.',
      evidenceIds: fortuneEvidence.map((e) => e.id)
    })
  );

  // 4. SPECULATION
  const speculationEvidence = getSupportingEvidence(
    'SPECULATION',
    WEALTH_SPECULATION_FAMILIES,
    WEALTH_SPECULATION_RULES
  );
  const speculationConfidence = calculateManifestationConfidence(speculationEvidence);
  manifestations.push(
    createDomainManifestation({
      mode: 'SPECULATION',
      confidence: speculationConfidence,
      status: speculationEvidence.length > 0 ? 'SUPPORTED' : 'INSUFFICIENT_DATA',
      statement: speculationEvidence.length > 0
        ? 'The chart contains supportive indicators for speculative activity, though these should be interpreted separately from overall wealth potential.'
        : 'Speculative indicators are comparatively weaker than accumulation and gains.',
      evidenceIds: speculationEvidence.map((e) => e.id)
    })
  );

  return Object.freeze(manifestations);
}

export function buildWealthManifestations(
  rawEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[],
  evidence: readonly DomainEvidence[]
): readonly DomainManifestation[] {
  return deriveWealthManifestations(evidence, rawEvidence);
}
