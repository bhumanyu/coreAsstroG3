import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { it } from 'vitest';
import { runGoldenAcceptanceProductionGate } from '../acceptance/goldenAcceptanceProductionHarness';

it('writes real PR-8 production acceptance gate results for the release report', () => {
  const outputPath = process.env.PR9_ACCEPTANCE_REPORT_PATH;
  if (!outputPath) throw new Error('PR9_ACCEPTANCE_REPORT_PATH must be set by the release runner.');

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

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
});
