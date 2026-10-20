/**
 * Canonical ProductAnalysis Aggregate Types (P-UI-02)
 *
 * Strict projection layer over computational engines.
 * NO engine objects (Horoscope, DomainInterpretation, DashaInterpretation)
 * are placed directly on ProductAnalysis.
 */

export type ProductStatus = 'READY' | 'PARTIAL' | 'ERROR';
export type ProductAnalysisStatus = ProductStatus;

export type ProductConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Temporal relation of a period relative to analysis.asOf.
 * Computed using interval semantics: before start → FUTURE, [start,end) → CURRENT, ≥ end → PAST.
 * UNKNOWN indicates invalid/unparseable date strings.
 */
export type ProductTemporalRelation = 'PAST' | 'CURRENT' | 'FUTURE' | 'UNKNOWN';

export type ProductAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'CONDITIONAL' | 'PARTIAL';

export type ProductDirection = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';

export type ProductEvidenceRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MODIFIER'
  | 'REFINEMENT'
  | 'CONFLICTING'
  | 'NEUTRAL';

export interface ProductWarning {
  readonly code: string;
  readonly message: string;
  readonly severity?: 'INFO' | 'WARNING' | 'ERROR';
  readonly domain?: string;
}

export interface ProductBirth {
  readonly name?: string;
  readonly placeOfBirth?: string;
  /** Source: dateTimeStr from BirthDetails */
  readonly dateTime: string;
  /** Source: timeZone from BirthDetails */
  readonly timezone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly ayanamsa: string;
}

import type { ProductMethodology } from '../../core/analysis/AnalysisContext';
export type { ProductMethodology };

export type PromiseStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNAVAILABLE';

export type ConclusionStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED'
  | 'UNAVAILABLE';

export type ActivationEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'DOES_NOT_ACTIVATE'
  | 'CHALLENGES'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE';

export type TransitEffect =
  | 'TRIGGER'
  | 'MODIFIER'
  | 'CHALLENGE'
  | 'NO_MATERIAL_TRIGGER'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE';

export interface ProductChartSummary {
  readonly ascendantSign?: string;
  readonly ascendantDegree?: number;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
  readonly isAvailable?: boolean;
}

export interface ProductEvidence {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: ProductEvidenceRole;
  readonly source: string;
  readonly ruleId?: string;
  readonly derivedFromIds?: readonly string[];
}

export interface CareerPromiseProduct {
  readonly status?: ConclusionStatus | string;
  readonly strength: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
  readonly dominantManifestations?: readonly string[];
}

export interface CareerExpressionProduct {
  readonly primaryStyle?: string;
  readonly leadershipPotential?: string;
  readonly secondaryTraits?: readonly string[];
}

export interface D10ProductResult {
  /**
   * Dasamsa relationship semantics per spec §29:
   * NEVER represented as a strength percentage.
   */
  readonly relationship: 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE';
  readonly statement?: string;
}

