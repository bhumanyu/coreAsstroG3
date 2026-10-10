import type { DomainInterpretation } from '../../domain/interpretation';
import type { CareerFinalSynthesisResult } from '../../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  CareerProfessionAnalysis,
  CareerProfessionCandidate,
  CareerProfessionEvidence,
  CareerProfessionD10Status
} from '../../domain/career/careerProfession/careerProfessionTypes';
import type {
  AiCareerCanonicalC11Fact,
  AiCareerCanonicalExpressionFact,
  AiCareerCanonicalConflictFact,
  AiCareerProfessionFact,
  AiCareerProfessionCandidateFact,
  AiCareerProfessionEvidenceFact
} from '../types/aiContextTypes';
import type { AiAvailability } from '../types/aiTypes';

/**
 * P2-10B Projection Layer: Career Intelligence
 *
 * Pure mappers that project authoritative canonical C11 result and precomputed
 * P2-10A CareerProfessionAnalysis into typed AI DTOs.
 *
 * This layer does NOT:
 * - Recalculate astrology
 * - Treat legacy synthesis as authoritative
 * - Modify C4–C11 producers
 * - Modify DomainEvidence.ts
 * - Modify the public return type of interpretCareerV2
 *
 * It is purely additive projection/plumbing.
 */

/**
 * Runtime type guard for CareerFinalSynthesisResult.
 * Reads ONLY conclusionData.canonicalCareerFinalSynthesis.
 * Never falls back to legacy careerFinalSynthesis.
 *
 * This is a defensive shape check for nested values that the projection
 * actually consumes. It validates:
 * - Each expressions element has string mode/direction/strength
 * - Each conflicts element has source/direction/severity/statement
 * - evidenceTrace is a non-null object with array evidenceIds/sourceIds/ruleIds
 */
export function isCareerFinalSynthesisResult(
  value: unknown
): value is CareerFinalSynthesisResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (
    obj.reasoningVersion !== 'C11' ||
    obj.domain !== 'CAREER' ||
    typeof obj.finalStatus !== 'string' ||
    typeof obj.finalDirection !== 'string' ||
    typeof obj.finalStrength !== 'string' ||
    typeof obj.confidence !== 'string' ||
    typeof obj.natalDirection !== 'string' ||
    typeof obj.natalStrength !== 'string' ||
    typeof obj.expressionStatus !== 'string' ||
    typeof obj.d10Direction !== 'string' ||
    typeof obj.d10Effect !== 'string' ||
    typeof obj.dashaEffect !== 'string' ||
    typeof obj.dashaDirection !== 'string' ||
    typeof obj.timingStatus !== 'string' ||
    typeof obj.transitDirection !== 'string' ||
    typeof obj.currentPressure !== 'string' ||
    !Array.isArray(obj.expressions) ||
    !Array.isArray(obj.strongestExpressions) ||
    !Array.isArray(obj.challengedExpressions) ||
    !Array.isArray(obj.conflicts) ||
    !Array.isArray(obj.evidenceIds) ||
    !Array.isArray(obj.sourceIds) ||
    !Array.isArray(obj.ruleIds) ||
    typeof obj.statement !== 'string'
  ) {
    return false;
  }

  // Validate nested expressions array elements
  const expressions = obj.expressions as unknown[];
  for (const expr of expressions) {
    if (
      typeof expr !== 'object' ||
      expr === null ||
      typeof (expr as Record<string, unknown>).mode !== 'string' ||
      typeof (expr as Record<string, unknown>).direction !== 'string' ||
      typeof (expr as Record<string, unknown>).strength !== 'string'
    ) {
      return false;
    }
  }

  // Validate nested conflicts array elements (fields read by conflict mapper)
  const conflicts = obj.conflicts as unknown[];
  for (const conflict of conflicts) {
    if (
      typeof conflict !== 'object' ||
      conflict === null ||
      typeof (conflict as Record<string, unknown>).source !== 'string' ||
      typeof (conflict as Record<string, unknown>).direction !== 'string' ||
      typeof (conflict as Record<string, unknown>).severity !== 'string' ||
      typeof (conflict as Record<string, unknown>).statement !== 'string'
    ) {
      return false;
    }
  }

  // Validate evidenceTrace is a non-null object with required arrays
  const evidenceTrace = obj.evidenceTrace;
  if (
    typeof evidenceTrace !== 'object' ||
    evidenceTrace === null ||
    !Array.isArray((evidenceTrace as Record<string, unknown>).evidenceIds) ||
    !Array.isArray((evidenceTrace as Record<string, unknown>).sourceIds) ||
    !Array.isArray((evidenceTrace as Record<string, unknown>).ruleIds)
  ) {
    return false;
  }

  return true;
}

/**
 * Projects the authoritative canonical C11 result into AI DTO.
 *
 * @param interpretation - Domain interpretation containing canonicalCareerFinalSynthesis
 * @returns AiCareerCanonicalC11Fact or undefined if not available
 */
