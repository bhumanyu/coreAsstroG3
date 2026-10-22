/**
 * TEMPORARY INVESTIGATION TEST - DELETE BEFORE MERGE
 *
 * This test investigates why the Bhu chart (May 8 1988) has no qualifying mechanisms
 * and why wealth dimensions show INSUFFICIENT_DATA for the Jupiter-Jupiter period.
 *
 * Purpose: Ground the real fix (Priority 3) in actual engine output rather than assumptions.
 */

import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { buildCanonicalCareerFoundation } from './canonicalCareerFoundationBuilder';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { createSelectedPeriodActivationContext } from '../../../core/analysis/selectedPeriodActivationContext';
import { evaluateSelectedWealthPeriodActivation } from '../../wealth/selectedWealthDashaActivation';
import { interpretWealthV2 } from '../../wealth/WealthDomainInterpreterV2';
import { listSelectableMdAdPeriods } from '../../../core/analysis';
import type { BirthDetails } from '../../../types';
import { AyanamsaType } from '../../../types';

// Bhu chart: May 8 1988, Patna (the canonical test chart)
const BHU_BIRTH_DETAILS: BirthDetails = Object.freeze({
  latitude: 25.75,
  longitude: 85.4167,
  timeZone: 'Asia/Kolkata',
  ayanamsa: AyanamsaType.LAHIRI,
  dateTimeStr: '1988-05-08T09:30:00+05:30'
} as const);