export interface ProductDashaPeriod {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet?: string;
  readonly role: ProductEvidenceRole;
  readonly direction: ProductDirection;
  readonly effect: ActivationEffect | string;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

/**
 * Selectable antardasha option for period selection UI.
 * Nested within ProductSelectableMahadasha.
 */
export interface ProductSelectableAntardasha {
  readonly id: string;
  readonly planet: string;
  readonly start: string;
  readonly end: string;
  readonly valid: boolean;
  readonly diagnostics: readonly string[];
  readonly temporalRelation: ProductTemporalRelation;
}

/**
 * Selectable mahadasha option for period selection UI.
 * Contains nested antardashas.
 */
export interface ProductSelectableMahadasha {
  readonly id: string;
  readonly planet: string;
  readonly start: string;
  readonly end: string;
  readonly valid: boolean;
  readonly diagnostics: readonly string[];
  readonly temporalRelation: ProductTemporalRelation;
  readonly antardashas: readonly ProductSelectableAntardasha[];
}

/**
 * Dash period options for period selection UI.
 * Projected from listSelectableMdAdPeriods(report) with temporalRelation computed.
 */
export interface ProductDashaPeriodOptions {
  readonly mahadashas: readonly ProductSelectableMahadasha[];
  readonly diagnostics: readonly string[];
}

export interface TransitProductResult {
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface CareerActivationProduct {
  readonly dasha: {
    readonly status: ProductAvailability;
    readonly periods: readonly ProductDashaPeriod[];
    readonly currentActivation?: string;
    readonly currentPressure?: string;
  };
  readonly transit: TransitProductResult;
}

export interface ProductQualification {
  readonly type: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly description: string;
}

export interface CareerProductAnalysis {
  readonly status?: ConclusionStatus | string;
  readonly promise: CareerPromiseProduct;
  readonly expression?: CareerExpressionProduct;
  readonly d10: D10ProductResult;
  readonly activation: CareerActivationProduct;
  readonly qualifications?: readonly ProductQualification[];
  readonly evidence: readonly ProductEvidence[];
  readonly synthesis?: {
    readonly headline?: string;
    readonly statement?: string;
  };
  readonly profession?: {
    readonly available: boolean;
    readonly status: string;
    readonly candidates: readonly {
      readonly candidateId: string;
      readonly domain: string;
      readonly family: string;
      readonly basis: string;
      readonly expressionTypes: readonly string[];
      readonly mechanismTypes: readonly string[];
      readonly patternIds: readonly string[];
      readonly d10Status: string;
      readonly evidence: readonly {
        readonly evidenceId: string;
        readonly basis: string;
        readonly sourceIds: readonly string[];
        readonly ruleId: string;
        readonly statement: string;
        readonly linkage?: string;
        readonly resolvedMechanismIds?: readonly string[];
        readonly unresolvedMechanismIds?: readonly string[];
      }[];
      readonly domainEvidenceIds: readonly string[];
      readonly relatedEvidenceIds: readonly string[];
      readonly ruleId: string;
    }[];
    readonly unresolvedExpressionTypes: readonly string[];
    readonly mappedTypes: readonly string[];
    readonly missingInputs: readonly string[];
    readonly d10Status: string;
  };
}

export interface WealthOverallProduct {
  readonly status: ConclusionStatus | string;
  readonly promise: PromiseStrength | string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
}

export interface WealthDimensionsProduct {
  readonly accumulation: { readonly status: ConclusionStatus | string; readonly statement?: string };
  readonly gains: { readonly status: ConclusionStatus | string; readonly statement?: string };
  readonly fortune: { readonly status: ConclusionStatus | string; readonly statement?: string };
  readonly speculation: { readonly status: ConclusionStatus | string; readonly statement?: string };
}

export interface D2ProductResult {
  readonly relationship: 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE';
  readonly statement?: string;
}

export interface WealthActivationProduct {
  readonly dasha: {
    readonly status: ProductAvailability;
    readonly periods: readonly ProductDashaPeriod[];
    readonly statement?: string;
  };
  readonly transit: TransitProductResult;
}

export interface SpeculativeRiskProduct {
  readonly level: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'UNAVAILABLE';
  readonly description?: string;
}

export interface WealthProductAnalysis {
  readonly overall: WealthOverallProduct;
  readonly dimensions: WealthDimensionsProduct;
  readonly d2: D2ProductResult;
  readonly activation: WealthActivationProduct;
  readonly speculativeRisk?: SpeculativeRiskProduct;
  readonly qualifications?: readonly ProductQualification[];
  readonly evidence: readonly ProductEvidence[];
  readonly synthesis?: {
    readonly headline?: string;
    readonly statement?: string;
  };
}

export interface ProductDashaState {
  readonly current: {
    readonly mahadasha?: ProductDashaPeriod;
    readonly antardasha?: ProductDashaPeriod;
    readonly pratyantardasha?: ProductDashaPeriod;
  };
  readonly asOf?: string;
  readonly summary?: string;
}

export interface ReasoningNode {
  readonly id: string;
  readonly label: string;
  readonly domain: string;
  readonly type: 'PROMISE' | 'VARGA' | 'ACTIVATION' | 'TRANSIT' | 'SYNTHESIS' | 'EVIDENCE';
  readonly direction: ProductDirection;
  readonly statement: string;
  readonly parentIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
}

export interface ReasoningProductAnalysis {
  readonly nodes: readonly ReasoningNode[];
  readonly primaryConclusions: readonly { readonly domain: string; readonly conclusion: string }[];
  readonly unresolvedQuestions?: readonly string[];
}

export interface AiProductState {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE' | 'GENERATING' | 'FAILED';
  readonly explanation?: string;
  readonly conclusion?: string;
  readonly providerInfo?: {
    readonly name?: string;
    readonly mode?: string;
  };
  readonly error?: string;
}

/**
 * Status for selected-period synthesis only.
 * Separate from ProductAnalysis.status - a failed selection must not mark a valid natal analysis as error.
 */
export type ProductSelectedPeriodStatus =
  | 'OK'
  | 'INVALID_SELECTION'
  | 'SYNTHESIS_FAILED'
  | 'UNAVAILABLE';

/**
 * Evidence reference in the selected-period synthesis.
 * Classification is based on explicit source polarity/effect only.
 * Mixed evidence stays MIXED (maps to PARTIALLY_ACTIVATES in status).
 * For RULE references (referenceKind: 'RULE'), classification and polarity are omitted.
 *
 * Provenance tracking:
 * - stage: Distinguishes high-level domain (CAREER/WEALTH)
 * - provenanceStage: For CAREER, distinguishes source stage (EXPRESSION/QUALIFICATION/ACTIVATION)
 * - referenceKind: Distinguishes evidence-based vs rule-based references (EVIDENCE/RULE)
 */
export interface ProductSynthesisEvidenceReference {
  readonly classification?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' | 'MIXED' | 'UNRESOLVED';
  readonly evidenceId?: string;
  readonly identityKey?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly polarity?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';
  readonly source?: string;
  readonly ruleId?: string;
  readonly level?: 'MD' | 'AD';
  readonly stage: 'CAREER' | 'WEALTH';
  readonly provenanceStage?: 'CAREER_EXPRESSION' | 'CAREER_QUALIFICATION' | 'CAREER_ACTIVATION' | 'WEALTH_NATAL_PROMISE' | 'WEALTH_DASHA_RULE';
  readonly referenceKind?: 'EVIDENCE' | 'RULE';
}

/**
 * Missing input diagnostic.
 */
export interface ProductSynthesisMissingInput {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly code: string;
  readonly description: string;
}

/**
 * Provenance tracking per analysis stage.
 */
export interface ProductSynthesisProvenance {
  readonly career: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
    readonly qualificationBasis?: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  };
  readonly wealth: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
  };
}

