import { Planet } from '../../../../types';
import type {
  ActiveDashaState,
  MahadashaPeriod,
  AntardashaPeriod,
  PratyantardashaPeriod
} from '../../../../engine/dasha/vimshottari';
import type {
  CareerDashaSynthesis,
  CareerDashaEffect,
  CareerDashaPlanetSynthesis,
  CareerDashaFactor
} from '../../../career/careerDasha/careerDashaSynthesisTypes';
import type { InterpretationConfidence } from '../../../../engine/planetInterpretation/planetInterpretationTypes';

export interface MockActiveDashaOptions {
  mdPlanet?: Planet;
  adPlanet?: Planet;
  pdPlanet?: Planet;
  mdStart?: string;
  mdEnd?: string;
  adStart?: string;
  adEnd?: string;
  pdStart?: string;
  pdEnd?: string;
}

export function createMockActiveDashaState(options?: MockActiveDashaOptions): ActiveDashaState {
  const mdPlanet = options?.mdPlanet ?? Planet.JUPITER;
  const adPlanet = options?.adPlanet ?? Planet.SATURN;
  const pdPlanet = options?.pdPlanet ?? Planet.MERCURY;

  const mdStart = options?.mdStart ?? '2020-01-01T00:00:00Z';
  const mdEnd = options?.mdEnd ?? '2036-01-01T00:00:00Z';
  const adStart = options?.adStart ?? '2025-01-01T00:00:00Z';
  const adEnd = options?.adEnd ?? '2027-01-01T00:00:00Z';
  const pdStart = options?.pdStart ?? '2026-05-01T00:00:00Z';
  const pdEnd = options?.pdEnd ?? '2026-08-01T00:00:00Z';

  const pratyantardasha: PratyantardashaPeriod = {
    planet: pdPlanet,
    start: pdStart,
    end: pdEnd
  };

  const antardasha: AntardashaPeriod = {
    planet: adPlanet,
    start: adStart,
    end: adEnd,
    pratyantardashas: [pratyantardasha]
  };

  const mahadasha: MahadashaPeriod = {
    planet: mdPlanet,
    start: mdStart,
    end: mdEnd,
    antardashas: [antardasha]
  };

  return {
    mahadasha,
    antardasha,
    pratyantardasha
  };
}

export function createMockCareerDashaSynthesis(options?: {
  combinedEffect?: CareerDashaEffect;
  combinedConfidence?: InterpretationConfidence;
  combinedScore?: number;
  mdPlanet?: Planet;
  adPlanet?: Planet;
  pdPlanet?: Planet;
  mdEffect?: CareerDashaEffect;
  adEffect?: CareerDashaEffect;
  pdEffect?: CareerDashaEffect;
  mdConfidence?: InterpretationConfidence;
  adConfidence?: InterpretationConfidence;
  pdConfidence?: InterpretationConfidence;
  factors?: readonly CareerDashaFactor[];
}): CareerDashaSynthesis {
  const combinedEffect = options?.combinedEffect ?? 'SUPPORTS';
  const combinedConfidence = options?.combinedConfidence ?? 'HIGH';
  const combinedScore = options?.combinedScore ?? 3.0;
  const mdPlanet = options?.mdPlanet ?? Planet.JUPITER;
  const adPlanet = options?.adPlanet ?? Planet.SATURN;
  const pdPlanet = options?.pdPlanet ?? Planet.MERCURY;
  const mdEffect = options?.mdEffect ?? combinedEffect;
  const adEffect = options?.adEffect ?? combinedEffect;
  const pdEffect = options?.pdEffect ?? combinedEffect;
  const mdConfidence = options?.mdConfidence ?? 'HIGH';
  const adConfidence = options?.adConfidence ?? 'HIGH';
  const pdConfidence = options?.pdConfidence ?? 'HIGH';
  const factors = options?.factors ?? [];

  const mdSynthesis: CareerDashaPlanetSynthesis = {
    period: 'MD',
    planet: mdPlanet,
    effect: mdEffect,
    confidence: mdConfidence,
    supportScore: 2.5,
    challengeScore: 0,
    netScore: 2.5,
    factors,
    supportingFactorIds: factors.filter((f) => f.direction === 'SUPPORT').map((f) => f.id),
    challengingFactorIds: factors.filter((f) => f.direction === 'CHALLENGE').map((f) => f.id),
    neutralFactorIds: factors.filter((f) => f.direction === 'NEUTRAL').map((f) => f.id),
    activatedCareerHouses: [10],
    d10Effect: 'SUPPORTS',
    summary: 'MD summary'
  };

  const adSynthesis: CareerDashaPlanetSynthesis = {
    period: 'AD',
    planet: adPlanet,
    effect: adEffect,
    confidence: adConfidence,
    supportScore: 1.5,
    challengeScore: 0,
    netScore: 1.5,
    factors: [],
    supportingFactorIds: [],
    challengingFactorIds: [],
    neutralFactorIds: [],
    activatedCareerHouses: [10],
    d10Effect: 'SUPPORTS',
    summary: 'AD summary'
  };

  const pdSynthesis: CareerDashaPlanetSynthesis = {
    period: 'PD',
    planet: pdPlanet,
    effect: pdEffect,
    confidence: pdConfidence,
    supportScore: 1.0,
    challengeScore: 0,
    netScore: 1.0,
    factors: [],
    supportingFactorIds: [],
    challengingFactorIds: [],
    neutralFactorIds: [],
    activatedCareerHouses: [10],
    d10Effect: 'SUPPORTS',
    summary: 'PD summary'
  };

  return {
    natalPromiseProtected: true,
    reasoningVersion: 'CW-02',
    timing: {
      md: { period: 'MD', planet: mdPlanet },
      ad: { period: 'AD', planet: adPlanet },
      pd: { period: 'PD', planet: pdPlanet }
    },
    md: mdSynthesis,
    ad: adSynthesis,
    pd: pdSynthesis,
    combined: {
      hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
      md: mdSynthesis,
      ad: adSynthesis,
      pd: pdSynthesis,
      combinedEffect,
      combinedConfidence,
      combinedScore,
      summary: `Combined effect ${combinedEffect}`
    },
    factors,
    summary: `Summary ${combinedEffect}`
  };
}

