import { Horoscope } from '../../types';
import {
  ThemeInterpretationContext,
  ThemeInterpretationContextInput,
  buildThemeInterpretationContext
} from './themeInterpretationContext';
import {
  EvidenceConfidence,
  EvidenceFamilySummary,
  VargaRelationship
} from './themeInterpretationTypes';
import {
  WealthEvidenceFamily,
  WealthEvidence,
  WealthRule,
  WealthEvidenceFamilySummary,
  WealthSubthemeKey,
  WealthSubthemeSummary,
  WealthThemeStatus,
  WealthInterpretationConclusion,
  WealthNatalPromise,
  WealthThemeInterpretationMetadata,
  WealthThemeInterpretation,
  WEALTH_FAMILY_RANK
} from './wealthThemeInterpretationTypes';
import { WEALTH_RULES } from './rules/wealth/wealthRules';
import {
  evaluateRule,
  isPresentEvidence,
  deduplicateEvidenceById,
  sortEvidenceDeterministically,
  groupEvidenceByFamily,
  buildFamilySummaries,
  deepFreeze
} from './themeInterpretationUtils';

export const WEALTH_STRUCTURAL_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set<WealthEvidenceFamily>([
  WealthEvidenceFamily.SECOND_HOUSE,
  WealthEvidenceFamily.SECOND_LORD,
  WealthEvidenceFamily.ELEVENTH_HOUSE,
  WealthEvidenceFamily.ELEVENTH_LORD,
  WealthEvidenceFamily.NINTH_HOUSE,
  WealthEvidenceFamily.NINTH_LORD,
  WealthEvidenceFamily.FIFTH_HOUSE,
  WealthEvidenceFamily.FIFTH_LORD
]);

export const WEALTH_MODIFIER_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set<WealthEvidenceFamily>([
  WealthEvidenceFamily.FUNCTIONAL_ROLE,
  WealthEvidenceFamily.PLANETARY_STRENGTH,
  WealthEvidenceFamily.ASPECT,
  WealthEvidenceFamily.JUPITER,
  WealthEvidenceFamily.VENUS,
  WealthEvidenceFamily.MERCURY
]);

export const WEALTH_CONFIRMATION_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set<WealthEvidenceFamily>([
  WealthEvidenceFamily.YOGA,
  WealthEvidenceFamily.D2
]);

export const WEALTH_TIMING_FAMILIES: ReadonlySet<WealthEvidenceFamily> = new Set<WealthEvidenceFamily>([
  WealthEvidenceFamily.DASHA,
  WealthEvidenceFamily.TRANSIT
]);

type WealthDomain = 'SECOND' | 'ELEVENTH' | 'NINTH' | 'FIFTH';

function getWealthDomain(family: WealthEvidenceFamily): WealthDomain | undefined {
  switch (family) {
    case WealthEvidenceFamily.SECOND_HOUSE:
    case WealthEvidenceFamily.SECOND_LORD:
      return 'SECOND';
    case WealthEvidenceFamily.ELEVENTH_HOUSE:
    case WealthEvidenceFamily.ELEVENTH_LORD:
      return 'ELEVENTH';
    case WealthEvidenceFamily.NINTH_HOUSE:
    case WealthEvidenceFamily.NINTH_LORD:
      return 'NINTH';
    case WealthEvidenceFamily.FIFTH_HOUSE:
    case WealthEvidenceFamily.FIFTH_LORD:
      return 'FIFTH';
    default:
      return undefined;
  }
}

export function checkDataCompleteness(context: ThemeInterpretationContext): 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT' {
  const hasHouseInt = Boolean(context.houseInterpretation);
  const hasPlanetInt = Boolean(context.planetInterpretation);
  const hasYogas = Boolean(context.yogas);
  const hasDivisional = Boolean(context.divisionalInterpretation);
  const hasRoles = Boolean(context.functionalRoles);
  const hasStrength = Boolean(context.planetaryStrength);
  const hasDasha = Boolean(context.dashaInterpretation);
  const hasDrishti = Boolean(context.natalGrahaDrishti);

  if (!hasHouseInt || !hasPlanetInt) {
    return 'INSUFFICIENT';
  }
  if (!hasYogas || !hasDivisional || !hasRoles || !hasStrength || !hasDasha || !hasDrishti) {
    return 'PARTIAL';
  }
  return 'COMPLETE';
}