/**
 * Diagnostic attached to a synthesis row.
 */
export interface ProductSynthesisDiagnostic {
  readonly code: string;
  readonly message: string;
}

/**
 * Career expression row in the synthesis result.
 *
 * Status is derived from explicit C9 MD/AD activation effects across linkedLevels.
 * matchBasis is omitted if the PBA-04 row type lacks the field.
 *
 * Full PBA-04 traceability: all evidence ID collections are carried through verbatim.
 * Status is a C9 activation derivation conditioned on the row's qualification basis —
 * activation never creates natal promise.
 */
export interface ProductSynthesisCareerExpressionRow {
  readonly expressionRefKey: string;
  readonly status: ActivationEffect | string;
  readonly linkedLevels: readonly ('MD' | 'AD')[];
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly matchBasis?: 'UNAMBIGUOUS' | 'AMBIGUOUS';
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
  readonly expressionEvidenceIds: readonly string[];
  readonly qualifiedEvidenceIds: readonly string[];
  readonly unqualifiedEvidenceIds: readonly string[];
  readonly mdDashaEvidenceIds: readonly string[];
  readonly adDashaEvidenceIds: readonly string[];
  readonly expressionSource: 'CALLER' | 'ADAPTER_FALLBACK';
}

/**
 * Career section in the synthesis result.
 */
export interface ProductSynthesisCareerSection {
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly expressions: readonly ProductSynthesisCareerExpressionRow[];
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
}

/**
 * Wealth dimension row in the synthesis result.
 *
 * Effect is preserved verbatim from PBA-05 dimension effect.
 * dataStatus describes input availability only, never a composite score.
 * promiseEvidenceIds and dashaRuleReferences are preserved verbatim from PBA-05 activation
 * for evidence parity with the AI context projection.
 */
export interface ProductSynthesisWealthDimensionRow {
  readonly dimension: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly effect: ActivationEffect | string;
  readonly dataStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly linkedLevels: readonly ('MD' | 'AD')[];
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
  readonly promiseEvidenceIds: readonly string[];
  readonly dashaRuleReferences: readonly {
    readonly ruleId: string;
    readonly source: string;
    readonly level: 'MD' | 'AD';
  }[];
}

