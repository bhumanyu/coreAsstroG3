import { readFile } from 'node:fs/promises';

const reportPath = 'test-results/e2e-results.json';
let report;
try {
  report = JSON.parse(await readFile(reportPath, 'utf8'));
} catch (error) {
  throw new Error(`Browser acceptance JSON report is missing or invalid at ${reportPath}: ${error instanceof Error ? error.message : String(error)}`);
}

const stats = report?.stats;
if (!stats || !Number.isInteger(stats.expected) || !Number.isInteger(stats.skipped)
  || !Number.isInteger(stats.unexpected) || !Number.isInteger(stats.flaky)) {
  throw new Error('Browser acceptance report does not contain the required Playwright execution statistics.');
}

const executed = stats.expected + stats.unexpected + stats.flaky;
if (executed < 1) throw new Error('No browser acceptance tests executed.');
if (stats.skipped !== 0) throw new Error(`Required browser acceptance suite contains ${stats.skipped} skipped test(s).`);
if (stats.unexpected !== 0) throw new Error(`Browser acceptance suite contains ${stats.unexpected} unexpected test result(s).`);

process.stdout.write(`Browser acceptance evidence: ${executed} executed, 0 skipped, 0 unexpected.\n`);
