import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerExpressionType
} from '../careerExpression/careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismType
} from '../careerMechanism/careerMechanismTypes';
import type {
  Career10HFoundation
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation
} from '../career10h/career10LFoundationTypes';
import type {
  CareerD10CanonicalAnalysis
} from '../careerD10/careerD10CanonicalTypes';
import type {
  DomainEvidence
} from '../../interpretation/DomainEvidence';
import type {
  CareerProfessionInput,
  CareerProfessionAnalysis,
  CareerProfessionAnalysisStatus,
  CareerProfessionCandidate,
  CareerProfessionEvidence,
  CareerProfessionProvenance,
  CareerProfessionD10Status
} from './careerProfessionTypes';
import type { CareerProfessionRule } from './careerProfessionRules';

import { CAREER_PROFESSION_RULES } from './careerProfessionRules';
import {
  createProfessionCandidateId,
  createProfessionEvidenceId,
  codePointCompare,
  canonicalSortProfessionCandidates,
  canonicalSortProfessionEvidence,
  deduplicateProfessionCandidates,
  deduplicateProfessionEvidence,
  mergeProfessionProvenances,
  freezeProfessionCandidate,
  freezeProfessionAnalysis,
  mergeSourceIds,
  mergeRelatedEvidenceIds
} from './careerProfessionUtils';

/**
 * P2-10A Career Profession Engine
 *
 * This module implements the profession resolution engine that converts already-computed
 * canonical career outputs into broad professional-domain candidates and profession families.
 *
 * Key features:
 * - Pattern-scoped resolution: resolves rules within each patternId scope
 * - D10 qualification-only: D10 only qualifies existing candidates, never creates them
 * - No astrology recalculation: consumes pre-computed outputs only
 * - No planet→job mapping: uses expression/mechanism types only
 * - Deterministic output: equivalent input order produces byte-identical output
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - d10/ (except careerD10 canonical types for qualification-only)
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - ai
 * - Any raw horoscope/chart astrology calculation
 */

/**
 * Build career profession analysis from input.
 * Per spec §5 and §6: pattern-scoped resolution with D10 qualification-only.
 *
 * @param input - Career profession input with expressions, mechanisms, and optional context
 * @returns Career profession analysis with candidates, status, and provenance
 */
