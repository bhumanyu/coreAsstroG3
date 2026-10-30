import { assertConclusionInventory, assertParity } from './goldenAcceptanceAssertions';
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
  const collected = requiredSurfaces
    .map(name => projections[name] === undefined ? undefined : normalizeAcceptanceSurface(name, projections[name]).conclusion)
    .filter((conclusion): conclusion is NormalizedAcceptanceConclusion => conclusion !== undefined && conclusion !== 'MISSING');
  return [...assertConclusionInventory(collected), ...assertParity(expected, surfaces)];
}
