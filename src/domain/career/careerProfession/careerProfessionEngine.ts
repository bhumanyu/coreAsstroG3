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

  // Compute status
  let status: CareerProfessionAnalysisStatus;
  if (expressions.expressions.length === 0) {
    status = 'INSUFFICIENT_DATA';
  } else if (missingInputs.length > 0) {
    status = 'PARTIAL';
  } else {
    status = 'COMPLETE';
  }

  // Build provenance
  const provenance = buildProvenance(
    expressions.expressions,
    mechanisms,
    d10QualifiedCandidates,
    allPatternIds
  );

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
 * Per spec §6: pattern-scoped resolution.
 *
 * Mechanisms and expressions from different patterns are NOT combined to satisfy a rule.
 * Candidate identity includes the source-pattern set so candidates from distinct patterns are not collapsed.
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

  // Collect expression types and mechanism types in this pattern
  const expressionTypes = new Set<CareerExpressionType>();
  for (const expr of patternExpressions) {
    expressionTypes.add(expr.expressionType);
  }

  const mechanismTypes = new Set<CareerMechanismType>();
  for (const mech of patternMechanisms) {
    mechanismTypes.add(mech.mechanismType);
  }

  // Evaluate each rule in precedence order
  for (const rule of CAREER_PROFESSION_RULES) {
    const match = evaluateRule(rule, expressionTypes, mechanismTypes);
    if (match) {
      const candidate = buildCandidateFromRule(
        rule,
        patternId,
        patternExpressions,
        patternMechanisms,
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
 * Evaluate a rule against available expression and mechanism types.
 * Per spec §4: composite rules require ALL listed mechanism types (every check).
 */
function evaluateRule(
  rule: CareerProfessionRule,
  expressionTypes: Set<CareerExpressionType>,
  mechanismTypes: Set<CareerMechanismType>
): boolean {
  // If rule requires expression types, all must be present
  if (rule.requiredExpressionTypes && rule.requiredExpressionTypes.length > 0) {
    const hasAllExpressions = rule.requiredExpressionTypes.every(type =>
      expressionTypes.has(type)
    );
    if (!hasAllExpressions) {
      return false;
    }
  }

  // If rule requires mechanism types, all must be present
  if (rule.requiredMechanismTypes && rule.requiredMechanismTypes.length > 0) {
    const hasAllMechanisms = rule.requiredMechanismTypes.every(type =>
      mechanismTypes.has(type)
    );
    if (!hasAllMechanisms) {
      return false;
    }
  }

  // At least one of requiredExpressionTypes or requiredMechanismTypes must be specified
  if (
    (!rule.requiredExpressionTypes || rule.requiredExpressionTypes.length === 0) &&
    (!rule.requiredMechanismTypes || rule.requiredMechanismTypes.length === 0)
  ) {
    return false;
  }

  return true;
}

/**
 * Build a profession candidate from a matching rule.
 */
function buildCandidateFromRule(
  rule: CareerProfessionRule,
  patternId: string,
  patternExpressions: readonly CareerExpressionCandidate[],
  patternMechanisms: readonly CareerMechanismCandidate[],
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

  // Build evidence
  const evidence = buildEvidence(
    rule,
    patternExpressions,
    patternMechanisms,
    career10HFoundation,
    career10LFoundation
  );

  // Collect source IDs from expressions and mechanisms
  const expressionIds = patternExpressions.map(e => e.expressionId);
  const mechanismIds = patternMechanisms.map(m => m.candidateId);
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

  // Build candidate ID (pattern-scoped)
  const candidateId = createProfessionCandidateId(
    rule.domain,
    rule.family,
    [patternId],
    rule.basis
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

  // 10H foundation evidence (context only, never establishes)
  if (career10HFoundation) {
    // 10H provides context but does not establish candidates
    // This is tracked in provenance, not as establishing evidence
  }

  // 10L foundation evidence (context only, never establishes)
  if (career10LFoundation) {
    // 10L provides context but does not establish candidates
    // This is tracked in provenance, not as establishing evidence
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
 */
function buildProvenance(
  expressions: readonly CareerExpressionCandidate[],
  mechanisms: readonly CareerMechanismCandidate[],
  candidates: readonly CareerProfessionCandidate[],
  patternIds: Set<string>
): CareerProfessionProvenance {
  const expressionIds = expressions.map(e => e.expressionId);
  const mechanismIds = mechanisms.map(m => m.candidateId);
  const candidatePatternIds = [...patternIds].sort(codePointCompare);
  const evidenceIds = candidates.flatMap(c => c.evidence.map(e => e.evidenceId));
  const sourceIds = candidates.flatMap(c => c.evidence.flatMap(e => e.sourceIds));
  const ruleIds = candidates.map(c => c.ruleId);

  return Object.freeze({
    expressionIds: Object.freeze(expressionIds.sort(codePointCompare)),
    mechanismIds: Object.freeze(mechanismIds.sort(codePointCompare)),
    patternIds: Object.freeze(candidatePatternIds),
    evidenceIds: Object.freeze(evidenceIds.sort(codePointCompare)),
    sourceIds: Object.freeze(sourceIds.sort(codePointCompare)),
    ruleIds: Object.freeze(ruleIds.sort(codePointCompare))
  });
}
