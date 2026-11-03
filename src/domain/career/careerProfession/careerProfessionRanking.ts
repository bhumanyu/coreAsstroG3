import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type {
  CareerProfessionCandidate,
  CareerProfessionRanking,
  CareerProfessionRankedCandidate,
  CareerProfessionScoreContribution
} from './careerProfessionTypes';
import { codePointCompare } from './careerProfessionUtils';

const POLICY_VERSION = 'B04-PROFESSION-RANKING-v1' as const;

interface CandidateGroup {
  readonly domain: CareerProfessionCandidate['domain'];
  readonly family: CareerProfessionCandidate['family'];
  readonly candidates: CareerProfessionCandidate[];
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(value => value.trim().length > 0))].sort(codePointCompare);
}

function strengthPoints(strength: DomainEvidence['strength']): number {
  switch (strength) {
    case 'VERY_STRONG': return 4;
    case 'STRONG': return 3;
    case 'MODERATE': return 2;
    case 'WEAK': return 1;
    default: return 0;
  }
}

function boundedPriority(priority: number): number {
  if (!Number.isFinite(priority)) return 1;
  return Math.max(1, Math.min(3, Math.trunc(priority)));
}

function groupCandidates(candidates: readonly CareerProfessionCandidate[]): CandidateGroup[] {
  const groups = new Map<string, CandidateGroup>();
  for (const candidate of candidates) {
    const key = `${candidate.domain}::${candidate.family}`;
    const group = groups.get(key);
    if (group) group.candidates.push(candidate);
    else groups.set(key, { domain: candidate.domain, family: candidate.family, candidates: [candidate] });
  }
  return [...groups.values()].sort((a, b) =>
    codePointCompare(a.domain, b.domain) || codePointCompare(a.family, b.family)
  );
}

function d10Aggregate(
  candidates: readonly CareerProfessionCandidate[]
): CareerProfessionRankedCandidate['d10Status'] {
  const statuses = candidates.map(candidate => candidate.d10Qualification?.status ?? candidate.d10Status);
  if (statuses.includes('CONFLICTED')) return 'CONFLICTED';
  if (statuses.includes('PARTIAL')) return 'PARTIAL';
  if (statuses.length > 0 && statuses.every(status => status === 'QUALIFIED')) return 'QUALIFIED';
  if (statuses.length > 0 && statuses.every(status => status === 'NOT_PROVIDED')) return 'NOT_PROVIDED';
  if (statuses.some(status => status === 'QUALIFIED' || status === 'NOT_PROVIDED' || status === 'UNAVAILABLE')) return 'PARTIAL';
  return 'UNAVAILABLE';
}

/**
 * B04 deterministic profession-family ranking.
 *
 * Scores are transparent policy points, not probabilities, forecasts, or employability
 * estimates. D1 is an entry gate; D10 is a qualification modifier only.
 */
