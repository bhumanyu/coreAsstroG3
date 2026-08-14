import {
  Planet,
  PlanetInfo,
  Sign,
  SignMetadata,
  Element,
  Modality,
  Gender,
  Polarity,
  Nakshatra,
  NakshatraMetadata,
  Relationship,
  DignityStatus,
  TestVector
} from '../types';

export const PLANETS_METADATA: Record<Planet, PlanetInfo> = {
  [Planet.SUN]: { code: 'SU', englishName: 'Sun', sanskritName: 'Surya', symbol: '☉' },
  [Planet.MOON]: { code: 'MO', englishName: 'Moon', sanskritName: 'Chandra', symbol: '☽' },
  [Planet.MARS]: { code: 'MA', englishName: 'Mars', sanskritName: 'Mangala', symbol: '♂' },
  [Planet.MERCURY]: { code: 'ME', englishName: 'Mercury', sanskritName: 'Budha', symbol: '☿' },
  [Planet.JUPITER]: { code: 'JU', englishName: 'Jupiter', sanskritName: 'Guru', symbol: '♃' },
  [Planet.VENUS]: { code: 'VE', englishName: 'Venus', sanskritName: 'Shukra', symbol: '♀' },
  [Planet.SATURN]: { code: 'SA', englishName: 'Saturn', sanskritName: 'Shani', symbol: '♄' },
  [Planet.RAHU]: { code: 'RA', englishName: 'Rahu', sanskritName: 'Rahu', symbol: '☊' },
  [Planet.KETU]: { code: 'KE', englishName: 'Ketu', sanskritName: 'Ketu', symbol: '☋' },
};

export const SIGNS_METADATA: Record<Sign, SignMetadata> = {
  [Sign.ARIES]: {
    sign: Sign.ARIES,
    number: 1,
    englishName: 'Aries',
    sanskritName: 'Mesha',
    startDegree: 0,
    endDegree: 30,
    element: Element.FIRE,
    modality: Modality.MOVABLE,
    gender: Gender.MASCULINE,
    polarity: Polarity.POSITIVE,
    ruler: Planet.MARS
  },
  [Sign.TAURUS]: {
    sign: Sign.TAURUS,
    number: 2,
    englishName: 'Taurus',
    sanskritName: 'Vrishabha',
    startDegree: 30,
    endDegree: 60,
    element: Element.EARTH,
    modality: Modality.FIXED,
    gender: Gender.FEMININE,
    polarity: Polarity.NEGATIVE,
    ruler: Planet.VENUS
  },
  [Sign.GEMINI]: {
    sign: Sign.GEMINI,
    number: 3,
    englishName: 'Gemini',
    sanskritName: 'Mithuna',
    startDegree: 60,
    endDegree: 90,
    element: Element.AIR,
    modality: Modality.DUAL,
    gender: Gender.MASCULINE,
    polarity: Polarity.POSITIVE,
    ruler: Planet.MERCURY
  },
  [Sign.CANCER]: {
    sign: Sign.CANCER,
    number: 4,
    englishName: 'Cancer',
    sanskritName: 'Karka',
    startDegree: 90,
    endDegree: 120,
    element: Element.WATER,
    modality: Modality.MOVABLE,
    gender: Gender.FEMININE,
    polarity: Polarity.NEGATIVE,
    ruler: Planet.MOON
  },
  [Sign.LEO]: {
    sign: Sign.LEO,
    number: 5,
    englishName: 'Leo',
    sanskritName: 'Simha',
    startDegree: 120,
    endDegree: 150,
    element: Element.FIRE,
    modality: Modality.FIXED,
    gender: Gender.MASCULINE,
    polarity: Polarity.POSITIVE,
    ruler: Planet.SUN
  },
  [Sign.VIRGO]: {
    sign: Sign.VIRGO,
    number: 6,
    englishName: 'Virgo',
    sanskritName: 'Kanya',
    startDegree: 150,
    endDegree: 180,
    element: Element.EARTH,
    modality: Modality.DUAL,
    gender: Gender.FEMININE,
    polarity: Polarity.NEGATIVE,
    ruler: Planet.MERCURY
  },
  [Sign.LIBRA]: {
    sign: Sign.LIBRA,
    number: 7,
    englishName: 'Libra',
    sanskritName: 'Tula',
    startDegree: 180,
    endDegree: 210,
    element: Element.AIR,
    modality: Modality.MOVABLE,
    gender: Gender.MASCULINE,
    polarity: Polarity.POSITIVE,
    ruler: Planet.VENUS
  },
  [Sign.SCORPIO]: {
    sign: Sign.SCORPIO,
    number: 8,
    englishName: 'Scorpio',
    sanskritName: 'Vrishchika',
    startDegree: 210,
    endDegree: 240,
    element: Element.WATER,
    modality: Modality.FIXED,
    gender: Gender.FEMININE,
    polarity: Polarity.NEGATIVE,
    ruler: Planet.MARS
  },
  [Sign.SAGITTARIUS]: {
    sign: Sign.SAGITTARIUS,
    number: 9,
    englishName: 'Sagittarius',
    sanskritName: 'Dhanu',
    startDegree: 240,
    endDegree: 270,
    element: Element.FIRE,
    modality: Modality.DUAL,
    gender: Gender.MASCULINE,
    polarity: Polarity.POSITIVE,
    ruler: Planet.JUPITER
  },
  [Sign.CAPRICORN]: {
    sign: Sign.CAPRICORN,
    number: 10,
    englishName: 'Capricorn',
    sanskritName: 'Makara',
    startDegree: 270,
    endDegree: 300,
    element: Element.EARTH,
    modality: Modality.MOVABLE,
    gender: Gender.FEMININE,
    polarity: Polarity.NEGATIVE,
    ruler: Planet.SATURN
  },
  [Sign.AQUARIUS]: {
    sign: Sign.AQUARIUS,
    number: 11,
    englishName: 'Aquarius',
    sanskritName: 'Kumbha',
    startDegree: 300,
    endDegree: 330,
    element: Element.AIR,
    modality: Modality.FIXED,
    gender: Gender.MASCULINE,
    polarity: Polarity.POSITIVE,
    ruler: Planet.SATURN
  },
  [Sign.PISCES]: {
    sign: Sign.PISCES,
    number: 12,
    englishName: 'Pisces',
    sanskritName: 'Meena',
    startDegree: 330,
    endDegree: 360,
    element: Element.WATER,
    modality: Modality.DUAL,
    gender: Gender.FEMININE,
    polarity: Polarity.NEGATIVE,
    ruler: Planet.JUPITER
  }
};

