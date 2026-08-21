import type { DomainInterpretation } from '../../domain/interpretation';
import type { DomainEvidence } from '../../domain/interpretation/DomainEvidence';
import type { DomainId, EvidenceRole } from '../../domain/interpretation/DomainInterpretationTypes';
import type { LifeAnalysis } from '../../domain/synthesis';
import type {
  EvidenceDetailViewModel,
  EvidenceIntegrityViewModel,
  EvidenceIntegrityStatus,
  GroupedEvidenceViewModel,
  GroupedWealthDimensionEvidenceViewModel,
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
 * Fixed deterministic ordering hierarchy for evidence roles:
 * PRIMARY -> SECONDARY -> MODIFIER -> CONFIRMATION -> TIMING
 */
export const ROLE_ORDER: readonly EvidenceRole[] = Object.freeze([
  'PRIMARY',
  'SECONDARY',
  'MODIFIER',
  'CONFIRMATION',
  'TIMING'
]);

export const ROLE_PRIORITY_MAP: Readonly<Record<EvidenceRole, number>> = Object.freeze({
  PRIMARY: 0,
  SECONDARY: 1,
  MODIFIER: 2,
  CONFIRMATION: 3,
  TIMING: 4
});

/**
 * Sorts evidence items deterministically by role order then by ID alphabetically.
 */
export function sortEvidence(
  evidence: readonly EvidenceDetailViewModel[]
): readonly EvidenceDetailViewModel[] {
  return [...evidence].sort((a, b) => {
    const roleA = ROLE_PRIORITY_MAP[a.role] ?? 99;
    const roleB = ROLE_PRIORITY_MAP[b.role] ?? 99;
    if (roleA !== roleB) {
      return roleA - roleB;
    }
    return a.id.localeCompare(b.id);
  });
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
 * Invariant: Outputs are deterministically ordered by ROLE_ORDER then id.localeCompare.
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
        ...(domainEvidence.dimension ? { dimension: domainEvidence.dimension } : {}),
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

  return deepFreeze(sortEvidence(resolvedList));
}

/**
 * Resolves deterministic DomainEvidence filtered strictly to a specific life domain (e.g. CAREER or WEALTH).
 * Reuses the canonical indexing, deduplication, and unknown-ID dropping logic.
 */
export function resolveDomainEvidence(
  options: ResolveWhyEvidenceOptions,
  domain: DomainId
): readonly EvidenceDetailViewModel[] {
  const allResolved = resolveLifeAnalysisEvidenceDetails(options);
  const domainFiltered = allResolved.filter((e) => e.domain === domain);
  return deepFreeze(sortEvidence(domainFiltered));
}

/**
 * Groups Wealth domain evidence items into classical wealth dimensions
 * (ACCUMULATION, GAINS, FORTUNE, SPECULATION, UNCLASSIFIED).
 */
export function groupWealthDimensionEvidence(
  evidence: readonly EvidenceDetailViewModel[]
): GroupedWealthDimensionEvidenceViewModel {
  const accumulation: EvidenceDetailViewModel[] = [];
  const gains: EvidenceDetailViewModel[] = [];
  const fortune: EvidenceDetailViewModel[] = [];
  const speculation: EvidenceDetailViewModel[] = [];
  const unclassified: EvidenceDetailViewModel[] = [];

  for (const item of evidence) {
    if (item.domain !== 'WEALTH') {
      continue;
    }

    switch (item.dimension) {
      case 'ACCUMULATION':
        accumulation.push(item);
        break;
      case 'GAINS':
        gains.push(item);
        break;
      case 'FORTUNE':
        fortune.push(item);
        break;
      case 'SPECULATION':
        speculation.push(item);
        break;
      default:
        unclassified.push(item);
        break;
    }
  }

  return deepFreeze({
    ACCUMULATION: Object.freeze(sortEvidence(accumulation)),
    GAINS: Object.freeze(sortEvidence(gains)),
    FORTUNE: Object.freeze(sortEvidence(fortune)),
    SPECULATION: Object.freeze(sortEvidence(speculation)),
    UNCLASSIFIED: Object.freeze(sortEvidence(unclassified))
  });
}

/**
 * Calculates evidence integrity across referenced and resolvable evidence items.
 */
export function calculateEvidenceIntegrity(
  analysis: LifeAnalysis,
  availableEvidenceIds: ReadonlySet<string> | readonly string[],
  domain?: DomainId
): EvidenceIntegrityViewModel {
  const availableSet =
    availableEvidenceIds instanceof Set
      ? availableEvidenceIds
      : new Set(availableEvidenceIds);

  let targetEvidenceIds: readonly string[];

  if (domain) {
    const domainSummary = analysis.domains?.find((d) => d.domain === domain);
    const domainSpecificIds = new Set<string>([
      ...(domainSummary?.supportingEvidenceIds ?? []),
      ...(domainSummary?.challengingEvidenceIds ?? [])
    ]);

    // Also include any analysis.evidenceIds that exist in this domain's available set
    for (const id of analysis.evidenceIds ?? []) {
      if (availableSet.has(id)) {
        domainSpecificIds.add(id);
      }
    }

    targetEvidenceIds = Array.from(domainSpecificIds);
  } else {
    targetEvidenceIds = analysis.evidenceIds ?? [];
  }

  const totalReferenced = targetEvidenceIds.length;
  const unresolvedIds: string[] = [];
  let resolvedCount = 0;

  for (const id of targetEvidenceIds) {
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
 * Groups evidence detail view models by role, display polarity, and wealth dimensions.
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
  const accumulation: EvidenceDetailViewModel[] = [];
  const gains: EvidenceDetailViewModel[] = [];
  const fortune: EvidenceDetailViewModel[] = [];
  const speculation: EvidenceDetailViewModel[] = [];
  const unclassified: EvidenceDetailViewModel[] = [];

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

    // Wealth dimension grouping (from DomainEvidence.dimension)
    if (item.dimension === 'ACCUMULATION') {
      accumulation.push(item);
    } else if (item.dimension === 'GAINS') {
      gains.push(item);
    } else if (item.dimension === 'FORTUNE') {
      fortune.push(item);
    } else if (item.dimension === 'SPECULATION') {
      speculation.push(item);
    } else if (item.domain === 'WEALTH') {
      unclassified.push(item);
    }
  }

  return deepFreeze({
    primary: Object.freeze(sortEvidence(primary)),
    supporting: Object.freeze(sortEvidence(supporting)),
    challenging: Object.freeze(sortEvidence(challenging)),
    conflicting: Object.freeze(sortEvidence(conflicting)),
    modifiers: Object.freeze(sortEvidence(modifiers)),
    confirmations: Object.freeze(sortEvidence(confirmations)),
    timing: Object.freeze(sortEvidence(timing)),
    accumulation: Object.freeze(sortEvidence(accumulation)),
    gains: Object.freeze(sortEvidence(gains)),
    fortune: Object.freeze(sortEvidence(fortune)),
    speculation: Object.freeze(sortEvidence(speculation)),
    unclassified: Object.freeze(sortEvidence(unclassified))
  });
}

/**
 * Builds the complete deterministic Why Experience View Model for P-030 and P-034.
 *
 * Invariant: Reads domain interpretations directly.
 * Invariant: Never invokes the AI layer or remote providers.
 */
export function buildWhyExperience(
  options: ResolveWhyEvidenceOptions,
  domain?: DomainId
): WhyExperienceViewModel {
  const evidence = domain
    ? resolveDomainEvidence(options, domain)
    : resolveLifeAnalysisEvidenceDetails(options);

  // Universe of resolvable DomainEvidence IDs
  const availableEvidenceIds = new Set<string>();
  for (const interp of options.domainInterpretations ?? []) {
    if (domain && interp.domain !== domain) {
      continue;
    }
    for (const ev of interp.evidence ?? []) {
      if (ev && ev.id) {
        availableEvidenceIds.add(ev.id);
      }
    }
  }

  const integrity = calculateEvidenceIntegrity(
    options.analysis,
    availableEvidenceIds,
    domain
  );
  const grouped = groupEvidence(evidence);

  return deepFreeze({
    integrity,
    evidence,
    grouped
  });
}

/**
 * Builds the deterministic Career domain Why Experience View Model.
 * Filters DomainEvidence strictly to Career domain and returns ready-to-render view model.
 */
export function buildCareerWhyExperience(
  options: ResolveWhyEvidenceOptions
): WhyExperienceViewModel {
  return buildWhyExperience(options, 'CAREER');
}

/**
 * Builds the deterministic Wealth domain Why Experience View Model.
 * Filters DomainEvidence strictly to Wealth domain and groups dimensions into ready-to-render view model.
 */
export function buildWealthWhyExperience(
  options: ResolveWhyEvidenceOptions
): WhyExperienceViewModel {
  return buildWhyExperience(options, 'WEALTH');
}
