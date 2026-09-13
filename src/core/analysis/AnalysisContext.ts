export interface ProductMethodology {
  readonly zodiacSystem: string;
  readonly houseSystem: string;
  readonly ayanamsa: string;
  readonly calculationEngine: string;
  readonly rulesEngine: string;
  readonly vargaRules: string;
  readonly dashaSystem: string;
}

export interface AnalysisContext {
  readonly asOf: string;
  readonly methodology: ProductMethodology;
  readonly engineVersion: string;
  readonly rulesVersion: string;
}
