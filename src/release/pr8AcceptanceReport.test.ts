import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, it } from 'vitest';
import { runGoldenAcceptanceProductionGate } from '../acceptance/goldenAcceptanceProductionHarness';

it('writes real PR-8 production acceptance gate results for the release report', () => {
  const outputPath = process.env.PR9_ACCEPTANCE_REPORT_PATH;

  const results = (['CAREER', 'WEALTH'] as const).map(domain => {
    const result = runGoldenAcceptanceProductionGate(domain, 'STANDARD');
    return {
      domain,
      reportStatus: result.report.status,
      gates: result.report.gates.map(gate => ({
        name: `${domain}:${gate.name}`,
        status: gate.status
      }))
    };
  });

  expect(results).toHaveLength(2);
  expect(results.map(result => result.domain).sort()).toEqual(['CAREER', 'WEALTH']);
  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  }
});
