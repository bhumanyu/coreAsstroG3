/**
 * Runtime implementation of acceptance evidence schema validation.
 * This is the single source of truth for validation logic.
 * The TypeScript facade in src/acceptance/acceptanceEvidenceSchema.ts
 * provides type-safe wrappers.
 */

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const UNASSIGNED_OWNER_VALUES = new Set(['', 'unassigned', 'not assigned', 'tbd', 'unknown', 'n/a', 'pending']);
const EXECUTION_STATUSES = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);
const PRODUCT_STATUSES = new Set([
  'COMPLETE', 'PARTIAL', 'BLOCKED', 'UNAVAILABLE', 'INSUFFICIENT_DATA', 'NOT_ASSESSED', 'BROKEN'
]);

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value, requireItems = false) {
  return Array.isArray(value)
    && (!requireItems || value.length > 0)
    && value.every(item => isNonEmptyString(item));
}

/**
 * Checks if an owner value is assigned (not a placeholder).
 * @param {string} value - The owner value to check
 * @returns {boolean} True if the owner is assigned
 */
export function hasAssignedOwner(value) {
  return !UNASSIGNED_OWNER_VALUES.has(value.trim().toLowerCase());
}

/**
 * Derives the acceptance product status from execution evidence.
 * @param {object} record - The acceptance evidence record (without productStatus)
 * @param {string} reportSha - The SHA of the report being validated
 * @returns {string} The derived product status
 */
export function deriveAcceptanceProductStatus(record, reportSha) {
  if (record.execution.status === 'BLOCKED') return 'BLOCKED';
  if (record.execution.status === 'FAIL') return 'BROKEN';
  if (record.execution.status !== 'PASS') return 'PARTIAL';

  const exactRevision = record.execution.testedSha === reportSha && SHA_PATTERN.test(reportSha);
  const owned = typeof record.productOwner === 'string' && typeof record.qaOwner === 'string'
    && hasAssignedOwner(record.productOwner) && hasAssignedOwner(record.qaOwner);
  const ciEvidence = Boolean(record.execution.ciRunId && record.execution.ciRunUrl);
  const commandEvidence = Array.isArray(record.requiredTestCommands)
    && record.requiredTestCommands.length > 0
    && Array.isArray(record.execution.commands)
    && record.requiredTestCommands.every(required => record.execution.commands.some(command =>
      Boolean(command && typeof command === 'object')
      && command.command === required && command.status === 'PASS' && command.exitCode === 0
    ));
  const artifactEvidence = Array.isArray(record.execution.evidenceReferences)
    && record.execution.evidenceReferences.length > 0;
  const noSkippedTests = record.execution.skippedCount === 0;
  const expectedTestsPresent = Array.isArray(record.expectedTestIds) && record.expectedTestIds.length > 0;

  return exactRevision && owned && ciEvidence && commandEvidence && artifactEvidence
    && noSkippedTests && expectedTestsPresent
    ? 'COMPLETE'
    : 'PARTIAL';
}

/**
 * Strict structural and evidence validation. It never upgrades missing evidence to PASS.
 * @param {unknown} value - The value to validate
 * @param {string} [expectedSha] - The expected SHA for the report
 * @returns {readonly string[]} Array of validation error messages (empty if valid)
 */
