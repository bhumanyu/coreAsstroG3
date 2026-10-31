export function calculateMissingCalculationCoverage(
  fixtures,
  coveragePolicy,
  inspectBoundaryCoverage
) {
  const missing = coveragePolicy.requiredKinds.filter(
    kind => !fixtures.some(fixture => fixture.kind === kind)
  );
  for (const planet of coveragePolicy.requiredPlanets) {
    if (!fixtures.some(fixture =>
      fixture.kind === 'PLANETARY_LONGITUDE' && String(fixture.input?.planet) === planet
    )) missing.push(`PLANETARY_LONGITUDE:${planet}`);
  }
  for (const scenario of coveragePolicy.requiredMotionScenarios) {
    if (!fixtures.some(fixture =>
      fixture.kind === 'PLANETARY_MOTION' && fixture.scenario === scenario
    )) missing.push(`PLANETARY_MOTION:${scenario}`);
  }
  for (const chartType of coveragePolicy.requiredVargaTypes) {
    if (!fixtures.some(fixture =>
      fixture.kind === 'VARGA_LONGITUDE' && String(fixture.input?.chartType) === chartType
    )) missing.push(`VARGA_LONGITUDE:${chartType}`);
  }
  if (typeof inspectBoundaryCoverage !== 'function') {
    throw new TypeError('The fixture module boundary validator is required.');
  }
  missing.push(...inspectBoundaryCoverage(fixtures, coveragePolicy));
  return missing;
}
