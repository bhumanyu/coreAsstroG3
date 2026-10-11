/**
 * Diagnostic script to check STAGE1_GOLDEN_WEALTH sourceType breakdown
 */

import { STAGE1_GOLDEN_WEALTH } from './src/integration/stage1/stage1GoldenFixture';

console.log('=== STAGE1_GOLDEN_WEALTH SourceType Breakdown ===');
console.log('Total evidence count:', STAGE1_GOLDEN_WEALTH.evidence.length);

const wealthSources = STAGE1_GOLDEN_WEALTH.evidence
  .filter((e) => e.domain === 'WEALTH')
  .map((e) => e.sourceType);

console.log('\nWealth sourceTypes:', wealthSources);
console.log('Unique wealth sourceTypes:', [...new Set(wealthSources)]);

// Check if STRUCTURAL is present
console.log('\nSTRUCTURAL present?', wealthSources.includes('STRUCTURAL'));
console.log('VARGA present?', wealthSources.includes('VARGA'));
console.log('PLANET present?', wealthSources.includes('PLANET'));
