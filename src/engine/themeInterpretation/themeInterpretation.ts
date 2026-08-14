import { Horoscope } from '../../types';
import {
  ThemeInterpretationContext,
  ThemeInterpretationContextInput,
  buildThemeInterpretationContext
} from './themeInterpretationContext';
import {
  CareerThemeInterpretation,
  CareerThemeStatus,
  EvidenceConfidence,
  CareerInterpretationConclusion,
  CareerThemeInterpretationMetadata,
  ThemeInterpretationEvidence,
  CareerEvidence,
  CareerEvidenceFamily,
  VargaRelationship,
  CareerNatalPromise
} from './themeInterpretationTypes';
import { CAREER_RULES } from './rules/career/careerRules';
import {
  evaluateRule,
  isPresentEvidence,
  deduplicateCareerEvidence,
  sortEvidenceDeterministically,
  groupEvidenceByFamily,
  buildFamilySummaries,
  deepFreeze
} from './themeInterpretationUtils';
import { EvidenceFamilySummary } from './themeInterpretationTypes';

export const STRUCTURAL_FAMILIES: ReadonlySet<CareerEvidenceFamily> = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.TENTH_HOUSE,
  CareerEvidenceFamily.TENTH_LORD,
  CareerEvidenceFamily.SIXTH_HOUSE,
  CareerEvidenceFamily.SIXTH_LORD,
  CareerEvidenceFamily.SECOND_HOUSE,
  CareerEvidenceFamily.SECOND_LORD,
  CareerEvidenceFamily.ELEVENTH_HOUSE,
  CareerEvidenceFamily.ELEVENTH_LORD
]);

export const MODIFIER_FAMILIES: ReadonlySet<CareerEvidenceFamily> = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.FUNCTIONAL_ROLE,
  CareerEvidenceFamily.PLANETARY_STRENGTH,
  CareerEvidenceFamily.ASPECT,
  CareerEvidenceFamily.SUN,
  CareerEvidenceFamily.SATURN,
  CareerEvidenceFamily.MERCURY,
  CareerEvidenceFamily.MARS,
  CareerEvidenceFamily.JUPITER
]);

export const CONFIRMATION_FAMILIES: ReadonlySet<CareerEvidenceFamily> = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.YOGA,
  CareerEvidenceFamily.D10
]);

export const TIMING_FAMILIES: ReadonlySet<CareerEvidenceFamily> = new Set<CareerEvidenceFamily>([
  CareerEvidenceFamily.DASHA
]);

function checkDataCompleteness(context: ThemeInterpretationContext): 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT' {
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