/**
 * Wealth section in the synthesis result.
 */
export interface ProductSynthesisWealthSection {
  readonly dimensions: Readonly<Record<'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION', ProductSynthesisWealthDimensionRow>>;
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
}

/**
 * Selected-period synthesis for ProductAnalysis.
 *
 * This is a pure projection of the PBA-06 synthesis result into the product DTO layer.
 * No recalculation, no AI-generated conclusions.
 */
export interface ProductSelectedPeriodSynthesis {
  readonly synthesisVersion: 'PBA-06-v1';
  readonly period: {
    readonly selectedPeriodId: string;
    readonly mahadashaId: string;
    readonly mahadashaPlanet: string;
    readonly antardashaId: string;
    readonly antardashaPlanet: string;
    readonly interval: { readonly start: string; readonly end: string };
    readonly analysisAsOf: string;
    readonly temporalRelation: 'PAST' | 'CURRENT' | 'FUTURE' | 'UNKNOWN';
  };
  readonly natalBaseline: {
    readonly career?: {
      readonly baseline: import('../../domain/career/careerTypes').CareerConclusionData;
      readonly unchanged: boolean;
    };
    readonly wealth?: {
      readonly baseline: import('../../domain/wealth/wealthTypes').WealthConclusionData;
      readonly unchanged: boolean;
    };
  };
  readonly career: ProductSynthesisCareerSection;
  readonly wealth: ProductSynthesisWealthSection;
  readonly evidence: readonly ProductSynthesisEvidenceReference[];
  readonly missingInputs: readonly ProductSynthesisMissingInput[];
  readonly provenance: ProductSynthesisProvenance;
  /**
   * AI explanation status for the selected period (PBA-09).
   * Explicitly surfaces whether AI explanation succeeded, failed, or was not requested.
   *
   * - 'OK': AI explanation succeeded and aiExplanation contains the result.
   * - 'ERROR': AI explanation failed and aiExplanation contains the error result.
   * - 'NOT_REQUESTED': AI explanation was not requested; aiExplanation is undefined.
   */
  readonly aiExplanationStatus: 'OK' | 'ERROR' | 'NOT_REQUESTED';
  /**
   * Optional AI explanation for the selected period (PBA-09).
   * When present, contains the AI explanation result.
   * AI failure does not affect the deterministic synthesis or status.
   */
  readonly aiExplanation?: import('../../ai').AiExplanationResult;
}

/**
 * Selected-period result type for ProductAnalysis.
 * Discriminated union distinguishing successful synthesis from various failure modes.
 * A failed selection must not mark a valid natal analysis as error.
 */
export type ProductSelectedPeriodResult =
  | {
    readonly status: 'OK';
    readonly synthesis: ProductSelectedPeriodSynthesis;
  }
  | {
    readonly status: 'INVALID_SELECTION' | 'SYNTHESIS_FAILED' | 'UNAVAILABLE';
    readonly error?: string;
  };

/**
 * Root Canonical ProductAnalysis Aggregate
 */
export interface ProductAnalysis {
  readonly analysisId: string;
  readonly asOf: string;
  readonly engineVersion: string;
  readonly rulesVersion: string;
  readonly status: ProductAnalysisStatus;
  readonly birth: ProductBirth;
  readonly methodology: ProductMethodology;
  readonly chart: ProductChartSummary;
  readonly career: CareerProductAnalysis;
  readonly wealth: WealthProductAnalysis;
  readonly dasha: ProductDashaState;
  readonly reasoning: ReasoningProductAnalysis;
  readonly ai: AiProductState;
  readonly warnings: readonly ProductWarning[];
  /**
   * Optional dasha period options for period selection UI.
   * Projected from listSelectableMdAdPeriods(report) with temporalRelation computed.
   */
  readonly dashPeriodOptions?: ProductDashaPeriodOptions;
  /**
   * Optional selected-period synthesis result.
   * When present, contains either a successful synthesis or a typed failure.
   * Absence does NOT indicate an error - it means no selection was requested.
   * Natal status is never downgraded by a failed selection.
   */
  readonly selectedPeriod?: ProductSelectedPeriodResult;
}
