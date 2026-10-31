import { assertConclusionInventory, assertParity } from './goldenAcceptanceAssertions';
import { normalizeAcceptanceConclusion, normalizeAcceptanceSurface } from './goldenAcceptanceNormalizer';
import { ACCEPTANCE_MISSING } from './goldenAcceptanceTypes';
import type { AcceptanceConclusion, AcceptanceSurface, NormalizedAcceptanceConclusion, ParityDifference, SelectedPeriodAcceptanceProjection } from './goldenAcceptanceTypes';
import { SURFACE_ALLOWED_DIFFERENCE_KINDS } from './goldenAcceptanceProductionHarness';
import type { GoldenAcceptanceProjections } from './goldenAcceptanceProductionHarness';

export interface GoldenAcceptancePipeline<D extends 'CAREER' | 'WEALTH' = 'CAREER' | 'WEALTH'> {
  readonly run: () => unknown;
  readonly collect: (productionResult: unknown) => GoldenAcceptanceProjections<D>;
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
  const projectionsByName = projections as unknown as Readonly<Record<string, AcceptanceConclusion
    | SelectedPeriodAcceptanceProjection
    | readonly AcceptanceConclusion[]
    | typeof ACCEPTANCE_MISSING
    | undefined>>;
  for (const name of names) {
    const projection = projectionsByName[name];
    const allowedDifferenceKinds: readonly ParityDifference['kind'][] = SURFACE_ALLOWED_DIFFERENCE_KINDS[name] ?? [];
    // Skip selected-period-ui as it's a SelectedPeriodAcceptanceProjection, not a conclusion
    if (name === 'selected-period-ui') continue;
    const conclusions: readonly (AcceptanceConclusion | undefined)[] = projection === undefined || projection === ACCEPTANCE_MISSING
      ? [undefined]
      : Array.isArray(projection)
        ? projection
        : [projection as AcceptanceConclusion];
    const normalizedConclusions = conclusions.map(conclusion =>
      conclusion === undefined ? undefined : normalizeAcceptanceConclusion(conclusion)
    );
    const inventory = normalizedConclusions.filter(
      (conclusion): conclusion is NormalizedAcceptanceConclusion => conclusion !== undefined
    );
    differences.push(...assertConclusionInventory(inventory));
    conclusions.forEach((conclusion, index) => {
      const surfaceName = conclusions.length > 1 ? `${name}[${index}]` : name;
      surfaces.push(normalizeAcceptanceSurface(
        surfaceName,
        conclusion,
        allowedDifferenceKinds
      ));
    });
  }
  differences.push(...assertParity(expected, surfaces));
  return Object.freeze(differences);
}
