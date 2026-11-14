import type { 
  ActiveDashaInterpretation,
  DashaPlanetActivation,
  DashaPairInterpretation,
  InterpretationConfidence,
  DashaDirectionalSynthesis,
  DashaDomainSynthesis
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  DashaInterpretationProduct,
  DashaPlanetProduct,
  DashaPairProduct,
  DashaLevel,
  CanonicalCareerActivationProduct,
  DashaInterpretationDiagnostic
} from './dashaInterpretationProductTypes';
import type { Planet } from '../../../types';
import type {
  CareerDashaCanonicalAnalysis,
  CareerDashaCanonicalLevel
} from '../../../domain/career/careerDasha/careerDashaCanonicalTypes';
import { formatCanonicalDashaPeriodStatement } from '../../../domain/career/careerDasha/careerDashaPeriodStatement';

function mapCanonicalCareerActivation(
  planet: DashaPlanetActivation['planet'],
  level: CareerDashaCanonicalLevel,
  canonicalDasha?: CareerDashaCanonicalAnalysis
): CanonicalCareerActivationProduct | undefined {
  if (!canonicalDasha) {
    return undefined;
  }

  const period = canonicalDasha[level.toLowerCase() as 'md' | 'ad' | 'pd'];
  if (!period || period.planet !== planet) {
    return undefined;
  }

  const evidence = canonicalDasha.evidence.filter((item) => item.level === level);
  return {
    level,
    planet: period.planet,
    effect: period.effect,
    direction: period.direction,
    ...(period.conditionAssessment !== undefined
      ? { conditionAssessment: period.conditionAssessment }
      : {}),
    ...(period.afflictionAssessed !== undefined
      ? { afflictionAssessed: period.afflictionAssessed }
      : {}),
    ...(period.expressionEvidenceCount !== undefined
      ? { expressionEvidenceCount: period.expressionEvidenceCount }
      : {}),
    evidenceIds: evidence.map((item) => item.id).sort(),
    sourceIds: [...new Set(evidence.flatMap((item) => item.sourceIds))].sort(),
    ruleIds: [...new Set(evidence.flatMap((item) => item.provenance.ruleIds ?? []))].sort(),
    statement: formatCanonicalDashaPeriodStatement(period, evidence.length),
    ...(period.start ? { start: period.start } : {}),
    ...(period.end ? { end: period.end } : {})
  };
}

function mapDashaPlanet(
  activation: DashaPlanetActivation | undefined,
  level: DashaLevel,
  start: string,
  end: string,
  confidence: InterpretationConfidence,
  planetarySynthesis?: DashaDirectionalSynthesis,
  domainSynthesis?: readonly DashaDomainSynthesis[],
  canonicalCareerActivation?: CanonicalCareerActivationProduct
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
    planetarySynthesis,
    ...(canonicalCareerActivation ? { canonicalCareerActivation } : {}),
    ...(domainSynthesis
      ? { domainSynthesis: domainSynthesis.filter((item) => item.domain !== 'CAREER') }
      : {})
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

/**
 * Emits C9_PERIOD_PLANET_MISMATCH diagnostics when the engine dasha
 * interpretation and the canonical C9 career dasha analysis disagree on the
 * ruling planet for a period. Previously mapCanonicalCareerActivation
 * silently dropped the canonical activation in this case.
 */
function collectCanonicalMismatchDiagnostics(
  current: ActiveDashaInterpretation,
  canonicalDasha?: CareerDashaCanonicalAnalysis
): readonly DashaInterpretationDiagnostic[] {
  if (!canonicalDasha) {
    return [];
  }
  const checks: ReadonlyArray<{
    level: CareerDashaCanonicalLevel;
    activationPlanet: Planet | undefined;
  }> = [
    { level: 'MD', activationPlanet: current.mahadasha?.natal?.planet },
    { level: 'AD', activationPlanet: current.antardasha?.natal?.planet },
    { level: 'PD', activationPlanet: current.pratyantardasha?.natal?.planet }
  ];
  const diagnostics: DashaInterpretationDiagnostic[] = [];
  for (const { level, activationPlanet } of checks) {
    if (activationPlanet === undefined) {
      continue;
    }
    const canonicalPeriod = canonicalDasha[level.toLowerCase() as 'md' | 'ad' | 'pd'];
    if (canonicalPeriod && canonicalPeriod.planet !== activationPlanet) {
      diagnostics.push({
        code: 'C9_PERIOD_PLANET_MISMATCH',
        level,
        activationPlanet,
        ...(canonicalPeriod.planet !== undefined
          ? { canonicalPlanet: canonicalPeriod.planet }
          : {})
      });
    }
  }
  return diagnostics;
}

export function buildDashaInterpretationProduct(
  current?: ActiveDashaInterpretation,
  canonicalCareerDasha?: CareerDashaCanonicalAnalysis
): DashaInterpretationProduct {
  if (!current) {
    return {
      status: 'UNAVAILABLE',
      evidence: []
    };
  }

  const diagnostics = collectCanonicalMismatchDiagnostics(current, canonicalCareerDasha);

  return {
    status: 'AVAILABLE',
    mahadasha: current.mahadasha
      ? mapDashaPlanet(
          current.mahadasha.natal,
          'MAHADASHA',
          current.mahadasha.start,
          current.mahadasha.end,
          current.mahadasha.confidence,
          current.mahadasha.planetarySynthesis,
          current.mahadasha.domainSynthesis,
          mapCanonicalCareerActivation(
            current.mahadasha.natal?.planet,
            'MD',
            canonicalCareerDasha
          )
        )
      : undefined,
    antardasha: current.antardasha
      ? mapDashaPlanet(
          current.antardasha.natal,
          'ANTARDASHA',
          current.antardasha.start,
          current.antardasha.end,
          current.antardasha.confidence,
          current.antardasha.planetarySynthesis,
          current.antardasha.domainSynthesis,
          mapCanonicalCareerActivation(
            current.antardasha.natal?.planet,
            'AD',
            canonicalCareerDasha
          )
        )
      : undefined,
    pratyantardasha: current.pratyantardasha
      ? mapDashaPlanet(
          current.pratyantardasha.natal,
          'PRATYANTARDASHA',
          current.pratyantardasha.start,
          current.pratyantardasha.end,
          current.pratyantardasha.confidence,
          current.pratyantardasha.planetarySynthesis,
          current.pratyantardasha.domainSynthesis,
          mapCanonicalCareerActivation(
            current.pratyantardasha.natal?.planet,
            'PD',
            canonicalCareerDasha
          )
        )
      : undefined,
    pair: current.antardasha?.pairInterpretation 
      ? mapDashaPair(current.antardasha.pairInterpretation)
      : undefined,
    evidence: current.evidence ?? [],
    confidence: current.confidence,
    at: current.at,
    ...(diagnostics.length > 0 ? { diagnostics } : {})
  };
}
