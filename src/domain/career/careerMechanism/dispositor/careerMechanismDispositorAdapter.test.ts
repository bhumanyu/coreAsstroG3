import { describe, expect, it } from 'vitest';
import { Planet } from '../../../../types';
import {
  CareerDispositorParticipantIdentityError,
  defaultCareerDispositorContextFactory
} from './careerMechanismDispositorAdapter';

const horoscope = {} as any;
const engine = {
  resolve: (planet: Planet) => ({
    startPlanetId: planet,
    chain: Object.freeze([planet]),
    terminalPlanetId: planet,
    depth: 0,
    outcome: 'SELF_DISPOSITOR' as const,
    chainId: `${planet}_CHAIN`,
    provenanceIds: Object.freeze([`PROVENANCE:${planet}`])
  })
};

function candidate(overrides: Record<string, unknown> = {}) {
  return {
    candidateId: 'CANDIDATE_1',
    patternId: 'PATTERN_1',
    mechanismType: 'AGENCY',
    pathway: 'PATTERN',
    evidence: [],
    provenance: {
      patternIds: [], relationshipIds: [], participantIds: ['PLANET:SUN'],
      evidenceIds: [], sourceStages: ['PATTERN']
    },
    explanation: 'test',
    ...overrides
  } as any;
}

describe('DefaultCareerDispositorContextFactory provenance contract', () => {
  it('marks a chain without matching source evidence insufficient', () => {
    const contexts = defaultCareerDispositorContextFactory.create(candidate(), engine, horoscope);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].sufficientData).toBe(false);
    expect(contexts[0].sourceEvidenceIds).toEqual([]);
  });

  it('does not attribute evidence belonging to another participant', () => {
    const contexts = defaultCareerDispositorContextFactory.create(candidate({
      evidence: [{ evidenceId: 'MOON_EVIDENCE', participantIds: ['PLANET:MOON'] }]
    }), engine, horoscope);
    expect(contexts[0].sourceEvidenceIds).toEqual([]);
    expect(contexts[0].sufficientData).toBe(false);
  });

  it('rejects malformed participant IDs with a candidate-scoped identity error', () => {
    expect(() => defaultCareerDispositorContextFactory.create(candidate({
      provenance: { participantIds: ['PLANET:PLUTO', 'SUN'] }
    }), engine, horoscope)).toThrow(CareerDispositorParticipantIdentityError);
  });
});
