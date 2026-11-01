import type {
  CareerFinalSynthesisInput,
  CareerFinalSynthesisResult,
  CareerFinalDirection,
  CareerFinalStrength,
  CareerFinalStatus,
  CareerFinalTimingStatus,
  CareerFinalConfidence,
  CareerFinalConflict,
  CareerConfidenceCoverage,
  CareerConfidenceReason,
  CareerConfidenceLayerCoverage
} from './careerFinalSynthesisTypes';
import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';
import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection
} from '../careerDasha';
import type {
  DomainStrength
} from '../../reasoning/reasoningTypes';
import type {
  CareerD10QualificationDirection,
  CareerD10QualificationStrength
} from '../careerD10';
import type {
  CareerExpressionDirection,
  CareerExpressionStrength
} from '../careerExpression';
import type { ContradictoryEvidenceDiagnostic } from '../canonicalCareerEvidenceMapper';

/**
 * C8 → C11 Direction Mapping Implementation
 *
 * Maps Career Expression Layer (C8) vocabulary to Final Synthesis Layer (C11) vocabulary.
 */
function mapExpressionDirectionToFinal(
  expressionDirection: CareerExpressionDirection
): CareerFinalDirection {
  switch (expressionDirection) {
    case 'SUPPORTED':
      return 'SUPPORT';
    case 'CONDITIONAL':
      return 'CONDITIONAL';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * C4 Structural → C11 Final Direction Mapping
 */
function mapStructuralDirectionToFinal(
  structuralDirection: CareerStructuralDirection
): CareerFinalDirection {
  switch (structuralDirection) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * C4 Structural → C11 Final Strength Mapping
 */
function mapStructuralStrengthToFinal(
  structuralStrength: CareerStructuralStrength
): CareerFinalStrength {
  switch (structuralStrength) {
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'MIXED':
      return 'MIXED';
    case 'WEAK':
      return 'WEAK';
    case 'VERY_WEAK':
      return 'VERY_WEAK';
    case 'UNDETERMINED':
      return 'UNDETERMINED';
    default:
      return 'UNDETERMINED';
  }
}

/**
 * C9 Dasha → C11 Final Direction Mapping
 */
function mapDashaDirectionToFinal(
  dashaDirection: CareerDashaActivationDirection | undefined
): CareerFinalDirection {
  if (!dashaDirection) return 'UNAVAILABLE';
  switch (dashaDirection) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * C10 D10 → C11 Final Direction Mapping
 */
function mapD10DirectionToFinal(
  d10Direction: CareerD10QualificationDirection | undefined
): CareerFinalDirection {
  if (!d10Direction) return 'UNAVAILABLE';
  switch (d10Direction) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Derive Final Status from Natal and Secondary Layers
 *
 * C11-INV-01: Natal promise is authoritative
 * C11-INV-04: Strong natal support not erased by D10 challenge
 * C11-INV-05: Missing evidence ≠ negative evidence
 *
 * Layer hierarchy: Natal → Expression → Dasha → D10 → Transit
 * Each layer qualifies along its semantic axis, not as interchangeable votes.
 */
function deriveFinalStatus(
  natalDirection: CareerStructuralDirection,
  natalStrength: CareerStructuralStrength,
  dashaDirection: CareerFinalDirection,
  d10Direction: CareerFinalDirection,
  d10Strength: CareerD10QualificationStrength | undefined,
  expressionDirection: CareerFinalDirection
): CareerFinalStatus {
  // C11-INV-05: Missing evidence ≠ negative evidence
  const hasDasha = dashaDirection !== 'UNAVAILABLE';
  const hasD10 = d10Direction !== 'UNAVAILABLE';
  const hasExpression = expressionDirection !== 'UNAVAILABLE';

  // C11-INV-01: Natal promise is authoritative
  if (natalDirection === 'UNAVAILABLE' || natalStrength === 'UNDETERMINED') {
    return 'INSUFFICIENT_DATA';
  }

  // Expression CONDITIONAL should be preserved, not treated as CHALLENGE
  const hasExpressionConditional = hasExpression && expressionDirection === 'CONDITIONAL';

  // D10 challenge is only significant if strength is STRONG or VERY_STRONG
  const hasStrongD10Challenge = hasD10 && d10Direction === 'CHALLENGE' &&
    (d10Strength === 'STRONG' || d10Strength === 'VERY_STRONG');

  // Strong natal support (C11-INV-04: cannot be erased by D10 challenge alone)
  if (natalStrength === 'VERY_STRONG' || natalStrength === 'STRONG') {
    if (natalDirection === 'SUPPORT') {
      // Expression CONDITIONAL produces CONDITIONALLY_SUPPORTED as a manifestation-axis qualification
      // SEMANTIC: The natal promise remains STRONG SUPPORT, but manifestation is conditional
      // This is NOT a general weakening of the natal promise itself
      // Dasha/D10/Transit may remain SUPPORT, but the overall result is CONDITIONALLY_SUPPORTED
      // to indicate that manifestation requires specific conditions to be met
      if (hasExpressionConditional) {
        return 'CONDITIONALLY_SUPPORTED';
      }

      // Check for strong secondary challenges (actual CHALLENGE, not CONDITIONAL)
      const hasStrongDashaChallenge = hasDasha && dashaDirection === 'CHALLENGE';
      const hasStrongExpressionChallenge = hasExpression && expressionDirection === 'CHALLENGE';

      // Dasha challenge affects timing, not final status (C11-INV-07)
      // D10 challenge qualifies execution (only STRONG D10 challenge matters)
      // Expression challenge qualifies manifestation
      if (hasStrongD10Challenge && hasStrongExpressionChallenge) {
        return 'CONDITIONALLY_SUPPORTED';
      }
      if (hasStrongD10Challenge || hasStrongExpressionChallenge) {
        return 'SUPPORTED';
      }
      return 'SUPPORTED';
    }
  }

  // Moderate natal support
  if (natalStrength === 'MODERATE') {
    if (natalDirection === 'SUPPORT') {
      // Expression CONDITIONAL produces CONDITIONALLY_SUPPORTED as a manifestation-axis qualification
      // SEMANTIC: The natal promise remains MODERATE SUPPORT, but manifestation is conditional
      // This is NOT a general weakening of the natal promise itself
      if (hasExpressionConditional) {
        return 'CONDITIONALLY_SUPPORTED';
      }
      const hasAnyChallenge = (hasDasha && dashaDirection === 'CHALLENGE') ||
        hasStrongD10Challenge ||
        (hasExpression && expressionDirection === 'CHALLENGE');
      return hasAnyChallenge ? 'MIXED' : 'SUPPORTED';
    }
  }

  // Weak natal support
  if (natalStrength === 'WEAK' || natalStrength === 'VERY_WEAK') {
    if (natalDirection === 'CHALLENGE') {
      return 'CHALLENGED';
    }
  }

  // Mixed natal
  if (natalDirection === 'MIXED' || natalStrength === 'MIXED') {
    return 'MIXED';
  }

  // Challenged natal
  if (natalDirection === 'CHALLENGE') {
    return 'CHALLENGED';
  }

  return 'INSUFFICIENT_DATA';
}

/**
 * Derive Final Direction
 *
 * C11-INV-01: Natal promise is authoritative
 */
function deriveFinalDirection(
  natalDirection: CareerStructuralDirection,
  finalStatus: CareerFinalStatus,
  expressionDirection: CareerFinalDirection
): CareerFinalDirection {
  const mappedNatal = mapStructuralDirectionToFinal(natalDirection);

  // C11-INV-01: Natal promise is authoritative
  if (finalStatus === 'SUPPORTED') {
    return mappedNatal === 'SUPPORT' ? 'SUPPORT' : 'MIXED';
  }
  if (finalStatus === 'CONDITIONALLY_SUPPORTED') {
    // If expression is CONDITIONAL, preserve that in final direction
    if (expressionDirection === 'CONDITIONAL') {
      return 'CONDITIONAL';
    }
    return 'MIXED';
  }
  if (finalStatus === 'CHALLENGED') {
    return 'CHALLENGE';
  }
  if (finalStatus === 'MIXED') {
    return 'MIXED';
  }
  return 'UNAVAILABLE';
}

/**
 * Derive Final Strength
 *
 * C11-INV-01: Natal promise is authoritative
 */
function deriveFinalStrength(
  natalStrength: CareerStructuralStrength,
  finalStatus: CareerFinalStatus,
  natalDirection?: CareerStructuralDirection
): CareerFinalStrength {
  const mappedNatal = mapStructuralStrengthToFinal(natalStrength);

  // C11-INV-01: Natal promise is authoritative
  if (finalStatus === 'SUPPORTED') {
    return mappedNatal;
  }
  if (finalStatus === 'CONDITIONALLY_SUPPORTED') {
    // Downgrade by one notch
    if (mappedNatal === 'VERY_STRONG') return 'STRONG';
    if (mappedNatal === 'STRONG') return 'MODERATE';
    if (mappedNatal === 'MODERATE') return 'MIXED';
    return 'WEAK';
  }
  if (finalStatus === 'CHALLENGED') {
    if (natalDirection === 'CHALLENGE') {
      return mappedNatal;
    }
    if (mappedNatal === 'VERY_STRONG') return 'MODERATE';
    if (mappedNatal === 'STRONG') return 'WEAK';
    if (mappedNatal === 'MODERATE') return 'WEAK';
    return 'VERY_WEAK';
  }
  if (finalStatus === 'MIXED') {
    return 'MIXED';
  }
  return 'UNDETERMINED';
}

/**
 * Derive Timing Status
 *
 * C11-INV-07: Dasha challenge modifies timing status, not natal direction
 * C11-INV-03: Transit may only affect timingStatus/currentPressure
 */
function deriveTimingStatus(
  dashaEffect: CareerDashaActivationEffect | undefined,
  dashaDirection: CareerFinalDirection,
  transitDirection: CareerFinalDirection | undefined
): CareerFinalTimingStatus {
  if (!dashaEffect || dashaEffect === 'INSUFFICIENT_DATA') {
    return 'UNKNOWN';
  }

  // C11-INV-07: Dasha challenge modifies timing status
  if (dashaDirection === 'CHALLENGE') {
    return 'CHALLENGED';
  }

  // C11-INV-03: Transit affects timing status
  if (transitDirection === 'CHALLENGE') {
    return 'PARTIALLY_ACTIVE';
  }

  if (dashaEffect === 'ACTIVATES') {
    return 'ACTIVE';
  }
  if (dashaEffect === 'PARTIALLY_ACTIVATES') {
    return 'PARTIALLY_ACTIVE';
  }
  if (dashaEffect === 'CHALLENGES') {
    return 'CHALLENGED';
  }
  if (dashaEffect === 'DOES_NOT_ACTIVATE') {
    return 'NOT_ACTIVE';
  }

  return 'UNKNOWN';
}

/**
 * Derive Current Pressure
 *
 * C11-INV-03: Transit may only affect timingStatus/currentPressure
 * Semantic precedence: Transit (current pressure) > Dasha (timing) > D10 (execution)
 *
 * DESIGN NOTE: This function intentionally aggregates three semantic dimensions into a single ordinal:
 * - Transit challenge → current pressure
 * - Dasha challenge → timing pressure
 * - D10 challenge → execution pressure
 *
 * The current implementation combines these into LOW/MODERATE/HIGH for C11 simplicity.
 * A future semantic refinement could preserve axis-specific pressures (currentTransitPressure,
 * timingPressure, executionPressure) and only derive a human-readable aggregate when explicitly required.
 * This is documented as an intentional C11 design decision, not a semantic flaw.
 */
function deriveCurrentPressure(
  dashaDirection: CareerFinalDirection,
  d10Direction: CareerFinalDirection,
  transitDirection: CareerFinalDirection | undefined
): 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'STRONG' | 'UNKNOWN' {
  // Transit is the primary driver of current pressure
  if (transitDirection === 'CHALLENGE') {
    // If transit challenges, check if other layers also challenge
    if (dashaDirection === 'CHALLENGE' && d10Direction === 'CHALLENGE') {
      return 'HIGH';
    }
    if (dashaDirection === 'CHALLENGE' || d10Direction === 'CHALLENGE') {
      return 'MODERATE';
    }
    return 'LOW';
  }

  // If no transit challenge, check Dasha (timing pressure)
  if (dashaDirection === 'CHALLENGE') {
    if (d10Direction === 'CHALLENGE') {
      return 'MODERATE';
    }
    return 'LOW';
  }

  // D10 execution challenge alone
  if (d10Direction === 'CHALLENGE') {
    return 'LOW';
  }

  return 'NONE';
}

/**
 * Derive confidence from explicit evidence coverage, provenance and conflict policy.
 * Promise strength is intentionally not modified by this function.
 */
function deriveConfidence(
  suppliedEvidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
  layers: { readonly natal: boolean; readonly dasha: boolean; readonly d10: boolean; readonly expression: boolean; readonly transit: boolean },
  conflicts: readonly CareerFinalConflict[],
  evidenceIds: readonly string[],
  sourceIds: readonly string[],
  ruleIds: readonly string[]
): { readonly confidence: CareerFinalConfidence; readonly coverage: CareerConfidenceCoverage; readonly reasons: readonly CareerConfidenceReason[] } {
  const layerCoverage: readonly CareerConfidenceLayerCoverage[] = Object.freeze([
    Object.freeze({ layer: 'NATAL' as const, requirement: 'REQUIRED' as const, availability: layers.natal ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }),
    Object.freeze({ layer: 'DASHA' as const, requirement: 'SUPPORTING' as const, availability: layers.dasha ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }),
    Object.freeze({ layer: 'D10' as const, requirement: 'SUPPORTING' as const, availability: layers.d10 ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }),
    Object.freeze({ layer: 'EXPRESSION' as const, requirement: 'SUPPORTING' as const, availability: layers.expression ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }),
    Object.freeze({ layer: 'TRANSIT' as const, requirement: 'OPTIONAL' as const, availability: layers.transit ? 'AVAILABLE' as const : 'UNAVAILABLE' as const })
  ]);
  const missingRequiredLayers = layerCoverage.filter(x => x.requirement === 'REQUIRED' && x.availability === 'UNAVAILABLE').map(x => x.layer);
  const missingSupportingLayers = layerCoverage.filter(x => x.requirement === 'SUPPORTING' && x.availability === 'UNAVAILABLE').map(x => x.layer);
  const missingOptionalLayers = layerCoverage.filter(x => x.requirement === 'OPTIONAL' && x.availability === 'UNAVAILABLE').map(x => x.layer);
  const provenanceProvided = evidenceIds.length > 0 || sourceIds.length > 0 || ruleIds.length > 0;
  const provenance: CareerConfidenceCoverage['provenance'] = !provenanceProvided ? 'NOT_PROVIDED' : evidenceIds.length > 0 && sourceIds.length > 0 && ruleIds.length > 0 ? 'COMPLETE' : 'PARTIAL';
  const evidenceQuality: CareerConfidenceCoverage['quality'] = suppliedEvidenceQuality ?? (provenance === 'COMPLETE' ? 'HIGH' : 'MEDIUM');
  const coverage: CareerConfidenceCoverage = Object.freeze({
    status: missingRequiredLayers.length > 0 ? 'INSUFFICIENT' : missingSupportingLayers.length > 0 ? 'PARTIAL' : 'COMPLETE',
    quality: evidenceQuality,
    layers: layerCoverage,
    missingRequiredLayers: Object.freeze(missingRequiredLayers),
    missingSupportingLayers: Object.freeze(missingSupportingLayers),
    missingOptionalLayers: Object.freeze(missingOptionalLayers),
    provenance
  });
  const reasons: CareerConfidenceReason[] = [];
  const caps: CareerFinalConfidence[] = [];
  const addReason = (code: CareerConfidenceReason['code'], message: string, capApplied: CareerFinalConfidence | null, layer?: CareerConfidenceReason['layer']) => {
    reasons.push(Object.freeze({ code, message, capApplied, ...(layer ? { layer } : {}) }));
    if (capApplied) caps.push(capApplied);
  };
  let confidence: CareerFinalConfidence = evidenceQuality;
  if (evidenceQuality === 'LOW') addReason('EVIDENCE_QUALITY_LOW', 'The supplied evidence-quality assessment is LOW.', 'LOW');
  else if (evidenceQuality === 'MEDIUM') addReason('EVIDENCE_QUALITY_MODERATE', 'The supplied evidence-quality assessment is MEDIUM or not independently supplied.', 'MEDIUM');
  for (const layer of missingRequiredLayers) addReason('REQUIRED_LAYER_UNAVAILABLE', 'A required evidence layer is unavailable; confidence is capped at LOW.', 'LOW', layer);
  for (const layer of missingSupportingLayers) {
    const cap: CareerFinalConfidence = missingSupportingLayers.length >= 2 ? 'LOW' : 'MEDIUM';
    addReason('SUPPORTING_LAYER_UNAVAILABLE', 'Supporting evidence layer ' + layer + ' is unavailable; confidence is capped at ' + cap + ' under the C11 coverage policy.', cap, layer);
  }
  for (const layer of missingOptionalLayers) addReason('OPTIONAL_LAYER_UNAVAILABLE', 'Optional evidence layer ' + layer + ' is unavailable and does not reduce confidence.', null, layer);
  if (conflicts.some(c => c.severity === 'HIGH')) addReason('CONFLICT_HIGH_SEVERITY', 'At least one HIGH-severity contradiction is present; confidence is capped at LOW.', 'LOW');
  else if (conflicts.some(c => c.severity === 'MODERATE')) addReason('CONFLICT_MODERATE_SEVERITY', 'At least one MODERATE-severity contradiction is present; confidence is capped at MEDIUM.', 'MEDIUM');
  if (provenance === 'PARTIAL') addReason('PROVENANCE_PARTIAL', 'Evidence, source and rule provenance are only partially populated; confidence is capped at MEDIUM.', 'MEDIUM');
  else if (provenance === 'NOT_PROVIDED') addReason('PROVENANCE_NOT_PROVIDED', 'No traceability arrays were supplied; provenance quality is unknown and is not silently treated as complete.', null);
  const rank: Record<CareerFinalConfidence, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  for (const cap of caps) if (rank[cap] < rank[confidence]) confidence = cap;
  return Object.freeze({ confidence, coverage, reasons: Object.freeze(reasons) });
}

/**
 * Derive Expression Status
 *
 * Now accepts both expressionStrength and expressionDirection to properly handle
 * CONDITIONAL expressions from the C8 layer. When expressionDirection is 'CONDITIONAL',
 * the status should be 'CONDITIONAL' regardless of strength.
 */
function deriveExpressionStatus(
  expressionStrength: CareerExpressionStrength | undefined,
  expressionDirection: CareerExpressionDirection | undefined
): CareerFinalDirection {
  // If direction is explicitly CONDITIONAL, preserve it
  if (expressionDirection === 'CONDITIONAL') return 'CONDITIONAL';
  if (expressionDirection === 'SUPPORTED') return 'SUPPORT';
  if (expressionDirection === 'NEUTRAL') return 'NEUTRAL';
  if (expressionDirection === 'UNAVAILABLE') return 'UNAVAILABLE';

  // Fall back to strength-based derivation for backwards compatibility
  if (!expressionStrength) return 'UNAVAILABLE';
  if (expressionStrength === 'STRONG') return 'SUPPORT';
  if (expressionStrength === 'MODERATE') return 'SUPPORT';
  if (expressionStrength === 'WEAK') return 'CONDITIONAL';
  return 'UNAVAILABLE';
}

/**
 * Build Evidence Trace
 *
 * C11-INV-06: Evidence traceability
 */
function buildEvidenceTrace(
  evidenceIds: readonly string[],
  sourceIds: readonly string[],
  ruleIds: readonly string[]
) {
  return Object.freeze({
    evidenceIds: Object.freeze([...evidenceIds]),
    sourceIds: Object.freeze([...sourceIds]),
    ruleIds: Object.freeze([...ruleIds])
  });
}

/**
 * Build Statement
 */
function buildStatement(
  finalStatus: CareerFinalStatus,
  finalDirection: CareerFinalDirection,
  finalStrength: CareerFinalStrength,
  confidence: CareerFinalConfidence,
  natalDirection: CareerFinalDirection,
  natalStrength: CareerFinalStrength,
  dashaDirection: CareerFinalDirection,
  timingStatus: CareerFinalTimingStatus
): string {
  const parts: string[] = [];

  parts.push(`Career final synthesis evaluates to ${finalStatus} (${finalDirection}, ${finalStrength}) with ${confidence} confidence.`);
  parts.push(`Natal foundation: ${natalDirection} (${natalStrength}).`);

  if (dashaDirection !== 'UNAVAILABLE') {
    parts.push(`Dasha activation: ${dashaDirection}.`);
  }

  if (timingStatus !== 'UNKNOWN') {
    parts.push(`Timing status: ${timingStatus}.`);
  }

  return parts.join(' ');
}

/**
 * C11 Final Synthesis Implementation
 *
 * Canonical Career Final Synthesis (C11) implementation.
 * Consumes C1–C10 layer outputs and produces the authoritative final career assessment.
 *
 * C11 Invariants Enforced:
 * - C11-INV-01: Natal promise is authoritative
 * - C11-INV-02: Dasha hierarchy from canonical C9 CareerDashaActivationHierarchy
 * - C11-INV-03: Transit only affects timingStatus/currentPressure
 * - C11-INV-04: Strong natal support not erased by D10 challenge
 * - C11-INV-05: Missing evidence ≠ negative evidence
 * - C11-INV-06: Evidence traceability (evidenceIds, sourceIds, ruleIds distinct)
 * - C11-INV-07: Dasha challenge modifies timing status, not natal direction
 * - C11-INV-08: Transit cannot rewrite natal promise
 * - C11-INV-09: Dasha hierarchy MD > AD > PD canonical
 * - C11-INV-10: Strong natal support preserved
 * - C11-INV-11: Deterministic output (pure function)
 * - C11-INV-12: Frozen result (Object.freeze)
 *
 * @param input - C11 Final Synthesis Input (C1–C10 layer outputs)
 * @returns Frozen CareerFinalSynthesisResult
 */
export function synthesizeCareerFinal(
  input: CareerFinalSynthesisInput
): CareerFinalSynthesisResult {
  const {
    natalDirection,
    natalStrength,
    expressionStrength,
    expressionDirection,
    dashaHierarchy,
    dashaEffect: inputDashaEffect,
    dashaDirection: inputDashaDirection,
    dashaStrength: inputDashaStrength,
    d10Effect,
    d10Direction,
    d10Strength,
    transitDirection,
    expressions = [],
    conflicts = [],
    evidenceIds = [],
    sourceIds = [],
    ruleIds = []
  } = input;

  // C11-INV-02: Derive Dasha values from canonical hierarchy (MD > AD > PD)
  // When hierarchy is unavailable (e.g., minimal test fixtures), fall back to the
  // top-level dashaEffect/dashaDirection/dashaStrength fields from the canonical analysis.
  const dashaEffect = dashaHierarchy?.overallEffect ?? inputDashaEffect;
  const dashaDirection = dashaHierarchy?.overallDirection ?? inputDashaDirection;
  const dashaStrength: DomainStrength | undefined = dashaHierarchy?.overallStrength ?? inputDashaStrength;

  // DESIGN NOTE: dashaStrength is derived but not currently used in final synthesis
  // The Dasha hierarchy remains authoritative through dashaEffect and dashaDirection.
  // dashaStrength could be used in future semantic refinements for qualification/confidence
  // rather than as another numeric vote in the synthesis. This is an intentional C11 design decision.

  // Map layer directions to C11 vocabulary
  const mappedNatalDirection = mapStructuralDirectionToFinal(natalDirection);
  const mappedNatalStrength = mapStructuralStrengthToFinal(natalStrength);
  const mappedDashaDirection = mapDashaDirectionToFinal(dashaDirection);
  const mappedD10Direction = mapD10DirectionToFinal(d10Direction);
  const mappedExpressionStatus = deriveExpressionStatus(expressionStrength, expressionDirection);

  // Derive final status
  const finalStatus = deriveFinalStatus(
    natalDirection,
    natalStrength,
    mappedDashaDirection,
    mappedD10Direction,
    d10Strength,
    mappedExpressionStatus
  );

  // Derive final direction (C11-INV-01: Natal promise is authoritative)
  const finalDirection = deriveFinalDirection(natalDirection, finalStatus, mappedExpressionStatus);

  // Derive final strength (C11-INV-01: Natal promise is authoritative)
  const finalStrength = deriveFinalStrength(natalStrength, finalStatus, natalDirection);

  // Derive timing status (C11-INV-07: Dasha challenge modifies timing status)
  const timingStatus = deriveTimingStatus(dashaEffect, mappedDashaDirection, transitDirection);

  // Derive current pressure (C11-INV-03: Transit affects currentPressure)
  const currentPressure = deriveCurrentPressure(mappedDashaDirection, mappedD10Direction, transitDirection);

  // Derive confidence (C11-INV-05: Missing evidence ≠ negative evidence)
  const confidenceAssessment = deriveConfidence(input.evidenceQuality, { natal: mappedNatalDirection !== 'UNAVAILABLE' && mappedNatalStrength !== 'UNDETERMINED', dasha: dashaEffect !== undefined && dashaEffect !== 'INSUFFICIENT_DATA' && mappedDashaDirection !== 'UNAVAILABLE', d10: mappedD10Direction !== 'UNAVAILABLE', expression: mappedExpressionStatus !== 'UNAVAILABLE', transit: transitDirection !== undefined && transitDirection !== 'UNAVAILABLE' }, conflicts, evidenceIds, sourceIds, ruleIds);
  const confidence = confidenceAssessment.confidence;

  // Extract strongest and challenged expressions
  const strongestExpressions = Object.freeze(
    expressions
      .filter(e => e.direction === 'SUPPORT' && (e.strength === 'VERY_STRONG' || e.strength === 'STRONG'))
      .map(e => e.mode)
  );

  const challengedExpressions = Object.freeze(
    expressions
      .filter(e => e.direction === 'CHALLENGE')
      .map(e => e.mode)
  );

  // Build evidence trace (C11-INV-06: Evidence traceability)
  const evidenceTrace = buildEvidenceTrace(evidenceIds, sourceIds, ruleIds);

  // Build statement
  const statement = buildStatement(
    finalStatus,
    finalDirection,
    finalStrength,
    confidence,
    mappedNatalDirection,
    mappedNatalStrength,
    mappedDashaDirection,
    timingStatus
  );

  // C11-INV-12: Frozen result
  return Object.freeze({
    reasoningVersion: 'C11' as const,
    domain: 'CAREER' as const,
    finalStatus,
    finalDirection,
    finalStrength,
    confidence,
    confidenceCoverage: confidenceAssessment.coverage,
    confidenceReasons: confidenceAssessment.reasons,
    natalDirection: mappedNatalDirection,
    natalStrength: mappedNatalStrength,
    expressionStatus: mappedExpressionStatus,
    d10Direction: mappedD10Direction,
    d10Effect: d10Effect ?? 'UNKNOWN',
    dashaEffect: dashaEffect ?? 'INSUFFICIENT_DATA',
    dashaDirection: mappedDashaDirection,
    timingStatus,
    transitDirection: transitDirection ?? 'UNAVAILABLE',
    currentPressure,
    expressions: Object.freeze([...expressions]),
    strongestExpressions,
    challengedExpressions,
    conflicts: Object.freeze([...conflicts]),
    evidenceIds: Object.freeze([...evidenceIds]),
    sourceIds: Object.freeze([...sourceIds]),
    ruleIds: Object.freeze([...ruleIds]),
    evidenceTrace,
    statement,
    contradictoryDashaEvidence: [] // Filled in by integration adapter from mapper diagnostics
  });
}
