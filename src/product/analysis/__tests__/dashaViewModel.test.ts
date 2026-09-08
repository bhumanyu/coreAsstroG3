import { describe, it, expect } from 'vitest';
import { selectDashaViewModel } from '../dashaViewModel';
import { createProductAnalysis } from './testHelpers';
import type { ProductAnalysis, ProductEvidence } from '../productAnalysisTypes';

describe('DashaViewModel pure projection selectors (P-UI-07)', () => {
  it('1. MD/AD/PD hierarchy preserved and ordered from selectDashaHierarchy', () => {
    const analysis = createProductAnalysis();
    const vm = selectDashaViewModel(analysis);

    expect(vm.hierarchy).toHaveLength(3);
    expect(vm.hierarchy[0].level).toBe('MD');
    expect(vm.hierarchy[0].planet).toBe('Jupiter');
    expect(vm.hierarchy[1].level).toBe('AD');
    expect(vm.hierarchy[1].planet).toBe('Saturn');
    expect(vm.hierarchy[2].level).toBe('PD');
    expect(vm.hierarchy[2].planet).toBe('Mercury');
  });

  it('2. Role and direction preserved independently (AD role=MODIFIER while direction=CHALLENGE)', () => {
    const analysis = createProductAnalysis();
    const vm = selectDashaViewModel(analysis);

    const adPeriod = vm.hierarchy.find((p) => p.level === 'AD');
    expect(adPeriod).toBeDefined();
    expect(adPeriod?.role).toBe('MODIFIER');
    expect(adPeriod?.direction).toBe('CHALLENGE');
    // Ensure direction did not force role to CHALLENGING
    expect(adPeriod?.role).not.toBe('CHALLENGING');
  });

  it('3. Wealth activation PARTIAL preserved without coercion', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis: ProductAnalysis = {
      ...defaultAnalysis,
      wealth: {
        ...defaultAnalysis.wealth,
        activation: {
          ...defaultAnalysis.wealth.activation,
          dasha: {
            ...defaultAnalysis.wealth.activation.dasha,
            status: 'PARTIAL',
            statement: 'Partial wealth dasha window'
          }
        }
      }
    };

    const vm = selectDashaViewModel(analysis);
    expect(vm.wealthActivation.status).toBe('PARTIAL');
    expect(vm.wealthActivation.statement).toBe('Partial wealth dasha window');
  });

  it('4. Missing dasha (empty current) yields hero availability UNAVAILABLE and empty hierarchy', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis: ProductAnalysis = {
      ...defaultAnalysis,
      dasha: {
        ...defaultAnalysis.dasha,
        current: {}
      }
    };

    const vm = selectDashaViewModel(analysis);
    expect(vm.hero.availability).toBe('UNAVAILABLE');
    expect(vm.hierarchy).toEqual([]);
    expect(vm.hero.mdPlanet).toBeNull();
    expect(vm.hero.adPlanet).toBeNull();
    expect(vm.hero.pdPlanet).toBeNull();
    expect(vm.hero.currentPeriodLabel).toBe('Timing Unavailable');
  });

  it('5. Partial dasha (only Mahadasha present) yields PARTIAL availability', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis: ProductAnalysis = {
      ...defaultAnalysis,
      dasha: {
        ...defaultAnalysis.dasha,
        current: {
          mahadasha: defaultAnalysis.dasha.current.mahadasha
        }
      }
    };

    const vm = selectDashaViewModel(analysis);
    expect(vm.hero.availability).toBe('PARTIAL');
    expect(vm.hierarchy).toHaveLength(1);
    expect(vm.hero.mdPlanet).toBe('Jupiter');
    expect(vm.hero.adPlanet).toBeNull();
    expect(vm.hero.pdPlanet).toBeNull();
  });

  it('6. Evidence dedupe by id across career + wealth', () => {
    const sharedEvidenceItem: ProductEvidence = {
      id: 'ev_shared_1',
      title: 'Shared Jupiter Placement',
      statement: 'Jupiter exalted influencing both 10th and 2nd houses.',
      direction: 'SUPPORT',
      role: 'PRIMARY',
      source: 'TEST_ENGINE',
      ruleId: 'RULE_SHARED'
    };

    const defaultAnalysis = createProductAnalysis();
    const analysis: ProductAnalysis = {
      ...defaultAnalysis,
      career: {
        ...defaultAnalysis.career,
        evidence: [sharedEvidenceItem, ...defaultAnalysis.career.evidence]
      },
      wealth: {
        ...defaultAnalysis.wealth,
        evidence: [sharedEvidenceItem, ...defaultAnalysis.wealth.evidence]
      }
    };

    const vm = selectDashaViewModel(analysis);
    // Shared item should appear only once across groups
    const allPrimaryItems = vm.evidence.groups.PRIMARY;
    const matchingShared = allPrimaryItems.filter((e) => e.id === 'ev_shared_1');
    expect(matchingShared).toHaveLength(1);

    // Total evidence count matches distinct items
    const distinctIds = new Set([
      sharedEvidenceItem.id,
      ...defaultAnalysis.career.evidence.map((e) => e.id),
      ...defaultAnalysis.wealth.evidence.map((e) => e.id)
    ]);
    expect(vm.evidence.total).toBe(distinctIds.size);
  });

  it('7. Qualifications combine career and wealth with severity preserved', () => {
    const defaultAnalysis = createProductAnalysis();
    const vm = selectDashaViewModel(defaultAnalysis);

    expect(vm.qualifications.length).toBeGreaterThanOrEqual(1);
    const combustionQual = vm.qualifications.find((q) => q.title === 'COMBUSTION');
    expect(combustionQual).toBeDefined();
    expect(combustionQual?.severity).toBe('HIGH');
    expect(combustionQual?.statement).toBe('10th lord combust by Sun.');
  });

  it('8. Warnings are mapped to string messages', () => {
    const defaultAnalysis = createProductAnalysis();
    const analysis: ProductAnalysis = {
      ...defaultAnalysis,
      warnings: [
        { code: 'TIME_APPROX', message: 'Birth time accuracy ±15 min.', severity: 'INFO' }
      ]
    };
    const vm = selectDashaViewModel(analysis);
    expect(vm.warnings).toContain('Birth time accuracy ±15 min.');
  });
});
