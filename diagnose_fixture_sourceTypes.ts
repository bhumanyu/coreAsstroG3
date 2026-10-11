/**
 * Diagnostic script to check STAGE1_GOLDEN_CAREER sourceType breakdown
 */

import { STAGE1_GOLDEN_CAREER } from './src/integration/stage1/stage1GoldenFixture';

console.log('=== STAGE1_GOLDEN_CAREER SourceType Breakdown ===');
console.log('Total evidence count:', STAGE1_GOLDEN_CAREER.evidence.length);

const careerSources = STAGE1_GOLDEN_CAREER.evidence
  .filter((e) => e.domain === 'CAREER')
  .map((e) => e.sourceType);

console.log('\nCareer sourceTypes:', careerSources);
console.log('Unique career sourceTypes:', [...new Set(careerSources)]);

// Check if STRUCTURAL is present
console.log('\nSTRUCTURAL present?', careerSources.includes('STRUCTURAL'));
console.log('VARGA present?', careerSources.includes('VARGA'));
console.log('HOUSE present?', careerSources.includes('HOUSE'));
