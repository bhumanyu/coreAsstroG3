/**
 * Diagnostic script to check canonical Dasha and D10 evidence availability
 */

import { interpretCareerV2 } from './src/domain/career/CareerDomainInterpreterV2';
import { calculateHoroscope } from './src/engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from './src/test/fixtures/canonicalChart';
import { createAnalysisContext } from './src/core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from './src/core/analysis/resolveAnalysisTemporalState';

// Test 1: Golden chart via STAGE1_GOLDEN_OPTIONS
async function diagnoseGoldenChart() {
  console.log('\n=== Diagnosing Golden Chart (STAGE1_GOLDEN_OPTIONS) ===');
  const analysisContext = createAnalysisContext({
    asOf: '2026-01-01T00:00:00.000Z',
    methodology: {
      zodiacSystem: 'SIDEREAL',
      houseSystem: 'WHOLE_SIGN',
      ayanamsa: 'LAHIRI',
      calculationEngine: 'ASTRO_CORE_V1',
      rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
      vargaRules: 'PARASHARA_D10_D2',
      dashaSystem: 'VIMSHOTTARI'
    }
  });
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const temporalState = resolveAnalysisTemporalState(horoscope, analysisContext);
  const domainOptions = { context: analysisContext, temporalState };
  const career = interpretCareerV2(horoscope, domainOptions);

  console.log('Total evidence count:', career.evidence.length);
  console.log('Dasha evidence (source=DASHA, phase=DASHA_ACTIVATION):',
    career.evidence.filter(e => e.source === 'DASHA' && e.phase === 'DASHA_ACTIVATION').length);
  console.log('D10 evidence (source=D10, phase=VARGA_CONFIRMATION):',
    career.evidence.filter(e => e.source === 'D10' && e.phase === 'VARGA_CONFIRMATION').length);

  const dashaEvidence = career.evidence.filter(e => e.source === 'DASHA' && e.phase === 'DASHA_ACTIVATION');
  console.log('\nDasha evidence details:');
  dashaEvidence.forEach(e => {
    console.log(`  - ID: ${e.id}, Level: ${e.timing?.level}, Planet: ${e.timing?.planet}, Strength: ${e.strength}`);
  });

  const d10Evidence = career.evidence.filter(e => e.source === 'D10' && e.phase === 'VARGA_CONFIRMATION');
  console.log('\nD10 evidence details:');
  d10Evidence.forEach(e => {
    console.log(`  - ID: ${e.id}, SourceType: ${e.sourceType}, Strength: ${e.strength}`);
  });
}

// Test 2: Chart with asOf: '2024-06-01T00:00:00.000Z'
async function diagnoseAsOfChart() {
  console.log('\n=== Diagnosing Chart with asOf: 2024-06-01T00:00:00.000Z ===');
  const asOf = '2024-06-01T00:00:00.000Z';
  const analysisContext = createAnalysisContext({
    asOf,
    methodology: {
      zodiacSystem: 'SIDEREAL',
      houseSystem: 'WHOLE_SIGN',
      ayanamsa: 'LAHIRI',
      calculationEngine: 'ASTRO_CORE_V1',
      rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
      vargaRules: 'PARASHARA_D10_D2',
      dashaSystem: 'VIMSHOTTARI'
    }
  });
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, asOf);
  const temporalState = resolveAnalysisTemporalState(horoscope, analysisContext);
  const domainOptions = { context: analysisContext, temporalState };
  const career = interpretCareerV2(horoscope, domainOptions);

  console.log('Total evidence count:', career.evidence.length);
  console.log('Dasha evidence (source=DASHA, phase=DASHA_ACTIVATION):',
    career.evidence.filter(e => e.source === 'DASHA' && e.phase === 'DASHA_ACTIVATION').length);
  console.log('D10 evidence (source=D10, phase=VARGA_CONFIRMATION):',
    career.evidence.filter(e => e.source === 'D10' && e.phase === 'VARGA_CONFIRMATION').length);

  const dashaEvidence = career.evidence.filter(e => e.source === 'DASHA' && e.phase === 'DASHA_ACTIVATION');
  console.log('\nDasha evidence details:');
  dashaEvidence.forEach(e => {
    console.log(`  - ID: ${e.id}, Level: ${e.timing?.level}, Planet: ${e.timing?.planet}, Strength: ${e.strength}`);
  });

  const d10Evidence = career.evidence.filter(e => e.source === 'D10' && e.phase === 'VARGA_CONFIRMATION');
  console.log('\nD10 evidence details:');
  d10Evidence.forEach(e => {
    console.log(`  - ID: ${e.id}, SourceType: ${e.sourceType}, Strength: ${e.strength}`);
  });
}

async function main() {
  await diagnoseGoldenChart();
  await diagnoseAsOfChart();
}

main().catch(console.error);