export function computeWealthNatalPromise(
  evidence: readonly WealthEvidence[],
  context: ThemeInterpretationContext,
  familySummaries: Readonly<Partial<Record<WealthEvidenceFamily, EvidenceFamilySummary<WealthEvidenceFamily>>>>
): WealthNatalPromise {
  const structuralEvidence = evidence.filter((e) => WEALTH_STRUCTURAL_FAMILIES.has(e.evidenceFamily));
  const primaryEvidence = structuralEvidence.filter((e) => e.priority === 'PRIMARY');
  const primarySupport = primaryEvidence.filter((e) => e.effect === 'SUPPORT');
  const primaryChallenges = primaryEvidence.filter((e) => e.effect === 'CHALLENGE');

  const strongPrimarySupport = primarySupport.filter((e) => e.strength === 'STRONG');
  const dataCompleteness = checkDataCompleteness(context);

  // Group supporting structural evidence into independent structural domains (2nd, 11th, 9th, 5th)
  const independentSupportingDomains = new Set<WealthDomain>();
  for (const e of structuralEvidence) {
    if (e.effect === 'SUPPORT') {
      const dom = getWealthDomain(e.evidenceFamily);
      if (dom) independentSupportingDomains.add(dom);
    }
  }

  const secondHouseSummary = familySummaries[WealthEvidenceFamily.SECOND_HOUSE];
  const secondLordSummary = familySummaries[WealthEvidenceFamily.SECOND_LORD];
  const eleventhHouseSummary = familySummaries[WealthEvidenceFamily.ELEVENTH_HOUSE];
  const eleventhLordSummary = familySummaries[WealthEvidenceFamily.ELEVENTH_LORD];

  const hasPrimaryMixed =
    secondHouseSummary?.status === 'MIXED' ||
    secondLordSummary?.status === 'MIXED' ||
    eleventhHouseSummary?.status === 'MIXED' ||
    eleventhLordSummary?.status === 'MIXED' ||
    familySummaries[WealthEvidenceFamily.NINTH_HOUSE]?.status === 'MIXED' ||
    familySummaries[WealthEvidenceFamily.NINTH_LORD]?.status === 'MIXED' ||
    familySummaries[WealthEvidenceFamily.FIFTH_HOUSE]?.status === 'MIXED' ||
    familySummaries[WealthEvidenceFamily.FIFTH_LORD]?.status === 'MIXED';

  const hasPrimarySupport = primarySupport.length > 0;
  const hasPrimaryChallenge = primaryChallenges.length > 0;

  const hasStructuralChallenge = structuralEvidence.some((e) => e.effect === 'CHALLENGE');
  const hasStructuralMixed = Object.values(familySummaries).some(
    (s) => s && WEALTH_STRUCTURAL_FAMILIES.has(s.family) && s.status === 'MIXED'
  );

  const secondStrong =
    (secondHouseSummary?.status === 'SUPPORT' && secondHouseSummary.supportingEvidence.some((e) => e.strength === 'STRONG')) ||
    (secondLordSummary?.status === 'SUPPORT' && secondLordSummary.supportingEvidence.some((e) => e.strength === 'STRONG')) ||
    strongPrimarySupport.some(
      (e) => e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE || e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD
    );

  const secondSupported =
    (secondHouseSummary?.status === 'SUPPORT' && secondHouseSummary.supportingEvidence.length > 0) ||
    (secondLordSummary?.status === 'SUPPORT' && secondLordSummary.supportingEvidence.length > 0) ||
    primarySupport.some(
      (e) => e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE || e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD
    );

  const eleventhStrong =
    (eleventhHouseSummary?.status === 'SUPPORT' && eleventhHouseSummary.supportingEvidence.some((e) => e.strength === 'STRONG')) ||
    (eleventhLordSummary?.status === 'SUPPORT' && eleventhLordSummary.supportingEvidence.some((e) => e.strength === 'STRONG')) ||
    strongPrimarySupport.some(
      (e) => e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE || e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD
    );

  const eleventhSupported =
    (eleventhHouseSummary?.status === 'SUPPORT' && eleventhHouseSummary.supportingEvidence.length > 0) ||
    (eleventhLordSummary?.status === 'SUPPORT' && eleventhLordSummary.supportingEvidence.length > 0) ||
    primarySupport.some(
      (e) => e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE || e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD
    );

  let status: 'STRONG' | 'SUPPORTED' | 'MIXED' | 'ADVERSE' | 'UNAVAILABLE' = 'UNAVAILABLE';

  if (dataCompleteness === 'INSUFFICIENT' || primaryEvidence.length === 0) {
    status = 'UNAVAILABLE';
  } else if (hasPrimaryMixed || (hasPrimarySupport && hasPrimaryChallenge)) {
    status = 'MIXED';
  } else if (hasPrimaryChallenge && !hasPrimarySupport) {
    status = 'ADVERSE';
  } else if (
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasStructuralChallenge &&
    !hasStructuralMixed &&
    secondStrong &&
    eleventhStrong
  ) {
    status = 'STRONG';
  } else if ((hasPrimarySupport || independentSupportingDomains.size >= 1) && !hasPrimaryChallenge) {
    status = 'SUPPORTED';
  } else {
    status = 'MIXED';
  }

  const hasStrongStructuralFamily = Object.values(familySummaries).some(
    (s) => s && WEALTH_STRUCTURAL_FAMILIES.has(s.family) && s.status === 'SUPPORT' && s.supportingEvidence.some((e) => e.strength === 'STRONG')
  );

  let evidenceConfidence: EvidenceConfidence = 'MEDIUM';
  if (dataCompleteness === 'INSUFFICIENT' || primaryEvidence.length < 1 || independentSupportingDomains.size === 0) {
    evidenceConfidence = 'LOW';
  } else if (
    independentSupportingDomains.size >= 2 &&
    (independentSupportingDomains.has('SECOND') || independentSupportingDomains.has('ELEVENTH')) &&
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasStructuralChallenge &&
    (dataCompleteness === 'COMPLETE' || dataCompleteness === 'PARTIAL')
  ) {
    evidenceConfidence = 'HIGH';
  } else if (hasStrongStructuralFamily || strongPrimarySupport.length >= 1) {
    evidenceConfidence = 'MEDIUM';
  } else {
    evidenceConfidence = 'MEDIUM';
  }

  return deepFreeze({
    status,
    structuralEvidence: Object.freeze(structuralEvidence),
    primarySupport: Object.freeze(primarySupport),
    primaryChallenges: Object.freeze(primaryChallenges),
    evidenceConfidence
  });
}