export const SIGNS_ORDER: Sign[] = [
  Sign.ARIES, Sign.TAURUS, Sign.GEMINI, Sign.CANCER,
  Sign.LEO, Sign.VIRGO, Sign.LIBRA, Sign.SCORPIO,
  Sign.SAGITTARIUS, Sign.CAPRICORN, Sign.AQUARIUS, Sign.PISCES
];

// 27 Nakshatras dataset (40/3 degrees each = 13.3333333333°)
export const NAKSHATRAS_METADATA: NakshatraMetadata[] = [
  { nakshatra: Nakshatra.ASHWINI, number: 1, englishName: 'Ashwini', sanskritName: 'अश्विनी', lord: Planet.KETU, startDegree: 0, endDegree: 13.3333333333, symbol: 'Horse Head', deity: 'Ashwini Kumaras' },
  { nakshatra: Nakshatra.BHARANI, number: 2, englishName: 'Bharani', sanskritName: 'भरणी', lord: Planet.VENUS, startDegree: 13.3333333333, endDegree: 26.6666666667, symbol: 'Yoni / Vessel', deity: 'Yama' },
  { nakshatra: Nakshatra.KRITTIKA, number: 3, englishName: 'Krittika', sanskritName: 'कृतिका', lord: Planet.SUN, startDegree: 26.6666666667, endDegree: 40, symbol: 'Razor / Flame', deity: 'Agni' },
  { nakshatra: Nakshatra.ROHINI, number: 4, englishName: 'Rohini', sanskritName: 'रोहिणी', lord: Planet.MOON, startDegree: 40, endDegree: 53.3333333333, symbol: 'Chariot / Banyan', deity: 'Brahma' },
  { nakshatra: Nakshatra.MRIGASHIRA, number: 5, englishName: 'Mrigashira', sanskritName: 'मृगशीर्ष', lord: Planet.MARS, startDegree: 53.3333333333, endDegree: 66.6666666667, symbol: 'Deer Head', deity: 'Soma' },
  { nakshatra: Nakshatra.ARDRA, number: 6, englishName: 'Ardra', sanskritName: 'अर्द्रा', lord: Planet.RAHU, startDegree: 66.6666666667, endDegree: 80, symbol: 'Teardrop / Gem', deity: 'Rudra' },
  { nakshatra: Nakshatra.PUNARVASU, number: 7, englishName: 'Punarvasu', sanskritName: 'पुनर्वसु', lord: Planet.JUPITER, startDegree: 80, endDegree: 93.3333333333, symbol: 'Bow & Quiver', deity: 'Aditi' },
  { nakshatra: Nakshatra.PUSHYA, number: 8, englishName: 'Pushya', sanskritName: 'पुष्य', lord: Planet.SATURN, startDegree: 93.3333333333, endDegree: 106.6666666667, symbol: 'Cow Udder / Lotus', deity: 'Brihaspati' },
  { nakshatra: Nakshatra.ASHLESHA, number: 9, englishName: 'Ashlesha', sanskritName: 'अश्लेषा', lord: Planet.MERCURY, startDegree: 106.6666666667, endDegree: 120, symbol: 'Serpent Coil', deity: 'Nagas' },
  { nakshatra: Nakshatra.MAGHA, number: 10, englishName: 'Magha', sanskritName: 'मघा', lord: Planet.KETU, startDegree: 120, endDegree: 133.3333333333, symbol: 'Royal Throne', deity: 'Pitris' },
  { nakshatra: Nakshatra.PURVA_PHALGUNI, number: 11, englishName: 'Purva Phalguni', sanskritName: 'पूर्व फाल्गुनी', lord: Planet.VENUS, startDegree: 133.3333333333, endDegree: 146.6666666667, symbol: 'Front Legs of Bed', deity: 'Bhaga' },
  { nakshatra: Nakshatra.UTTARA_PHALGUNI, number: 12, englishName: 'Uttara Phalguni', sanskritName: 'उत्तर फाल्गुनी', lord: Planet.SUN, startDegree: 146.6666666667, endDegree: 160, symbol: 'Back Legs of Bed', deity: 'Aryaman' },
  { nakshatra: Nakshatra.HASTA, number: 13, englishName: 'Hasta', sanskritName: 'हस्त', lord: Planet.MOON, startDegree: 160, endDegree: 173.3333333333, symbol: 'Open Hand / Fist', deity: 'Savitar' },
  { nakshatra: Nakshatra.CHITRA, number: 14, englishName: 'Chitra', sanskritName: 'चित्रा', lord: Planet.MARS, startDegree: 173.3333333333, endDegree: 186.6666666667, symbol: 'Bright Jewel', deity: 'Vishwakarma' },
  { nakshatra: Nakshatra.SWATI, number: 15, englishName: 'Swati', sanskritName: 'स्वाती', lord: Planet.RAHU, startDegree: 186.6666666667, endDegree: 200, symbol: 'Coral / Young Shoot', deity: 'Vayu' },
  { nakshatra: Nakshatra.VISHAKHA, number: 16, englishName: 'Vishakha', sanskritName: 'विशाखा', lord: Planet.JUPITER, startDegree: 200, endDegree: 213.3333333333, symbol: 'Triumphal Arch', deity: 'Indra & Agni' },
  { nakshatra: Nakshatra.ANURADHA, number: 17, englishName: 'Anuradha', sanskritName: 'अनुराधा', lord: Planet.SATURN, startDegree: 213.3333333333, endDegree: 226.6666666667, symbol: 'Lotus / Archway', deity: 'Mitra' },
  { nakshatra: Nakshatra.JYESHTHA, number: 18, englishName: 'Jyeshtha', sanskritName: 'ज्येष्ठा', lord: Planet.MERCURY, startDegree: 226.6666666667, endDegree: 240, symbol: 'Circular Amulet', deity: 'Indra' },
  { nakshatra: Nakshatra.MULA, number: 19, englishName: 'Mula', sanskritName: 'मूल', lord: Planet.KETU, startDegree: 240, endDegree: 253.3333333333, symbol: 'Tied Roots', deity: 'Nirriti' },
  { nakshatra: Nakshatra.PURVA_ASHADHA, number: 20, englishName: 'Purva Ashadha', sanskritName: 'पूर्वाषाढ़ा', lord: Planet.VENUS, startDegree: 253.3333333333, endDegree: 266.6666666667, symbol: 'Elephant Tusk / Fan', deity: 'Apas' },
  { nakshatra: Nakshatra.UTTARA_ASHADHA, number: 21, englishName: 'Uttara Ashadha', sanskritName: 'उत्तराषाढ़ा', lord: Planet.SUN, startDegree: 266.6666666667, endDegree: 280, symbol: 'Small Bed / Tusk', deity: 'Vishwadevas' },
  { nakshatra: Nakshatra.SHRAVANA, number: 22, englishName: 'Shravana', sanskritName: 'श्रवण', lord: Planet.MOON, startDegree: 280, endDegree: 293.3333333333, symbol: 'Three Footprints / Ear', deity: 'Vishnu' },
  { nakshatra: Nakshatra.DHANISHTA, number: 23, englishName: 'Dhanishta', sanskritName: 'धनिष्ठा', lord: Planet.MARS, startDegree: 293.3333333333, endDegree: 306.6666666667, symbol: 'Drum / Flute', deity: 'Eight Vasus' },
  { nakshatra: Nakshatra.SHATABHISHA, number: 24, englishName: 'Shatabhisha', sanskritName: 'शतभिषा', lord: Planet.RAHU, startDegree: 306.6666666667, endDegree: 320, symbol: 'Empty Circle / 100 Healers', deity: 'Varuna' },
  { nakshatra: Nakshatra.PURVA_BHADRAPADA, number: 25, englishName: 'Purva Bhadrapada', sanskritName: 'पूर्वभाद्रपदा', lord: Planet.JUPITER, startDegree: 320, endDegree: 333.3333333333, symbol: 'Swords / Funeral Cot', deity: 'Aja Ekapada' },
  { nakshatra: Nakshatra.UTTARA_BHADRAPADA, number: 26, englishName: 'Uttara Bhadrapada', sanskritName: 'उत्तरभाद्रपदा', lord: Planet.SATURN, startDegree: 333.3333333333, endDegree: 346.6666666667, symbol: 'Twin / Back Cot', deity: 'Ahirbudhnya' },
  { nakshatra: Nakshatra.REVATI, number: 27, englishName: 'Revati', sanskritName: 'रेवती', lord: Planet.MERCURY, startDegree: 346.6666666667, endDegree: 360, symbol: 'Drum / Pair of Fish', deity: 'Pushan' }
];