export function buildCareerProfessionAnalysis(
  input: CareerProfessionInput
): CareerProfessionAnalysis {
  // Extract inputs
  const { expressions, mechanisms, career10HFoundation, career10LFoundation, careerD10CanonicalAnalysis, domainEvidence } = input;

  // Build index maps for pattern-scoped resolution
  const expressionsByPattern = indexExpressionsByPattern(expressions.expressions);
  const mechanismsByPattern = indexMechanismsByPattern(mechanisms);

  // Collect all pattern IDs from expressions and mechanisms
  const allPatternIds = new Set<string>();
  for (const patternId of Object.keys(expressionsByPattern)) {
    allPatternIds.add(patternId);
  }
  for (const patternId of Object.keys(mechanismsByPattern)) {
    allPatternIds.add(patternId);
  }

  // Resolve candidates within each pattern scope
  const candidates: CareerProfessionCandidate[] = [];
  const allConsumedExpressionTypes = new Set<CareerExpressionType>();
  let anyCandidateEstablished = false;

  for (const patternId of allPatternIds) {
    const patternExpressions = expressionsByPattern[patternId] || [];
    const patternMechanisms = mechanismsByPattern[patternId] || [];

    // Resolve rules within this pattern scope
    const patternResult = resolveRulesInPattern(
      patternId,
      patternExpressions,
      patternMechanisms,
      career10HFoundation,
      career10LFoundation,
      domainEvidence
    );

    // Track consumed expression types
    for (const candidate of patternResult.candidates) {
      for (const exprType of candidate.expressionTypes) {
        allConsumedExpressionTypes.add(exprType);
      }
    }

    candidates.push(...patternResult.candidates);
  }

  // Track whether any candidate was established (for status determination)
  anyCandidateEstablished = candidates.length > 0;

  // Apply D10 qualification to existing candidates only
  const d10QualifiedCandidates = applyD10Qualification(candidates, careerD10CanonicalAnalysis);

  // Compute unresolved expression types
  const allExpressionTypes = new Set<CareerExpressionType>();
  for (const expr of expressions.expressions) {
    allExpressionTypes.add(expr.expressionType);
  }
  const unresolvedExpressionTypes: CareerExpressionType[] = [...allExpressionTypes]
    .filter(type => !allConsumedExpressionTypes.has(type))
    .sort(codePointCompare);

  // Compute mapped types (from actually consumed expression types)
  const mappedTypes: CareerExpressionType[] = [...allConsumedExpressionTypes].sort(codePointCompare);

  // Compute missing inputs
  const missingInputs: string[] = [];
  if (!career10HFoundation) {
    missingInputs.push('career10HFoundation');
  }
  if (!career10LFoundation) {
    missingInputs.push('career10LFoundation');
  }
  if (!careerD10CanonicalAnalysis) {
    missingInputs.push('careerD10CanonicalAnalysis');
  }
  if (!domainEvidence) {
    missingInputs.push('domainEvidence');
  }

  // Compute status based on minimum-input contract
  // INSUFFICIENT_DATA: no candidate-establishing input was present/consumed
  // PARTIAL: candidates established but some optional inputs missing
  // COMPLETE: candidates established and all optional inputs present
  let status: CareerProfessionAnalysisStatus;
  if (!anyCandidateEstablished) {
    status = 'INSUFFICIENT_DATA';
  } else if (missingInputs.length > 0) {
    status = 'PARTIAL';
  } else {
    status = 'COMPLETE';
  }

  // Build provenance from emitted candidates' evidence only
  const provenance = buildProvenance(d10QualifiedCandidates);

  // Sort and deduplicate candidates
  const sortedCandidates = canonicalSortProfessionCandidates(
    deduplicateProfessionCandidates(d10QualifiedCandidates)
  );

  // Freeze and return
  return freezeProfessionAnalysis({
    candidates: sortedCandidates,
    status: status as 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA',
    unresolvedExpressionTypes,
    mappedTypes,
    missingInputs,
    provenance
  });
}

/**
 * Index expressions by pattern ID for pattern-scoped resolution.
 */
function indexExpressionsByPattern(
  expressions: readonly CareerExpressionCandidate[]
): Record<string, CareerExpressionCandidate[]> {
  const index: Record<string, CareerExpressionCandidate[]> = {};

  for (const expr of expressions) {
    for (const patternId of expr.provenance.patternIds) {
      if (!index[patternId]) {
        index[patternId] = [];
      }
      index[patternId].push(expr);
    }
  }

  // Sort expressions within each pattern
  for (const patternId of Object.keys(index)) {
    index[patternId].sort((a, b) => codePointCompare(a.expressionId, b.expressionId));
  }

  return index;
}

/**
 * Index mechanisms by pattern ID for pattern-scoped resolution.
 */
function indexMechanismsByPattern(
  mechanisms: readonly CareerMechanismCandidate[]
): Record<string, CareerMechanismCandidate[]> {
  const index: Record<string, CareerMechanismCandidate[]> = {};

  for (const mech of mechanisms) {
    const patternId = mech.patternId;
    if (!index[patternId]) {
      index[patternId] = [];
    }
    index[patternId].push(mech);
  }

  // Sort mechanisms within each pattern
  for (const patternId of Object.keys(index)) {
    index[patternId].sort((a, b) => codePointCompare(a.candidateId, b.candidateId));
  }

  return index;
}

/**
 * Resolve rules within a single pattern scope.
 * Per spec §6: pattern-scoped resolution with source-linked rule resolution.
 *
 * Mechanisms and expressions from different patterns are NOT combined to satisfy a rule.
 * Candidate identity includes the source-pattern set so candidates from distinct patterns are not collapsed.
 *
 * Source-linked resolution (P1):
 * - For expression-driven rules: select only expressions whose expressionType matches the rule
 *   AND verify their sourceMechanismIds reference the pattern's mechanism candidates
 * - For mechanism composites: require all requiredMechanismTypes to be present AND share
 *   a deterministic source relationship (referenced together by at least one expression in the pattern)
 * - Pass only the satisfying expressions/mechanisms into buildCandidateFromRule and buildEvidence
 */
