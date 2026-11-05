export interface ProductMethodology {
  readonly zodiacSystem: string;
  readonly houseSystem: string;
  readonly ayanamsa: string;
  readonly calculationEngine: string;
  readonly rulesEngine: string;
  readonly vargaRules: string;
  readonly dashaSystem: string;
}


/**
 * Non-personal runtime identifiers required for deterministic replay.
 * Missing identifiers are explicit; consumers must not infer them from defaults.
 */
export interface AnalysisVersionConfiguration {
  readonly calculationEngine?: string;
  readonly referenceDatasets?: Readonly<Record<string, string>>;
  readonly ruleCatalogue?: string;
  readonly careerLogic?: string;
  readonly wealthLogic?: string;
  readonly careerSynthesis?: string;
  readonly wealthSynthesis?: string;
  readonly outputSchema?: string;
  readonly configuration?: Readonly<Record<string, string | number | boolean | null>>;
  readonly inputRetention?: 'RETAINED_BY_CALLER' | 'NOT_RETAINED' | 'UNKNOWN';
  /** Opaque caller-owned reference to an independently retained input snapshot; never raw input values. */
  readonly retainedInputSnapshotRef?: string;
  readonly requiredCodeAvailable?: boolean | null;
  readonly requiredDatasetsAvailable?: boolean | null;
}

export interface AnalysisContext {
  readonly asOf: string;
  readonly methodology: ProductMethodology;
  readonly engineVersion: string;
  readonly rulesVersion: string;
  readonly versionConfiguration?: AnalysisVersionConfiguration;
}
