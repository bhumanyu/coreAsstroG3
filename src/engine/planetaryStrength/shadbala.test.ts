import { describe, it, expect } from 'vitest';
import {
  Planet,
  ShadbalaComponent,
  ShadbalaSubcomponent,
  ShadbalaAggregationStatus,
  StrengthComponentStatus,
  PlanetStrengthComponent,
  SHADBALA_MINIMUM_REQUIREMENTS
} from '../../types';
import { calculateShadbala, ShadbalaAggregationInput } from './shadbala';

describe('Shadbala Aggregation (P-11)', () => {
  const createCompleteComponents = (values: {
    uchcha?: number;
    saptavargaja?: number;
    ojaYugma?: number;
    kendradi?: number;
    drekkana?: number;
    sthana?: number;
    dig?: number;
    kala?: number;
    cheshta?: number;
    naisargika?: number;
    drik?: number;
  }): PlanetStrengthComponent[] => [
    {
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.UCHCHA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.uchcha ?? 40.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.saptavargaja ?? 80.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.OJA_YUGMA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.ojaYugma ?? 30.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.KENDRADI_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.kendradi ?? 30.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.DREKKANA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.drekkana ?? 20.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.STHANA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.sthana ?? 200.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.DIG_BALA,
      subcomponent: ShadbalaSubcomponent.DIG_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.dig ?? 50.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.KALA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.kala ?? 120.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.CHESHTA_BALA,
      subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.cheshta ?? 40.0,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.NAISARGIKA_BALA,
      subcomponent: ShadbalaSubcomponent.NAISARGIKA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.naisargika ?? 34.29,
      unit: 'SHASTIAMSA'
    },
    {
      component: ShadbalaComponent.DRIK_BALA,
      subcomponent: ShadbalaSubcomponent.DRIK_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: values.drik ?? 15.0,
      unit: 'SHASTIAMSA'
    }
  ];

  describe('Validation & Error Handling', () => {
    it('throws TypeError if input is null or undefined', () => {
      // @ts-expect-error test invalid input
      expect(() => calculateShadbala(null)).toThrow(TypeError);
      // @ts-expect-error test invalid input
      expect(() => calculateShadbala(undefined)).toThrow(TypeError);
    });

    it('throws TypeError if planet is missing', () => {
      // @ts-expect-error test missing planet
      expect(() => calculateShadbala({ components: [] })).toThrow(TypeError);
      // @ts-expect-error test empty planet string
      expect(() => calculateShadbala({ planet: '', components: [] })).toThrow(TypeError);
    });

    it('throws TypeError if components is missing or not an array', () => {
      // @ts-expect-error test missing components
      expect(() => calculateShadbala({ planet: Planet.SUN })).toThrow(TypeError);
      // @ts-expect-error test non-array components
      expect(() => calculateShadbala({ planet: Planet.SUN, components: 'invalid' })).toThrow(TypeError);
    });

    it('throws TypeError if planet is invalid', () => {
      // @ts-expect-error test invalid planet
      expect(() => calculateShadbala({ planet: 'PLUTO', components: [] })).toThrow(TypeError);
    });

    it('throws Error if a calculated component has NaN or non-finite value', () => {
      const components: PlanetStrengthComponent[] = [
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.STHANA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: NaN,
          unit: 'SHASTIAMSA'
        }
      ];
      expect(() =>
        calculateShadbala({
          planet: Planet.SUN,
          components,
          completeKalaBala: 100
        })
      ).toThrow(/Calculated Shadbala component STHANA_BALA\/STHANA_BALA has an invalid value/);
    });
  });

  describe('Node Policy for Rahu and Ketu', () => {
    it('returns INCOMPLETE with all 6 components missing for Rahu and Ketu', () => {
      const rahuRes = calculateShadbala({
        planet: Planet.RAHU,
        components: createCompleteComponents({}),
        completeKalaBala: 120
      });

      expect(rahuRes.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
      expect(rahuRes.missingComponents).toEqual([
        ShadbalaComponent.STHANA_BALA,
        ShadbalaComponent.DIG_BALA,
        ShadbalaComponent.KALA_BALA,
        ShadbalaComponent.CHESHTA_BALA,
        ShadbalaComponent.NAISARGIKA_BALA,
        ShadbalaComponent.DRIK_BALA
      ]);
      expect(rahuRes.totalShastiamsa).toBeUndefined();
      expect(rahuRes.minimumRequirement).toBeUndefined();
      expect(rahuRes.reason).toBe(
        'Rahu/Ketu do not have a canonical P-11 minimum Shadbala requirement in the repository methodology.'
      );

      const ketuRes = calculateShadbala({
        planet: Planet.KETU,
        components: createCompleteComponents({}),
        completeKalaBala: 120
      });
      expect(ketuRes.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
    });
  });

  describe('Kala Bala Gating', () => {
    it('treats KALA_BALA as missing when completeKalaBala is undefined, even if kalaBalaCoreTotal exists', () => {
      const components = createCompleteComponents({});
      const res = calculateShadbala({
        planet: Planet.SUN,
        components,
        kalaBalaCoreTotal: 250.0,
        completeKalaBala: undefined
      });

      expect(res.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
      expect(res.missingComponents).toContain(ShadbalaComponent.KALA_BALA);
      expect(res.totalShastiamsa).toBeUndefined();
      expect(res.totalRupa).toBeUndefined();
    });

    it('treats KALA_BALA as missing when completeKalaBala is NaN or non-finite', () => {
      const components = createCompleteComponents({});
      const res = calculateShadbala({
        planet: Planet.SUN,
        components,
        completeKalaBala: NaN
      });

      expect(res.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
      expect(res.missingComponents).toContain(ShadbalaComponent.KALA_BALA);
    });
  });

  describe('Missing Components Handling', () => {
    it('reports all uncalculated or missing components', () => {
      const partialComponents: PlanetStrengthComponent[] = [
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.STHANA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 150.0
        },
        {
          component: ShadbalaComponent.DIG_BALA,
          subcomponent: ShadbalaSubcomponent.DIG_BALA,
          status: StrengthComponentStatus.NOT_IMPLEMENTED
        }
      ];

      const res = calculateShadbala({
        planet: Planet.MARS,
        components: partialComponents,
        completeKalaBala: 100
      });

      expect(res.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
      expect(res.missingComponents).toEqual([
        ShadbalaComponent.DIG_BALA,
        ShadbalaComponent.CHESHTA_BALA,
        ShadbalaComponent.NAISARGIKA_BALA,
        ShadbalaComponent.DRIK_BALA
      ]);
      expect(res.reason).toContain('DIG_BALA, CHESHTA_BALA, NAISARGIKA_BALA, DRIK_BALA');
      expect(res.totalShastiamsa).toBeUndefined();
      expect(res.meetsMinimum).toBeUndefined();
    });
  });

  describe('Complete Aggregation & Mathematical Precision', () => {
    it('correctly aggregates Jupiter components with expected totals and ratios', () => {
      // Sthana Aggregate: 200.0, Dig: 50.0, Kala: 120.0, Cheshta: 40.0, Naisargika: 34.29, Drik: 15.0 -> Total: 459.29
      const components = createCompleteComponents({
        sthana: 200.0,
        dig: 50.0,
        kala: 120.0,
        cheshta: 40.0,
        naisargika: 34.29,
        drik: 15.0
      });

      const res = calculateShadbala({
        planet: Planet.JUPITER,
        components,
        completeKalaBala: 120.0
      });

      expect(res.status).toBe(ShadbalaAggregationStatus.COMPLETE);
      expect(res.totalShastiamsa).toBe(459.29);
      expect(res.totalRupa).toBe(7.65);
      expect(res.minimumRequirement).toEqual(SHADBALA_MINIMUM_REQUIREMENTS.JUPITER);
      expect(res.minimumRequirement?.requiredShastiamsa).toBe(390);
      expect(res.minimumRequirement?.requiredRupa).toBe(6.5);
      expect(res.ratioToMinimum).toBe(1.1777);
      expect(res.percentageOfMinimum).toBe(117.77);
      expect(res.meetsMinimum).toBe(true);
      expect(res.missingComponents).toEqual([]);
      expect(res.reason).toBe(
        'Complete Shadbala is the sum of Sthana, Dig, Kala, Cheshta, Naisargika and Drik Bala.'
      );
    });

    it('uses the Sthana Bala aggregate value (200) and not the first subcomponent Uchcha Bala (40)', () => {
      const components = createCompleteComponents({
        uchcha: 40.0,
        saptavargaja: 80.0,
        ojaYugma: 30.0,
        kendradi: 30.0,
        drekkana: 20.0,
        sthana: 200.0,
        dig: 50.0,
        kala: 120.0,
        cheshta: 40.0,
        naisargika: 34.29,
        drik: 15.0
      });

      const res = calculateShadbala({
        planet: Planet.JUPITER,
        components,
        completeKalaBala: 120.0
      });

      // Total with Sthana aggregate (200.0) = 200 + 50 + 120 + 40 + 34.29 + 15 = 459.29
      // If Uchcha Bala (40.0) were incorrectly picked, total would be 299.29
      expect(res.totalShastiamsa).toBe(459.29);
      expect(res.totalShastiamsa).not.toBe(299.29);
      expect(res.totalRupa).toBe(7.65);
      expect(res.ratioToMinimum).toBe(1.1777);
      expect(res.percentageOfMinimum).toBe(117.77);
      expect(res.meetsMinimum).toBe(true);
    });

    it('evaluates threshold boundary for Sun (minimum 390): 390 passes, 389.99 fails', () => {
      // Passing case: 390.0
      const passComponents = createCompleteComponents({
        sthana: 150.0,
        dig: 50.0,
        kala: 100.0,
        cheshta: 40.0,
        naisargika: 35.0,
        drik: 15.0
      }); // total = 390.0

      const passRes = calculateShadbala({
        planet: Planet.SUN,
        components: passComponents,
        completeKalaBala: 100.0
      });
      expect(passRes.totalShastiamsa).toBe(390.0);
      expect(passRes.meetsMinimum).toBe(true);
      expect(passRes.ratioToMinimum).toBe(1.0);
      expect(passRes.percentageOfMinimum).toBe(100.0);

      // Failing case: 389.99
      const failComponents = createCompleteComponents({
        sthana: 150.0,
        dig: 50.0,
        kala: 100.0,
        cheshta: 40.0,
        naisargika: 34.99,
        drik: 15.0
      }); // total = 389.99

      const failRes = calculateShadbala({
        planet: Planet.SUN,
        components: failComponents,
        completeKalaBala: 100.0
      });
      expect(failRes.totalShastiamsa).toBe(389.99);
      expect(failRes.meetsMinimum).toBe(false);
      expect(failRes.ratioToMinimum).toBe(1.0); // 389.99 / 390 = 0.999974 -> 1.0000
      expect(failRes.percentageOfMinimum).toBe(100.0);
    });

    it('preserves negative Drik Bala without clamping', () => {
      const components = createCompleteComponents({
        sthana: 100.0,
        dig: 30.0,
        kala: 80.0,
        cheshta: 20.0,
        naisargika: 15.0,
        drik: -25.0 // negative Drik Bala
      });

      const res = calculateShadbala({
        planet: Planet.SATURN,
        components,
        completeKalaBala: 80.0
      });

      expect(res.status).toBe(ShadbalaAggregationStatus.COMPLETE);
      expect(res.totalShastiamsa).toBe(220.0); // 100 + 30 + 80 + 20 + 15 - 25 = 220
      expect(res.totalRupa).toBe(3.67);
      expect(res.minimumRequirement?.requiredShastiamsa).toBe(300);
      expect(res.meetsMinimum).toBe(false);
    });
  });

  describe('Immutability & Determinism', () => {
    it('returns frozen objects and arrays', () => {
      const components = createCompleteComponents({});
      const res = calculateShadbala({
        planet: Planet.VENUS,
        components,
        completeKalaBala: 120.0
      });

      expect(Object.isFrozen(res)).toBe(true);
      expect(Object.isFrozen(res.missingComponents)).toBe(true);
      if (res.minimumRequirement) {
        expect(Object.isFrozen(res.minimumRequirement)).toBe(true);
      }
    });

    it('is strictly deterministic across multiple invocations', () => {
      const input: ShadbalaAggregationInput = {
        planet: Planet.MERCURY,
        components: createCompleteComponents({ sthana: 180.0, dig: 60.0 }),
        completeKalaBala: 110.0
      };

      const res1 = calculateShadbala(input);
      const res2 = calculateShadbala(input);
      expect(res1).toEqual(res2);
    });

    it('does not mutate input components array or objects', () => {
      const components = createCompleteComponents({});
      const cloned = JSON.parse(JSON.stringify(components));

      calculateShadbala({
        planet: Planet.MOON,
        components,
        completeKalaBala: 100.0
      });

      expect(components).toEqual(cloned);
    });
  });
});