// Exaltation Points
export const EXALTATION_DATA: Record<Planet, { sign: Sign; degree: number }> = {
  [Planet.SUN]: { sign: Sign.ARIES, degree: 10 },
  [Planet.MOON]: { sign: Sign.TAURUS, degree: 3 },
  [Planet.MARS]: { sign: Sign.CAPRICORN, degree: 28 },
  [Planet.MERCURY]: { sign: Sign.VIRGO, degree: 15 },
  [Planet.JUPITER]: { sign: Sign.CANCER, degree: 5 },
  [Planet.VENUS]: { sign: Sign.PISCES, degree: 27 },
  [Planet.SATURN]: { sign: Sign.LIBRA, degree: 20 },
  [Planet.RAHU]: { sign: Sign.TAURUS, degree: 15 }, // Traditional extension
  [Planet.KETU]: { sign: Sign.SCORPIO, degree: 15 } // Traditional extension
};

// Debilitation Points (7th sign opposite, same degree)
export const DEBILITATION_DATA: Record<Planet, { sign: Sign; degree: number }> = {
  [Planet.SUN]: { sign: Sign.LIBRA, degree: 10 },
  [Planet.MOON]: { sign: Sign.SCORPIO, degree: 3 },
  [Planet.MARS]: { sign: Sign.CANCER, degree: 28 },
  [Planet.MERCURY]: { sign: Sign.PISCES, degree: 15 },
  [Planet.JUPITER]: { sign: Sign.CAPRICORN, degree: 5 },
  [Planet.VENUS]: { sign: Sign.VIRGO, degree: 27 },
  [Planet.SATURN]: { sign: Sign.ARIES, degree: 20 },
  [Planet.RAHU]: { sign: Sign.SCORPIO, degree: 15 },
  [Planet.KETU]: { sign: Sign.TAURUS, degree: 15 }
};

