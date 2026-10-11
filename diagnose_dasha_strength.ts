/**
 * Diagnostic script to check canonical Dasha evidence strength values
 */

import { interpretCareerV2 } from './src/domain/career/CareerDomainInterpreterV2';
import { calculateHoroscope } from './src/engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from './src/test/fixtures/canonicalChart';
import { createAnalysisContext } from './src/core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from './src/core/analysis/resolveAnalysisTemporalState';
import { buildCareerDashaAnalysis } from './src/domain/career/careerDasha/careerDashaIntegration';
import { buildCareerNatalAnalysis } from './src/domain/career/careerNatalConvergence';
import { buildCareerExpression } from './src/domain/career/careerExpressionIntegration';

async function diagnoseDashaStrength() {
  console.log('\n=== Diagnosing Canonical Dasha Evidence Strength ===');
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

  const natal = buildCareerNatalAnalysis({ horoscope });
  const expression = buildCareerExpression({ natal });
  const dasha = buildCareerDashaAnalysis({ horoscope, natal, expression });

  console.log('Canonical Dasha analysis:');
  console.log(`  overallEffect: ${dasha.overallEffect}`);
  console.log(`  overallDirection: ${dasha.overallDirection}`);
  console.log(`  overallStrength: ${dasha.overallStrength}`);
  console.log(`  dominantLevel: ${dasha.dominantLevel}`);
  console.log(`  evidence count: ${dasha.evidence.length}`);

  console.log('\nCanonical Dasha evidence details:');
  dasha.evidence.forEach(e => {
    console.log(`  - ID: ${e.id}`);
    console.log(`    Level: ${e.level}, Planet: ${e.planet}, Role: ${e.role}`);
    console.log(`    Effect: ${e.effect}, Direction: ${e.direction}, Strength: ${e.strength}`);
  });

  console.log('\nMD period:');
  console.log(`  planet: ${dasha.md.planet}`);
  console.log(`  effect: ${dasha.md.effect}`);
  console.log(`  direction: ${dasha.md.direction}`);
  console.log(`  strength: ${dasha.md.strength}`);

  console.log('\nAD period:');
  console.log(`  planet: ${dasha.ad.planet}`);
  console.log(`  effect: ${dasha.ad.effect}`);
  console.log(`  direction: ${dasha.ad.direction}`);
  console.log(`  strength: ${dasha.ad.strength}`);

  console.log('\nPD period:');
  console.log(`  planet: ${dasha.pd.planet}`);
  console.log(`  effect: ${dasha.pd.effect}`);
  console.log(`  direction: ${dasha.pd.direction}`);
  console.log(`  strength: ${dasha.pd.strength}`);
}

diagnoseDashaStrength().catch(console.error);
