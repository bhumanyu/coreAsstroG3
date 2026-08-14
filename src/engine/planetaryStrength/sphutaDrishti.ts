import { Planet } from '../../types';
import { normalizeDegree } from '../nakshatraUtils';

export interface SphutaDrishtiResult {
  readonly angle: number;
  readonly value: number;
  readonly ruleId: string;
  readonly reason: string;
}

/**
 * Calculates the general Saravali / classical continuous aspect curve (Sphuta Drishti)
 * across the 360-degree zodiacal circle for default planets (Sun, Moon, Mercury, Venus).
 */
export function calculateGeneralSaravaliDrishti(angle: number): number {
  if (angle >= 0 && angle < 30) {
    return 0;
  }
  if (angle >= 30 && angle < 60) {
    return (angle - 30) / 2;
  }
  if (angle >= 60 && angle < 90) {
    return angle - 45;
  }
  if (angle >= 90 && angle < 120) {
    return 30 + (120 - angle) / 2;
  }
  if (angle >= 120 && angle < 150) {
    return 150 - angle;
  }
  if (angle >= 150 && angle < 180) {
    return 2 * (angle - 150);
  }
  if (angle >= 180 && angle < 300) {
    return (300 - angle) / 2;
  }
  // [300, 360)
  return 0;
}

/**
 * Pure, deterministic, side-effect-free calculation of planetary aspect (Sphuta Drishti)
 * from a source planet to a target planet longitude.
 *
 * Rules:
 * - Angle is directional: normalizeDegree(targetLongitude - sourceLongitude)
 * - Half-open intervals: [0, 30), [30, 60), ..., [330, 360)
 * - Default planets (SUN, MOON, MERCURY, VENUS) use the general Saravali curve.
 * - Special overrides apply for MARS (4th & 8th), JUPITER (5th & 9th), and SATURN (3rd & 10th).
 */
