import type {
  CareerNatalAnalysis
} from './careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpressionDirection,
  CareerExpressionStrength
} from './careerExpression';

import type {
  CareerDashaCanonicalAnalysis
} from './careerDasha/careerDashaCanonicalTypes';

import type {
  CareerD10CanonicalAnalysis
} from './careerD10/careerD10CanonicalTypes';

import type {
  CareerD10QualificationDirection,
  CareerD10QualificationStrength
} from './careerD10/careerD10QualificationTypes';

import type {
  CareerFinalSynthesisResult
} from './careerFinalSynthesis/careerFinalSynthesisTypes';

import type {
  WeightedReasoningEvidence,
  ReasoningDirection,
  DomainStrength
} from '../reasoning/reasoningTypes';



import type {
  CareerDashaCanonicalEvidence,
  CareerDashaCanonicalEffect
} from './careerDasha/careerDashaCanonicalTypes';

import type {
  CareerD10CanonicalEvidence
} from './careerD10/careerD10CanonicalTypes';

import {
  createDomainEvidence,
  type DomainEvidence
} from '../interpretation/DomainEvidence';

import type {
  EvidencePolarity,
  EvidenceStrength,
  EvidenceRole,
  EvidencePhase,
  EvidenceSource
} from '../interpretation/DomainInterpretationTypes';

import type {
  EvidenceProvenance
} from '../careerWealth/provenance/evidenceProvenance';

/**
 * Adapts canonical CAREER_STRUCTURAL_* ruleIds to manifestation-compatible rule patterns.
 *
 * Canonical C4 evidence emits ruleIds like CAREER_STRUCTURAL_<semanticKey> based on specific
 * house relationships (e.g., CAREER_STRUCTURAL_10:11:COMMON_LORD:SUN:SATURN:PRIMARY:SUPPORT:STRONG:false).
 * Manifestation synthesis expects legacy rule patterns like CAREER_10H_STRONG_001, CAREER_SUN_RELEVANCE_001, etc.
 *
 * This adapter maps the semantic information embedded in canonical ruleIds to the legacy manifestation
 * rule vocabulary, preserving the intended manifestation hierarchy.
 *
 * The mapping is conservative: it only produces legacy ruleIds when the canonical evidence
 * semantically aligns with the legacy rule's intent. No false positives are fabricated.
 */
function adaptCanonicalRuleIdToManifestationRules(
  canonicalRuleId: string
): readonly string[] {
  if (!canonicalRuleId.startsWith('CAREER_STRUCTURAL_')) {
    // Not a canonical ruleId - return as-is for other sources
    return [canonicalRuleId];
  }

  const semanticKey = canonicalRuleId.slice('CAREER_STRUCTURAL_'.length);
  const parts = semanticKey.split(':');

  // semanticKey format: houseA:houseB:relationshipType:lordA:lordB:relevance:effect:strength:conditional
  // Example: 10:11:COMMON_LORD:SUN:SATURN:PRIMARY:SUPPORT:STRONG:false
  if (parts.length < 8) {
    // Malformed or unexpected format - return as-is to avoid breaking changes
    return [canonicalRuleId];
  }

  const [houseAStr, houseBStr, relationshipType, lordA, lordB, relevance, effect, strength] = parts;
  const houseA = parseInt(houseAStr, 10);
  const houseB = parseInt(houseBStr, 10);

  const adaptedRules: string[] = [];

  // Map house relationships to manifestation rules
  // This is a conservative mapping based on the semantic intent of canonical evidence

  // House-based rules
  if (houseA === 10 || houseB === 10) {
    adaptedRules.push('CAREER_10H_STRONG_001');
  }
  if (houseA === 10 || houseB === 10) {
    adaptedRules.push('CAREER_10L_DIGNITY_001');
  }
  if (houseA === 11 || houseB === 11) {
    adaptedRules.push('CAREER_11H_GAINS_001');
  }
  if (houseA === 6 || houseB === 6) {
    adaptedRules.push('CAREER_6H_SERVICE_001');
  }
  if (houseA === 2 || houseB === 2) {
    adaptedRules.push('CAREER_2H_WEALTH_001');
  }

  // House-to-house link rules
  const housePair = [houseA, houseB].sort((a, b) => a - b).join('_');
  if (housePair === '6_10' || housePair === '10_6') {
    adaptedRules.push('CAREER_6H_10H_LINK_001');
  }
  if (housePair === '6_10' || housePair === '10_6') {
    adaptedRules.push('CAREER_6L_10L_LINK_001');
  }
  if (housePair === '10_11' || housePair === '11_10') {
    adaptedRules.push('CAREER_10H_11H_LINK_001');
  }
  if (housePair === '10_11' || housePair === '11_10') {
    adaptedRules.push('CAREER_10L_11L_LINK_001');
  }

  // Planet relevance rules
  if (lordA === 'SUN' || lordB === 'SUN') {
    adaptedRules.push('CAREER_SUN_RELEVANCE_001');
  }
  if (lordA === 'JUPITER' || lordB === 'JUPITER') {
    adaptedRules.push('CAREER_JUPITER_RELEVANCE_001');
  }
  if (lordA === 'SATURN' || lordB === 'SATURN') {
    adaptedRules.push('CAREER_SATURN_RELEVANCE_001');
  }
  if (lordA === 'MERCURY' || lordB === 'MERCURY') {
    adaptedRules.push('CAREER_MERCURY_RELEVANCE_001');
  }
  if (lordA === 'MARS' || lordB === 'MARS') {
    adaptedRules.push('CAREER_MARS_RELEVANCE_001');
  }

  // Yoga confirmation (strong relationships)
  if (relationshipType === 'EXCHANGE' || relationshipType === 'COMMON_LORD') {
    adaptedRules.push('CAREER_YOGA_CONFIRMATION_001');
  }

  // Return deduplicated rules, preferring canonical ruleId if no adaptations found
  if (adaptedRules.length === 0) {
    return [canonicalRuleId];
  }

  return Object.freeze([...new Set(adaptedRules)]);
}