// Moolatrikona Ranges
export const MOOLATRIKONA_DATA: Partial<Record<Planet, { sign: Sign; startDegree: number; endDegree: number }>> = {
  [Planet.SUN]: { sign: Sign.LEO, startDegree: 0, endDegree: 20 },
  [Planet.MOON]: { sign: Sign.TAURUS, startDegree: 4, endDegree: 30 },
  [Planet.MARS]: { sign: Sign.ARIES, startDegree: 0, endDegree: 12 },
  [Planet.MERCURY]: { sign: Sign.VIRGO, startDegree: 16, endDegree: 20 },
  [Planet.JUPITER]: { sign: Sign.SAGITTARIUS, startDegree: 0, endDegree: 10 },
  [Planet.VENUS]: { sign: Sign.LIBRA, startDegree: 0, endDegree: 15 },
  [Planet.SATURN]: { sign: Sign.AQUARIUS, startDegree: 0, endDegree: 20 }
};

// Own Signs
export const OWN_SIGNS_DATA: Partial<Record<Planet, Sign[]>> = {
  [Planet.SUN]: [Sign.LEO],
  [Planet.MOON]: [Sign.CANCER],
  [Planet.MARS]: [Sign.ARIES, Sign.SCORPIO],
  [Planet.MERCURY]: [Sign.GEMINI, Sign.VIRGO],
  [Planet.JUPITER]: [Sign.SAGITTARIUS, Sign.PISCES],
  [Planet.VENUS]: [Sign.TAURUS, Sign.LIBRA],
  [Planet.SATURN]: [Sign.CAPRICORN, Sign.AQUARIUS]
};