export interface WealthSubthemeConfig {
  readonly key: WealthSubthemeKey;
  readonly title: string;
  readonly houseNumber: number;
  readonly primaryFamily: WealthEvidenceFamily;
  readonly lordFamily: WealthEvidenceFamily;
}

export const WEALTH_SUBTHEME_CONFIGS: readonly WealthSubthemeConfig[] = Object.freeze([
  {
    key: 'ACCUMULATION',
    title: 'Wealth Accumulation & Liquid Assets',
    houseNumber: 2,
    primaryFamily: WealthEvidenceFamily.SECOND_HOUSE,
    lordFamily: WealthEvidenceFamily.SECOND_LORD
  },
  {
    key: 'GAINS',
    title: 'Income, Gains & Financial Inflows',
    houseNumber: 11,
    primaryFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
    lordFamily: WealthEvidenceFamily.ELEVENTH_LORD
  },
  {
    key: 'FORTUNE',
    title: 'Prosperity & Bhagya (Fortune)',
    houseNumber: 9,
    primaryFamily: WealthEvidenceFamily.NINTH_HOUSE,
    lordFamily: WealthEvidenceFamily.NINTH_LORD
  },
  {
    key: 'SPECULATION',
    title: 'Investments & Speculative Growth',
    houseNumber: 5,
    primaryFamily: WealthEvidenceFamily.FIFTH_HOUSE,
    lordFamily: WealthEvidenceFamily.FIFTH_LORD
  }
]);

