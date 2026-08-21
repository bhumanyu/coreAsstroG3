import type { DomainInterpretation } from '../../domain/interpretation';
import type { DomainEvidence } from '../../domain/interpretation/DomainEvidence';
import type { LifeAnalysis } from '../../domain/synthesis';
import type {
  EvidenceDetailViewModel,
  EvidenceIntegrityViewModel,
  EvidenceIntegrityStatus,
  GroupedEvidenceViewModel,
  WhyExperienceViewModel,
  EvidenceChartFactViewModel
} from './lifeAnalysisEvidenceTypes';
import { resolveRuleMetadata } from './lifeAnalysisEvidenceRules';
import { mapEvidenceSource, formatDomainDisplayName } from './domainPresentationUtils';
import { deepFreeze } from '../../ai/context/deepFreeze';

export interface ResolveWhyEvidenceOptions {
  readonly analysis: LifeAnalysis;
  readonly domainInterpretations: readonly DomainInterpretation[];
}

/**
 * Extracts chart fact metadata from domain evidence if available.
 * Optional; never computes or fabricates astrology data.
 */
function extractChartFact(
  evidence: DomainEvidence
): EvidenceChartFactViewModel | undefined {
  if (evidence.timing?.periodKey) {
    return Object.freeze({
      label: 'Dasha Period',
      value: evidence.timing.periodKey,
      source: evidence.source
    });
  }

  if (evidence.dimension) {
    return Object.freeze({
      label: 'Wealth Dimension',
      value: evidence.dimension,
      source: evidence.source
    });
  }

  if (evidence.notes) {
    return Object.freeze({
      label: 'Astrological Notes',
      value: evidence.notes,
      source: evidence.source
    });
  }

  return undefined;
}

/**
 * Derives a human-readable title for the evidence detail card.
 */
function deriveEvidenceTitle(
  evidence: DomainEvidence,
  ruleName?: string
): string {
  if (ruleName) {
    return ruleName;
  }
  if (evidence.evidenceFamily) {
    return `${formatDomainDisplayName(evidence.domain)}: ${evidence.evidenceFamily.replace(/_/g, ' ')}`;
  }
  return `${formatDomainDisplayName(evidence.domain)} ${evidence.role.toLowerCase()} factor`;
}

/**
 * Resolves deterministic DomainEvidence from Career and Wealth domain interpretations
 * matching the IDs referenced in the synthesized LifeAnalysis.
 *
 * Invariant: Consumes DomainEvidence directly from domain interpretations.
 * Invariant: Unknown evidence IDs with no matching DomainEvidence are dropped.
 * Invariant: Traceability is marked valid=true when DomainEvidence resolves, regardless of rule metadata presence.
 */
export function resolveLifeAnalysisEvidenceDetails(
  options: ResolveWhyEvidenceOptions
): readonly EvidenceDetailViewModel[] {
  const { analysis, domainInterpretations } = options;

  if (!analysis || !domainInterpretations || domainInterpretations.length === 0) {
    return Object.freeze([]);
  }

  // Index all domain evidence from the supplied domain interpretations by ID
  const domainEvidenceMap = new Map<string, DomainEvidence>();
  for (const domainInterp of domainInterpretations) {
    for (const ev of domainInterp.evidence ?? []) {
      if (ev && ev.id) {
        domainEvidenceMap.set(ev.id, ev);
      }
    }
  }

  // Index supporting and challenging sets from analysis domains
  const supportingIds = new Set<string>();
  const challengingIds = new Set<string>();

  for (const d of analysis.domains ?? []) {
    for (const sId of d.supportingEvidenceIds ?? []) {
      supportingIds.add(sId);
    }
    for (const cId of d.challengingEvidenceIds ?? []) {
      challengingIds.add(cId);
    }
  }

  const resolvedList: EvidenceDetailViewModel[] = [];
  const seenIds = new Set<string>();

  for (const id of analysis.evidenceIds ?? []) {
    if (!id || seenIds.has(id)) {
      continue;
    }

    const domainEvidence = domainEvidenceMap.get(id);
    if (!domainEvidence) {
      // Unknown evidence ID not found in DomainEvidence universe is dropped
      continue;
    }

    seenIds.add(id);

    // Compute display polarity: CONFLICTING if in both supporting and challenging sets
    const inSupporting = supportingIds.has(id);
    const inChallenging = challengingIds.has(id);

    let displayPolarity: 'SUPPORTING' | 'CHALLENGING' | 'CONFLICTING' | 'NEUTRAL';
    if (inSupporting && inChallenging) {
      displayPolarity = 'CONFLICTING';
    } else if (inChallenging || domainEvidence.polarity === 'CHALLENGING') {
      displayPolarity = 'CHALLENGING';
    } else if (inSupporting || domainEvidence.polarity === 'SUPPORTING') {
      displayPolarity = 'SUPPORTING';
    } else {
      displayPolarity = 'NEUTRAL';
    }

    const rule = resolveRuleMetadata(domainEvidence.ruleId);
    const source = mapEvidenceSource(domainEvidence);
    const chartFact = extractChartFact(domainEvidence);
    const title = deriveEvidenceTitle(domainEvidence, rule?.name);

    resolvedList.push(
      Object.freeze({
        id: domainEvidence.id,
        domain: domainEvidence.domain,
        role: domainEvidence.role,
        polarity: domainEvidence.polarity,
        displayPolarity,
        title,
        statement: domainEvidence.statement,
        source,
        ...(rule ? { rule } : {}),
        ...(chartFact ? { chartFact } : {}),
        relatedEvidenceIds: domainEvidence.relatedEvidenceIds ?? Object.freeze([]),
        traceability: Object.freeze({
          evidenceId: domainEvidence.id,
          domain: domainEvidence.domain,
          ...(domainEvidence.ruleId ? { ruleId: domainEvidence.ruleId } : {}),
          relatedEvidenceIds: domainEvidence.relatedEvidenceIds ?? Object.freeze([]),
          valid: true // Valid because DomainEvidence successfully resolved
        }),
        availability: 'AVAILABLE'
      })
    );
  }

  return deepFreeze(resolvedList);
}

