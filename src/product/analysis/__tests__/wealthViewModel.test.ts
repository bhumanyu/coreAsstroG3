import { describe, it, expect } from 'vitest';
import { selectWealthViewModel } from '../wealthViewModel';
import { createProductAnalysis } from './testHelpers';
import type { ProductDashaPeriod } from '../productAnalysisTypes';

describe('WealthViewModel pure projection selectors (P-UI-05)', () => {
  it('1. promise vs conclusion vs confidence separation: preserves distinct fields on overall', () => {
    const analysis = createProductAnalysis({
      wealth: {
        ...createProductAnalysis().wealth,
        overall: {
          promise: 'MODERATE',
          status: 'STRONGLY_SUPPORTED',
          confidence: 'HIGH',
          headline: 'Accumulation Foundation',
          statement: 'Solid 2nd house foundation.'
        }
      }
    });
    const vm = selectWealthViewModel(analysis);

    expect(vm.overall.promise).toBe('MODERATE');
    expect(vm.overall.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.overall.confidence).toBe('HIGH');
    expect(vm.overall.headline).toBe('Accumulation Foundation');
    expect(vm.overall.statement).toBe('Solid 2nd house foundation.');
  });

  it('2. four dimensions preserved: accumulation, gains, fortune, speculation with house labels', () => {
    const analysis = createProductAnalysis();
    const vm = selectWealthViewModel(analysis);

    expect(vm.dimensions.accumulation.id).toBe('ACCUMULATION');
    expect(vm.dimensions.accumulation.houseLabel).toBe('2nd House (Liquid Capital & Assets)');
    expect(vm.dimensions.accumulation.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.dimensions.accumulation.statement).toBe('2nd lord exalted.');

    expect(vm.dimensions.gains.id).toBe('GAINS');
    expect(vm.dimensions.gains.houseLabel).toBe('11th House (Income & Profit Streams)');
    expect(vm.dimensions.gains.status).toBe('SUPPORTED');

    expect(vm.dimensions.fortune.id).toBe('FORTUNE');
    expect(vm.dimensions.fortune.houseLabel).toBe('9th House (Lakshmi Sthana & Prosperity)');
    expect(vm.dimensions.fortune.status).toBe('STRONGLY_SUPPORTED');

    expect(vm.dimensions.speculation.id).toBe('SPECULATION');
    expect(vm.dimensions.speculation.houseLabel).toBe('5th House (Risk Capital & Investments)');
    expect(vm.dimensions.speculation.status).toBe('SUPPORTED');

    expect(vm.dimensions.items).toHaveLength(4);
    expect(vm.dimensions.items.map((i) => i.id)).toEqual([
      'ACCUMULATION',
      'GAINS',
      'FORTUNE',
      'SPECULATION'
    ]);
  });

  it('3. D2 relationship preserved: preserves relationship without strength conversion or percentages', () => {
    const analysis = createProductAnalysis();
    const vm = selectWealthViewModel(analysis);

    expect(vm.d2.relationship).toBe('CONFIRMS');
    expect(vm.d2.statement).toBe('Hora D2 confirms liquid capital accumulation.');
  });

  it('4. unavailable D2/Dasha/transit preserved: handles UNAVAILABLE values without coercion', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      wealth: {
        ...defaultAnalysis.wealth,
        d2: {
          relationship: 'UNAVAILABLE',
          statement: 'D2 chart unavailable'
        },
        activation: {
          dasha: {
            status: 'UNAVAILABLE',
            periods: [],
            statement: 'Dasha timings unavailable'
          },
          transit: {
            status: 'UNAVAILABLE',
            effect: 'UNAVAILABLE',
            statement: 'Transit data unavailable'
          }
        }
      }
    });
    const vm = selectWealthViewModel(analysis);

    expect(vm.d2.relationship).toBe('UNAVAILABLE');
    expect(vm.d2.statement).toBe('D2 chart unavailable');
    expect(vm.dasha.status).toBe('UNAVAILABLE');
    expect(vm.transit.status).toBe('UNAVAILABLE');
    expect(vm.transit.effect).toBe('UNAVAILABLE');
  });

  it('5. speculative risk independent from promise: level and description are separate from overall', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      wealth: {
        ...defaultAnalysis.wealth,
        overall: {
          ...defaultAnalysis.wealth.overall,
          promise: 'STRONG',
          status: 'STRONGLY_SUPPORTED'
        },
        speculativeRisk: {
          level: 'EXTREME',
          description: 'High volatility in 5th house.'
        }
      }
    });
    const vm = selectWealthViewModel(analysis);

    expect(vm.overall.promise).toBe('STRONG');
    expect(vm.speculativeRisk?.level).toBe('EXTREME');
    expect(vm.speculativeRisk?.description).toBe('High volatility in 5th house.');
  });

  it('6. preserves MD -> AD -> PD hierarchy: strictly orders periods regardless of input array order', () => {
    const defaultAnalysis = createProductAnalysis();
    const shuffledPeriods: ProductDashaPeriod[] = [
      {
        level: 'PD',
        planet: 'Mercury',
        role: 'REFINEMENT',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: ['ev_pd'],
        statement: 'PD period'
      },
      {
        level: 'MD',
        planet: 'Jupiter',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: ['ev_md'],
        statement: 'MD period'
      },
      {
        level: 'AD',
        planet: 'Saturn',
        role: 'MODIFIER',
        direction: 'CHALLENGE',
        effect: 'CHALLENGES',
        evidenceIds: ['ev_ad'],
        statement: 'AD period'
      }
    ];

    const analysis = createProductAnalysis({
      wealth: {
        ...defaultAnalysis.wealth,
        activation: {
          ...defaultAnalysis.wealth.activation,
          dasha: {
            status: 'AVAILABLE',
            periods: shuffledPeriods,
            statement: 'Jupiter-Saturn-Mercury period'
          }
        }
      }
    });

    const vm = selectWealthViewModel(analysis);

    expect(vm.dasha.periods).toHaveLength(3);
    expect(vm.dasha.periods[0].level).toBe('MD');
    expect(vm.dasha.periods[0].planet).toBe('Jupiter');
    expect(vm.dasha.periods[1].level).toBe('AD');
    expect(vm.dasha.periods[1].planet).toBe('Saturn');
    expect(vm.dasha.periods[2].level).toBe('PD');
    expect(vm.dasha.periods[2].planet).toBe('Mercury');

    expect(vm.dasha.md?.planet).toBe('Jupiter');
    expect(vm.dasha.ad?.planet).toBe('Saturn');
    expect(vm.dasha.pd?.planet).toBe('Mercury');
    expect(vm.dasha.currentActivation).toBe('Jupiter-Saturn-Mercury period');
  });

  it('7. evidence role/direction independence: counts role and direction as independent dimensions', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      wealth: {
        ...defaultAnalysis.wealth,
        evidence: [
          {
            id: 'ev_1',
            title: 'Primary Challenge Factor',
            statement: 'Primary factor that challenges accumulation',
            direction: 'CHALLENGE',
            role: 'PRIMARY',
            source: 'WEALTH_ENGINE',
            derivedFromIds: []
          },
          {
            id: 'ev_2',
            title: 'Supporting Secondary Factor',
            statement: 'Supporting factor with secondary role',
            direction: 'SUPPORT',
            role: 'SUPPORTING',
            source: 'WEALTH_ENGINE',
            derivedFromIds: []
          },
          {
            id: 'ev_3',
            title: 'Primary Support Factor',
            statement: 'Primary factor supporting wealth',
            direction: 'SUPPORT',
            role: 'PRIMARY',
            source: 'WEALTH_ENGINE',
            derivedFromIds: []
          }
        ]
      }
    });

    const vm = selectWealthViewModel(analysis);

    // Two items with role PRIMARY (ev_1, ev_3)
    expect(vm.conclusion.primaryEvidenceCount).toBe(2);
    expect(vm.conclusion.primaryDriverCount).toBe(2);
    // Two items with direction SUPPORT (ev_2, ev_3)
    expect(vm.conclusion.supportingEvidenceCount).toBe(2);
    expect(vm.conclusion.supportingFactorCount).toBe(2);
    // One item with direction CHALLENGE (ev_1 - which was also PRIMARY)
    expect(vm.conclusion.challengingEvidenceCount).toBe(1);
    expect(vm.conclusion.challengingFactorCount).toBe(1);
  });

  it('8. synthesis-availability overclaim guard: flags integratedSynthesisAvailable and falls back to overall', () => {
    const defaultAnalysis = createProductAnalysis();

    // Case A: synthesis exists
    const analysisWithSynthesis = createProductAnalysis();
    const vmWith = selectWealthViewModel(analysisWithSynthesis);
    expect(vmWith.conclusion.integratedSynthesisAvailable).toBe(true);
    expect(vmWith.conclusion.headline).toBe('Favorable Wealth Outlook');
    expect(vmWith.conclusion.statement).toBe(
      'Long-term asset growth underpinned by solid Dhana yogas.'
    );

    // Case B: synthesis is undefined -> fall back to overall.*
    const analysisWithoutSynthesis = createProductAnalysis({
      wealth: {
        ...defaultAnalysis.wealth,
        synthesis: undefined,
        overall: {
          ...defaultAnalysis.wealth.overall,
          headline: 'Overall Wealth Headline',
          statement: 'Overall wealth statement fallback.'
        }
      }
    });
    const vmWithout = selectWealthViewModel(analysisWithoutSynthesis);
    expect(vmWithout.conclusion.integratedSynthesisAvailable).toBe(false);
    expect(vmWithout.conclusion.headline).toBe('Overall Wealth Headline');
    expect(vmWithout.conclusion.statement).toBe('Overall wealth statement fallback.');
  });

  it('9. accumulation != speculation regression test: accumulation and speculation are not conflated', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      wealth: {
        ...defaultAnalysis.wealth,
        dimensions: {
          ...defaultAnalysis.wealth.dimensions,
          accumulation: {
            status: 'STRONGLY_SUPPORTED',
            statement: 'Liquid capital highly secure.'
          },
          speculation: {
            status: 'CHALLENGED',
            statement: 'High speculative vulnerability in 5th house.'
          }
        }
      }
    });
    const vm = selectWealthViewModel(analysis);

    expect(vm.dimensions.accumulation.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.dimensions.accumulation.statement).toBe('Liquid capital highly secure.');

    expect(vm.dimensions.speculation.status).toBe('CHALLENGED');
    expect(vm.dimensions.speculation.statement).toBe('High speculative vulnerability in 5th house.');

    expect(vm.dimensions.accumulation.status).not.toBe(vm.dimensions.speculation.status);
    expect(vm.dimensions.accumulation.statement).not.toBe(vm.dimensions.speculation.statement);
  });
});
