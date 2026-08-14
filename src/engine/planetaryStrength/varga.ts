import { Sign, ChartType } from '../../types';
import { SIGNS_ORDER } from '../../data/astroData';
import { normalizeDegree } from '../nakshatraUtils';
import { getDivisionalLongitude, calculateSign } from '../chartMath';

export type VargaType = 'D1' | 'D2' | 'D3' | 'D7' | 'D9' | 'D12' | 'D30';

export function getVargaSign(longitude: number, varga: VargaType): Sign {
  const norm = normalizeDegree(longitude);
  const signIndex = Math.floor(norm / 30) % 12;
  const posInSign = norm % 30;

  switch (varga) {
    case 'D1':
      return SIGNS_ORDER[signIndex];

    case 'D2': {
      // Hora: 15° divisions
      const isOddSign = signIndex % 2 === 0; // Aries = 0 (odd)
      if (posInSign < 15) {
        return isOddSign ? Sign.LEO : Sign.CANCER;
      } else {
        return isOddSign ? Sign.CANCER : Sign.LEO;
      }
    }

    case 'D3': {
      // Drekkana
      const divLong = getDivisionalLongitude(norm, ChartType.DREKKANA);
      return calculateSign(divLong);
    }

    case 'D7': {
      // Saptamsa: 7 divisions of 30/7 degrees
      const part = Math.min(6, Math.floor(posInSign / (30 / 7)));
      const isOddSign = signIndex % 2 === 0;
      const startSignIndex = isOddSign ? signIndex : (signIndex + 6) % 12;
      return SIGNS_ORDER[(startSignIndex + part) % 12];
    }

    case 'D9': {
      // Navamsa
      const divLong = getDivisionalLongitude(norm, ChartType.NAVAMSA);
      return calculateSign(divLong);
    }

    case 'D12': {
      // Dwadasamsa: 12 divisions of 2.5 degrees
      const part = Math.min(11, Math.floor(posInSign / 2.5));
      return SIGNS_ORDER[(signIndex + part) % 12];
    }

    case 'D30': {
      // Trimsamsa: irregular divisions
      const isOddSign = signIndex % 2 === 0;
      if (isOddSign) {
        if (posInSign < 5) return Sign.ARIES;
        if (posInSign < 10) return Sign.AQUARIUS;
        if (posInSign < 18) return Sign.SAGITTARIUS;
        if (posInSign < 25) return Sign.GEMINI;
        return Sign.LIBRA;
      } else {
        if (posInSign < 5) return Sign.TAURUS;
        if (posInSign < 12) return Sign.VIRGO;
        if (posInSign < 20) return Sign.PISCES;
        if (posInSign < 25) return Sign.CAPRICORN;
        return Sign.SCORPIO;
      }
    }

    default:
      return SIGNS_ORDER[signIndex];
  }
}