export function validateAcceptanceEvidenceReport(value, expectedSha) {
  const errors = [];
  if (!isRecord(value)) return ['Report must be an object.'];
  const report = value;

  if (report.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!isNonEmptyString(report.repository)) errors.push('repository is required.');
  if (typeof report.sourceSha !== 'string' || !SHA_PATTERN.test(report.sourceSha)) {
    errors.push('sourceSha must be a full 40-character SHA.');
  }
  if (expectedSha && report.sourceSha !== expectedSha) errors.push('sourceSha does not match the expected tested revision.');

  if (!isRecord(report.workflowRun)) {
    errors.push('workflowRun must be an object.');
  } else {
    const workflowRun = report.workflowRun;
    if (workflowRun.id !== null && !isNonEmptyString(workflowRun.id)) errors.push('workflowRun.id must be null or a non-empty string.');
    if (workflowRun.url !== null && !isNonEmptyString(workflowRun.url)) errors.push('workflowRun.url must be null or a non-empty string.');
    if (workflowRun.name !== null && !isNonEmptyString(workflowRun.name)) errors.push('workflowRun.name must be null or a non-empty string.');
    if (workflowRun.conclusion !== null && !isNonEmptyString(workflowRun.conclusion)) errors.push('workflowRun.conclusion must be null or a non-empty string.');
  }

  if (!Array.isArray(report.records) || report.records.length === 0) {
    errors.push('At least one acceptance record is required.');
    return errors;
  }

  const ids = new Set();
  for (const [index, candidate] of report.records.entries()) {
    const prefix = `records[${index}]`;
    if (!isRecord(candidate)) {
      errors.push(`${prefix} must be an object.`);
      continue;
    }
    const record = candidate;
    if (!isNonEmptyString(record.storyId)) errors.push(`${prefix}.storyId is required.`);
    else if (ids.has(record.storyId)) errors.push(`${prefix}.storyId must be unique.`);
    else ids.add(record.storyId);
    if (!isNonEmptyString(record.title)) errors.push(`${prefix}.title is required.`);
    if (!isNonEmptyString(record.productOwner)) errors.push(`${prefix}.productOwner is required.`);
    if (!isNonEmptyString(record.qaOwner)) errors.push(`${prefix}.qaOwner is required.`);
    if (!isStringArray(record.acceptanceCriteria, true)) errors.push(`${prefix}.acceptanceCriteria must be a non-empty string array.`);
    if (!isStringArray(record.implementationReferences)) errors.push(`${prefix}.implementationReferences must be a string array.`);
    if (!isStringArray(record.requiredTestCommands, true)) errors.push(`${prefix}.requiredTestCommands must be a non-empty string array.`);
    if (!isStringArray(record.expectedTestIds, true)) errors.push(`${prefix}.expectedTestIds must be a non-empty string array.`);
    if (record.productStatusReason !== undefined && !isNonEmptyString(record.productStatusReason)) {
      errors.push(`${prefix}.productStatusReason must be a non-empty string when supplied.`);
    }
    if (!PRODUCT_STATUSES.has(record.productStatus)) errors.push(`${prefix}.productStatus is invalid.`);

    if (!isRecord(record.execution)) {
      errors.push(`${prefix}.execution must be an object.`);
      continue;
    }
    const execution = record.execution;
    if (!EXECUTION_STATUSES.has(execution.status)) {
      errors.push(`${prefix}.execution.status is invalid.`);
      continue;
    }
    if (execution.testedSha !== null && (typeof execution.testedSha !== 'string' || !SHA_PATTERN.test(execution.testedSha))) {
      errors.push(`${prefix}.execution.testedSha must be null or a full SHA.`);
    }
    if (execution.ciRunId !== null && !isNonEmptyString(execution.ciRunId)) errors.push(`${prefix}.execution.ciRunId must be null or a non-empty string.`);
    if (execution.ciRunUrl !== null && !isNonEmptyString(execution.ciRunUrl)) errors.push(`${prefix}.execution.ciRunUrl must be null or a non-empty string.`);
    if (!Array.isArray(execution.commands) || !execution.commands.every(command =>
      isRecord(command)
      && isNonEmptyString(command.command)
      && EXECUTION_STATUSES.has(command.status)
      && (command.exitCode === null || Number.isInteger(command.exitCode))
    )) errors.push(`${prefix}.execution.commands must contain valid command evidence records.`);
    if (!isStringArray(execution.evidenceReferences)) errors.push(`${prefix}.execution.evidenceReferences must be a string array.`);
    if (!Number.isInteger(execution.skippedCount) || execution.skippedCount < 0) {
      errors.push(`${prefix}.execution.skippedCount must be a non-negative integer.`);
    }
    if (execution.failureSummary !== undefined && !isNonEmptyString(execution.failureSummary)) {
      errors.push(`${prefix}.execution.failureSummary must be a non-empty string when supplied.`);
    }

    const arraysValid = isStringArray(record.requiredTestCommands, true)
      && isStringArray(record.expectedTestIds, true)
      && Array.isArray(execution.commands)
      && isStringArray(execution.evidenceReferences);
    if (!arraysValid || !Number.isInteger(execution.skippedCount) || execution.skippedCount < 0) continue;

    const derivedStatus = deriveAcceptanceProductStatus(
      record,
      report.sourceSha ?? ''
    );
    const explicitUnavailable = ['UNAVAILABLE', 'INSUFFICIENT_DATA', 'NOT_ASSESSED'].includes(record.productStatus);
    if (explicitUnavailable) {
      if (!isNonEmptyString(record.productStatusReason)) {
        errors.push(`${prefix}.productStatusReason is required for ${record.productStatus}.`);
      }
      if (execution.status === 'FAIL') {
        errors.push(`${prefix} cannot suppress failed execution as ${record.productStatus}.`);
      }
    } else if (record.productStatus !== derivedStatus) {
      errors.push(`${prefix}.productStatus does not match its execution evidence; expected ${derivedStatus}.`);
    }

  }

  return errors;
}