function buildWealthSubthemes(
  familySummaries: Readonly<Partial<Record<WealthEvidenceFamily, EvidenceFamilySummary<WealthEvidenceFamily>>>>
): Readonly<Record<WealthSubthemeKey, WealthSubthemeSummary>> {
  const configs = WEALTH_SUBTHEME_CONFIGS;

  const subthemes: Partial<Record<WealthSubthemeKey, WealthSubthemeSummary>> = {};

  for (const cfg of configs) {
    const hSum = familySummaries[cfg.primaryFamily];
    const lSum = familySummaries[cfg.lordFamily];

    const supportingCount =
      (hSum?.supportingEvidence.length || 0) + (lSum?.supportingEvidence.length || 0);
    const challengingCount =
      (hSum?.challengingEvidence.length || 0) + (lSum?.challengingEvidence.length || 0);

    let status: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' = 'NEUTRAL';
    if (supportingCount > 0 && challengingCount > 0) {
      status = 'MIXED';
    } else if (supportingCount > 0) {
      status = 'SUPPORT';
    } else if (challengingCount > 0) {
      status = 'CHALLENGE';
    } else {
      status = 'NEUTRAL';
    }

    let summaryStatement = '';
    switch (status) {
      case 'SUPPORT':
        summaryStatement = `${cfg.title} is well supported by primary house and lord factors.`;
        break;
      case 'CHALLENGE':
        summaryStatement = `${cfg.title} faces structural friction or challenging placements.`;
        break;
      case 'MIXED':
        summaryStatement = `${cfg.title} demonstrates mixed dignity with both supportive and challenging influences.`;
        break;
      case 'NEUTRAL':
        summaryStatement = `${cfg.title} shows baseline neutral influences with no strong afflictions.`;
        break;
    }

    subthemes[cfg.key] = Object.freeze({
      key: cfg.key,
      title: cfg.title,
      houseNumber: cfg.houseNumber,
      primaryFamily: cfg.primaryFamily,
      lordFamily: cfg.lordFamily,
      status,
      supportingEvidenceCount: supportingCount,
      challengingEvidenceCount: challengingCount,
      summaryStatement
    });
  }

  return Object.freeze(subthemes as Record<WealthSubthemeKey, WealthSubthemeSummary>);
}

