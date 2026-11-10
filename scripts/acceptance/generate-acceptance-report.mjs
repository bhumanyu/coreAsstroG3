import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  deriveAcceptanceProductStatus,
  validateAcceptanceEvidenceReport
} from './acceptanceEvidenceSchema.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function resolvePath(value, fallback) {
  const candidate = value ?? fallback;
  return isAbsolute(candidate) ? candidate : resolve(root, candidate);
}

const inputPath = resolvePath(argument('--input'), 'artifacts/acceptance/acceptance-input.json');
const outputPath = resolvePath(argument('--output'), 'artifacts/acceptance/acceptance-report.json');
const expectedSha = argument('--expected-sha') ?? execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8'
}).trim();

const input = JSON.parse(readFileSync(inputPath, 'utf8'));
if (!input || typeof input !== 'object' || !Array.isArray(input.records)) {
  throw new Error('Acceptance input must be an object containing a records array.');
}

const report = {
  schemaVersion: 1,
  repository: input.repository,
  sourceSha: input.sourceSha,
  workflowRun: input.workflowRun,
  records: input.records.map(record => {
    const productStatus = ['UNAVAILABLE', 'INSUFFICIENT_DATA', 'NOT_ASSESSED'].includes(record.productStatus)
      ? record.productStatus
      : deriveAcceptanceProductStatus(record, input.sourceSha);
    return { ...record, productStatus };
  })
};

const errors = validateAcceptanceEvidenceReport(report, expectedSha);
if (errors.length > 0) {
  throw new Error(`Acceptance evidence report is invalid:\n- ${errors.join('\n- ')}`);
}

mkdirSync(dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
renameSync(temporaryPath, outputPath);

const counts = report.records.reduce((result, record) => {
  result[record.productStatus] = (result[record.productStatus] ?? 0) + 1;
  return result;
}, {});
process.stdout.write(`Acceptance report written: ${outputPath}\n`);
process.stdout.write(`Source SHA: ${report.sourceSha}\n`);
process.stdout.write(`Product status counts: ${JSON.stringify(counts)}\n`);