/**
 * Calculates evidence integrity across referenced and resolvable evidence items.
 */
export function calculateEvidenceIntegrity(
  analysis: LifeAnalysis,
  availableEvidenceIds: ReadonlySet<string> | readonly string[]
): EvidenceIntegrityViewModel {
  const totalReferenced = analysis.evidenceIds?.length ?? 0;
  const availableSet =
    availableEvidenceIds instanceof Set
      ? availableEvidenceIds
      : new Set(availableEvidenceIds);

  const unresolvedIds: string[] = [];
  let resolvedCount = 0;

  for (const id of analysis.evidenceIds ?? []) {
    if (availableSet.has(id)) {
      resolvedCount++;
    } else {
      unresolvedIds.push(id);
    }
  }

  let status: EvidenceIntegrityStatus;
  if (totalReferenced === 0) {
    status = 'INVALID';
  } else if (unresolvedIds.length === 0) {
    status = 'VALID';
  } else if (resolvedCount > 0) {
    status = 'PARTIAL';
  } else {
    status = 'INVALID';
  }

  return deepFreeze({
    status,
    totalReferenced,
    resolved: resolvedCount,
    unresolved: unresolvedIds.length,
    unresolvedIds: Object.freeze(unresolvedIds)
  });
}

/**
 * Groups evidence detail view models by role and display polarity.
 */
export function groupEvidence(
  evidence: readonly EvidenceDetailViewModel[]
): GroupedEvidenceViewModel {
  const primary: EvidenceDetailViewModel[] = [];
  const supporting: EvidenceDetailViewModel[] = [];
  const challenging: EvidenceDetailViewModel[] = [];
  const conflicting: EvidenceDetailViewModel[] = [];
  const modifiers: EvidenceDetailViewModel[] = [];
  const confirmations: EvidenceDetailViewModel[] = [];
  const timing: EvidenceDetailViewModel[] = [];

  for (const item of evidence) {
    // Role-based grouping
    if (item.role === 'PRIMARY') {
      primary.push(item);
    } else if (item.role === 'SECONDARY') {
      supporting.push(item);
    } else if (item.role === 'MODIFIER') {
      modifiers.push(item);
    } else if (item.role === 'CONFIRMATION') {
      confirmations.push(item);
    } else if (item.role === 'TIMING') {
      timing.push(item);
    }

    // Polarity-based cross-grouping
    if (item.displayPolarity === 'CHALLENGING') {
      challenging.push(item);
    } else if (item.displayPolarity === 'CONFLICTING') {
      conflicting.push(item);
    }
  }

  return deepFreeze({
    primary: Object.freeze(primary),
    supporting: Object.freeze(supporting),
    challenging: Object.freeze(challenging),
    conflicting: Object.freeze(conflicting),
    modifiers: Object.freeze(modifiers),
    confirmations: Object.freeze(confirmations),
    timing: Object.freeze(timing)
  });
}

/**
 * Builds the complete deterministic Why Experience View Model for P-030.
 *
 * Invariant: Reads domain interpretations directly.
 * Invariant: Never invokes the AI layer or remote providers.
 */
export function buildWhyExperience(
  options: ResolveWhyEvidenceOptions
): WhyExperienceViewModel {
  const evidence = resolveLifeAnalysisEvidenceDetails(options);

  // Universe of resolvable DomainEvidence IDs
  const availableEvidenceIds = new Set<string>();
  for (const interp of options.domainInterpretations ?? []) {
    for (const ev of interp.evidence ?? []) {
      if (ev && ev.id) {
        availableEvidenceIds.add(ev.id);
      }
    }
  }

  const integrity = calculateEvidenceIntegrity(
    options.analysis,
    availableEvidenceIds
  );
  const grouped = groupEvidence(evidence);

  return deepFreeze({
    integrity,
    evidence,
    grouped
  });
}
