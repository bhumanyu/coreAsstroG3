import { describe, it, expect } from 'vitest';
import { selectCareerViewModel } from '../careerViewModel';
import { createProductAnalysis } from './testHelpers';
import type { ProductDashaPeriod } from '../productAnalysisTypes';

describe('CareerViewModel pure projection selectors (P-UI-04)', () => {
  it('1. natal promise passthrough: passes strength, confidence, headline, and statement', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.promise.strength).toBe('STRONG');
    expect(vm.promise.confidence).toBe('HIGH');
    expect(vm.promise.headline).toBe('Executive Trajectory');
    expect(vm.promise.statement).toBe('High vocational promise across 10th lord and Lagna.');
  });

  it('2. manifestations: preserves dominantManifestations array and handles undefined', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);
    expect(vm.promise.manifestations).toEqual(['Corporate Leadership']);

    const analysisWithoutManifestations = createProductAnalysis({
      career: {
        ...analysis.career,
        promise: {
          ...analysis.career.promise,
          dominantManifestations: undefined
        }
      }
    });
    const vm2 = selectCareerViewModel(analysisWithoutManifestations);
    expect(vm2.promise.manifestations).toEqual([]);
  });

  it('3. D10 relationship preserved: preserves relationship value and statement', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.d10.relationship).toBe('CONFIRMS');
    expect(vm.d10.statement).toBe('Dasamsa confirms strong 10th house status.');
  });

  it('4. UNAVAILABLE D10: preserves UNAVAILABLE relationship without strength coercion', () => {
    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        d10: {
          relationship: 'UNAVAILABLE',
          statement: 'D10 divisional assessment unavailable'
        }
      }
    });
    const vm = selectCareerViewModel(analysis);

    expect(vm.d10.relationship).toBe('UNAVAILABLE');
    expect(vm.d10.statement).toBe('D10 divisional assessment unavailable');
  });

  it('5. MD>AD>PD order: guarantees strictly hierarchical period ordering regardless of input ordering', () => {
    const defaultAnalysis = createProductAnalysis();
    const shuffledPeriods: ProductDashaPeriod[] = [
      {
        level: 'PD',
        planet: 'Mercury',
        role: 'REFINEMENT',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: ['ev_pd']
      },
      {
        level: 'MD',
        planet: 'Jupiter',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: ['ev_md']
      },
      {
        level: 'AD',
        planet: 'Saturn',
        role: 'MODIFIER',
        direction: 'CHALLENGE',
        effect: 'CHALLENGES',
        evidenceIds: ['ev_ad']
      }
    ];

    const analysis = createProductAnalysis({
      career: {
        ...defaultAnalysis.career,
        activation: {
          ...defaultAnalysis.career.activation,
          dasha: {
            ...defaultAnalysis.career.activation.dasha,
            periods: shuffledPeriods
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);
    expect(vm.dasha.periods.map((p) => p.level)).toEqual(['MD', 'AD', 'PD']);
  });

  it('6. MD/AD/PD planets Jupiter/Saturn/Mercury: matches canonical planetary rulers', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.dasha.md?.planet).toBe('Jupiter');
    expect(vm.dasha.ad?.planet).toBe('Saturn');
    expect(vm.dasha.pd?.planet).toBe('Mercury');
  });

  it('7. role vs direction independence: ensures roles (PRIMARY, MODIFIER, REFINEMENT) are independent of directions', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.dasha.md?.role).toBe('PRIMARY');
    expect(vm.dasha.md?.direction).toBe('SUPPORT');

    expect(vm.dasha.ad?.role).toBe('MODIFIER');
    expect(vm.dasha.ad?.direction).toBe('CHALLENGE');

    expect(vm.dasha.pd?.role).toBe('REFINEMENT');
    expect(vm.dasha.pd?.direction).toBe('SUPPORT');
  });

  it('8. unavailable dasha: preserves UNAVAILABLE status', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...defaultAnalysis.career,
        activation: {
          ...defaultAnalysis.career.activation,
          dasha: {
            status: 'UNAVAILABLE',
            periods: []
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);
    expect(vm.dasha.status).toBe('UNAVAILABLE');
  });

  it('9. unavailable transit: preserves UNAVAILABLE status', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...defaultAnalysis.career,
        activation: {
          ...defaultAnalysis.career.activation,
          transit: {
            status: 'UNAVAILABLE',
            effect: 'UNAVAILABLE',
            statement: 'Transit data unavailable'
          }
        }
      }
    });

    const vm = selectCareerViewModel(analysis);
    expect(vm.transit.status).toBe('UNAVAILABLE');
    expect(vm.transit.effect).toBe('UNAVAILABLE');
  });

  it('10. qualification severity passthrough: passes qualification details and severity without modification', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.qualifications).toHaveLength(1);
    expect(vm.qualifications[0].type).toBe('COMBUSTION');
    expect(vm.qualifications[0].severity).toBe('LOW');
    expect(vm.qualifications[0].description).toBe('Mercury combust by 8 degrees.');
  });

  it('11. evidence direction/role passthrough: passes all evidential roles and directions', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.evidence).toHaveLength(2);
    expect(vm.evidence[0]).toMatchObject({
      id: 'ev_career_1',
      title: '10th Lord Exaltation',
      direction: 'SUPPORT',
      role: 'PRIMARY',
      source: 'CAREER_ENGINE'
    });
    expect(vm.evidence[1]).toMatchObject({
      id: 'ev_career_2',
      title: 'Saturn Aspect',
      direction: 'CHALLENGE',
      role: 'MODIFIER',
      source: 'CAREER_ENGINE'
    });
  });

  it('12. evidence provenance passthrough: preserves derivedFromIds and handles empty arrays', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    expect(vm.evidence[0].derivedFromIds).toEqual(['ev_mars_exalted']);
    expect(vm.evidence[1].derivedFromIds).toEqual([]);
  });

  it('13. defensive dasha hierarchy: asserts exactly one MD, one AD, and one PD in normal fixture', () => {
    const analysis = createProductAnalysis();
    const vm = selectCareerViewModel(analysis);

    const mdCount = vm.dasha.periods.filter((p) => p.level === 'MD').length;
    const adCount = vm.dasha.periods.filter((p) => p.level === 'AD').length;
    const pdCount = vm.dasha.periods.filter((p) => p.level === 'PD').length;

    expect(mdCount).toBe(1);
    expect(adCount).toBe(1);
    expect(pdCount).toBe(1);
    expect(vm.dasha.md).toBeDefined();
    expect(vm.dasha.ad).toBeDefined();
    expect(vm.dasha.pd).toBeDefined();
  });

  it('14. anti-overclaim: falls back to promise when synthesis is undefined and marks integratedSynthesisAvailable:false', () => {
    const base = createProductAnalysis();
    const analysisWithoutSynthesis = createProductAnalysis({
      career: {
        ...base.career,
        synthesis: undefined
      }
    });

    const vm = selectCareerViewModel(analysisWithoutSynthesis);

    expect(vm.conclusion.statement).toBe(base.career.promise.statement);
    expect(vm.conclusion.headline).toBe(base.career.promise.headline);
    expect(vm.conclusion.integratedSynthesisAvailable).toBe(false);
  });
});
