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

export type ProductAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'CONDITIONAL';

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

export interface ProductMethodology {
  readonly zodiacSystem: string;
  readonly houseSystem: string;
  readonly ayanamsa: string;
  readonly calculationEngine: string;
  readonly rulesEngine?: string;
  readonly vargaRules?: string;
}

export interface ProductChartSummary {
  readonly ascendantSign: string;
  readonly ascendantDegree: number;
  readonly moonSign: string;
  readonly sunSign: string;
  readonly moonNakshatra?: string;
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
  readonly strength: string;
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
  readonly effect: string;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface TransitProductResult {
  readonly status: ProductAvailability;
  readonly effect: string;
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
}

export interface WealthOverallProduct {
  readonly status: string;
  readonly promise: string;
  readonly confidence: ProductConfidence;
  readonly headline?: string;
  readonly statement?: string;
}

export interface WealthDimensionsProduct {
  readonly accumulation: { readonly status: string; readonly statement?: string };
  readonly gains: { readonly status: string; readonly statement?: string };
  readonly fortune: { readonly status: string; readonly statement?: string };
  readonly speculation: { readonly status: string; readonly statement?: string };
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
 * Root Canonical ProductAnalysis Aggregate
 */
export interface ProductAnalysis {
  readonly analysisId: string;
  readonly asOf: string;
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
}
