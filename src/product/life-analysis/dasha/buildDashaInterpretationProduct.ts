import type { 
  ActiveDashaInterpretation,
  DashaPlanetActivation,
  DashaPairInterpretation,
  InterpretationConfidence
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
  confidence: InterpretationConfidence
): DashaPlanetProduct {
  if (!activation) {
    return {
      planet: 'SUN' as any,
      level,
      start,
      end,
      placement: {
        sign: 'ARIES',
        house: 1
      },
      ownedHouses: [],
      functionalRoles: [],
      evidence: [],
      confidence: confidence ?? 'MEDIUM'
    };
  }

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
          availability: activation.strength.availability ?? 'AVAILABLE'
        }
      : undefined,
    evidence: activation.evidence ?? [],
    confidence
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
          current.mahadasha.confidence
        )
      : undefined,
    antardasha: current.antardasha
      ? mapDashaPlanet(
          current.antardasha.natal,
          'ANTARDASHA',
          current.antardasha.start,
          current.antardasha.end,
          current.antardasha.confidence
        )
      : undefined,
    pratyantardasha: current.pratyantardasha
      ? mapDashaPlanet(
          current.pratyantardasha.natal,
          'PRATYANTARDASHA',
          current.pratyantardasha.start,
          current.pratyantardasha.end,
          current.pratyantardasha.confidence
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
