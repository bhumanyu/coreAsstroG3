import { assertConclusionInventory, assertParity } from './goldenAcceptanceAssertions';
import { normalizeAcceptanceConclusion, normalizeAcceptanceSurface } from './goldenAcceptanceNormalizer';
import { ACCEPTANCE_MISSING } from './goldenAcceptanceTypes';
import type { AcceptanceConclusion, AcceptanceKnownGap, AcceptanceSurface, NormalizedAcceptanceConclusion, ParityDifference, SelectedPeriodAcceptanceProjection } from './goldenAcceptanceTypes';
import { REQUIRED_SURFACES, SURFACE_ALLOWED_DIFFERENCE_KINDS } from './goldenAcceptanceProductionHarness';
import type { GoldenAcceptanceProjections, RequiredSurfaceName } from './goldenAcceptanceProductionHarness';

export interface GoldenAcceptancePipeline<D extends 'CAREER' | 'WEALTH' = 'CAREER' | 'WEALTH'> {
  readonly run: () => unknown;
  readonly collect: (productionResult: unknown) => GoldenAcceptanceProjections<D>;
  readonly knownGaps: Readonly<Partial<Record<RequiredSurfaceName, AcceptanceKnownGap>>>;
}

/** Runs production once and projects every independently rendered surface from that same run. */
export function runGoldenAcceptanceParity(
  pipeline: GoldenAcceptancePipeline,
  expected: NormalizedAcceptanceConclusion,
  requiredSurfaces: readonly RequiredSurfaceName[] = REQUIRED_SURFACES[expected.domain]
): readonly ParityDifference[] {
  if (requiredSurfaces.length === 0) throw new Error('runGoldenAcceptanceParity requires at least one required surface');
  const productionResult = pipeline.run();
  const projections = pipeline.collect(productionResult);
  const surfaces: AcceptanceSurface[] = [];
  const differences: ParityDifference[] = [];
  const names = [...requiredSurfaces];
  const projectionsByName = projections as unknown as Readonly<Record<string, AcceptanceConclusion
    | SelectedPeriodAcceptanceProjection
    | readonly AcceptanceConclusion[]
    | typeof ACCEPTANCE_MISSING
    | undefined>>;
  for (const name of names) {
    const projection = projectionsByName[name];
    const allowedDifferenceKinds: readonly ParityDifference['kind'][] = [
      ...(SURFACE_ALLOWED_DIFFERENCE_KINDS[name] ?? []),
      ...(pipeline.knownGaps[name]?.differenceKinds ?? [])
    ];
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
        allowedDifferenceKinds,
        {
          externalEvidencePolicy: allowedDifferenceKinds.includes('EXTERNAL_EVIDENCE')
            ? 'ALLOW_DECLARED'
            : 'FAIL'
        }
      ));
    });
  }
  differences.push(...assertParity(expected, surfaces));
  return Object.freeze(differences);
}
