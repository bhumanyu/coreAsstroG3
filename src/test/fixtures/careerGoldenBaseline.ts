/**
 * Golden baseline for C11 regression testing.
 *
 * This baseline preserves the canonical C11 synthesis output before
 * changes, enabling regression detection for structural integrity changes.
 *
 * To regenerate this baseline:
 * 1. Run the test script in canonicalCareerFoundationBuilder.test.ts
 * 2. Copy the captured output to GOLDEN_C11_BASELINE below
 */

/**
 * Committed golden baseline.
 * This should be captured from a known-good commit and committed to the repo.
 *
 * Structure includes:
 * - conclusion: strength, confidence, statement, evidence IDs
 * - natalPromise: strength, confidence, statement, evidence IDs
 * - dashaActivation: active, effect, strength, confidence, statement, evidence IDs
 * - transitTrigger: active, effect, strength, confidence, statement, evidence IDs
 * - vargaConfirmations: array of varga confirmation data
 * - timingActivations: array of timing activation data
 * - evidenceCount: number of evidence records
 * - evidenceIds: sorted array of evidence IDs
 * - canonicalC11Synthesis: the authoritative C11 synthesis object
 * - reasoningTrace: the reasoning trace object
 */
export const GOLDEN_C11_BASELINE = {
  placeholder: true,
  conclusion: {
    strength: 'PLACEHOLDER',
    confidence: 'PLACEHOLDER',
    statement: 'PLACEHOLDER',
    primaryEvidenceIds: [],
    supportingEvidenceIds: [],
    challengingEvidenceIds: []
  },
  natalPromise: {
    strength: 'PLACEHOLDER',
    confidence: 'PLACEHOLDER',
    statement: 'PLACEHOLDER',
    evidenceIds: [],
    supportingEvidenceIds: [],
    challengingEvidenceIds: []
  },
  dashaActivation: {
    active: false,
    effect: 'PLACEHOLDER',
    strength: 'PLACEHOLDER',
    confidence: 'PLACEHOLDER',
    statement: 'PLACEHOLDER',
    evidenceIds: [],
    activatedPromiseEvidenceIds: []
  },
  transitTrigger: {
    active: false,
    effect: 'PLACEHOLDER',
    strength: 'PLACEHOLDER',
    confidence: 'PLACEHOLDER',
    statement: 'PLACEHOLDER',
    evidenceIds: [],
    triggeredPromiseEvidenceIds: []
  },
  vargaConfirmations: [],
  timingActivations: [],
  evidenceCount: 0,
  evidenceIds: [],
  canonicalC11Synthesis: null,
  reasoningTrace: null
} as const;
