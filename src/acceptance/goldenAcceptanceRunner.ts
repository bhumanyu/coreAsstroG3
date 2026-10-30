import { assertParity } from './goldenAcceptanceAssertions';
import { normalizeAcceptanceSurface } from './goldenAcceptanceNormalizer';
import type { AcceptanceConclusion, AcceptanceSurface, NormalizedAcceptanceConclusion, ParityDifference } from './goldenAcceptanceTypes';

export interface GoldenAcceptancePipeline {
  readonly run: () => unknown;
  readonly collect: (productionResult: unknown) => Readonly<Record<string, AcceptanceConclusion | undefined>>;
}

/** Runs production once and projects every independently rendered surface from that same run. */
export function runGoldenAcceptanceParity(
  pipeline: GoldenAcceptancePipeline,
  expected: NormalizedAcceptanceConclusion,
  requiredSurfaces: readonly string[] = ['career-view-model', 'ai-context', 'reasoning-trace', 'json-export']
): readonly ParityDifference[] {
  if (requiredSurfaces.length === 0) throw new Error('runGoldenAcceptanceParity requires at least one required surface');
  const productionResult = pipeline.run();
  const projections = pipeline.collect(productionResult);
  const surfaces: AcceptanceSurface[] = requiredSurfaces.map(name =>
    normalizeAcceptanceSurface(name, projections[name])
  );
  for (const name of Object.keys(projections).filter(name => !requiredSurfaces.includes(name)).sort()) {
    surfaces.push(normalizeAcceptanceSurface(name, projections[name]));
  }
  // Cross-surface identity is compared directly by assertParity. Inventory validation is
  // intentionally intra-surface and belongs in a separate per-surface collection contract.
  return [...assertParity(expected, surfaces)];
}