function resolveRulesInPattern(
  patternId: string,
  patternExpressions: readonly CareerExpressionCandidate[],
  patternMechanisms: readonly CareerMechanismCandidate[],
  career10HFoundation?: Career10HFoundation,
  career10LFoundation?: Career10LFoundation,
  domainEvidence?: readonly DomainEvidence[]
): { candidates: CareerProfessionCandidate[] } {
  const candidates: CareerProfessionCandidate[] = [];

  // Build mechanism ID set for source linkage verification
  const patternMechanismIds = new Set<string>();
  for (const mech of patternMechanisms) {
    patternMechanismIds.add(mech.candidateId);
  }

  // Build mechanism type set for mechanism composite rules
  const mechanismTypes = new Set<CareerMechanismType>();
  for (const mech of patternMechanisms) {
    mechanismTypes.add(mech.mechanismType);
  }

  // Evaluate each rule in precedence order
  for (const rule of CAREER_PROFESSION_RULES) {
    const match = evaluateRule(
      rule,
      patternExpressions,
      patternMechanisms,
      patternMechanismIds,
      mechanismTypes
    );
    if (match) {
      const { satisfyingExpressions, satisfyingMechanisms } = match;
      const candidate = buildCandidateFromRule(
        rule,
        patternId,
        satisfyingExpressions,
        satisfyingMechanisms,
        career10HFoundation,
        career10LFoundation,
        domainEvidence
      );
      candidates.push(candidate);
    }
  }

  return { candidates };
}

/**
 * Evaluate a rule against available expression and mechanism types with source linkage.
 * Per spec §4: composite rules require ALL listed mechanism types (every check).
 * Per spec P1: source-linked resolution - expressions must reference pattern mechanisms.
 * For mechanism composites: STRONG source-linkage contract - required mechanisms must be
 * referenced together by at least one expression in the pattern (shared source relationship).
 *
 * Returns null if rule does not match, or the satisfying expressions/mechanisms if it does.
 */