function synthesizeWealthEvidence(
  evidence: readonly WealthEvidence[],
  context: ThemeInterpretationContext,
  familySummaries: Readonly<Partial<Record<WealthEvidenceFamily, EvidenceFamilySummary<WealthEvidenceFamily>>>>,
  wealthNatalPromise: WealthNatalPromise
): WealthInterpretationConclusion {
  const dataCompleteness = checkDataCompleteness(context);

  // 1. Base status from WealthNatalPromise
  let status: WealthThemeStatus = 'LIMITED_EVIDENCE';
  if (wealthNatalPromise.status === 'UNAVAILABLE') {
    status = 'LIMITED_EVIDENCE';
  } else if (wealthNatalPromise.status === 'ADVERSE') {
    status = 'CHALLENGED';
  } else if (wealthNatalPromise.status === 'MIXED') {
    status = 'MIXED';
  } else if (wealthNatalPromise.status === 'STRONG') {
    status = 'STRONGLY_SUPPORTED';
  } else if (wealthNatalPromise.status === 'SUPPORTED') {
    status = 'SUPPORTED';
  }

  // 2. D2 Confirmation Layer (Not implemented in v1 -> UNAVAILABLE)
  const d2Ev = evidence.find((e) => e.evidenceFamily === WealthEvidenceFamily.D2);
  const hasD2Conflict =
    d2Ev?.effect === 'CHALLENGE' || d2Ev?.vargaEvidence?.relationship === 'CONFLICTS';

  if (status === 'STRONGLY_SUPPORTED' && hasD2Conflict) {
    status = 'SUPPORTED';
  }

  // 3. Yoga Confirmation Layer
  const yogaEvidence = evidence.filter((e) => e.evidenceFamily === WealthEvidenceFamily.YOGA);
  const hasYogaSupport = yogaEvidence.some((e) => e.effect === 'SUPPORT');
  const hasD2Confirms = d2Ev?.effect === 'SUPPORT' && d2Ev.vargaEvidence?.relationship === 'CONFIRMS';
  const hasConfirmation = hasYogaSupport || hasD2Confirms;

  // 4. Derive Final Confidence
  const structuralEvidence = evidence.filter((e) => WEALTH_STRUCTURAL_FAMILIES.has(e.evidenceFamily));
  const independentSupportingDomains = new Set<WealthDomain>();
  for (const e of structuralEvidence) {
    if (e.effect === 'SUPPORT') {
      const dom = getWealthDomain(e.evidenceFamily);
      if (dom) independentSupportingDomains.add(dom);
    }
  }

  const primaryEvidence = structuralEvidence.filter((e) => e.priority === 'PRIMARY');
  const hasPrimaryChallenge = wealthNatalPromise.primaryChallenges.length > 0;
  const secondHouseSummary = familySummaries[WealthEvidenceFamily.SECOND_HOUSE];
  const secondLordSummary = familySummaries[WealthEvidenceFamily.SECOND_LORD];
  const eleventhHouseSummary = familySummaries[WealthEvidenceFamily.ELEVENTH_HOUSE];
  const eleventhLordSummary = familySummaries[WealthEvidenceFamily.ELEVENTH_LORD];

  const hasPrimaryMixed =
    secondHouseSummary?.status === 'MIXED' ||
    secondLordSummary?.status === 'MIXED' ||
    eleventhHouseSummary?.status === 'MIXED' ||
    eleventhLordSummary?.status === 'MIXED';

  const hasStrongStructuralFamily = Object.values(familySummaries).some(
    (s) => s && WEALTH_STRUCTURAL_FAMILIES.has(s.family) && s.status === 'SUPPORT' && s.supportingEvidence.some((e) => e.strength === 'STRONG')
  );

  let confidence: EvidenceConfidence = 'MEDIUM';
  if (dataCompleteness === 'INSUFFICIENT' || primaryEvidence.length < 1 || independentSupportingDomains.size === 0) {
    confidence = 'LOW';
  } else if (
    independentSupportingDomains.size >= 2 &&
    (independentSupportingDomains.has('SECOND') || independentSupportingDomains.has('ELEVENTH')) &&
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasD2Conflict &&
    (dataCompleteness === 'COMPLETE' || dataCompleteness === 'PARTIAL')
  ) {
    confidence = 'HIGH';
  } else if (
    (hasStrongStructuralFamily || hasConfirmation) &&
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasD2Conflict
  ) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'MEDIUM';
  }

  // Collect factor statements across family summaries
  const keySupportingFactorsSet = new Set<string>();
  const keyChallengingFactorsSet = new Set<string>();
  const keyConditionalFactorsSet = new Set<string>();

  for (const summary of Object.values(familySummaries)) {
    if (!summary) continue;
    for (const e of summary.supportingEvidence) keySupportingFactorsSet.add(e.statement);
    for (const e of summary.challengingEvidence) keyChallengingFactorsSet.add(e.statement);
    for (const e of [...summary.supportingEvidence, ...summary.challengingEvidence, ...summary.neutralEvidence]) {
      if (e.conditional) keyConditionalFactorsSet.add(e.statement);
    }
  }

  for (const e of evidence) {
    if (e.effect === 'SUPPORT') keySupportingFactorsSet.add(e.statement);
    if (e.effect === 'CHALLENGE') keyChallengingFactorsSet.add(e.statement);
    if (e.conditional) keyConditionalFactorsSet.add(e.statement);
  }

  let summary = '';
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      summary = 'Wealth and financial prosperity indicators demonstrate robust multi-domain alignment across 2nd (accumulation) and 11th (gains) houses and lords.';
      break;
    case 'SUPPORTED':
      summary = 'Financial indicators exhibit positive structural support across wealth houses and planetary significators.';
      break;
    case 'MIXED':
      summary = 'Wealth indicators show a blend of supporting dignity alongside specific house or placement challenges.';
      break;
    case 'CHALLENGED':
      summary = 'Wealth indicators reflect notable friction, afflicted house placements, or challenging lord dignities.';
      break;
    case 'LIMITED_EVIDENCE':
      summary = 'Available upstream astrological data is insufficient or lacks primary wealth indicators for definitive evaluation.';
      break;
  }

  if (dataCompleteness === 'PARTIAL') {
    summary += ' Some upstream interpretation layers are unavailable, so the result is based on the available deterministic evidence.';
  }

  return deepFreeze({
    status,
    confidence,
    summary,
    keySupportingFactors: Object.freeze(Array.from(keySupportingFactorsSet)),
    keyChallengingFactors: Object.freeze(Array.from(keyChallengingFactorsSet)),
    keyConditionalFactors: Object.freeze(Array.from(keyConditionalFactorsSet))
  });
}