export function computeCareerNatalPromise(
  evidence: readonly CareerEvidence[],
  context: ThemeInterpretationContext,
  familySummaries: Readonly<Partial<Record<CareerEvidenceFamily, EvidenceFamilySummary<CareerEvidenceFamily>>>>
): CareerNatalPromise {
  const structuralEvidence = evidence.filter((e) => STRUCTURAL_FAMILIES.has(e.evidenceFamily));
  const primaryEvidence = structuralEvidence.filter((e) => e.priority === 'PRIMARY');
  const primarySupport = primaryEvidence.filter((e) => e.effect === 'SUPPORT');
  const primaryChallenges = primaryEvidence.filter((e) => e.effect === 'CHALLENGE');

  const strongPrimarySupport = primarySupport.filter((e) => e.strength === 'STRONG');
  const dataCompleteness = checkDataCompleteness(context);

  const independentSupportingFamilies = new Set(
    structuralEvidence
      .filter((e) => e.effect === 'SUPPORT')
      .map((e) => e.evidenceFamily)
  );

  const tenthHouseSummary = familySummaries[CareerEvidenceFamily.TENTH_HOUSE];
  const tenthLordSummary = familySummaries[CareerEvidenceFamily.TENTH_LORD];

  const hasPrimaryMixed =
    tenthHouseSummary?.status === 'MIXED' || tenthLordSummary?.status === 'MIXED';

  const hasPrimarySupport =
    (tenthHouseSummary?.supportingEvidence.length ?? 0) > 0 ||
    (tenthLordSummary?.supportingEvidence.length ?? 0) > 0 ||
    primarySupport.length > 0;

  const hasPrimaryChallenge =
    (tenthHouseSummary?.challengingEvidence.length ?? 0) > 0 ||
    (tenthLordSummary?.challengingEvidence.length ?? 0) > 0 ||
    primaryChallenges.length > 0;

  const hasStrongTenthSupport =
    (tenthHouseSummary?.status === 'SUPPORT' && tenthHouseSummary.supportingEvidence.some((e) => e.strength === 'STRONG')) ||
    (tenthLordSummary?.status === 'SUPPORT' && tenthLordSummary.supportingEvidence.some((e) => e.strength === 'STRONG')) ||
    strongPrimarySupport.some(
      (e) => e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE || e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD
    );

  const hasStructuralChallenge = structuralEvidence.some((e) => e.effect === 'CHALLENGE');
  const hasStructuralMixed = Object.values(familySummaries).some(
    (s) => s && STRUCTURAL_FAMILIES.has(s.family) && s.status === 'MIXED'
  );

  let status: 'STRONG' | 'SUPPORTED' | 'MIXED' | 'ADVERSE' | 'UNAVAILABLE' = 'UNAVAILABLE';

  if (dataCompleteness === 'INSUFFICIENT' || primaryEvidence.length === 0) {
    status = 'UNAVAILABLE';
  } else if (hasPrimaryMixed || (hasPrimarySupport && hasPrimaryChallenge)) {
    status = 'MIXED';
  } else if (hasPrimaryChallenge && !hasPrimarySupport) {
    status = 'ADVERSE';
  } else if (
    hasStrongTenthSupport &&
    independentSupportingFamilies.size >= 2 &&
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasStructuralChallenge &&
    !hasStructuralMixed
  ) {
    status = 'STRONG';
  } else if ((hasPrimarySupport || independentSupportingFamilies.size >= 1) && !hasPrimaryChallenge) {
    status = 'SUPPORTED';
  } else {
    status = 'MIXED';
  }

  const hasStrongStructuralFamily = Object.values(familySummaries).some(
    (s) => s && STRUCTURAL_FAMILIES.has(s.family) && s.status === 'SUPPORT' && s.supportingEvidence.some((e) => e.strength === 'STRONG')
  );

  let evidenceConfidence: EvidenceConfidence = 'MEDIUM';
  if (dataCompleteness === 'INSUFFICIENT' || primaryEvidence.length < 1 || independentSupportingFamilies.size === 0) {
    evidenceConfidence = 'LOW';
  } else if (
    independentSupportingFamilies.size >= 2 &&
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

function synthesizeCareerEvidence(
  evidence: readonly CareerEvidence[],
  context: ThemeInterpretationContext,
  familySummaries: Readonly<Partial<Record<CareerEvidenceFamily, EvidenceFamilySummary<CareerEvidenceFamily>>>>,
  careerNatalPromise: CareerNatalPromise
): CareerInterpretationConclusion {
  const dataCompleteness = checkDataCompleteness(context);

  // 1. Base status from CareerNatalPromise (structural engine)
  let status: CareerThemeStatus = 'LIMITED_EVIDENCE';
  if (careerNatalPromise.status === 'UNAVAILABLE') {
    status = 'LIMITED_EVIDENCE';
  } else if (careerNatalPromise.status === 'ADVERSE') {
    status = 'CHALLENGED';
  } else if (careerNatalPromise.status === 'MIXED') {
    status = 'MIXED';
  } else if (careerNatalPromise.status === 'STRONG') {
    status = 'STRONGLY_SUPPORTED';
  } else if (careerNatalPromise.status === 'SUPPORTED') {
    status = 'SUPPORTED';
  }

  // 2. D10 Confirmation Layer
  const d10Ev = evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
  const hasD10Conflict =
    d10Ev?.effect === 'CHALLENGE' || d10Ev?.vargaEvidence?.relationship === 'CONFLICTS';

  // If natal promise was STRONG but D10 conflicts, downgrade to SUPPORTED
  if (status === 'STRONGLY_SUPPORTED' && hasD10Conflict) {
    status = 'SUPPORTED';
  }

  // 3. Yoga Confirmation Layer
  const yogaEvidence = evidence.filter((e) => e.evidenceFamily === CareerEvidenceFamily.YOGA);
  const hasYogaSupport = yogaEvidence.some((e) => e.effect === 'SUPPORT');
  const hasD10Confirms = d10Ev?.effect === 'SUPPORT' && d10Ev.vargaEvidence?.relationship === 'CONFIRMS';

  const hasConfirmation = hasYogaSupport || hasD10Confirms;

  // 4. Dasha Timing Layer
  const dashaEvidence = evidence.filter((e) => e.evidenceFamily === CareerEvidenceFamily.DASHA);

  // 5. Derive Final Confidence
  const structuralEvidence = evidence.filter((e) => STRUCTURAL_FAMILIES.has(e.evidenceFamily));
  const independentSupportingFamilies = new Set(
    structuralEvidence.filter((e) => e.effect === 'SUPPORT').map((e) => e.evidenceFamily)
  );
  const primaryEvidence = structuralEvidence.filter((e) => e.priority === 'PRIMARY');
  const hasPrimaryChallenge = careerNatalPromise.primaryChallenges.length > 0;
  const tenthHouseSummary = familySummaries[CareerEvidenceFamily.TENTH_HOUSE];
  const tenthLordSummary = familySummaries[CareerEvidenceFamily.TENTH_LORD];
  const hasPrimaryMixed =
    tenthHouseSummary?.status === 'MIXED' || tenthLordSummary?.status === 'MIXED';

  const hasStrongStructuralFamily = Object.values(familySummaries).some(
    (s) => s && STRUCTURAL_FAMILIES.has(s.family) && s.status === 'SUPPORT' && s.supportingEvidence.some((e) => e.strength === 'STRONG')
  );

  let confidence: EvidenceConfidence = 'MEDIUM';
  if (dataCompleteness === 'INSUFFICIENT' || primaryEvidence.length < 1 || independentSupportingFamilies.size === 0) {
    confidence = 'LOW';
  } else if (
    independentSupportingFamilies.size >= 2 &&
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasD10Conflict &&
    (dataCompleteness === 'COMPLETE' || dataCompleteness === 'PARTIAL')
  ) {
    confidence = 'HIGH';
  } else if (
    (hasStrongStructuralFamily || hasConfirmation) &&
    !hasPrimaryChallenge &&
    !hasPrimaryMixed &&
    !hasD10Conflict
  ) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'MEDIUM';
  }

  // Collect Factor strings across all family summaries so both supporting and challenging factors are retained
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

  // Also include statements from deduplicated evidence array if not present
  for (const e of evidence) {
    if (e.effect === 'SUPPORT') keySupportingFactorsSet.add(e.statement);
    if (e.effect === 'CHALLENGE') keyChallengingFactorsSet.add(e.statement);
    if (e.conditional) keyConditionalFactorsSet.add(e.statement);
  }

  // Build Summary
  let summary = '';
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      summary = 'Career and public status indicators exhibit robust, multi-family astrological alignment with strong 10th house/lord dignity.';
      break;
    case 'SUPPORTED':
      summary = 'Career indicators demonstrate positive structural support across primary house and lord placements.';
      break;
    case 'MIXED':
      summary = 'Career indicators reflect a balance of supporting dignity alongside specific structural or house placement challenges.';
      break;
    case 'CHALLENGED':
      summary = 'Career indicators show notable friction, enemy sign placement, or 10th house afflictions requiring conscious mitigation.';
      break;
    case 'LIMITED_EVIDENCE':
      summary = 'Available upstream astrological data is insufficient or lacks primary 10th house evidence for definitive evaluation.';
      break;
  }

  if (dataCompleteness === 'PARTIAL') {
    summary += ' (Note: Upstream Yogas or Divisional D10 report was partial, so evaluation reflects primary natal structure.)';
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

export function interpretCareerTheme(
  input: ThemeInterpretationContextInput | Horoscope
): CareerThemeInterpretation {
  const context = buildThemeInterpretationContext(input);

  const nonVargaRules = CAREER_RULES.filter((r) => r.evidenceFamily !== CareerEvidenceFamily.D10);
  const vargaRules = CAREER_RULES.filter((r) => r.evidenceFamily === CareerEvidenceFamily.D10);

  const rawNonVargaEvidence: CareerEvidence[] = [];
  let evaluatedRulesCount = 0;
  let triggeredRulesCount = 0;
  const ruleErrors: { ruleId: string; error: string }[] = [];

  // Step 1: Run all non-D10 rules
  for (const rule of nonVargaRules) {
    evaluatedRulesCount++;
    const result = evaluateRule(rule, context, undefined, ruleErrors);
    if (isPresentEvidence(result)) {
      triggeredRulesCount++;
      if (Array.isArray(result.evidence)) {
        rawNonVargaEvidence.push(...(result.evidence as readonly CareerEvidence[]));
      } else if (result.evidence) {
        rawNonVargaEvidence.push(result.evidence as CareerEvidence);
      }
    }
  }

  // Step 2: Build non-D10 evidence, deduplicated, sorted, and family summaries
  const preD10Deduplicated = deduplicateCareerEvidence(rawNonVargaEvidence);
  const preD10Sorted = sortEvidenceDeterministically(preD10Deduplicated);
  const preD10FamilySummaries = buildFamilySummaries(preD10Sorted);

  // Step 3: Compute canonical CareerNatalPromise
  const careerNatalPromise = computeCareerNatalPromise(preD10Sorted, context, preD10FamilySummaries);

  // Step 4: Evaluate D10 rules with the promise injected
  const rawD10Evidence: CareerEvidence[] = [];
  for (const rule of vargaRules) {
    evaluatedRulesCount++;
    const result = evaluateRule(rule, context, careerNatalPromise, ruleErrors);
    if (isPresentEvidence(result)) {
      triggeredRulesCount++;
      if (Array.isArray(result.evidence)) {
        rawD10Evidence.push(...(result.evidence as readonly CareerEvidence[]));
      } else if (result.evidence) {
        rawD10Evidence.push(result.evidence as CareerEvidence);
      }
    }
  }

  // Step 5: Merge all evidence, sort and build final summaries
  const allRawEvidence = [...rawNonVargaEvidence, ...rawD10Evidence];
  const deduplicated = deduplicateCareerEvidence(allRawEvidence);
  const sortedEvidence = sortEvidenceDeterministically(deduplicated);
  const groupedEvidence = groupEvidenceByFamily(sortedEvidence);
  const familySummaries = buildFamilySummaries(sortedEvidence);

  const conclusion = synthesizeCareerEvidence(sortedEvidence, context, familySummaries, careerNatalPromise);

  // Determine metadata
  const familiesRepresented = Array.from(
    new Set(sortedEvidence.map((e) => e.evidenceFamily))
  ) as CareerEvidenceFamily[];

  let vargaConfirmationStatus: VargaRelationship = 'UNAVAILABLE';
  const d10Ev = sortedEvidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
  if (d10Ev?.vargaEvidence) {
    vargaConfirmationStatus = d10Ev.vargaEvidence.relationship;
  }

  const dataCompleteness = checkDataCompleteness(context);

  const metadata: CareerThemeInterpretationMetadata = deepFreeze({
    evaluatedRulesCount,
    triggeredRulesCount,
    evidenceItemCount: sortedEvidence.length,
    evidenceFamiliesRepresented: Object.freeze(familiesRepresented),
    vargaConfirmationStatus,
    dataCompleteness,
    ruleErrors: ruleErrors.length > 0 ? Object.freeze(ruleErrors.map((e) => Object.freeze(e))) : undefined
  });

  return deepFreeze({
    theme: 'CAREER_STATUS',
    conclusion,
    careerNatalPromise,
    evidence: sortedEvidence,
    groupedEvidence,
    familySummaries,
    metadata
  });
}