describe('TEMPORARY: Bhu Chart Investigation (Priority 2)', () => {
  it('records career pattern families and mechanism resolution for Bhu chart', () => {
    // Step 1: Calculate horoscope for Bhu chart
    const horoscope = calculateHoroscope(BHU_BIRTH_DETAILS);

    // Step 2: Build canonical career foundation
    const foundation = buildCanonicalCareerFoundation({
      horoscope,
      enableDispositorContexts: false // Production default
    });

    // Step 3: Record pattern families/classifications
    console.log('=== CAREER PATTERN INVESTIGATION ===');
    console.log('Total pattern candidates:', foundation.patternCandidates.length);
    console.log('Pattern families detected:');
    const patternFamilies = new Set<string>();
    for (const pattern of foundation.patternCandidates) {
      patternFamilies.add(pattern.family);
      console.log(`  - ${pattern.family}: ${pattern.patternId} (classification: ${pattern.classification})`);
    }
    console.log('Unique pattern families:', Array.from(patternFamilies));

    // Step 4: Record mechanism resolution
    console.log('\nMechanism resolution:');
    console.log('Total resolved mechanisms:', foundation.resolvedMechanisms.length);
    console.log('Mechanism candidates:');
    for (const resolved of foundation.resolvedMechanisms) {
      console.log(`  - ${resolved.candidate.candidateId} (pattern: ${resolved.patternId})`);
    }

    // Step 5: Determine which pattern families have no mechanisms
    console.log('\nPattern families with empty mechanisms:');
    for (const family of patternFamilies) {
      const hasMechanism = foundation.resolvedMechanisms.some(
        m => foundation.patternCandidates.find(p => p.patternId === m.patternId)?.family === family
      );
      if (!hasMechanism) {
        console.log(`  - ${family}: NO MECHANISM (CAREER_MECHANISM_RESOLUTION_RULES needs rule)`);
      }
    }

    // Assertions to make this a valid test
    expect(foundation.patternCandidates.length).toBeGreaterThan(0);
    // The chart should have patterns (KENDRA_TRIKONA, UPACHAYA, etc.)
    // but mechanisms may be empty (this is the bug we're investigating)
  });

  it('records wealth selected-period activation for Jupiter-Jupiter period', async () => {
    // Step 1: Calculate horoscope for Bhu chart
    const horoscope = calculateHoroscope(BHU_BIRTH_DETAILS);

    // Step 2: Create analysis context
    const context = createAnalysisContext({
      asOf: '2026-01-01T00:00:00Z',
      methodology: {
        zodiacSystem: 'SIDEREAL',
        houseSystem: 'WHOLE_SIGN',
        ayanamsa: 'LAHIRI',
        calculationEngine: 'ASTRO_CORE_V1',
        rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
        vargaRules: 'PARASHARA_D10_D2',
        dashaSystem: 'VIMSHOTTARI'
      },
      engineVersion: '1.0.0',
      rulesVersion: '2.0.0'
    });

    // Step 3: Resolve temporal state
    const temporalState = resolveAnalysisTemporalState(horoscope, context);

    // Step 4: Run wealth interpretation to get natal promise evidence
    const wealthInterpretation = interpretWealthV2(horoscope, {
      context,
      temporalState
    });

    // Step 5: Create selected-period context for the current period
    // Use listSelectableMdAdPeriods to get the selectable IDs
    const selectablePeriods = listSelectableMdAdPeriods(temporalState.dashaInterpretation);

    if (selectablePeriods.mahadashas.length === 0) {
      console.log('No selectable mahadashas found');
      return;
    }

    // Use the first mahadasha (should be the current or first in list)
    const firstMd = selectablePeriods.mahadashas[0];
    console.log('\nUsing MD:', firstMd.planet, 'ID:', firstMd.id);

    // Find the first antardasha for this MD
    const firstAd = selectablePeriods.antardashas.find(ad => ad.mahadashaId === firstMd.id);
    if (!firstAd) {
      console.log('No antardashas found for MD:', firstMd.id);
      return;
    }

    console.log('Using AD:', firstAd.planet, 'ID:', firstAd.id);

    const selectedPeriodResult = createSelectedPeriodActivationContext({
      report: temporalState.dashaInterpretation,
      selection: {
        mahadashaId: firstMd.id,
        antardashaId: firstAd.id
      },
      analysisAsOf: context.asOf
    });

    if (!selectedPeriodResult.ok) {
      console.log('Failed to create selected-period context:', selectedPeriodResult.error);
      return;
    }

    const selectedPeriod = selectedPeriodResult.value;

    // Step 6: Evaluate selected-period wealth activation
    const activationResult = evaluateSelectedWealthPeriodActivation({
      selectedPeriod,
      wealthEvidence: wealthInterpretation.evidence
    });

    if (!activationResult.ok) {
      console.log('Failed to evaluate wealth activation:', activationResult.error);
      return;
    }

    const activation = activationResult.value;

    // Step 7: Record findings for each dimension
    console.log('\n=== WEALTH SELECTED-PERIOD INVESTIGATION ===');
    console.log('Selected period:', selectedPeriod.mahadashaNode.planet, 'MD →', selectedPeriod.antardashaNode.planet, 'AD');
    console.log('Interval:', selectedPeriod.interval.start, 'to', selectedPeriod.interval.end);
    console.log('Temporal relation:', selectedPeriod.temporalRelation);

    for (const [dimension, dimActivation] of Object.entries(activation.dimensions)) {
      console.log(`\n${dimension}:`);
      console.log(`  Effect: ${dimActivation.effect}`);
      console.log(`  Linked levels: ${dimActivation.linkedLevels.join(', ') || 'none'}`);
      console.log(`  Insufficient reason: ${dimActivation.insufficientReason}`);
      console.log(`  Promise evidence count: ${dimActivation.promiseEvidenceIds.length}`);
      console.log(`  MD dasha rule count: ${dimActivation.md.dashaRuleReferences.length}`);
      console.log(`  AD dasha rule count: ${dimActivation.ad.dashaRuleReferences.length}`);

      // Record promise evidence houses
      const promiseEvidence = wealthInterpretation.evidence.filter(e =>
        dimActivation.promiseEvidenceIds.includes(e.id)
      );
      console.log(`  Promise evidence houses:`, [...new Set(promiseEvidence.map(e => e.house).filter(Boolean))]);

      // Record dasha evidence houses
      const mdDashaHouses = dimActivation.md.dashaRuleReferences
        .map(ref => {
          const evidence = selectedPeriod.mahadashaNode.evidence.find(e => e.ruleId === ref.ruleId);
          return evidence?.houses;
        })
        .filter(Boolean);
      const adDashaHouses = dimActivation.ad.dashaRuleReferences
        .map(ref => {
          const evidence = selectedPeriod.antardashaNode.evidence.find(e => e.ruleId === ref.ruleId);
          return evidence?.houses;
        })
        .filter(Boolean);

      console.log(`  MD dasha houses:`, mdDashaHouses.flat());
      console.log(`  AD dasha houses:`, adDashaHouses.flat());

      // Determine why linkage failed
      if (dimActivation.insufficientReason === 'PROMISE_NOT_LINKED') {
        console.log(`  ⚠️ LINKAGE FAILED: Promise exists but dasha lord does not touch dimension's house`);
      } else if (dimActivation.insufficientReason === 'NO_PROMISE_EVIDENCE') {
        console.log(`  ⚠️ NO PROMISE: No natal promise evidence for this dimension`);
      }
    }

    // Assertions to make this a valid test
    expect(activationResult.ok).toBe(true);
  });
});