export function interpretWealthTheme(
  input: ThemeInterpretationContextInput | Horoscope
): WealthThemeInterpretation {
  const context = buildThemeInterpretationContext(input);

  const rawEvidence: WealthEvidence[] = [];
  let evaluatedRulesCount = 0;
  let triggeredRulesCount = 0;
  const ruleErrors: { ruleId: string; error: string }[] = [];

  // Step 1: Run all registered wealth rules (non-D2 in v1)
  for (const rule of WEALTH_RULES) {
    evaluatedRulesCount++;
    const result = evaluateRule(rule, context, undefined, ruleErrors);
    if (isPresentEvidence(result)) {
      triggeredRulesCount++;
      if (Array.isArray(result.evidence)) {
        rawEvidence.push(...(result.evidence as readonly WealthEvidence[]));
      } else if (result.evidence) {
        rawEvidence.push(result.evidence as WealthEvidence);
      }
    }
  }

  // Step 2: Build evidence, deduplicated, sorted, and family summaries
  const deduplicated = deduplicateEvidenceById(rawEvidence);
  const sortedEvidence = sortEvidenceDeterministically(deduplicated, WEALTH_FAMILY_RANK);
  const familySummaries = buildFamilySummaries(sortedEvidence);

  // Step 3: Compute canonical WealthNatalPromise
  const wealthNatalPromise = computeWealthNatalPromise(sortedEvidence, context, familySummaries);

  // Note: D2 (Hora) rule evaluation pipeline will be reintroduced in a future P-24B-D2 phase.
  // In v1, no D2 rules are registered, so vargaConfirmationStatus remains UNAVAILABLE.

  const groupedEvidence = groupEvidenceByFamily(sortedEvidence);
  const subthemes = buildWealthSubthemes(familySummaries);

  const conclusion = synthesizeWealthEvidence(sortedEvidence, context, familySummaries, wealthNatalPromise);

  const familiesRepresented = Array.from(
    new Set(sortedEvidence.map((e) => e.evidenceFamily))
  ) as WealthEvidenceFamily[];

  // D2 confirmation is not implemented in P-24B v1 (D2 = UNAVAILABLE)
  const vargaConfirmationStatus: VargaRelationship = 'UNAVAILABLE';

  let yogaConfirmationStatus: 'CONFIRMS' | 'ABSENT' | 'UNAVAILABLE' = 'UNAVAILABLE';
  if (!context.yogas?.yogas) {
    yogaConfirmationStatus = 'UNAVAILABLE';
  } else {
    const hasYogaSupport = sortedEvidence.some(
      (e) => e.evidenceFamily === WealthEvidenceFamily.YOGA && e.effect === 'SUPPORT'
    );
    yogaConfirmationStatus = hasYogaSupport ? 'CONFIRMS' : 'ABSENT';
  }

  const dataCompleteness = checkDataCompleteness(context);

  const metadata: WealthThemeInterpretationMetadata = {
    evaluatedRulesCount,
    triggeredRulesCount,
    evidenceItemCount: sortedEvidence.length,
    evidenceFamiliesRepresented: Object.freeze(familiesRepresented),
    vargaConfirmationStatus,
    yogaConfirmationStatus,
    dataCompleteness,
    ...(ruleErrors.length > 0 ? { ruleErrors: Object.freeze(ruleErrors) } : {})
  };

  return deepFreeze({
    theme: 'WEALTH_PROSPERITY',
    conclusion,
    wealthNatalPromise,
    evidence: sortedEvidence,
    groupedEvidence,
    familySummaries,
    subthemes,
    metadata
  });
}
