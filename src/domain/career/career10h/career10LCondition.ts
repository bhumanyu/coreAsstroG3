import type { Planet, Sign, DignityStatus, PlanetAnalysisReport, PlanetAnalysisEvidence, PlanetAnalysisEvidenceType } from '../../../types';
import type { Career10HContext } from './career10HFoundationTypes';
import type { Career10LCondition, Career10LDataStatus } from './career10LFoundationTypes';
import type { CareerPlanetaryDignity, CareerPlanetaryMotion, CareerPlanetaryCombustion } from '../careerPlanetaryCondition';

/**
 * P2-07G Career 10L Condition Adapter
 *
 * This module adapts PlanetAnalysisReport to Career10LCondition for the 10th lord.
 * It extracts dignity, motion, combustion, and placement facts without interpretation.
 *
 * KEY CONSTRAINTS:
 * - Never fabricate data - return UNAVAILABLE when source is absent
 * - Map DignityStatus to CareerPlanetaryDignity with MOOLATRIKONA → OWN_SIGN fold
 * - Extract real ruleIds from PlanetAnalysisEvidence only
 * - No interpretation logic (e.g., no if (planet === SATURN && sign === PISCES) checks)
 */

/**
 * Resolves 10L condition from PlanetAnalysisReport.
 *
 * @param context10H - The 10H context containing the 10L identity
 * @param planetAnalysis - Optional PlanetAnalysisReport
 * @returns Career10LCondition with status and optional condition fields
 */
export function resolveCareer10LCondition(
  context10H: Career10HContext,
  planetAnalysis: PlanetAnalysisReport | undefined
): Career10LCondition {
  // If planetAnalysis is absent, return UNAVAILABLE
  if (!planetAnalysis) {
    return Object.freeze({
      status: 'UNAVAILABLE' as Career10LDataStatus,
      sourceRuleIds: Object.freeze([])
    });
  }

  // Look up the 10L in planetAnalysis
  const planetData = planetAnalysis.planets[context10H.house10Lord];
  if (!planetData) {
    return Object.freeze({
      status: 'UNAVAILABLE' as Career10LDataStatus,
      sourceRuleIds: Object.freeze([])
    });
  }

  // Map DignityStatus to CareerPlanetaryDignity
  // NOTE: MOOLATRIKONA is folded into OWN_SIGN per spec decision
  // This is a deliberate simplification to avoid expanding the career dignity union
  const dignity = mapDignityStatus(planetData.dignity?.status);

  // Map motion state
  const motion = mapMotionState(planetData.state?.motion?.retrograde);

  // Map combustion state
  const combustion = mapCombustionState(planetData.state?.condition);

  // Extract sign and house placement
  const sign = planetData.sign;
  const house = planetData.house;

  // Extract real ruleIds from PlanetAnalysisEvidence
  // Only include evidence for SIGN_PLACEMENT, DIGNITY, RETROGRADE, COMBUSTION
  const sourceRuleIds = extractSourceRuleIds(planetData.evidence);

  return Object.freeze({
    status: 'AVAILABLE' as Career10LDataStatus,
    dignity,
    motion,
    combustion,
    sign,
    house,
    sourceRuleIds
  });
}

/**
 * Maps DignityStatus to CareerPlanetaryDignity.
 * Folds MOOLATRIKONA into OWN_SIGN per spec decision.
 */
function mapDignityStatus(
  dignityStatus: DignityStatus | undefined
): CareerPlanetaryDignity | undefined {
  if (!dignityStatus) {
    return undefined;
  }

  switch (dignityStatus) {
    case 'EXALTED':
      return 'EXALTED';
    case 'MOOLATRIKONA':
      // Fold MOOLATRIKONA into OWN_SIGN
      // This is a deliberate simplification per spec decision
      return 'OWN_SIGN';
    case 'OWN_SIGN':
      return 'OWN_SIGN';
    case 'DEBILITATED':
      return 'DEBILITATED';
    case 'NEUTRAL':
      return 'NEUTRAL_SIGN';
    case 'GREAT_FRIEND_SIGN':
    case 'FRIEND_SIGN':
      return 'FRIENDLY_SIGN';
    case 'NEUTRAL_SIGN':
      return 'NEUTRAL_SIGN';
    case 'ENEMY_SIGN':
    case 'GREAT_ENEMY_SIGN':
      return 'ENEMY_SIGN';
    default:
      return undefined;
  }
}

/**
 * Maps retrograde state to CareerPlanetaryMotion.
 */
function mapMotionState(
  retrograde: boolean | undefined
): CareerPlanetaryMotion | undefined {
  if (retrograde === undefined) {
    return undefined;
  }

  return retrograde ? 'RETROGRADE' : 'DIRECT';
}

/**
 * Maps combustion state to CareerPlanetaryCombustion.
 */
function mapCombustionState(
  condition: string | undefined
): CareerPlanetaryCombustion | undefined {
  if (!condition) {
    return undefined;
  }

  // PlanetStateCondition.NORMAL | COMBUST | DEEP_COMBUST
  if (condition === 'COMBUST' || condition === 'DEEP_COMBUST') {
    return 'COMBUST';
  }

  return 'NOT_COMBUST';
}

/**
 * Extracts real ruleIds from PlanetAnalysisEvidence.
 * Only includes evidence for SIGN_PLACEMENT, DIGNITY, RETROGRADE, COMBUSTION.
 */
function extractSourceRuleIds(
  evidence: readonly PlanetAnalysisEvidence[] | undefined
): readonly string[] {
  if (!evidence) {
    return Object.freeze([]);
  }

  const ruleIds = new Set<string>();

  for (const ev of evidence) {
    const type = ev.type as PlanetAnalysisEvidenceType;

    // Only include evidence for the facts we copy
    if (
      type === 'SIGN_PLACEMENT' ||
      type === 'DIGNITY' ||
      type === 'RETROGRADE' ||
      type === 'COMBUSTION'
    ) {
      if (ev.ruleId) {
        ruleIds.add(ev.ruleId);
      }
    }
  }

  return Object.freeze(Array.from(ruleIds));
}