function evaluateRule(
  rule: CareerProfessionRule,
  patternExpressions: readonly CareerExpressionCandidate[],
  patternMechanisms: readonly CareerMechanismCandidate[],
  patternMechanismIds: Set<string>,
  mechanismTypes: Set<CareerMechanismType>
): { satisfyingExpressions: readonly CareerExpressionCandidate[]; satisfyingMechanisms: readonly CareerMechanismCandidate[] } | null {
  // At least one of requiredExpressionTypes or requiredMechanismTypes must be specified
  if (
    (!rule.requiredExpressionTypes || rule.requiredExpressionTypes.length === 0) &&
    (!rule.requiredMechanismTypes || rule.requiredMechanismTypes.length === 0)
  ) {
    return null;
  }

  // Source-linked expression resolution
  const satisfyingExpressions: CareerExpressionCandidate[] = [];
  if (rule.requiredExpressionTypes && rule.requiredExpressionTypes.length > 0) {
    // Select only expressions whose expressionType matches the rule
    // AND verify their sourceMechanismIds reference the pattern's mechanism candidates
    for (const expr of patternExpressions) {
      if (rule.requiredExpressionTypes.includes(expr.expressionType)) {
        // Verify source linkage: expression must reference at least one mechanism in this pattern
        // PARTIAL RESOLUTION POLICY: An expression is valid if at least one of its sourceMechanismIds
        // resolves to a pattern mechanism. Unresolved source references are ignored for validity,
        // but only actually-resolved mechanism IDs are included in evidence sourceIds.
        const hasSourceLinkage = expr.sourceMechanismIds.some(id => patternMechanismIds.has(id));
        if (hasSourceLinkage) {
          satisfyingExpressions.push(expr);
        }
      }
    }

    // All required expression types must be present with source linkage
    const presentExpressionTypes = new Set(satisfyingExpressions.map(e => e.expressionType));
    const hasAllExpressions = rule.requiredExpressionTypes.every(type =>
      presentExpressionTypes.has(type)
    );
    if (!hasAllExpressions) {
      return null;
    }
  }

  // Source-linked mechanism resolution
  const satisfyingMechanisms: CareerMechanismCandidate[] = [];
  if (rule.requiredMechanismTypes && rule.requiredMechanismTypes.length > 0) {
    // Require all requiredMechanismTypes to be present in the source-linked mechanism set
    const hasAllMechanisms = rule.requiredMechanismTypes.every(type =>
      mechanismTypes.has(type)
    );
    if (!hasAllMechanisms) {
      return null;
    }

    // STRONG source-linkage contract for mechanism composites:
    // Require mechanisms to share a deterministic source relationship.
    // A mechanism composite is valid only if the required mechanisms are
    // referenced together by at least one expression in the pattern, indicating
    // they participate in a common qualifying relationship rather than merely co-occurring.
    if (rule.requiredMechanismTypes.length > 1) {
      // Build a map from mechanism ID to mechanism type
      const mechanismIdToType = new Map<string, CareerMechanismType>();
      for (const mech of patternMechanisms) {
        mechanismIdToType.set(mech.candidateId, mech.mechanismType);
      }

      // Check if any expression references multiple required mechanism types
      let hasSharedSourceLinkage = false;
      for (const expr of patternExpressions) {
        const referencedMechanismTypes = new Set<CareerMechanismType>();
        for (const mechId of expr.sourceMechanismIds) {
          const mechType = mechanismIdToType.get(mechId);
          if (mechType && rule.requiredMechanismTypes!.includes(mechType)) {
            referencedMechanismTypes.add(mechType);
          }
        }
        // If this expression references all required mechanism types, we have shared linkage
        if (referencedMechanismTypes.size === rule.requiredMechanismTypes.length) {
          hasSharedSourceLinkage = true;
          break;
        }
      }

      if (!hasSharedSourceLinkage) {
        return null;
      }
    }

    // Collect the satisfying mechanisms
    for (const mech of patternMechanisms) {
      if (rule.requiredMechanismTypes.includes(mech.mechanismType)) {
        satisfyingMechanisms.push(mech);
      }
    }
  }

  return { satisfyingExpressions, satisfyingMechanisms };
}

/**
 * Build a profession candidate from a matching rule.
 * Uses only the satisfying expressions/mechanisms that passed source-linked evaluation.
 */
