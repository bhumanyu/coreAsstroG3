import type { 
  ActiveDashaInterpretation,
  DashaPlanetActivation,
  DashaPairInterpretation,
  InterpretationConfidence,
  DashaDirectionalSynthesis
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  DashaInterpretationProduct,
  DashaPlanetProduct,
  DashaPairProduct,
  DashaLevel
} from './dashaInterpretationProductTypes';

function mapDashaPlanet(
  activation: DashaPlanetActivation | undefined,
  level: DashaLevel,
  start: string,
  end: string,
  confidence: InterpretationConfidence,
  planetarySynthesis?: DashaDirectionalSynthesis
): DashaPlanetProduct | undefined {
  if (!activation) {
    return undefined;
  }

  // Preserve richer deterministic astrological details:
  // While activation.evidence conveys human-readable narrative statements,
  // it lacks structured quantitative metrics (totalRupa, percentageOfMinimum, etc.)
  // and structured aspect/yoga participant references. We expose these deterministic
  // details on DashaPlanetProduct for programmatic consumers while keeping evidence as the narrative spine.
  return {
    planet: activation.planet,
    level,
    start,
    end,
    placement: {
      sign: String(activation.sign),
      house: activation.house
    },
    ownedHouses: activation.ownedHouses ?? [],
    functionalRoles: Array.isArray(activation.functionalRoles)
      ? activation.functionalRoles.map((r) => String(r))
      : [],
    functionalNature: activation.functionalNature ? String(activation.functionalNature) : undefined,
    dignity: activation.dignity ? String(activation.dignity) : undefined,
    state: activation.state?.condition ?? (typeof activation.state === 'string' ? activation.state : undefined),
    strength: activation.strength
      ? {
          availability: activation.strength.availability ?? 'AVAILABLE',
          totalRupa: activation.strength.totalRupa,
          totalShastiamsa: activation.strength.totalShastiamsa,
          percentageOfMinimum: activation.strength.percentageOfMinimum,
          meetsMinimum: activation.strength.meetsMinimum,
          shadbalaStatus: activation.strength.shadbalaStatus
        }
      : undefined,
    castAspects: activation.castAspects,
    receivedAspects: activation.receivedAspects,
    yogaParticipation: activation.yogaParticipation,
    evidence: activation.evidence ?? [],
    confidence,
    planetarySynthesis
  };
}

function mapDashaPair(pair: DashaPairInterpretation): DashaPairProduct {
  return {
    mahadashaLord: pair.mahadashaLord,
    antardashaLord: pair.antardashaLord,
    sharedHouses: pair.sharedHouses ?? [],
    combinedHouseSet: pair.combinedHouseSet ?? [],
    relationshipEvidence: pair.relationshipEvidence ?? []
  };
}

export function buildDashaInterpretationProduct(
  current?: ActiveDashaInterpretation
): DashaInterpretationProduct {
  if (!current) {
    return {
      status: 'UNAVAILABLE',
      evidence: []
    };
  }

  return {
    status: 'AVAILABLE',
    mahadasha: current.mahadasha
      ? mapDashaPlanet(
          current.mahadasha.natal,
          'MAHADASHA',
          current.mahadasha.start,
          current.mahadasha.end,
          current.mahadasha.confidence,
          current.mahadasha.planetarySynthesis
        )
      : undefined,
    antardasha: current.antardasha
      ? mapDashaPlanet(
          current.antardasha.natal,
          'ANTARDASHA',
          current.antardasha.start,
          current.antardasha.end,
          current.antardasha.confidence,
          current.antardasha.planetarySynthesis
        )
      : undefined,
    pratyantardasha: current.pratyantardasha
      ? mapDashaPlanet(
          current.pratyantardasha.natal,
          'PRATYANTARDASHA',
          current.pratyantardasha.start,
          current.pratyantardasha.end,
          current.pratyantardasha.confidence,
          current.pratyantardasha.planetarySynthesis
        )
      : undefined,
    pair: current.antardasha?.pairInterpretation 
      ? mapDashaPair(current.antardasha.pairInterpretation)
      : undefined,
    evidence: current.evidence ?? [],
    confidence: current.confidence,
    at: current.at
  };
}