export function buildCareerProfessionRanking(params: {
  readonly candidates: readonly CareerProfessionCandidate[];
  readonly domainEvidence?: readonly DomainEvidence[];
  readonly natalPromiseDirection?: 'SUPPORT' | 'CONDITIONAL' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE';
}): CareerProfessionRanking {
  const { candidates, domainEvidence = [], natalPromiseDirection } = params;
  const d1PermitsRanking = natalPromiseDirection === 'SUPPORT' || natalPromiseDirection === 'CONDITIONAL';
  if (!d1PermitsRanking) {
    return Object.freeze({
      policyVersion: POLICY_VERSION,
      status: 'UNAVAILABLE',
      rankedCandidates: Object.freeze([]),
      diagnostics: Object.freeze([
        natalPromiseDirection === undefined
          ? 'D1_PROMISE_DIRECTION_NOT_PROVIDED'
          : 'D1_NATAL_PROMISE_NOT_ESTABLISHED'
      ])
    });
  }

  const evidenceOccurrenceIds = domainEvidence.map(item => item.id);
  if (new Set(evidenceOccurrenceIds).size !== evidenceOccurrenceIds.length) {
    return Object.freeze({
      policyVersion: POLICY_VERSION,
      status: 'UNAVAILABLE',
      rankedCandidates: Object.freeze([]),
      diagnostics: Object.freeze(['DUPLICATE_DOMAIN_EVIDENCE_OCCURRENCE_ID'])
    });
  }
  const evidenceById = new Map(domainEvidence.map(item => [item.id, item]));
  const groups = groupCandidates(candidates);
  if (groups.length === 0) {
    return Object.freeze({ policyVersion: POLICY_VERSION, status: 'UNAVAILABLE', rankedCandidates: Object.freeze([]), diagnostics: Object.freeze(['NO_PROFESSION_FAMILY_CANDIDATES_AVAILABLE']) });
  }
  const ranked: Array<Omit<CareerProfessionRankedCandidate, 'rank' | 'alternativeExplanation'>> = [];
  let partial = natalPromiseDirection === 'CONDITIONAL';

  for (const group of groups) {
    const groupCandidates = group.candidates;
    const supportIds = uniqueSorted(groupCandidates.map(candidate => candidate.candidateId));
    const linkedSourceIds = uniqueSorted(groupCandidates.flatMap(candidate => candidate.evidence.flatMap(item => [
      ...item.sourceIds,
      ...(item.resolvedMechanismIds ?? []),
      ...(item.unresolvedMechanismIds ?? [])
    ])));
    const ruleIds = uniqueSorted(groupCandidates.map(candidate => candidate.ruleId));
    const occurrenceIds = uniqueSorted(groupCandidates.flatMap(candidate => candidate.evidenceOccurrenceIds));
    const semanticIdentityKeys = uniqueSorted(groupCandidates.flatMap(candidate => candidate.semanticIdentityKeys));
    const rootIdentityKeys = uniqueSorted([
      ...groupCandidates.flatMap(candidate => candidate.rootIdentityKeys),
      ...groupCandidates.flatMap(candidate => candidate.d10Qualification?.rootIdentityKeys ?? [])
    ]);

    const linkedEvidence = occurrenceIds
      .map(id => evidenceById.get(id))
      .filter((item): item is DomainEvidence => Boolean(item));
    const linkedIds = uniqueSorted(linkedEvidence.map(item => item.id));
    const supportingEvidence = linkedEvidence.filter(item => item.polarity === 'SUPPORTING');
    const counterEvidence = linkedEvidence.filter(item => item.polarity === 'CHALLENGING');

    // Itemize every score contribution. Duplicate patterns cannot multiply a rule
    // or the same canonical evidence occurrence.
    const scoreContributions: CareerProfessionScoreContribution[] = [];
    const rulePointsById = new Map<string, number>();
    for (const candidate of groupCandidates) {
      const points = candidate.basis === 'MECHANISM' ? 8 : 5;
      rulePointsById.set(candidate.ruleId, Math.max(rulePointsById.get(candidate.ruleId) ?? 0, points));
    }
    for (const [ruleId, points] of [...rulePointsById.entries()].sort((a, b) => codePointCompare(a[0], b[0]))) {
      scoreContributions.push(Object.freeze({
        referenceType: 'PROFESSION_RULE',
        referenceId: ruleId,
        direction: 'SUPPORT',
        points,
        explanation: `${ruleId} contributes +${points} base policy points for this broad family.`
      }));
    }

    for (const item of linkedEvidence) {
      const strength = strengthPoints(item.strength);
      const priority = boundedPriority(item.priority);
      const basePoints = strength * priority;
      const direction = item.polarity === 'SUPPORTING' ? 'SUPPORT'
        : item.polarity === 'CHALLENGING' ? 'CHALLENGE' : 'NEUTRAL';
      const points = direction === 'SUPPORT' ? basePoints
        : direction === 'CHALLENGE' ? -basePoints : 0;
      scoreContributions.push(Object.freeze({
        referenceType: 'DOMAIN_EVIDENCE',
        referenceId: item.id,
        direction,
        points,
        explanation: `${item.strength} ${item.polarity.toLowerCase()} evidence × priority ${priority} contributes ${points > 0 ? '+' : ''}${points} points.`
      }));
    }

    const d10Status = d10Aggregate(groupCandidates);
    const d10Directions = groupCandidates.flatMap(candidate =>
      candidate.d10Qualification ? [candidate.d10Qualification.direction] : []
    );
    const d10EvidenceOccurrenceIds = uniqueSorted(groupCandidates.flatMap(candidate => candidate.d10Qualification?.evidenceOccurrenceIds ?? []));
    const d10Direction = d10Directions.includes('CHALLENGE') && d10Directions.includes('SUPPORT') ? 'MIXED'
      : d10Directions.includes('CHALLENGE') ? 'CHALLENGE'
        : d10Directions.includes('MIXED') ? 'MIXED'
          : d10Directions.includes('SUPPORT') ? 'SUPPORT' : 'UNDETERMINED';

    const seenD10QualificationKeys = new Set<string>();
    for (const candidate of groupCandidates) {
      const qualification = candidate.d10Qualification;
      const key = qualification
        ? [qualification.status, qualification.direction, ...qualification.evidenceOccurrenceIds].join('|')
        : 'NO_D10_INPUT';
      if (seenD10QualificationKeys.has(key)) continue;
      seenD10QualificationKeys.add(key);

      const isSupport = qualification?.status === 'QUALIFIED' && qualification.direction === 'SUPPORT';
      const isChallenge = qualification?.status === 'CONFLICTED' || qualification?.direction === 'CHALLENGE';
      const direction: CareerProfessionScoreContribution['direction'] = isSupport ? 'SUPPORT'
        : isChallenge ? 'CHALLENGE' : 'NEUTRAL';
      const points = isSupport ? 3 : isChallenge ? -3 : 0;
      const referenceId = qualification?.evidenceOccurrenceIds[0] ??
        (qualification ? `D10_${qualification.status}` : 'D10_NOT_PROVIDED');
      const explanation = isSupport
        ? 'Resolved expression-linked D10 support contributes +3 qualification points; it does not create a D1 promise.'
        : isChallenge
          ? 'Expression-linked D10 challenge/weakening contributes -3 points and remains counter-evidence.'
          : qualification?.status === 'NOT_PROVIDED'
            ? 'D10 was not provided; no D10 score adjustment is applied.'
            : 'D10 is partial, unavailable, or mixed; no D10 score adjustment is applied.';
      scoreContributions.push(Object.freeze({
        referenceType: 'D10_QUALIFICATION',
        referenceId,
        direction,
        points,
        explanation
      }));
    }

    scoreContributions.sort((a, b) =>
      codePointCompare(a.referenceType, b.referenceType) ||
      codePointCompare(a.referenceId, b.referenceId) ||
      codePointCompare(a.direction, b.direction)
    );
    const score = scoreContributions.reduce((total, contribution) => total + contribution.points, 0);
    if (d10Status === 'NOT_PROVIDED' || d10Status === 'UNAVAILABLE' || d10Status === 'PARTIAL') partial = true;

    const evidenceCoverageStatus: CareerProfessionRankedCandidate['evidenceCoverage']['status'] =
      linkedIds.length === 0 ? 'UNAVAILABLE'
        : semanticIdentityKeys.length > 0 && rootIdentityKeys.length > 0 ? 'COMPLETE' : 'PARTIAL';
    if (evidenceCoverageStatus !== 'COMPLETE') partial = true;

    const confidenceReasons: string[] = [];
    let confidence: CareerProfessionRankedCandidate['confidence'];
    if (linkedIds.length === 0) {
      confidence = 'UNAVAILABLE';
      confidenceReasons.push('No linked canonical evidence occurrences were available for this family.');
    } else if (counterEvidence.length > 0 || d10Status === 'CONFLICTED') {
      confidence = 'LOW';
      confidenceReasons.push('Conflicting or mixed evidence limits candidate-level confidence.');
    } else if (
      linkedIds.length >= 2 &&
      semanticIdentityKeys.length > 0 &&
      rootIdentityKeys.length > 0 &&
      d10Status === 'QUALIFIED'
    ) {
      confidence = 'HIGH';
      confidenceReasons.push('Multiple linked occurrences, semantic identity, root linkage, and resolved D10 qualification are present.');
    } else if (semanticIdentityKeys.length > 0 && rootIdentityKeys.length > 0) {
      confidence = 'MEDIUM';
      confidenceReasons.push('Linked evidence has semantic and root identity coverage; one or more qualification layers remain incomplete.');
    } else {
      confidence = 'LOW';
      confidenceReasons.push('Evidence linkage is partial; semantic identity or root linkage is incomplete.');
    }

    const reasons: string[] = [];
    if (ruleIds.length > 0) reasons.push(`Established by profession-family rules: ${ruleIds.join(', ')}.`);
    if (supportingEvidence.length > 0) reasons.push(`${supportingEvidence.length} linked D1 evidence occurrence(s) support this family.`);
    if (d10Status === 'QUALIFIED') reasons.push('D10 provides a resolved, expression-linked qualification for this existing D1-derived family.');
    else if (d10Status === 'PARTIAL') reasons.push('D10 provides mixed or qualifying refinement; it does not establish the family.');
    else if (d10Status === 'CONFLICTED') reasons.push('D10 contains expression-linked counter-indication; the D1-derived family is retained with a constraint.');
    else if (d10Status === 'NOT_PROVIDED') reasons.push('D10 was not provided; no D10 score contribution was applied.');
    else reasons.push('D10 qualification is unavailable or unmapped; no D10 score contribution was applied.');

    const counterEvidenceReasons = counterEvidence.map(item => item.statement);
    if (groupCandidates.some(candidate => (candidate.d10Qualification?.counterEvidenceOccurrenceIds.length ?? 0) > 0)) counterEvidenceReasons.push('Expression-specific D10 challenge/weakening evidence is retained as counter-evidence.');
    if (d10Direction === 'MIXED') counterEvidenceReasons.push('Expression-specific D10 evidence is mixed; it qualifies the expression without creating or removing the D1-derived family.');

    ranked.push({
      candidateId: `PROFESSION:${group.domain}:${group.family}`,
      domain: group.domain,
      family: group.family,
      score,
      scoreContributions: Object.freeze(scoreContributions),
      confidence,
      confidenceReasons: Object.freeze(confidenceReasons),
      evidenceCoverage: Object.freeze({
        status: evidenceCoverageStatus,
        occurrenceCount: linkedIds.length,
        semanticIdentityCount: semanticIdentityKeys.length,
        rootIdentityCount: rootIdentityKeys.length,
        linkedSourceCount: linkedSourceIds.length
      }),
      supportingCandidateIds: Object.freeze(supportIds),
      ruleIds: Object.freeze(ruleIds),
      supportingEvidenceOccurrenceIds: Object.freeze(uniqueSorted(supportingEvidence.map(item => item.id))),
      d10EvidenceOccurrenceIds: Object.freeze(d10EvidenceOccurrenceIds),
      d10Direction,
      counterEvidenceOccurrenceIds: Object.freeze(uniqueSorted([
        ...counterEvidence.map(item => item.id),
        ...groupCandidates.flatMap(candidate => candidate.d10Qualification?.counterEvidenceOccurrenceIds ?? [])
      ])),
      semanticIdentityKeys: Object.freeze(semanticIdentityKeys),
      rootIdentityKeys: Object.freeze(rootIdentityKeys),
      d10Status,
      reasons: Object.freeze(reasons),
      counterEvidenceReasons: Object.freeze(counterEvidenceReasons)
    } as Omit<CareerProfessionRankedCandidate, 'rank' | 'alternativeExplanation'>);
  }

  ranked.sort((a, b) =>
    b.score - a.score ||
    codePointCompare(a.domain, b.domain) ||
    codePointCompare(a.family, b.family) ||
    codePointCompare(a.candidateId, b.candidateId)
  );

  const top = ranked[0];
  const rankedCandidates: CareerProfessionRankedCandidate[] = ranked.map((candidate, index) => {
    const previous = ranked[index - 1];
    const rank = previous && previous.score === candidate.score
      ? (rankedCandidatesRankAt(ranked, index - 1))
      : index + 1;
    const alternativeExplanation = index === 0
      ? 'Primary-ranked broad profession-family candidate; this is a comparative evidence ranking, not a job-title prediction.'
      : candidate.score === top.score
        ? `Tied with ${top.domain}/${top.family}; retain both as equal-ranked alternatives.`
        : `Retained as an alternative below ${top.domain}/${top.family} because its weighted evidence score is lower by ${top.score - candidate.score} policy point(s).`;
    return Object.freeze({
      ...candidate,
      rank,
      alternativeExplanation
    });
  });

  return Object.freeze({
    policyVersion: POLICY_VERSION,
    status: partial ? 'PARTIAL' : 'AVAILABLE',
    rankedCandidates: Object.freeze(rankedCandidates),
    diagnostics: Object.freeze(partial ? ['D1_PROMISE_ESTABLISHED_BUT_ONE_OR_MORE_QUALIFICATION_OR_COVERAGE_INPUTS_ARE_PARTIAL'] : [])
  });
}

function rankedCandidatesRankAt(
  ranked: readonly { readonly score: number }[],
  index: number
): number {
  const score = ranked[index].score;
  let firstIndex = index;
  while (firstIndex > 0 && ranked[firstIndex - 1].score === score) firstIndex -= 1;
  return firstIndex + 1;
}