export function projectCanonicalCareerC11(
  interpretation?: DomainInterpretation
): AiCareerCanonicalC11Fact | undefined {
  const canonicalC11 = interpretation?.conclusionData?.canonicalCareerFinalSynthesis;

  if (!canonicalC11 || !isCareerFinalSynthesisResult(canonicalC11)) {
    return undefined;
  }

  const expressions: readonly AiCareerCanonicalExpressionFact[] = canonicalC11.expressions.map(
    (expr) => ({
      mode: expr.mode,
      direction: expr.direction,
      strength: expr.strength,
      statement: `${expr.mode} expression: ${expr.direction} direction, ${expr.strength} strength`
    })
  );

  const conflicts: readonly AiCareerCanonicalConflictFact[] = canonicalC11.conflicts.map(
    (conflict) => ({
      layers: [conflict.source, conflict.direction, conflict.severity],
      description: conflict.statement
    })
  );

  return {
    reasoningVersion: canonicalC11.reasoningVersion,
    finalStatus: canonicalC11.finalStatus,
    finalDirection: canonicalC11.finalDirection,
    finalStrength: canonicalC11.finalStrength,
    confidence: canonicalC11.confidence,
    natalDirection: canonicalC11.natalDirection,
    natalStrength: canonicalC11.natalStrength,
    expressionStatus: canonicalC11.expressionStatus,
    d10Direction: canonicalC11.d10Direction,
    d10Effect: canonicalC11.d10Effect,
    dashaEffect: canonicalC11.dashaEffect,
    dashaDirection: canonicalC11.dashaDirection,
    timingStatus: canonicalC11.timingStatus,
    transitDirection: canonicalC11.transitDirection,
    currentPressure: canonicalC11.currentPressure,
    expressions,
    strongestExpressions: Object.freeze([...canonicalC11.strongestExpressions]),
    challengedExpressions: Object.freeze([...canonicalC11.challengedExpressions]),
    conflicts,
    statement: canonicalC11.statement,
    canonicalEvidenceIds: Object.freeze([...canonicalC11.evidenceIds]),
    canonicalSourceIds: Object.freeze([...canonicalC11.sourceIds]),
    canonicalRuleIds: Object.freeze([...canonicalC11.ruleIds]),
    canonicalEvidenceTrace: {
      evidenceIds: Object.freeze([...canonicalC11.evidenceTrace.evidenceIds]),
      sourceIds: Object.freeze([...canonicalC11.evidenceTrace.sourceIds]),
      ruleIds: Object.freeze([...canonicalC11.evidenceTrace.ruleIds])
    }
  };
}

/**
 * Projects a profession evidence record into AI DTO.
 */
function projectProfessionEvidence(
  evidence: CareerProfessionEvidence
): AiCareerProfessionEvidenceFact {
  return {
    evidenceId: evidence.evidenceId,
    basis: evidence.basis,
    sourceIds: Object.freeze([...evidence.sourceIds]),
    ruleId: evidence.ruleId,
    statement: evidence.statement,
    ...(evidence.linkage ? { linkage: evidence.linkage } : {}),
    ...(evidence.resolvedMechanismIds
      ? { resolvedMechanismIds: Object.freeze([...evidence.resolvedMechanismIds]) }
      : {}),
    ...(evidence.unresolvedMechanismIds
      ? { unresolvedMechanismIds: Object.freeze([...evidence.unresolvedMechanismIds]) }
      : {})
  };
}

/**
 * Projects a profession candidate into AI DTO.
 */
function projectProfessionCandidate(
  candidate: CareerProfessionCandidate
): AiCareerProfessionCandidateFact {
  return {
    candidateId: candidate.candidateId,
    domain: candidate.domain,
    family: candidate.family,
    basis: candidate.basis,
    expressionTypes: Object.freeze([...candidate.expressionTypes]),
    mechanismTypes: Object.freeze([...candidate.mechanismTypes]),
    patternIds: Object.freeze([...candidate.patternIds]),
    d10Status: candidate.d10Status,
    evidence: candidate.evidence.map(projectProfessionEvidence),
    domainEvidenceIds: Object.freeze([...candidate.domainEvidenceIds]),
    relatedEvidenceIds: Object.freeze([...candidate.relatedEvidenceIds]),
    ruleId: candidate.ruleId
  };
}

/**
 * Projects the precomputed P2-10A CareerProfessionAnalysis into AI DTO.
 *
 * @param analysis - Precomputed profession analysis from P2-10A
 * @returns AiCareerProfessionFact with availability status
 */
export function projectCareerProfessionAnalysis(
  analysis?: CareerProfessionAnalysis
): AiCareerProfessionFact {
  if (!analysis) {
    return {
      availability: 'UNAVAILABLE' as AiAvailability,
      status: 'INSUFFICIENT_DATA',
      candidates: [],
      unresolvedExpressionTypes: [],
      mappedTypes: [],
      missingInputs: ['careerProfessionAnalysis'],
      d10Status: 'NOT_PROVIDED' as CareerProfessionD10Status
    };
  }

  const candidates: readonly AiCareerProfessionCandidateFact[] = analysis.candidates.map(
    projectProfessionCandidate
  );

  // Determine aggregate D10 status from candidates
  // Preserve d10Status as supplied; never convert UNAVAILABLE/NOT_PROVIDED to NOT_QUALIFIED
  let aggregateD10Status: CareerProfessionD10Status = 'NOT_PROVIDED';
  if (candidates.length > 0) {
    const hasQualified = candidates.some((c) => c.d10Status === 'QUALIFIED');
    const hasUnavailable = candidates.some((c) => c.d10Status === 'UNAVAILABLE');
    const hasNotProvided = candidates.some((c) => c.d10Status === 'NOT_PROVIDED');

    if (hasQualified) {
      aggregateD10Status = 'QUALIFIED';
    } else if (hasUnavailable) {
      aggregateD10Status = 'UNAVAILABLE';
    } else if (hasNotProvided) {
      aggregateD10Status = 'NOT_PROVIDED';
    } else {
      aggregateD10Status = 'NOT_APPLICABLE';
    }
  }

  return {
    availability: 'AVAILABLE' as AiAvailability,
    status: analysis.status,
    candidates,
    unresolvedExpressionTypes: Object.freeze([...analysis.unresolvedExpressionTypes]),
    mappedTypes: Object.freeze([...analysis.mappedTypes]),
    missingInputs: Object.freeze([...analysis.missingInputs]),
    d10Status: aggregateD10Status
  };
}
