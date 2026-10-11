/**
 * Diagnostic script to check STAGE1_GOLDEN_CAREER fixture
 */

import { STAGE1_GOLDEN_CAREER } from './src/integration/stage1/stage1GoldenFixture';

console.log('=== STAGE1_GOLDEN_CAREER Evidence Breakdown ===');
console.log('Total evidence count:', STAGE1_GOLDEN_CAREER.evidence.length);

console.log('\nBy source:');
const bySource = new Map();
for (const e of STAGE1_GOLDEN_CAREER.evidence) {
  const count = bySource.get(e.source) ?? 0;
  bySource.set(e.source, count + 1);
}
for (const [source, count] of bySource.entries()) {
  console.log(`  ${source}: ${count}`);
}

console.log('\nBy sourceType:');
const bySourceType = new Map();
for (const e of STAGE1_GOLDEN_CAREER.evidence) {
  const count = bySourceType.get(e.sourceType) ?? 0;
  bySourceType.set(e.sourceType, count + 1);
}
for (const [sourceType, count] of bySourceType.entries()) {
  console.log(`  ${sourceType}: ${count}`);
}

console.log('\nBy phase:');
const byPhase = new Map();
for (const e of STAGE1_GOLDEN_CAREER.evidence) {
  const count = byPhase.get(e.phase) ?? 0;
  byPhase.set(e.phase, count + 1);
}
for (const [phase, count] of byPhase.entries()) {
  console.log(`  ${phase}: ${count}`);
}

console.log('\nDasha evidence (source=DASHA, phase=DASHA_ACTIVATION):');
const dashaEvidence = STAGE1_GOLDEN_CAREER.evidence.filter(e => e.source === 'DASHA' && e.phase === 'DASHA_ACTIVATION');
console.log(`  Count: ${dashaEvidence.length}`);
dashaEvidence.forEach(e => {
  console.log(`  - ID: ${e.id}, Level: ${e.timing?.level}, Planet: ${e.timing?.planet}, Strength: ${e.strength}, Direction: ${e.polarity}`);
});

console.log('\nD10 evidence (source=D10, phase=VARGA_CONFIRMATION):');
const d10Evidence = STAGE1_GOLDEN_CAREER.evidence.filter(e => e.source === 'D10' && e.phase === 'VARGA_CONFIRMATION');
console.log(`  Count: ${d10Evidence.length}`);
d10Evidence.forEach(e => {
  console.log(`  - ID: ${e.id}, SourceType: ${e.sourceType}, Strength: ${e.strength}, Direction: ${e.polarity}`);
});