// Natural Friendships Matrix (Naisargika Sambandha)
export const NATURAL_FRIENDS: Partial<Record<Planet, Planet[]>> = {
  [Planet.SUN]: [Planet.MOON, Planet.MARS, Planet.JUPITER],
  [Planet.MOON]: [Planet.SUN, Planet.MERCURY],
  [Planet.MARS]: [Planet.SUN, Planet.MOON, Planet.JUPITER],
  [Planet.MERCURY]: [Planet.SUN, Planet.VENUS],
  [Planet.JUPITER]: [Planet.SUN, Planet.MOON, Planet.MARS],
  [Planet.VENUS]: [Planet.MERCURY, Planet.SATURN],
  [Planet.SATURN]: [Planet.MERCURY, Planet.VENUS]
};

export const NATURAL_ENEMIES: Partial<Record<Planet, Planet[]>> = {
  [Planet.SUN]: [Planet.VENUS, Planet.SATURN],
  [Planet.MOON]: [],
  [Planet.MARS]: [Planet.MERCURY],
  [Planet.MERCURY]: [Planet.MOON],
  [Planet.JUPITER]: [Planet.MERCURY, Planet.VENUS],
  [Planet.VENUS]: [Planet.SUN, Planet.MOON],
  [Planet.SATURN]: [Planet.SUN, Planet.MOON, Planet.MARS]
};