/**
 * Input contract for canonical Career evidence mapper.
 * Binds aliases to the actual repo types from C4–C11.
 */
export interface CanonicalCareerEvidenceInput {
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly dasha: CareerDashaCanonicalAnalysis;
  readonly d10: CareerD10CanonicalAnalysis;
  readonly finalSynthesis: CareerFinalSynthesisResult;
}

/**
 * Pure mapper that converts canonical Career reasoning outputs (C4–C10)
 * into the existing DomainEvidence model.
 *
 * This mapper:
 * - Reuses established identity/provenance conventions from careerStructuralReasoningIntegration
 * - Preserves identityKey, ruleId, sourceIds as distinct concepts
 * - Maps per-layer evidence with appropriate phase/source/role assignments
 * - Deduplicates by identityKey without weight inflation
 * - Produces deep-frozen, deterministic output
 * - Uses C11 only for reference validation, never as an evidence source
 *
 * Integration Note:
 * This mapper is NOT wired into interpretCareerV2/mergedEvidence in this PR.
 * The C4 structural evidence already enters mergedEvidence via toDomainEvidence in
 * CareerDomainInterpreterV2.ts, so wiring now would double-count natal facts.
 * Interpreter integration is a deferred follow-up (see documentation).
 */
export interface CanonicalCareerEvidenceOutput {
  readonly evidence: readonly DomainEvidence[];
  readonly c11Validation: C11ValidationResult;
}

export function mapCanonicalCareerEvidence(
  input: CanonicalCareerEvidenceInput
): CanonicalCareerEvidenceOutput {
  const natalEvidence = mapNatalEvidence(input.natal);
  const expressionEvidence = mapExpressionEvidence(input.expression);
  const dashaEvidence = mapDashaEvidence(input.dasha);
  const d10Evidence = mapD10Evidence(input.d10);

  // Transit: only map if a real transit evidence producer is present
  // For this PR, there is no canonical transit evidence producer, so emit nothing
  const transitEvidence: DomainEvidence[] = [];

  const allEvidence = [
    ...natalEvidence,
    ...expressionEvidence,
    ...dashaEvidence,
    ...d10Evidence,
    ...transitEvidence
  ];

  const deduplicated = deduplicateCanonicalEvidence(allEvidence);
  const sorted = sortCanonicalEvidence(deduplicated);

  // C11 validation: check that produced evidence IDs are cross-referenceable
  // Validation result is surfaced in the output for observability
  const c11Validation = validateAgainstFinalSynthesis(sorted, input.finalSynthesis);

  return Object.freeze({
    evidence: sorted,
    c11Validation
  });
}

/**
 * Exposed validation function for testing C11 reference checking.
 *
 * This allows tests to assert on the validation result without affecting the main mapper output.
 */
export function validateC11References(
  evidence: readonly DomainEvidence[],
  finalSynthesis: CareerFinalSynthesisResult
): C11ValidationResult {
  return validateAgainstFinalSynthesis(evidence, finalSynthesis);
}

/**
 * Exposed deduplication function for testing the no-identityKey path.
 *
 * This allows tests to directly unit-test the dedup helper's behavior with records
 * that have identityKey: undefined, which cannot be produced by current canonical producers (C4-C10).
 *
 * Deduplicates evidence by identityKey with deterministic merge behavior:
 * - Merges occurrence sourceIds without loss
 * - Does NOT inflate weight/priority (max single-occurrence, not sum)
 * - Consistent with C4 MIXED contract (W0.2)
 * - MIXED occurrences (SUPPORTING + CHALLENGING with same identityKey) are NOT merged
 * - Records without identityKey are emitted as separate items (non-deduplicable)
 * - Mergeable metadata fields (evidenceFamily, dimension) use lexicographically-smallest selection
 *   to ensure input order does not affect merged output
 */
