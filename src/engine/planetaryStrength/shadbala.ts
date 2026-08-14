import {
  Planet,
  PlanetStrengthComponent,
  ShadbalaComponent,
  ShadbalaSubcomponent,
  ShadbalaAggregation,
  ShadbalaAggregationStatus,
  StrengthComponentStatus,
  SHADBALA_MINIMUM_REQUIREMENTS
} from '../../types';
import { shastiamsaToRupa } from './rupa';

export interface ShadbalaAggregationInput {
  readonly planet: Planet;
  readonly components: readonly PlanetStrengthComponent[];
  readonly kalaBalaCoreTotal?: number;
  readonly completeKalaBala?: number;
}

const REQUIRED_COMPONENTS: readonly ShadbalaComponent[] = Object.freeze([
  ShadbalaComponent.STHANA_BALA,
  ShadbalaComponent.DIG_BALA,
  ShadbalaComponent.KALA_BALA,
  ShadbalaComponent.CHESHTA_BALA,
  ShadbalaComponent.NAISARGIKA_BALA,
  ShadbalaComponent.DRIK_BALA
]);

const COMPONENT_SUBCOMPONENTS: Readonly<Record<Exclude<ShadbalaComponent, ShadbalaComponent.KALA_BALA>, ShadbalaSubcomponent>> = Object.freeze({
  [ShadbalaComponent.STHANA_BALA]: ShadbalaSubcomponent.STHANA_BALA,
  [ShadbalaComponent.DIG_BALA]: ShadbalaSubcomponent.DIG_BALA,
  [ShadbalaComponent.CHESHTA_BALA]: ShadbalaSubcomponent.CHESHTA_BALA,
  [ShadbalaComponent.NAISARGIKA_BALA]: ShadbalaSubcomponent.NAISARGIKA_BALA,
  [ShadbalaComponent.DRIK_BALA]: ShadbalaSubcomponent.DRIK_BALA
});

const VALID_PLANETS = new Set<string>(Object.values(Planet));

function getCalculatedAggregateValue(
  components: readonly PlanetStrengthComponent[],
  component: ShadbalaComponent,
  subcomponent: ShadbalaSubcomponent
): number | undefined {
  const item = components.find(
    (c) => c.component === component && c.subcomponent === subcomponent
  );
  if (!item) {
    return undefined;
  }
  if (item.status === StrengthComponentStatus.CALCULATED) {
    const val = item.shastiamsaValue ?? item.value;
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      throw new Error(`Calculated Shadbala component ${component}/${subcomponent} has an invalid value.`);
    }
    return val;
  }
  return undefined;
}

export function calculateShadbala(input: ShadbalaAggregationInput): ShadbalaAggregation {
  if (!input) {
    throw new TypeError('calculateShadbala: input is required');
  }
  if (input.planet === null || input.planet === undefined || (input.planet as unknown) === '') {
    throw new TypeError('calculateShadbala: planet is required');
  }
  if (!Array.isArray(input.components)) {
    throw new TypeError('calculateShadbala: components must be an array');
  }
  if (typeof input.planet !== 'string' || !VALID_PLANETS.has(input.planet)) {
    throw new TypeError('calculateShadbala: invalid planet');
  }

  const planet = input.planet;

  // Node policy for RAHU and KETU
  if (planet === Planet.RAHU || planet === Planet.KETU) {
    return Object.freeze({
      status: ShadbalaAggregationStatus.INCOMPLETE,
      missingComponents: Object.freeze([
        ShadbalaComponent.STHANA_BALA,
        ShadbalaComponent.DIG_BALA,
        ShadbalaComponent.KALA_BALA,
        ShadbalaComponent.CHESHTA_BALA,
        ShadbalaComponent.NAISARGIKA_BALA,
        ShadbalaComponent.DRIK_BALA
      ]),
      reason: 'Rahu/Ketu do not have a canonical P-11 minimum Shadbala requirement in the repository methodology.'
    });
  }

  const missingComponents: ShadbalaComponent[] = [];

  for (const comp of REQUIRED_COMPONENTS) {
    if (comp === ShadbalaComponent.KALA_BALA) {
      if (typeof input.completeKalaBala !== 'number' || !Number.isFinite(input.completeKalaBala)) {
        missingComponents.push(ShadbalaComponent.KALA_BALA);
      }
    } else {
      const subcomp = COMPONENT_SUBCOMPONENTS[comp];
      const val = getCalculatedAggregateValue(input.components, comp, subcomp);
      if (val === undefined) {
        missingComponents.push(comp);
      }
    }
  }

  if (missingComponents.length > 0) {
    return Object.freeze({
      status: ShadbalaAggregationStatus.INCOMPLETE,
      missingComponents: Object.freeze(missingComponents),
      reason: `Complete Shadbala aggregation is unavailable because the following components are incomplete: ${missingComponents.join(', ')}.`
    });
  }

  const sthana = getCalculatedAggregateValue(input.components, ShadbalaComponent.STHANA_BALA, ShadbalaSubcomponent.STHANA_BALA)!;
  const dig = getCalculatedAggregateValue(input.components, ShadbalaComponent.DIG_BALA, ShadbalaSubcomponent.DIG_BALA)!;
  const completeKalaBala = input.completeKalaBala!;
  const cheshta = getCalculatedAggregateValue(input.components, ShadbalaComponent.CHESHTA_BALA, ShadbalaSubcomponent.CHESHTA_BALA)!;
  const naisargika = getCalculatedAggregateValue(input.components, ShadbalaComponent.NAISARGIKA_BALA, ShadbalaSubcomponent.NAISARGIKA_BALA)!;
  const drik = getCalculatedAggregateValue(input.components, ShadbalaComponent.DRIK_BALA, ShadbalaSubcomponent.DRIK_BALA)!;

  const rawTotal = sthana + dig + completeKalaBala + cheshta + naisargika + drik;
  const totalShastiamsa = Number(rawTotal.toFixed(2));
  const totalRupa = shastiamsaToRupa(totalShastiamsa);

  const minimum = SHADBALA_MINIMUM_REQUIREMENTS[planet];
  if (!minimum) {
    throw new TypeError('No minimum requirement for planet');
  }

  const ratioToMinimum = Number((totalShastiamsa / minimum.requiredShastiamsa).toFixed(4));
  const percentageOfMinimum = Number((ratioToMinimum * 100).toFixed(2));
  const meetsMinimum = totalShastiamsa >= minimum.requiredShastiamsa;

  return Object.freeze({
    status: ShadbalaAggregationStatus.COMPLETE,
    totalShastiamsa,
    totalRupa,
    minimumRequirement: minimum,
    ratioToMinimum,
    percentageOfMinimum,
    meetsMinimum,
    missingComponents: Object.freeze([]),
    reason: 'Complete Shadbala is the sum of Sthana, Dig, Kala, Cheshta, Naisargika and Drik Bala.'
  });
}