// Golden vectors from coreAstroEngine test datasets
export const GOLDEN_TEST_VECTORS: TestVector[] = [
  { longitude: 0, expectedNakshatra: 'Ashwini', expectedPada: 'FIRST', expectedSign: 'Aries' },
  { longitude: 3.3333333333, expectedNakshatra: 'Ashwini', expectedPada: 'SECOND', expectedSign: 'Aries' },
  { longitude: 6.6666666667, expectedNakshatra: 'Ashwini', expectedPada: 'THIRD', expectedSign: 'Aries' },
  { longitude: 10, expectedNakshatra: 'Ashwini', expectedPada: 'FOURTH', expectedSign: 'Aries' },
  { longitude: 13.3333333333, expectedNakshatra: 'Bharani', expectedPada: 'FIRST', expectedSign: 'Aries' },
  { longitude: 26.6666666667, expectedNakshatra: 'Bharani', expectedPada: 'FOURTH', expectedSign: 'Aries' },
  { longitude: 40, expectedNakshatra: 'Krittika', expectedPada: 'FIRST', expectedSign: 'Taurus' },
  { longitude: 53.3333333333, expectedNakshatra: 'Rohini', expectedPada: 'SECOND', expectedSign: 'Taurus' },
  { longitude: 66.6666666667, expectedNakshatra: 'Mrigashira', expectedPada: 'FOURTH', expectedSign: 'Gemini' },
  { longitude: 80, expectedNakshatra: 'Punarvasu', expectedPada: 'FIRST', expectedSign: 'Cancer' },
  { longitude: 93.3333333333, expectedNakshatra: 'Pushya', expectedPada: 'SECOND', expectedSign: 'Cancer' },
  { longitude: 106.6666666667, expectedNakshatra: 'Ashlesha', expectedPada: 'FOURTH', expectedSign: 'Cancer' },
  { longitude: 120, expectedNakshatra: 'Magha', expectedPada: 'FIRST', expectedSign: 'Leo' },
  { longitude: 133.3333333333, expectedNakshatra: 'Purva Phalguni', expectedPada: 'SECOND', expectedSign: 'Leo' },
  { longitude: 146.6666666667, expectedNakshatra: 'Uttara Phalguni', expectedPada: 'THIRD', expectedSign: 'Leo' },
  { longitude: 160, expectedNakshatra: 'Hasta', expectedPada: 'FOURTH', expectedSign: 'Virgo' },
  { longitude: 173.3333333333, expectedNakshatra: 'Chitra', expectedPada: 'FIRST', expectedSign: 'Virgo' },
  { longitude: 186.6666666667, expectedNakshatra: 'Swati', expectedPada: 'SECOND', expectedSign: 'Libra' },
  { longitude: 200, expectedNakshatra: 'Vishakha', expectedPada: 'FOURTH', expectedSign: 'Libra' },
  { longitude: 213.3333333333, expectedNakshatra: 'Anuradha', expectedPada: 'FIRST', expectedSign: 'Scorpio' },
  { longitude: 226.6666666667, expectedNakshatra: 'Jyeshtha', expectedPada: 'SECOND', expectedSign: 'Scorpio' },
  { longitude: 240, expectedNakshatra: 'Mula', expectedPada: 'FOURTH', expectedSign: 'Sagittarius' },
  { longitude: 253.3333333333, expectedNakshatra: 'Purva Ashadha', expectedPada: 'FIRST', expectedSign: 'Sagittarius' },
  { longitude: 266.6666666667, expectedNakshatra: 'Uttara Ashadha', expectedPada: 'SECOND', expectedSign: 'Sagittarius' },
  { longitude: 280, expectedNakshatra: 'Shravana', expectedPada: 'FOURTH', expectedSign: 'Capricorn' },
  { longitude: 293.3333333333, expectedNakshatra: 'Dhanishta', expectedPada: 'FIRST', expectedSign: 'Capricorn' },
  { longitude: 306.6666666667, expectedNakshatra: 'Shatabhisha', expectedPada: 'SECOND', expectedSign: 'Aquarius' },
  { longitude: 320, expectedNakshatra: 'Purva Bhadrapada', expectedPada: 'FOURTH', expectedSign: 'Aquarius' },
  { longitude: 333.3333333333, expectedNakshatra: 'Uttara Bhadrapada', expectedPada: 'FIRST', expectedSign: 'Pisces' },
  { longitude: 346.6666666667, expectedNakshatra: 'Revati', expectedPada: 'SECOND', expectedSign: 'Pisces' },
  { longitude: 359.9999999999, expectedNakshatra: 'Revati', expectedPada: 'FOURTH', expectedSign: 'Pisces' }
];