export function calculateSphutaDrishti(
  sourcePlanet: Planet,
  sourceLongitude: number,
  targetLongitude: number
): SphutaDrishtiResult {
  if (
    typeof sourceLongitude !== 'number' ||
    !Number.isFinite(sourceLongitude) ||
    typeof targetLongitude !== 'number' ||
    !Number.isFinite(targetLongitude)
  ) {
    throw new TypeError('Longitudes must be finite numbers.');
  }

  const angle = normalizeDegree(targetLongitude - sourceLongitude);
  let value = 0;
  let ruleId = 'SPHUTA_DRISHTI_DEFAULT';
  let reason = '';

  switch (sourcePlanet) {
    case Planet.MARS: {
      ruleId = 'SPHUTA_DRISHTI_MARS';
      if (angle >= 90 && angle < 120) {
        value = 45 + (angle - 90) / 2;
        reason = `Mars special 4th house aspect in [90, 120): 45 + (${angle.toFixed(2)} - 90) / 2 = ${value.toFixed(2)}`;
      } else if (angle >= 120 && angle < 150) {
        value = 2 * (150 - angle);
        reason = `Mars aspect descending in [120, 150): 2 * (150 - ${angle.toFixed(2)}) = ${value.toFixed(2)}`;
      } else if (angle >= 180 && angle < 210) {
        value = 60;
        reason = `Mars special 7th/8th aspect in [180, 210): full aspect of 60.00`;
      } else if (angle >= 210 && angle < 240) {
        value = 270 - angle;
        reason = `Mars special 8th house aspect in [210, 240): 270 - ${angle.toFixed(2)} = ${value.toFixed(2)}`;
      } else {
        value = calculateGeneralSaravaliDrishti(angle);
        reason = `Mars general Saravali aspect curve at angle ${angle.toFixed(2)}°: ${value.toFixed(2)}`;
      }
      break;
    }

    case Planet.JUPITER: {
      ruleId = 'SPHUTA_DRISHTI_JUPITER';
      if (angle >= 90 && angle < 120) {
        value = 45 + (angle - 90) / 2;
        reason = `Jupiter aspect ascending in [90, 120): 45 + (${angle.toFixed(2)} - 90) / 2 = ${value.toFixed(2)}`;
      } else if (angle >= 120 && angle < 150) {
        value = 2 * (150 - angle);
        reason = `Jupiter special 5th house aspect in [120, 150): 2 * (150 - ${angle.toFixed(2)}) = ${value.toFixed(2)}`;
      } else if (angle >= 210 && angle < 240) {
        value = 45 + (angle - 210) / 2;
        reason = `Jupiter special 9th house aspect ascending in [210, 240): 45 + (${angle.toFixed(2)} - 210) / 2 = ${value.toFixed(2)}`;
      } else if (angle === 240) {
        // Explicit boundary peak for Jupiter's 9th aspect (60.00 Shastiamsas)
        value = 60;
        reason = `Jupiter special 9th house peak aspect at 240.00°: 60.00`;
      } else if (angle > 240 && angle < 270) {
        value = 15 + (2 * (270 - angle)) / 3;
        reason = `Jupiter special 9th house aspect descending in (240, 270): 15 + 2 * (270 - ${angle.toFixed(2)}) / 3 = ${value.toFixed(2)}`;
      } else {
        value = calculateGeneralSaravaliDrishti(angle);
        reason = `Jupiter general Saravali aspect curve at angle ${angle.toFixed(2)}°: ${value.toFixed(2)}`;
      }
      break;
    }

    case Planet.SATURN: {
      ruleId = 'SPHUTA_DRISHTI_SATURN';
      if (angle >= 30 && angle < 60) {
        value = (angle - 30) * 2;
        reason = `Saturn special 3rd house aspect ascending in [30, 60): (${angle.toFixed(2)} - 30) * 2 = ${value.toFixed(2)}`;
      } else if (angle >= 60 && angle < 90) {
        value = 45 + (90 - angle) / 2;
        reason = `Saturn special 3rd house aspect descending in [60, 90): 45 + (90 - ${angle.toFixed(2)}) / 2 = ${value.toFixed(2)}`;
      } else if (angle >= 210 && angle < 240) {
        value = 45 + (angle - 210) / 2;
        reason = `Saturn aspect ascending in [210, 240): 45 + (${angle.toFixed(2)} - 210) / 2 = ${value.toFixed(2)}`;
      } else if (angle >= 240 && angle < 270) {
        value = angle - 210;
        reason = `Saturn special 10th house aspect in [240, 270): ${angle.toFixed(2)} - 210 = ${value.toFixed(2)}`;
      } else if (angle >= 270 && angle < 300) {
        value = 2 * (300 - angle);
        reason = `Saturn special 10th house aspect descending in [270, 300): 2 * (300 - ${angle.toFixed(2)}) = ${value.toFixed(2)}`;
      } else if (angle >= 300 && angle < 330) {
        value = 0;
        reason = `Saturn aspect in [300, 330): 0.00`;
      } else {
        value = calculateGeneralSaravaliDrishti(angle);
        reason = `Saturn general Saravali aspect curve at angle ${angle.toFixed(2)}°: ${value.toFixed(2)}`;
      }
      break;
    }

    default: {
      ruleId = 'SPHUTA_DRISHTI_DEFAULT';
      value = calculateGeneralSaravaliDrishti(angle);
      reason = `Default Saravali aspect curve for ${sourcePlanet} at angle ${angle.toFixed(2)}°: ${value.toFixed(2)}`;
      break;
    }
  }

  // Range assertion with small epsilon tolerance to catch formula bugs while accommodating float boundaries
  const EPS = 1e-9;
  if (value < -EPS || value > 60 + EPS) {
    throw new Error(`Invalid Sphuta Drishti result: ${value}`);
  }
  value = Math.min(60, Math.max(0, value));

  return Object.freeze({
    angle,
    value,
    ruleId,
    reason
  });
}
