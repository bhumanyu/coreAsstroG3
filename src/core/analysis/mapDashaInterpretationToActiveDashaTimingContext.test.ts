import { describe, it, expect } from 'vitest';
import { Planet, DashaSystem } from '../../types';
import type {
  DashaInterpretationReport,
  DashaPlanetActivation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { mapDashaInterpretationToActiveDashaTimingContext } from './mapDashaInterpretationToActiveDashaTimingContext';

const mockNatal = (planet: Planet): DashaPlanetActivation =>
  ({
    planet,
    period: 'MAHADASHA',
    strength: { availability: 'AVAILABLE' },
    activation: 'ACTIVE',
    confidence: 'HIGH'
  }) as unknown as DashaPlanetActivation;

describe('mapDashaInterpretationToActiveDashaTimingContext', () => {
  it('complete Dasha report returns correct planet values', () => {
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Ashwini',
        nakshatraLord: Planet.KETU,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      mahadashas: [],
      current: {
        at: '2024-06-15T00:00:00.000Z',
        mahadasha: {
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.JUPITER),
          antardashas: [],
          evidence: [],
          confidence: 'HIGH'
        },
        antardasha: {
          planet: Planet.SATURN,
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.SATURN),
          pratyantardashas: [],
          evidence: [],
          confidence: 'MEDIUM'
        },
        pratyantardasha: {
          planet: Planet.MERCURY,
          start: '2026-05-01T00:00:00.000Z',
          end: '2026-08-01T00:00:00.000Z',
          natal: mockNatal(Planet.MERCURY),
          evidence: [],
          confidence: 'MEDIUM'
        },
        evidence: [],
        confidence: 'HIGH'
      },
      confidence: 'HIGH'
    };

    const result = mapDashaInterpretationToActiveDashaTimingContext(report);

    expect(result).not.toBeNull();
    expect(result?.mahadashaPlanet).toBe(Planet.JUPITER);
    expect(result?.antardashaPlanet).toBe(Planet.SATURN);
    expect(result?.pratyantardashaPlanet).toBe(Planet.MERCURY);
  });

  it('undefined report returns null', () => {
    const result = mapDashaInterpretationToActiveDashaTimingContext(undefined);
    expect(result).toBeNull();
  });

  it('report with current: undefined returns null', () => {
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Ashwini',
        nakshatraLord: Planet.KETU,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      mahadashas: [],
      current: undefined,
      confidence: 'HIGH'
    };

    const result = mapDashaInterpretationToActiveDashaTimingContext(report);
    expect(result).toBeNull();
  });

  it('incomplete report missing mahadasha planet returns null', () => {
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Ashwini',
        nakshatraLord: Planet.KETU,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      mahadashas: [],
      current: {
        at: '2024-06-15T00:00:00.000Z',
        mahadasha: {
          planet: undefined as unknown as Planet,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.JUPITER),
          antardashas: [],
          evidence: [],
          confidence: 'HIGH'
        },
        antardasha: {
          planet: Planet.SATURN,
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.SATURN),
          pratyantardashas: [],
          evidence: [],
          confidence: 'MEDIUM'
        },
        pratyantardasha: {
          planet: Planet.MERCURY,
          start: '2026-05-01T00:00:00.000Z',
          end: '2026-08-01T00:00:00.000Z',
          natal: mockNatal(Planet.MERCURY),
          evidence: [],
          confidence: 'MEDIUM'
        },
        evidence: [],
        confidence: 'HIGH'
      },
      confidence: 'HIGH'
    };

    const result = mapDashaInterpretationToActiveDashaTimingContext(report);
    expect(result).toBeNull();
  });

  it('incomplete report missing antardasha planet returns null', () => {
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Ashwini',
        nakshatraLord: Planet.KETU,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      mahadashas: [],
      current: {
        at: '2024-06-15T00:00:00.000Z',
        mahadasha: {
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.JUPITER),
          antardashas: [],
          evidence: [],
          confidence: 'HIGH'
        },
        antardasha: {
          planet: undefined as unknown as Planet,
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.SATURN),
          pratyantardashas: [],
          evidence: [],
          confidence: 'MEDIUM'
        },
        pratyantardasha: {
          planet: Planet.MERCURY,
          start: '2026-05-01T00:00:00.000Z',
          end: '2026-08-01T00:00:00.000Z',
          natal: mockNatal(Planet.MERCURY),
          evidence: [],
          confidence: 'MEDIUM'
        },
        evidence: [],
        confidence: 'HIGH'
      },
      confidence: 'HIGH'
    };

    const result = mapDashaInterpretationToActiveDashaTimingContext(report);
    expect(result).toBeNull();
  });

  it('incomplete report missing pratyantardasha planet returns null', () => {
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Ashwini',
        nakshatraLord: Planet.KETU,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      mahadashas: [],
      current: {
        at: '2024-06-15T00:00:00.000Z',
        mahadasha: {
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.JUPITER),
          antardashas: [],
          evidence: [],
          confidence: 'HIGH'
        },
        antardasha: {
          planet: Planet.SATURN,
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.SATURN),
          pratyantardashas: [],
          evidence: [],
          confidence: 'MEDIUM'
        },
        pratyantardasha: {
          planet: undefined as unknown as Planet,
          start: '2026-05-01T00:00:00.000Z',
          end: '2026-08-01T00:00:00.000Z',
          natal: mockNatal(Planet.MERCURY),
          evidence: [],
          confidence: 'MEDIUM'
        },
        evidence: [],
        confidence: 'HIGH'
      },
      confidence: 'HIGH'
    };

    const result = mapDashaInterpretationToActiveDashaTimingContext(report);
    expect(result).toBeNull();
  });

  it('no-mutation: source report remains unchanged after mapping', () => {
    const report: DashaInterpretationReport = {
      system: DashaSystem.VIMSHOTTARI,
      birthAnchor: {
        nakshatra: 'Ashwini',
        nakshatraLord: Planet.KETU,
        nakshatraProgress: 0.5,
        remainingFraction: 0.5
      },
      mahadashas: [],
      current: {
        at: '2024-06-15T00:00:00.000Z',
        mahadasha: {
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.JUPITER),
          antardashas: [],
          evidence: [],
          confidence: 'HIGH'
        },
        antardasha: {
          planet: Planet.SATURN,
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z',
          natal: mockNatal(Planet.SATURN),
          pratyantardashas: [],
          evidence: [],
          confidence: 'MEDIUM'
        },
        pratyantardasha: {
          planet: Planet.MERCURY,
          start: '2026-05-01T00:00:00.000Z',
          end: '2026-08-01T00:00:00.000Z',
          natal: mockNatal(Planet.MERCURY),
          evidence: [],
          confidence: 'MEDIUM'
        },
        evidence: [],
        confidence: 'HIGH'
      },
      confidence: 'HIGH'
    };

    // Deep clone the input report
    const reportClone = JSON.parse(JSON.stringify(report));

    // Run the mapper
    mapDashaInterpretationToActiveDashaTimingContext(report);

    // Assert the source report is unchanged
    expect(report).toEqual(reportClone);
  });
});
