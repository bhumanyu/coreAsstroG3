export interface HarnessImportGraph {
  readonly dependencies: readonly string[];
  readonly edges: readonly string[];
  readonly runtimeLoadLimitations: readonly string[];
}

export function computeHarnessImportGraph(
  repositoryRoot: string,
  revision: string,
  entryPoint: string
): HarnessImportGraph;
