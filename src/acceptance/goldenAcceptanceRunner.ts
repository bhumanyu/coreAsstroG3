import { assertConclusionInventory, assertParity } from './goldenAcceptanceAssertions';
import { normalizeAcceptanceSurface } from './goldenAcceptanceNormalizer';
import type { AcceptanceConclusion, AcceptanceSurface, NormalizedAcceptanceConclusion, ParityDifference, SelectedPeriodAcceptanceProjection } from './goldenAcceptanceTypes';
import type { GoldenAcceptanceProjections } from './goldenAcceptanceProductionHarness';

export interface GoldenAcceptancePipeline {
  readonly run: () => unknown;
  readonly collect: (productionResult: unknown) => GoldenAcceptanceProjections;
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
  const surfaces: AcceptanceSurface[] = [];
  const differences: ParityDifference[] = [];
  const names = [
    ...requiredSurfaces,
    ...Object.keys(projections).filter(name => !requiredSurfaces.includes(name)).sort()
  ];
  for (const name of names) {
    const projection = projections[name];
    // Skip selected-period-ui as it's a SelectedPeriodAcceptanceProjection, not a conclusion
    if (name === 'selected-period-ui') continue;
    const conclusions: readonly (AcceptanceConclusion | undefined)[] = projection === undefined
      ? [undefined]
      : Array.isArray(projection)
        ? projection
        : [projection as AcceptanceConclusion];
    const normalized = conclusions.map(conclusion =>
      conclusion === undefined ? undefined : normalizeAcceptanceSurface(name, conclusion).conclusion
    );
    const inventory = normalized.filter(
      (conclusion): conclusion is NormalizedAcceptanceConclusion =>
        conclusion !== undefined && conclusion !== 'MISSING'
    );
    differences.push(...assertConclusionInventory(inventory));
    normalized.forEach((conclusion, index) => {
      const surfaceName = normalized.length > 1 ? `${name}[${index}]` : name;
      surfaces.push(normalizeAcceptanceSurface(
        surfaceName,
        conclusion === 'MISSING' || conclusion === undefined ? undefined : conclusion
      ));
    });
  }
  differences.push(...assertParity(expected, surfaces));
  return Object.freeze(differences);
}