function buildCandidateFromRule(
  rule: CareerProfessionRule,
  patternId: string,
  satisfyingExpressions: readonly CareerExpressionCandidate[],
  satisfyingMechanisms: readonly CareerMechanismCandidate[],
  career10HFoundation?: Career10HFoundation,
  career10LFoundation?: Career10LFoundation,
  domainEvidence?: readonly DomainEvidence[]
): CareerProfessionCandidate {
  // Collect expression types that match the rule
  const matchedExpressionTypes: CareerExpressionType[] = [];
  if (rule.requiredExpressionTypes) {
    for (const type of rule.requiredExpressionTypes) {
      matchedExpressionTypes.push(type);
    }
  }

  // Collect mechanism types that match the rule
  const matchedMechanismTypes: CareerMechanismType[] = [];
  if (rule.requiredMechanismTypes) {
    for (const type of rule.requiredMechanismTypes) {
      matchedMechanismTypes.push(type);
    }
  }

  // Build evidence using only satisfying expressions/mechanisms
  const evidence = buildEvidence(
    rule,
    satisfyingExpressions,
    satisfyingMechanisms,
    career10HFoundation,
    career10LFoundation
  );

  // Collect source IDs from satisfying expressions and mechanisms only
  const expressionIds = satisfyingExpressions.map(e => e.expressionId);
  const mechanismIds = satisfyingMechanisms.map(m => m.candidateId);
  const sourceIds = mergeSourceIds([expressionIds, mechanismIds]);

  // Collect related evidence IDs from DomainEvidence
  const domainEvidenceIds: string[] = [];
  const relatedEvidenceIds: string[] = [];
  if (domainEvidence) {
    for (const de of domainEvidence) {
      // Only include DomainEvidence that is referenced via relatedEvidenceIds
      // Unreferenced DomainEvidence cannot create or activate a candidate
      if (de.relatedEvidenceIds && de.relatedEvidenceIds.length > 0) {
        // Check if this evidence is related to our sources
        const isRelated = de.relatedEvidenceIds.some(id => sourceIds.includes(id));
        if (isRelated) {
          domainEvidenceIds.push(de.id);
          relatedEvidenceIds.push(de.id);
        }
      }
    }
  }

  // Build candidate ID (pattern-scoped with ruleId for identity)
  const candidateId = createProfessionCandidateId(
    rule.domain,
    rule.family,
    [patternId],
    rule.basis,
    rule.ruleId
  );

  // Build candidate
  return Object.freeze({
    candidateId,
    domain: rule.domain,
    family: rule.family,
    basis: rule.basis,
    expressionTypes: Object.freeze(matchedExpressionTypes.sort(codePointCompare)),
    mechanismTypes: Object.freeze(matchedMechanismTypes.sort(codePointCompare)),
    patternIds: Object.freeze([patternId]),
    d10Status: 'NOT_PROVIDED', // Will be updated by applyD10Qualification
    evidence: Object.freeze(canonicalSortProfessionEvidence(evidence)),
    domainEvidenceIds: Object.freeze(domainEvidenceIds.sort(codePointCompare)),
    relatedEvidenceIds: Object.freeze(relatedEvidenceIds.sort(codePointCompare)),
    ruleId: rule.ruleId
  });
}

/**
 * Build evidence for a candidate.
 * For expression-based evidence, sourceIds include only the expression IDs themselves.
 * Mechanism source linkage is validated during rule evaluation, not included in evidence sourceIds.
 */
function buildEvidence(
  rule: CareerProfessionRule,
  patternExpressions: readonly CareerExpressionCandidate[],
  patternMechanisms: readonly CareerMechanismCandidate[],
  career10HFoundation?: Career10HFoundation,
  career10LFoundation?: Career10LFoundation
): CareerProfessionEvidence[] {
  const evidence: CareerProfessionEvidence[] = [];

  // Expression-based evidence
  if (rule.basis === 'EXPRESSION' && rule.requiredExpressionTypes) {
    const expressionIds = patternExpressions
      .filter(e => rule.requiredExpressionTypes!.includes(e.expressionType))
      .map(e => e.expressionId);

    if (expressionIds.length > 0) {
      evidence.push(Object.freeze({
        evidenceId: createProfessionEvidenceId('EXPRESSION', rule.ruleId, expressionIds),
        basis: 'EXPRESSION',
        sourceIds: Object.freeze(expressionIds.sort(codePointCompare)),
        ruleId: rule.ruleId,
        statement: `Expression types ${rule.requiredExpressionTypes.join(', ')} establish ${rule.domain}/${rule.family}`
      }));
    }
  }

  // Mechanism-based evidence
  if (rule.basis === 'MECHANISM' && rule.requiredMechanismTypes) {
    const mechanismIds = patternMechanisms
      .filter(m => rule.requiredMechanismTypes!.includes(m.mechanismType))
      .map(m => m.candidateId);

    if (mechanismIds.length > 0) {
      evidence.push(Object.freeze({
        evidenceId: createProfessionEvidenceId('MECHANISM', rule.ruleId, mechanismIds),
        basis: 'MECHANISM',
        sourceIds: Object.freeze(mechanismIds.sort(codePointCompare)),
        ruleId: rule.ruleId,
        statement: `Mechanism types ${rule.requiredMechanismTypes.join(', ')} establish ${rule.domain}/${rule.family}`
      }));
    }
  }

  // 10H foundation (accepted-but-unused context this pass)
  // 10H provides context but does not establish candidates
  // This is not tracked in provenance or as establishing evidence
  // Actual refinement rules are deferred to a scoped follow-up
  if (career10HFoundation) {
    // Context accepted but not used in this pass
  }

  // 10L foundation (accepted-but-unused context this pass)
  // 10L provides context but does not establish candidates
  // This is not tracked in provenance or as establishing evidence
  // Actual refinement rules are deferred to a scoped follow-up
  if (career10LFoundation) {
    // Context accepted but not used in this pass
  }

  return evidence;
}

