import { Planet, Sign, DignityStatus, PlanetDignity } from '../types';
import {
  EXALTATION_DATA,
  DEBILITATION_DATA,
  MOOLATRIKONA_DATA,
  OWN_SIGNS_DATA
} from '../data/astroData';

/**
 * Calculates classical planetary dignity in a sign.
 */
export function calculateDignity(planet: Planet, sign: Sign, signDegree: number): PlanetDignity {
  // Check Exaltation
  const exaltation = EXALTATION_DATA[planet];
  if (exaltation && exaltation.sign === sign) {
    return { planet, sign, status: DignityStatus.EXALTED, exactDegree: exaltation.degree };
  }

  // Check Debilitation
  const debilitation = DEBILITATION_DATA[planet];
  if (debilitation && debilitation.sign === sign) {
    return { planet, sign, status: DignityStatus.DEBILITATED, exactDegree: debilitation.degree };
  }

  // Check Moolatrikona
  const moolatrikona = MOOLATRIKONA_DATA[planet];
  if (
    moolatrikona &&
    moolatrikona.sign === sign &&
    signDegree >= moolatrikona.startDegree &&
    signDegree <= moolatrikona.endDegree
  ) {
    return { planet, sign, status: DignityStatus.MOOLATRIKONA };
  }

  // Check Own Sign
  const ownSigns = OWN_SIGNS_DATA[planet];
  if (ownSigns && ownSigns.includes(sign)) {
    return { planet, sign, status: DignityStatus.OWN_SIGN };
  }

  return { planet, sign, status: DignityStatus.NEUTRAL };
}
