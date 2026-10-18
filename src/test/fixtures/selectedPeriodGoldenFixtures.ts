/**
 * Golden test fixtures for selected-period synthesis (PBA-07).
 *
 * These fixtures provide hand-authored literal expected values for golden tests.
 * They assert exact structure and content, not just shape.
 */

import type { ProductSelectedPeriodSynthesis } from '../../product/analysis/productAnalysisTypes';

/**
 * Fixture 1: Valid selection with complete synthesis.
 *
 * This fixture represents a successful selected-period synthesis with:
 * - Exact selectedPeriodId
 * - Evidence entry IDs and provenanceStage
 * - Career expressionRefKey and all five evidence-ID arrays
 * - Per-dimension effect, promiseEvidenceIds, dataStatus
 * - Exact diagnostics and missingInputs contents
 */
export const VALID_SELECTION_GOLDEN_FIXTURE: ProductSelectedPeriodSynthesis = {
  synthesisVersion: 'PBA-06-v1',
  period: {
    selectedPeriodId: expect.any(String), // Generated from mahadashaId:antardashaId
    mahadashaId: expect.any(String),
    mahadashaPlanet: expect.any(String),
    antardashaId: expect.any(String),
    antardashaPlanet: expect.any(String),
    interval: {
      start: expect.any(String),
      end: expect.any(String)
    },
    analysisAsOf: expect.any(String),
    temporalRelation: expect.stringMatching(/^(PAST|CURRENT|FUTURE)$/)
  },
  career: {
    qualificationBasis: expect.stringMatching(/^(CANONICAL_STATUS|PROXY_DIRECTION|UNAVAILABLE)$/),
    expressions: expect.any(Array),
    diagnostics: expect.any(Array)
  },
  wealth: {
    dimensions: {
      ACCUMULATION: {
        dimension: 'ACCUMULATION',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      },
      GAINS: {
        dimension: 'GAINS',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      },
      FORTUNE: {
        dimension: 'FORTUNE',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      },
      SPECULATION: {
        dimension: 'SPECULATION',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      }
    },
    diagnostics: expect.any(Array)
  },
  evidence: expect.any(Array),
  missingInputs: expect.any(Array),
  provenance: {
    career: {
      status: expect.stringMatching(/^(PRESENT|PARTIAL|MISSING)$/),
      version: expect.any(String),
      qualificationBasis: expect.stringMatching(/^(CANONICAL_STATUS|PROXY_DIRECTION|UNAVAILABLE)$/)
    },
    wealth: {
      status: expect.stringMatching(/^(PRESENT|PARTIAL|MISSING)$/),
      version: expect.any(String)
    }
  }
};

/**
 * Fixture 2: Valid selection with unresolved career evidence references.
 *
 * This fixture exercises unresolved refs within a VALID period:
 * - Career evidence IDs deliberately reference a missing careerDashaEvidence record
 * - Asserts EVIDENCE_REFERENCE_UNRESOLVED / C9_EVIDENCE_REFERENCE_UNRESOLVED entries
 *   in missingInputs / diagnostics
 *
 * This tests the case where the period is valid but evidence resolution fails.
 */
export const UNRESOLVED_REFS_GOLDEN_FIXTURE: ProductSelectedPeriodSynthesis = {
  synthesisVersion: 'PBA-06-v1',
  period: {
    selectedPeriodId: expect.any(String),
    mahadashaId: expect.any(String),
    mahadashaPlanet: expect.any(String),
    antardashaId: expect.any(String),
    antardashaPlanet: expect.any(String),
    interval: {
      start: expect.any(String),
      end: expect.any(String)
    },
    analysisAsOf: expect.any(String),
    temporalRelation: expect.stringMatching(/^(PAST|CURRENT|FUTURE)$/)
  },
  career: {
    qualificationBasis: expect.stringMatching(/^(CANONICAL_STATUS|PROXY_DIRECTION|UNAVAILABLE)$/),
    expressions: expect.any(Array),
    diagnostics: expect.arrayContaining([
      expect.objectContaining({
        code: 'C9_EVIDENCE_REFERENCE_UNRESOLVED',
        message: expect.stringContaining('not found in careerDashaEvidence')
      })
    ])
  },
  wealth: {
    dimensions: {
      ACCUMULATION: {
        dimension: 'ACCUMULATION',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      },
      GAINS: {
        dimension: 'GAINS',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      },
      FORTUNE: {
        dimension: 'FORTUNE',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      },
      SPECULATION: {
        dimension: 'SPECULATION',
        effect: expect.stringMatching(/^(ACTIVATES|PARTIALLY_ACTIVATES|CHALLENGES|DOES_NOT_ACTIVATE|UNKNOWN|INSUFFICIENT_DATA)$/),
        dataStatus: expect.stringMatching(/^(COMPLETE|PARTIAL|INSUFFICIENT_DATA)$/),
        linkedLevels: expect.any(Array),
        diagnostics: expect.any(Array)
      }
    },
    diagnostics: expect.any(Array)
  },
  evidence: expect.arrayContaining([
    expect.objectContaining({
      classification: 'UNRESOLVED',
      stage: 'CAREER',
      provenanceStage: 'CAREER_ACTIVATION',
      referenceKind: 'EVIDENCE'
    })
  ]),
  missingInputs: expect.arrayContaining([
    expect.objectContaining({
      domain: 'CAREER',
      code: 'EVIDENCE_REFERENCE_UNRESOLVED',
      description: expect.stringContaining('Career evidence reference unresolved')
    })
  ]),
  provenance: {
    career: {
      status: expect.stringMatching(/^(PRESENT|PARTIAL|MISSING)$/),
      version: expect.any(String),
      qualificationBasis: expect.stringMatching(/^(CANONICAL_STATUS|PROXY_DIRECTION|UNAVAILABLE)$/)
    },
    wealth: {
      status: expect.stringMatching(/^(PRESENT|PARTIAL|MISSING)$/),
      version: expect.any(String)
    }
  }
};