/**
 * Apply D10 qualification to existing candidates.
 * Per spec §5.5: D10 only qualifies existing candidates; it never creates them.
 *
 * CRITICAL TRAP: The P2-08A expressionId is built from createCareerExpressionId(expressionType, sourceMechanismIds),
 * while D10 canonical expression qualifications are keyed on the legacy mode-based CareerExpression.
 * These are DIFFERENT identity namespaces. A naive string-equality match will NEVER match.
 *
 * Resolution: Return NOT_PROVIDED/UNAVAILABLE and document that D10 per-expression qualification is deferred
 * because the identity namespaces are not yet reconciled. Do NOT ship silent dead-code matching.
 *
 * In all cases, D10 must only qualify an existing candidate and must never create one.
 * Missing/unavailable D10 is NOT_PROVIDED/UNAVAILABLE, not negative evidence.
 */
function applyD10Qualification(
  candidates: CareerProfessionCandidate[],
  careerD10CanonicalAnalysis?: CareerD10CanonicalAnalysis
): CareerProfessionCandidate[] {
  if (!careerD10CanonicalAnalysis) {
    // D10 not provided - mark all candidates as NOT_PROVIDED
    return candidates.map(c =>
      Object.freeze({
        ...c,
        d10Status: 'NOT_PROVIDED' as const
      })
    );
  }

  // D10 is provided but identity namespaces are not reconciled
  // Mark all candidates as UNAVAILABLE and document the deferment
  //
  // The P2-08A expressionId (e.g., "EXPR:RESEARCH_WORK:MECH1,MECH2") does not match
  // the D10 canonical expressionId (legacy mode-based CareerExpression identity).
  // Without a documented mapping between these namespaces, we cannot match them.
  //
  // This is explicitly documented in the P2-10A doc as deferred work.
  return candidates.map(c =>
    Object.freeze({
      ...c,
      d10Status: 'UNAVAILABLE' as const
    })
  );
}

/**
 * Build provenance for the analysis.
 * Derived only from emitted candidates' evidence to reflect consumed/causal sources.
 * Separate observed/input IDs from consumed/causal source IDs.
 */
function buildProvenance(
  candidates: readonly CareerProfessionCandidate[]
): CareerProfessionProvenance {
  // Derive consumed/causal source IDs from candidates' evidence only
  const consumedExpressionIds = candidates.flatMap(c =>
    c.evidence
      .filter(e => e.basis === 'EXPRESSION')
      .flatMap(e => e.sourceIds)
  );
  const consumedMechanismIds = candidates.flatMap(c =>
    c.evidence
      .filter(e => e.basis === 'MECHANISM')
      .flatMap(e => e.sourceIds)
  );
  // Derive pattern IDs strictly from emitted candidates' patternIds (not all input patterns)
  const consumedPatternIds = new Set<string>();
  for (const candidate of candidates) {
    for (const patternId of candidate.patternIds) {
      consumedPatternIds.add(patternId);
    }
  }
  const evidenceIds = candidates.flatMap(c => c.evidence.map(e => e.evidenceId));
  const sourceIds = candidates.flatMap(c => c.evidence.flatMap(e => e.sourceIds));
  const ruleIds = candidates.map(c => c.ruleId);

  return Object.freeze({
    expressionIds: Object.freeze(consumedExpressionIds.sort(codePointCompare)),
    mechanismIds: Object.freeze(consumedMechanismIds.sort(codePointCompare)),
    patternIds: Object.freeze([...consumedPatternIds].sort(codePointCompare)),
    evidenceIds: Object.freeze(evidenceIds.sort(codePointCompare)),
    sourceIds: Object.freeze(sourceIds.sort(codePointCompare)),
    ruleIds: Object.freeze(ruleIds.sort(codePointCompare))
  });
}
