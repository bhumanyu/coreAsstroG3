/**
 * Golden baseline for CW-05 Wealth synthesis regression testing.
 *
 * This baseline preserves the canonical CW-05 synthesis output for the
 * canonical birth chart at asOf=2024-01-01T00:00:00Z.
 *
 * Captured on 2026-10-17 for acceptance hardening.
 */

export const GOLDEN_WEALTH_BASELINE = {
  finalStatus: 'STRONG',
  status: 'STRONG',
  ruleIds: [
    'CW-05-WEALTH-SYNTHESIS',
    'WEALTH_11H_STRONG_001',
    'WEALTH_2H_11H_LINK_001',
    'WEALTH_11L_DIGNITY_001',
    'WEALTH_2L_11L_LINK_001',
    'WEALTH_9L_DIGNITY_001',
    'WEALTH_5L_DIGNITY_001',
    'WEALTH_5H_9H_LINK_001',
    'WEALTH_5L_9L_LINK_001',
    'NATAL_ACCUMULATION_WEALTH_2H_11H_LINK_001:HOUSES_2_11',
    'NATAL_ACCUMULATION_WEALTH_2L_11L_LINK_001:MOON_MARS',
    'NATAL_GAINS_WEALTH_11H_STRONG_001:HOUSE_11',
    'NATAL_GAINS_WEALTH_2H_11H_LINK_001:HOUSES_2_11',
    'NATAL_GAINS_WEALTH_11L_DIGNITY_001:MARS',
    'NATAL_GAINS_WEALTH_2L_11L_LINK_001:MOON_MARS',
    'NATAL_FORTUNE_WEALTH_9L_DIGNITY_001:SATURN',
    'NATAL_FORTUNE_WEALTH_5H_9H_LINK_001:HOUSES_5_9',
    'NATAL_FORTUNE_WEALTH_5L_9L_LINK_001:VENUS_SATURN',
    'NATAL_FORTUNE_WEALTH_JUPITER_KARAKA_001:JUPITER',
    'NATAL_SPECULATION_WEALTH_5L_DIGNITY_001:VENUS',
    'NATAL_SPECULATION_WEALTH_5H_9H_LINK_001:HOUSES_5_9'
  ],
  evidenceIds: [
    'WEALTH_11H_STRONG_001:HOUSE_11',
    'WEALTH_11L_DIGNITY_001:MARS',
    'WEALTH_2H_11H_LINK_001:HOUSES_2_11',
    'WEALTH_2L_11L_LINK_001:MOON_MARS',
    'WEALTH_5H_9H_LINK_001:HOUSES_5_9',
    'WEALTH_5L_9L_LINK_001:VENUS_SATURN',
    'WEALTH_5L_DIGNITY_001:VENUS',
    'WEALTH_9L_DIGNITY_001:SATURN',
    'WEALTH_JUPITER_KARAKA_001:JUPITER'
  ],
  dimensions: {
    ACCUMULATION: {
      finalStatus: 'STRONG',
      dataStatus: undefined,
      promiseEvidenceIds: undefined,
      dashaRuleReferences: undefined
    },
    GAINS: {
      finalStatus: 'STRONG',
      dataStatus: undefined,
      promiseEvidenceIds: undefined,
      dashaRuleReferences: undefined
    },
    FORTUNE: {
      finalStatus: 'STRONG',
      dataStatus: undefined,
      promiseEvidenceIds: undefined,
      dashaRuleReferences: undefined
    },
    SPECULATION: {
      finalStatus: 'STRONG',
      dataStatus: undefined,
      promiseEvidenceIds: undefined,
      dashaRuleReferences: undefined
    }
  }
};

export const GOLDEN_WEALTH_MANIFESTATION_BASELINE = {
  dimensions: {
    ACCUMULATION: {
      status: 'SUPPORTED'
    },
    GAINS: {
      status: 'SUPPORTED'
    },
    FORTUNE: {
      status: 'SUPPORTED'
    },
    SPECULATION: {
      status: 'SUPPORTED'
    }
  }
};