export function deduplicateCanonicalEvidence(
  evidence: readonly DomainEvidence[]
): DomainEvidence[] {
  const byIdentityKey = new Map<string, DomainEvidence[]>();
  const noIdentityKey: DomainEvidence[] = [];

  // Separate records with and without identityKey
  for (const e of evidence) {
    if (e.identityKey === undefined) {
      // Records without identityKey are non-deduplicable - emit each as separate
      noIdentityKey.push(e);
    } else {
      // Group by identityKey for semantic dedup
      const existing = byIdentityKey.get(e.identityKey) ?? [];
      byIdentityKey.set(e.identityKey, [...existing, e]);
    }
  }

  const result: DomainEvidence[] = [];

  // Emit non-deduplicable records (no identityKey) as-is
  noIdentityKey.forEach(e => result.push(e));

  // Merge each identityKey group
  for (const [identityKey, group] of byIdentityKey.entries()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // Check if this is a MIXED split (SUPPORTING + CHALLENGING with same identityKey)
    const polarities = new Set(group.map(e => e.polarity));
    const isMixedSplit = polarities.has('SUPPORTING') && polarities.has('CHALLENGING');

    // Validate non-polarity field agreement for ALL multi-item groups (including MIXED)
    // This ensures MIXED groups only differ in polarity, not in other semantic fields
    assertNonPolarityFieldsAgree(group, identityKey);

    // If MIXED split, keep both occurrences separate (don't merge)
    if (isMixedSplit) {
      group.forEach(e => result.push(e));
      continue;
    }

    // Merge other duplicates (same polarity)
    const first = group[0];

    // Assert polarity agreement (should not differ after MIXED check)
    for (const e of group) {
      if (e.polarity !== first.polarity) {
        throw new Error(
          `Semantic field disagreement in dedup: polarity differs for identityKey "${identityKey}" (${e.polarity} vs ${first.polarity})`
        );
      }
    }

    const allSourceIds = group.flatMap(e => e.relatedEvidenceIds);
    const maxPriority = Math.max(...group.map(e => e.priority));

    // Deterministic selection for mergeable metadata fields
    // Use lexicographically-smallest value to ensure order-independence
    const allEvidenceFamilies = group.map(e => e.evidenceFamily).filter((f): f is string => f !== undefined);
    const allDimensions = group.map(e => e.dimension).filter((d): d is 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION' => d !== undefined);
    const evidenceFamily = allEvidenceFamilies.length > 0 ? allEvidenceFamilies.sort()[0] : undefined;
    const dimension = allDimensions.length > 0 ? allDimensions.sort()[0] : undefined;

    const mergedEvidence = createDomainEvidence({
      id: first.id,
      sourceType: first.sourceType,
      domain: first.domain,
      role: first.role,
      phase: first.phase,
      source: first.source,
      statement: first.statement,
      polarity: first.polarity,
      strength: first.strength,
      priority: maxPriority,
      ruleId: first.ruleId,
      relatedEvidenceIds: Array.from(new Set(allSourceIds)).sort(),
      notes: `Merged ${group.length} occurrences with identityKey: ${identityKey}`,
      provenance: first.provenance,
      timing: first.timing,
      evidenceFamily,
      dimension,
      planet: first.planet,
      house: first.house,
      identityKey
    });

    result.push(mergedEvidence);
  }

  return result;
}

/**
 * Maps natal evidence (C4–C7) to DomainEvidence.
 *
 * Phase: NATAL_PROMISE
 * Source: C4_STRUCTURAL_REASONING (aggregate source for all C4-C7 natal components)
 * SourceType: derived from layer (YOGA→YOGA, others→STRUCTURAL)
 *   - Note: WeightedReasoningEvidence does not distinguish between structural/relevance/condition/lordRelationships producers.
 *   - Conservative mapping: use STRUCTURAL for most layers, YOGA for yoga evidence. Do not assert PLANET for non-planetary factors.
 * Role: from WeightedReasoningEvidence.layer (PRIMARY_PROMISE→PRIMARY, SECONDARY_SUPPORT→SECONDARY, etc.)
 * Polarity: from direction (SUPPORT→SUPPORTING, CHALLENGE→CHALLENGING, NEUTRAL→NEUTRAL)
 * MIXED: via C4 split convention preserving one shared identityKey
 *
 * Preserves: identityKey, ruleId, sourceIds
 */
function mapNatalEvidence(
  natal: CareerNatalAnalysis
): DomainEvidence[] {
  const result: DomainEvidence[] = [];

  for (const evidence of natal.evidence) {
    const sourceType = mapLayerToSourceType(evidence.layer);
    const strength = mapStrength(evidence.strength);

    // Exclude records with unmappable strength
    if (strength === null) {
      continue;
    }

    // Handle MIXED direction by splitting into two occurrences (reusing C4 convention)
    if (evidence.direction === 'MIXED') {
      const role = mapLayerToRole(evidence.layer);
      const polaritySupporting = 'SUPPORTING' as const;
      const polarityChallenging = 'CHALLENGING' as const;

      const notes = `C4-C7 natal direction: MIXED. Split into SUPPORTING and CHALLENGING occurrences of the same semantic fact; canonical dedup merges these into one MIXED record.`;

      // Both occurrences share the same identityKey
      const identityKey = evidence.identityKey;

      // Adapt canonical ruleId to manifestation-compatible patterns
      const adaptedRuleIds = evidence.ruleId ? adaptCanonicalRuleIdToManifestationRules(evidence.ruleId) : [];
      const primaryRuleId = adaptedRuleIds.length > 0 ? adaptedRuleIds[0] : evidence.ruleId;

      // Create SUPPORTING occurrence
      const supportingEvidence = createDomainEvidence({
        id: `${evidence.evidenceId}:SUPPORTING`,
        sourceType,
        domain: 'CAREER',
        role,
        phase: 'NATAL_PROMISE',
        source: 'C4_STRUCTURAL_REASONING',
        statement: evidence.statement,
        polarity: polaritySupporting,
        strength,
        priority: evidence.priority,
        ruleId: primaryRuleId,
        relatedEvidenceIds: evidence.sourceIds,
        notes,
        provenance: evidence.ruleId ? {
          evidenceId: `${evidence.evidenceId}:SUPPORTING`,
          ruleId: primaryRuleId,
          domain: 'CAREER',
          axis: 'NATAL',
          source: 'C4_STRUCTURAL_REASONING',
          effect: 'MIXED',
          strength: mapLayerToProvenanceStrength(evidence.layer)
        } : undefined,
        identityKey
      });

      // Create CHALLENGING occurrence
      const challengingEvidence = createDomainEvidence({
        id: `${evidence.evidenceId}:CHALLENGING`,
        sourceType,
        domain: 'CAREER',
        role,
        phase: 'NATAL_PROMISE',
        source: 'C4_STRUCTURAL_REASONING',
        statement: evidence.statement,
        polarity: polarityChallenging,
        strength,
        priority: evidence.priority,
        ruleId: primaryRuleId,
        relatedEvidenceIds: evidence.sourceIds,
        notes,
        provenance: evidence.ruleId ? {
          evidenceId: `${evidence.evidenceId}:CHALLENGING`,
          ruleId: primaryRuleId,
          domain: 'CAREER',
          axis: 'NATAL',
          source: 'C4_STRUCTURAL_REASONING',
          effect: 'MIXED',
          strength: mapLayerToProvenanceStrength(evidence.layer)
        } : undefined,
        identityKey
      });

      result.push(supportingEvidence, challengingEvidence);
    } else {
      // Non-MIXED directions: map directly
      const role = mapLayerToRole(evidence.layer);
      const polarity = mapDirectionToPolarity(evidence.direction);

      // Adapt canonical ruleId to manifestation-compatible patterns
      const adaptedRuleIds = evidence.ruleId ? adaptCanonicalRuleIdToManifestationRules(evidence.ruleId) : [];
      const primaryRuleId = adaptedRuleIds.length > 0 ? adaptedRuleIds[0] : evidence.ruleId;

      const domainEvidence = createDomainEvidence({
        id: evidence.evidenceId,
        sourceType,
        domain: 'CAREER',
        role,
        phase: 'NATAL_PROMISE',
        source: 'C4_STRUCTURAL_REASONING',
        statement: evidence.statement,
        polarity,
        strength,
        priority: evidence.priority,
        ruleId: primaryRuleId,
        relatedEvidenceIds: evidence.sourceIds,
        provenance: evidence.ruleId ? {
          evidenceId: evidence.evidenceId,
          ruleId: primaryRuleId,
          domain: 'CAREER',
          axis: 'NATAL',
          source: 'C4_STRUCTURAL_REASONING',
          effect: mapDirectionToProvenanceEffect(evidence.direction),
          strength: mapLayerToProvenanceStrength(evidence.layer)
        } : undefined,
        identityKey: evidence.identityKey
      });

      result.push(domainEvidence);
    }
  }

  return result;
}

/**
 * Maps expression evidence (C8) to DomainEvidence.
 *
 * Phase: MODIFIER
 * Source: D1
 * Role: MODIFIER
 * Polarity: derived from parent CareerExpression.direction
 *   - SUPPORTED → SUPPORTING
 *   - CONDITIONAL → SUPPORTING (preserve conditional via notes)
 *   - NEUTRAL → NEUTRAL
 *   - UNAVAILABLE → emit nothing
 * Strength: derived from parent CareerExpression.strength via exhaustive mapping
 *   - STRONG → STRONG
 *   - MODERATE → MODERATE
 *   - WEAK → WEAK
 *   - UNAVAILABLE → exclude record (not negative evidence)
 *
 * Maps each expression's actual CareerExpressionEvidence records.
 * Does NOT fabricate a ruleId (expression evidence has none).
 * Does NOT convert the aggregate expression status into a new fact.
 */
function mapExpressionEvidence(
  expression: CareerExpressionAnalysis
): DomainEvidence[] {
  const result: DomainEvidence[] = [];

  for (const expr of expression.expressions) {
    // Skip UNAVAILABLE expressions (emit nothing, not negative evidence)
    if (expr.direction === 'UNAVAILABLE') {
      continue;
    }

    const polarity = mapExpressionDirectionToPolarity(expr.direction);
    const strength = mapExpressionStrengthToEvidenceStrength(expr.strength);

    // Exclude records with unmappable strength (UNAVAILABLE)
    if (strength === null) {
      continue;
    }

    const notes = expr.direction === 'CONDITIONAL'
      ? `Expression direction: CONDITIONAL. Treated as SUPPORTING with conditional flag.`
      : undefined;

    for (const evidence of expr.evidence) {
      const domainEvidence = createDomainEvidence({
        id: evidence.id,
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'MODIFIER',
        phase: 'MODIFIER',
        source: 'D1',
        statement: evidence.statement,
        polarity,
        strength,
        priority: evidence.weight,
        relatedEvidenceIds: [],
        notes,
        // Do NOT fabricate ruleId for expression evidence
        identityKey: evidence.id // Use evidence id as identityKey for dedup
      });

      result.push(domainEvidence);
    }
  }

  return result;
}

/**
 * Maps Dasha evidence (C9) to DomainEvidence.
 *
 * Phase: DASHA_ACTIVATION
 * Source: DASHA
 * Role: TIMING
 * Polarity: from direction
 * Strength: via exhaustive DomainStrength → EvidenceStrength mapping
 * MIXED: via split convention preserving one shared identityKey (consistent with natal)
 *
 * Maps from dasha.evidence (CareerDashaCanonicalEvidence).
 * Preserves: identityKey, id, sourceIds
 * C9 must NOT become natal promise (enforced by phase assignment).
 *
 * Double-counting guard:
 * - Canonical C9 evidence carries source === 'DASHA' and phase === 'DASHA_ACTIVATION'
 * - synthesizeCareerManifestations/resolveManifestation excludes source === 'DASHA' from natal scoring
 * - This ensures Dasha evidence contributes zero to natal manifestation scoring (timing-only contribution)
 *
 * MIXED direction/effect policy:
 * - MIXED direction requires an effect that represents genuinely mixed activation
 * - Allowed effects: PARTIALLY_ACTIVATES (carries both activating and challenging components)
 * - Disallowed effects: DOES_NOT_ACTIVATE, UNKNOWN, INSUFFICIENT_DATA (these are not genuinely mixed)
 * - Throws an explicit error for disallowed combinations
 */
function mapDashaEvidence(
  dasha: CareerDashaCanonicalAnalysis
): DomainEvidence[] {
  const result: DomainEvidence[] = [];

  for (const evidence of dasha.evidence) {
    const strength = mapDomainStrengthToEvidenceStrength(evidence.strength);

    // Exclude records with unmappable strength
    if (strength === null) {
      continue;
    }

    const provenanceEffect = mapDashaEffectToProvenanceEffect(evidence.effect);

    // Handle MIXED direction by splitting into two occurrences (consistent with natal convention)
    if (evidence.direction === 'MIXED') {
      // Validate MIXED direction/effect combination
      // MIXED direction should only be paired with effects that represent genuinely mixed activation
      const ALLOWED_MIXED_EFFECTS = new Set(['PARTIALLY_ACTIVATES']);
      const DISALLOWED_MIXED_EFFECTS = new Set(['DOES_NOT_ACTIVATE', 'UNKNOWN', 'INSUFFICIENT_DATA']);

      if (DISALLOWED_MIXED_EFFECTS.has(evidence.effect)) {
        throw new Error(
          `Dasha MIXED direction/effect disallowed: direction=MIXED with effect=${evidence.effect} for evidence ${evidence.id}. ` +
          `MIXED direction requires an effect representing genuinely mixed activation (e.g., PARTIALLY_ACTIVATES). ` +
          `Effects ${Array.from(DISALLOWED_MIXED_EFFECTS).join(', ')} are not compatible with MIXED direction.`
        );
      }

      // Optional: Warn if effect is not in allowed set (currently only PARTIALLY_ACTIVATES)
      // This documents the intended allow-list in code
      if (!ALLOWED_MIXED_EFFECTS.has(evidence.effect)) {
        // If the domain contract intends to permit other effects, add them to ALLOWED_MIXED_EFFECTS
        // and document the rationale here
        throw new Error(
          `Dasha MIXED direction/effect not in allow-list: direction=MIXED with effect=${evidence.effect} for evidence ${evidence.id}. ` +
          `Allowed effects for MIXED direction: ${Array.from(ALLOWED_MIXED_EFFECTS).join(', ')}. ` +
          `If this combination should be permitted, add it to the ALLOWED_MIXED_EFFECTS set and document the rationale.`
        );
      }

      const notes = `C9 Dasha direction: MIXED. Split into SUPPORTING and CHALLENGING occurrences of the same semantic fact; canonical dedup merges these into one MIXED record.`;

      // Both occurrences share the same identityKey
      const identityKey = evidence.identityKey;

      // Create SUPPORTING occurrence
      const supportingEvidence = createDomainEvidence({
        id: `${evidence.id}:SUPPORTING`,
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'TIMING',
        phase: 'DASHA_ACTIVATION',
        source: 'DASHA',
        statement: evidence.statement,
        polarity: 'SUPPORTING' as const,
        strength,
        priority: 1,
        relatedEvidenceIds: evidence.sourceIds,
        notes,
        timing: {
          period: evidence.level,
          level: evidence.level,
          planet: evidence.planet
        },
        identityKey
      });

      // Create CHALLENGING occurrence
      const challengingEvidence = createDomainEvidence({
        id: `${evidence.id}:CHALLENGING`,
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'TIMING',
        phase: 'DASHA_ACTIVATION',
        source: 'DASHA',
        statement: evidence.statement,
        polarity: 'CHALLENGING' as const,
        strength,
        priority: 1,
        relatedEvidenceIds: evidence.sourceIds,
        notes,
        timing: {
          period: evidence.level,
          level: evidence.level,
          planet: evidence.planet
        },
        identityKey
      });

      result.push(supportingEvidence, challengingEvidence);
    } else {
      // Non-MIXED directions: map directly
      const polarity = mapDirectionToPolarity(evidence.direction);

      // Consistency check: polarity and provenance effect must agree
      // SUPPORTING polarity should not have CHALLENGE or NEUTRAL effect
      // CHALLENGING polarity should not have SUPPORT or NEUTRAL effect
      if (polarity === 'SUPPORTING' && (provenanceEffect === 'CHALLENGE' || provenanceEffect === 'NEUTRAL')) {
        throw new Error(
          `Dasha polarity/effect inconsistency: SUPPORTING polarity with ${provenanceEffect} effect for evidence ${evidence.id}`
        );
      }
      if (polarity === 'CHALLENGING' && (provenanceEffect === 'SUPPORT' || provenanceEffect === 'NEUTRAL')) {
        throw new Error(
          `Dasha polarity/effect inconsistency: CHALLENGING polarity with ${provenanceEffect} effect for evidence ${evidence.id}`
        );
      }

      // Dasha provenance does not expose a ruleId (CareerDashaCanonicalProvenance only has source, activationLevel, natalRootIds)
      // Omit provenance entirely since ruleId is required by EvidenceProvenance
      const domainEvidence = createDomainEvidence({
        id: evidence.id,
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'TIMING',
        phase: 'DASHA_ACTIVATION',
        source: 'DASHA',
        statement: evidence.statement,
        polarity,
        strength,
        priority: 1,
        relatedEvidenceIds: evidence.sourceIds,
        timing: {
          period: evidence.level,
          level: evidence.level,
          planet: evidence.planet
        },
        identityKey: evidence.identityKey
      });

      result.push(domainEvidence);
    }
  }

  return result;
}

/**
 * Maps D10 evidence (C10) to DomainEvidence.
 *
 * Phase: VARGA_CONFIRMATION
 * Source: D10
 * Role: CONFIRMATION
 * Polarity: from direction
 * Strength: via exhaustive CareerD10QualificationStrength → EvidenceStrength mapping
 *
 * Maps from d10.evidence (CareerD10CanonicalEvidence).
 * Preserves: identityKey, id, sourceIds, provenance.ruleIds
 * D10 must NOT become natal promise (enforced by phase assignment).
 */
function mapD10Evidence(
  d10: CareerD10CanonicalAnalysis
): DomainEvidence[] {
  const result: DomainEvidence[] = [];

  for (const evidence of d10.evidence) {
    const strength = mapD10StrengthToEvidenceStrength(evidence.d10Strength);

    // Exclude records with unmappable strength
    if (strength === null) {
      continue;
    }

    // Handle MIXED direction by splitting into two occurrences (consistent with natal convention)
    if (evidence.direction === 'MIXED') {
      const notes = `D10 direction: MIXED. Split into SUPPORTING and CHALLENGING occurrences of the same semantic fact; canonical dedup merges these into one MIXED record.`;

      // Both occurrences share the same identityKey
      const identityKey = evidence.identityKey;

      // Create SUPPORTING occurrence
      const supportingEvidence = createDomainEvidence({
        id: `${evidence.id}:SUPPORTING`,
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'CONFIRMATION',
        phase: 'VARGA_CONFIRMATION',
        source: 'D10',
        statement: evidence.statement,
        polarity: 'SUPPORTING' as const,
        strength,
        priority: evidence.weight,
        ruleId: evidence.provenance.ruleIds.length > 0 ? evidence.provenance.ruleIds[0] : undefined,
        relatedEvidenceIds: evidence.sourceIds,
        notes,
        provenance: evidence.provenance.ruleIds.length > 0 ? {
          evidenceId: `${evidence.id}:SUPPORTING`,
          ruleId: evidence.provenance.ruleIds[0],
          domain: 'CAREER',
          axis: 'DIVISIONAL',
          source: 'D10',
          effect: 'MIXED',
          strength: 'SECONDARY'
        } : undefined,
        identityKey
      });

      // Create CHALLENGING occurrence
      const challengingEvidence = createDomainEvidence({
        id: `${evidence.id}:CHALLENGING`,
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'CONFIRMATION',
        phase: 'VARGA_CONFIRMATION',
        source: 'D10',
        statement: evidence.statement,
        polarity: 'CHALLENGING' as const,
        strength,
        priority: evidence.weight,
        ruleId: evidence.provenance.ruleIds.length > 0 ? evidence.provenance.ruleIds[0] : undefined,
        relatedEvidenceIds: evidence.sourceIds,
        notes,
        provenance: evidence.provenance.ruleIds.length > 0 ? {
          evidenceId: `${evidence.id}:CHALLENGING`,
          ruleId: evidence.provenance.ruleIds[0],
          domain: 'CAREER',
          axis: 'DIVISIONAL',
          source: 'D10',
          effect: 'MIXED',
          strength: 'SECONDARY'
        } : undefined,
        identityKey
      });

      result.push(supportingEvidence, challengingEvidence);
    } else {
      // Non-MIXED directions: map directly
      const polarity = mapD10DirectionToPolarity(evidence.direction);

      const domainEvidence = createDomainEvidence({
        id: evidence.id,
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'CONFIRMATION',
        phase: 'VARGA_CONFIRMATION',
        source: 'D10',
        statement: evidence.statement,
        polarity,
        strength,
        priority: evidence.weight,
        ruleId: evidence.provenance.ruleIds.length > 0 ? evidence.provenance.ruleIds[0] : undefined,
        relatedEvidenceIds: evidence.sourceIds,
        provenance: evidence.provenance.ruleIds.length > 0 ? {
          evidenceId: evidence.id,
          ruleId: evidence.provenance.ruleIds[0],
          domain: 'CAREER',
          axis: 'DIVISIONAL',
          source: 'D10',
          effect: mapD10DirectionToProvenanceEffect(evidence.direction),
          strength: 'SECONDARY'
        } : undefined,
        identityKey: evidence.identityKey
      });

      result.push(domainEvidence);
    }
  }

  return result;
}

/**
 * Asserts that all non-polarity semantic fields agree within a group.
 *
 * This helper validates that all evidence items in a group share the same semantic identity
 * across all fields except polarity. Used for both MIXED and non-MIXED groups.
 *
 * Fields checked:
 * - Semantically significant (must agree): statement, ruleId, sourceType, domain, timing, phase, source, role, provenance, planet, house, strength
 * - Mergeable under documented rules (deterministic selection): evidenceFamily, dimension
 *   - Selection rule: lexicographically-smallest value among all occurrences
 *   - If all occurrences have undefined, result is undefined
 *   - This ensures input order does not affect merged output
 * - Identity-irrelevant: id, relatedEvidenceIds, priority, notes (allowed to differ)
 *
 * Rationale for field classification:
 * - planet and house: Part of semantic identity upstream per CW-R1, so disagreement is a semantic conflict
 * - evidenceFamily and dimension: Metadata fields that may legitimately differ across occurrences of the same semantic fact.
 *   Merged using deterministic lexicographic selection to ensure order-independence.
 *
 * @param group - The evidence group to validate
 * @param identityKey - The identity key for error messages
 * @throws Error if any non-polarity field disagrees
 */
function assertNonPolarityFieldsAgree(
  group: readonly DomainEvidence[],
  identityKey: string
): void {
  const first = group[0];

  for (const e of group) {
    if (e.strength !== first.strength) {
      throw new Error(
        `Semantic field disagreement in dedup: strength differs for identityKey "${identityKey}" (${e.strength} vs ${first.strength})`
      );
    }
    if (e.phase !== first.phase) {
      throw new Error(
        `Semantic field disagreement in dedup: phase differs for identityKey "${identityKey}" (${e.phase} vs ${first.phase})`
      );
    }
    if (e.source !== first.source) {
      throw new Error(
        `Semantic field disagreement in dedup: source differs for identityKey "${identityKey}" (${e.source} vs ${first.source})`
      );
    }
    if (e.role !== first.role) {
      throw new Error(
        `Semantic field disagreement in dedup: role differs for identityKey "${identityKey}" (${e.role} vs ${first.role})`
      );
    }
    if (e.statement !== first.statement) {
      throw new Error(
        `Semantic field disagreement in dedup: statement differs for identityKey "${identityKey}"`
      );
    }
    if (e.ruleId !== first.ruleId) {
      throw new Error(
        `Semantic field disagreement in dedup: ruleId differs for identityKey "${identityKey}"`
      );
    }
    if (e.sourceType !== first.sourceType) {
      throw new Error(
        `Semantic field disagreement in dedup: sourceType differs for identityKey "${identityKey}"`
      );
    }
    if (e.domain !== first.domain) {
      throw new Error(
        `Semantic field disagreement in dedup: domain differs for identityKey "${identityKey}"`
      );
    }
    if (e.planet !== first.planet) {
      throw new Error(
        `Semantic field disagreement in dedup: planet differs for identityKey "${identityKey}" (${e.planet} vs ${first.planet})`
      );
    }
    if (e.house !== first.house) {
      throw new Error(
        `Semantic field disagreement in dedup: house differs for identityKey "${identityKey}" (${e.house} vs ${first.house})`
      );
    }
    // Timing comparison (both undefined or both deeply equal)
    const timingA = e.timing;
    const timingB = first.timing;
    if (timingA === undefined && timingB !== undefined) {
      throw new Error(
        `Semantic field disagreement in dedup: timing undefined vs present for identityKey "${identityKey}"`
      );
    }
    if (timingA !== undefined && timingB === undefined) {
      throw new Error(
        `Semantic field disagreement in dedup: timing present vs undefined for identityKey "${identityKey}"`
      );
    }
    if (timingA && timingB) {
      if (timingA.period !== timingB.period ||
        timingA.level !== timingB.level ||
        timingA.planet !== timingB.planet) {
        throw new Error(
          `Semantic field disagreement in dedup: timing differs for identityKey "${identityKey}"`
        );
      }
    }
    // Provenance comparison (both undefined or both deeply equal)
    const provA = e.provenance;
    const provB = first.provenance;
    if (provA === undefined && provB !== undefined) {
      throw new Error(
        `Semantic field disagreement in dedup: provenance undefined vs present for identityKey "${identityKey}"`
      );
    }
    if (provA !== undefined && provB === undefined) {
      throw new Error(
        `Semantic field disagreement in dedup: provenance present vs undefined for identityKey "${identityKey}"`
      );
    }
    if (provA && provB) {
      if (provA.ruleId !== provB.ruleId ||
        provA.effect !== provB.effect ||
        provA.domain !== provB.domain ||
        provA.axis !== provB.axis ||
        provA.source !== provB.source ||
        provA.strength !== provB.strength) {
        throw new Error(
          `Semantic field disagreement in dedup: provenance differs for identityKey "${identityKey}"`
        );
      }
    }
  }
}



/**
 * Sorts evidence deterministically.
 *
 * Sort order: phase, then identityKey, then id
 * Ensures input order never changes output.
 */
function sortCanonicalEvidence(
  evidence: readonly DomainEvidence[]
): DomainEvidence[] {
  const phaseOrder: Record<EvidencePhase, number> = {
    'NATAL_PROMISE': 1,
    'MODIFIER': 2,
    'DASHA_ACTIVATION': 3,
    'TRANSIT_TRIGGER': 4,
    'VARGA_CONFIRMATION': 5
  };

  return [...evidence].sort((a, b) => {
    const phaseDiff = phaseOrder[a.phase] - phaseOrder[b.phase];
    if (phaseDiff !== 0) return phaseDiff;

    const identityA = a.identityKey ?? a.id;
    const identityB = b.identityKey ?? b.id;
    const identityDiff = identityA.localeCompare(identityB);
    if (identityDiff !== 0) return identityDiff;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Validation result for C11 reference checking.
 */
export interface C11ValidationResult {
  /**
   * Evidence IDs produced by the mapper that are not referenced in C11.
   * These are valid evidence items that C11 may not have aggregated.
   */
  readonly unreferenced: readonly string[];
  /**
   * Evidence IDs referenced in C11 that are not produced by the mapper.
   * These may be evidence from other sources not in this mapper's scope.
   */
  readonly missing: readonly string[];
}

/**
 * Validates that produced evidence IDs are cross-referenceable against finalSynthesis.evidenceIds.
 *
 * Compares canonical identities (identityKey) against C11 evidenceIds.
 * Uses identityKey when present, falling back to id only when identityKey is absent.
 *
 * Handles unknown references explicitly (ignores them, never fabricates).
 * This is a lightweight validation; it does not affect the mapping output.
 *
 * Returns a structured result with unreferenced and missing IDs for observability.
 */
function validateAgainstFinalSynthesis(
  evidence: readonly DomainEvidence[],
  finalSynthesis: CareerFinalSynthesisResult
): C11ValidationResult {
  const producedIds = new Set(evidence.map(e => e.identityKey ?? e.id));
  const finalIds = new Set(finalSynthesis.evidenceIds);

  // Check for produced IDs not referenced in C11 (informational only)
  const unreferenced = [...producedIds].filter(id => !finalIds.has(id));

  // Check for C11 IDs not produced by mapper (informational only)
  const missing = [...finalIds].filter(id => !producedIds.has(id));

  return Object.freeze({
    unreferenced,
    missing
  });
}

// ============================================================================
// Mapping Helpers
// ============================================================================

function mapLayerToSourceType(
  layer: string
): 'STRUCTURAL' | 'YOGA' {
  switch (layer) {
    case 'YOGA':
      return 'YOGA';
    case 'PRIMARY_PROMISE':
    case 'SECONDARY_SUPPORT':
    case 'MODIFIER':
    case 'DASHA':
    case 'VARGA':
    case 'TRANSIT':
      return 'STRUCTURAL';
    default:
      throw new Error(`Unexpected layer value: ${layer}`);
  }
}

function mapLayerToRole(
  layer: string
): EvidenceRole {
  switch (layer) {
    case 'PRIMARY_PROMISE':
      return 'PRIMARY';
    case 'SECONDARY_SUPPORT':
      return 'SECONDARY';
    case 'MODIFIER':
    case 'YOGA':
      return 'MODIFIER';
    case 'DASHA':
      return 'TIMING';
    case 'VARGA':
      return 'CONFIRMATION';
    case 'TRANSIT':
      return 'MODIFIER';
    default:
      throw new Error(`Unexpected layer value: ${layer}`);
  }
}

function mapLayerToProvenanceStrength(
  layer: string
): 'PRIMARY' | 'SECONDARY' | 'TERTIARY' {
  switch (layer) {
    case 'PRIMARY_PROMISE':
      return 'PRIMARY';
    case 'SECONDARY_SUPPORT':
      return 'SECONDARY';
    default:
      return 'TERTIARY';
  }
}

function mapDirectionToPolarity(
  direction: ReasoningDirection
): EvidencePolarity {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORTING';
    case 'CHALLENGE':
      return 'CHALLENGING';
    case 'NEUTRAL':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
    case 'MIXED':
      // MIXED should be split before calling this (after item 1, all callers split first)
      throw new Error('MIXED direction should be split into two occurrences before calling mapDirectionToPolarity');
    default:
      // Exhaustive check - should never reach here with valid ReasoningDirection
      const _exhaustiveCheck: never = direction;
      throw new Error(`Unexpected ReasoningDirection value: ${_exhaustiveCheck}`);
  }
}

function mapDirectionToProvenanceEffect(
  direction: ReasoningDirection
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
    default:
      // Exhaustive check - should never reach here with valid ReasoningDirection
      const _exhaustiveCheck: never = direction;
      throw new Error(`Unexpected ReasoningDirection value: ${_exhaustiveCheck}`);
  }
}

function mapExpressionDirectionToPolarity(
  direction: CareerExpressionDirection
): EvidencePolarity {
  switch (direction) {
    case 'SUPPORTED':
    case 'CONDITIONAL':
      return 'SUPPORTING';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      // Should be filtered before calling this
      return 'NEUTRAL';
    default:
      // Exhaustive check - should never reach here with valid CareerExpressionDirection
      const _exhaustiveCheck: never = direction;
      throw new Error(`Unexpected CareerExpressionDirection value: ${_exhaustiveCheck}`);
  }
}

function mapExpressionStrengthToEvidenceStrength(
  strength: CareerExpressionStrength
): EvidenceStrength | null {
  switch (strength) {
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'UNAVAILABLE':
      return null; // Exclude record
    default:
      // Exhaustive check - should never reach here with valid CareerExpressionStrength
      const _exhaustiveCheck: never = strength;
      throw new Error(`Unexpected CareerExpressionStrength value: ${_exhaustiveCheck}`);
  }
}

function mapD10DirectionToPolarity(
  direction: CareerD10QualificationDirection
): EvidencePolarity {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORTING';
    case 'CHALLENGE':
      return 'CHALLENGING';
    case 'NEUTRAL':
    case 'UNDETERMINED':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
    case 'MIXED':
      // MIXED should be split before calling this (D10 splits MIXED in mapD10Evidence)
      throw new Error('MIXED direction should be split into two occurrences before calling mapD10DirectionToPolarity');
    default:
      // Exhaustive check - should never reach here with valid CareerD10QualificationDirection
      const _exhaustiveCheck: never = direction;
      throw new Error(`Unexpected CareerD10QualificationDirection value: ${_exhaustiveCheck}`);
  }
}

function mapD10DirectionToProvenanceEffect(
  direction: CareerD10QualificationDirection
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' {
  switch (direction) {
    case 'SUPPORT':
      return 'SUPPORT';
    case 'CHALLENGE':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
    case 'UNDETERMINED':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
    default:
      // Exhaustive check - should never reach here with valid CareerD10QualificationDirection
      const _exhaustiveCheck: never = direction;
      throw new Error(`Unexpected CareerD10QualificationDirection value: ${_exhaustiveCheck}`);
  }
}

function mapDashaEffectToProvenanceEffect(
  effect: CareerDashaCanonicalEffect
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' {
  switch (effect) {
    case 'ACTIVATES':
    case 'PARTIALLY_ACTIVATES':
      return 'SUPPORT';
    case 'CHALLENGES':
      return 'CHALLENGE';
    case 'DOES_NOT_ACTIVATE':
    case 'UNKNOWN':
    case 'INSUFFICIENT_DATA':
      return 'NEUTRAL';
    default:
      throw new Error(`Unexpected Dasha effect value: ${effect}`);
  }
}

/**
 * Exhaustive strength mapping: DomainStrength → EvidenceStrength.
 *
 * VERY_STRONG → VERY_STRONG
 * STRONG → STRONG
 * MODERATE → MODERATE
 * WEAK → WEAK
 * UNAVAILABLE → exclude record (return null)
 * UNDETERMINED → exclude record (return null)
 * VERY_WEAK → exclude record (return null)
 * MIXED → exclude record (return null)
 *
 * Never infer strength from C11 confidence or another layer.
 */
function mapDomainStrengthToEvidenceStrength(
  strength: DomainStrength
): EvidenceStrength | null {
  switch (strength) {
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'VERY_WEAK':
    case 'UNDETERMINED':
    case 'MIXED':
      return null; // Exclude record
    default:
      return null;
  }
}

/**
 * Exhaustive strength mapping: CareerD10QualificationStrength → EvidenceStrength.
 *
 * VERY_STRONG → VERY_STRONG
 * STRONG → STRONG
 * MODERATE → MODERATE
 * WEAK → WEAK
 * VERY_WEAK → exclude record (return null)
 * UNDETERMINED → exclude record (return null)
 */
function mapD10StrengthToEvidenceStrength(
  strength: CareerD10QualificationStrength
): EvidenceStrength | null {
  switch (strength) {
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'VERY_WEAK':
    case 'UNDETERMINED':
      return null; // Exclude record
    default:
      return null;
  }
}

function mapStrength(
  strength: string
): EvidenceStrength | null {
  switch (strength) {
    case 'VERY_STRONG':
      return 'VERY_STRONG';
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    default:
      return null; // Exclude record with unmappable strength
  }
}
