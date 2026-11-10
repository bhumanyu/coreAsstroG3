import { readFile } from 'node:fs/promises';
import { validateE2eResultsReport, REQUIRED_E08_JOURNEY_IDS } from '../../src/acceptance/e2eResultsValidation.ts';

const reportPath = 'test-results/e2e-results.json';
let report;
try {
  report = JSON.parse(await readFile(reportPath, 'utf8'));
} catch (error) {
  throw new Error(`Browser acceptance JSON report is missing or invalid at ${reportPath}: ${error instanceof Error ? error.message : String(error)}`);
}

const errors = validateE2eResultsReport(report);
if (errors.length > 0) {
  throw new Error(`Browser acceptance evidence is incomplete:\n- ${errors.join('\n- ')}`);
}

const stats = report.stats;
const executed = stats.expected + stats.unexpected + stats.flaky;
process.stdout.write(`Browser acceptance evidence: ${executed} executed, 0 skipped, 0 unexpected, 0 flaky; all ${REQUIRED_E08_JOURNEY_IDS.length} E08 journeys present.\n`);
