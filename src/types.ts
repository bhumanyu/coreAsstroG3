export enum AyanamsaType {
  LAHIRI = 'LAHIRI',
  RAMAN = 'RAMAN',
  KRISHNAMURTI = 'KRISHNAMURTI',
  FAGAN_BRADLEY = 'FAGAN_BRADLEY',
  TROPICAL = 'TROPICAL'
}

export enum HouseSystem {
  EQUAL = 'EQUAL',
  WHOLE_SIGN = 'WHOLE_SIGN',
  PLACIDUS = 'PLACIDUS'
}

export enum Planet {
  SUN = 'SUN',
  MOON = 'MOON',
  MARS = 'MARS',
  MERCURY = 'MERCURY',
  JUPITER = 'JUPITER',
  VENUS = 'VENUS',
  SATURN = 'SATURN',
  RAHU = 'RAHU',
  KETU = 'KETU'
}

export enum Sign {
  ARIES = 'ARIES',
  TAURUS = 'TAURUS',
  GEMINI = 'GEMINI',
  CANCER = 'CANCER',
  LEO = 'LEO',
  VIRGO = 'VIRGO',
  LIBRA = 'LIBRA',
  SCORPIO = 'SCORPIO',
  SAGITTARIUS = 'SAGITTARIUS',
  CAPRICORN = 'CAPRICORN',
  AQUARIUS = 'AQUARIUS',
  PISCES = 'PISCES'
}

export enum Element {
  FIRE = 'FIRE',
  EARTH = 'EARTH',
  AIR = 'AIR',
  WATER = 'WATER'
}

export enum Modality {
  MOVABLE = 'MOVABLE',
  CARDINAL = 'MOVABLE',
  FIXED = 'FIXED',
  DUAL = 'DUAL',
  MUTABLE = 'DUAL'
}

export enum Gender {
  MASCULINE = 'MASCULINE',
  FEMININE = 'FEMININE'
}

export enum Polarity {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE'
}

export enum Pada {
  ONE = 1,
  FIRST = 1,
  TWO = 2,
  SECOND = 2,
  THREE = 3,
  THIRD = 3,
  FOUR = 4,
  FOURTH = 4
}

export enum AspectType {
  CONJUNCTION = 'CONJUNCTION',
  OPPOSITION = 'OPPOSITION',
  TRINE = 'TRINE',
  SQUARE = 'SQUARE',
  SEXTILE = 'SEXTILE',
  CUSTOM = 'CUSTOM',
  FULL_7TH = 'FULL_7TH',
  SPECIAL_9TH = 'SPECIAL_9TH',
  SPECIAL_5TH = 'SPECIAL_5TH',
  SPECIAL_4TH = 'SPECIAL_4TH',
  SPECIAL_8TH = 'SPECIAL_8TH',
  SPECIAL_3RD = 'SPECIAL_3RD',
  SPECIAL_10TH = 'SPECIAL_10TH'
}

export enum Nakshatra {
  ASHWINI = 'ASHWINI',
  BHARANI = 'BHARANI',
  KRITTIKA = 'KRITTIKA',
  ROHINI = 'ROHINI',
  MRIGASHIRA = 'MRIGASHIRA',
  ARDRA = 'ARDRA',
  PUNARVASU = 'PUNARVASU',
  PUSHYA = 'PUSHYA',
  ASHLESHA = 'ASHLESHA',
  MAGHA = 'MAGHA',
  PURVA_PHALGUNI = 'PURVA_PHALGUNI',
  UTTARA_PHALGUNI = 'UTTARA_PHALGUNI',
  HASTA = 'HASTA',
  CHITRA = 'CHITRA',
  SWATI = 'SWATI',
  VISHAKHA = 'VISHAKHA',
  ANURADHA = 'ANURADHA',
  JYESHTHA = 'JYESHTHA',
  MULA = 'MULA',
  PURVA_ASHADHA = 'PURVA_ASHADHA',
  UTTARA_ASHADHA = 'UTTARA_ASHADHA',
  SHRAVANA = 'SHRAVANA',
  DHANISHTA = 'DHANISHTA',
  SHATABHISHA = 'SHATABHISHA',
  PURVA_BHADRAPADA = 'PURVA_BHADRAPADA',
  UTTARA_BHADRAPADA = 'UTTARA_BHADRAPADA',
  REVATI = 'REVATI'
}

export enum RelationshipType {
  GREAT_FRIEND = 'GREAT_FRIEND',
  FRIEND = 'FRIEND',
  NEUTRAL = 'NEUTRAL',
  ENEMY = 'ENEMY',
  GREAT_ENEMY = 'GREAT_ENEMY'
}

export enum NaturalRelationship {
  FRIEND = 'FRIEND',
  NEUTRAL = 'NEUTRAL',
  ENEMY = 'ENEMY'
}

export enum TemporaryRelationship {
  FRIEND = 'FRIEND',
  ENEMY = 'ENEMY'
}

export enum CompoundRelationship {
  GREAT_FRIEND = 'GREAT_FRIEND',
  FRIEND = 'FRIEND',
  NEUTRAL = 'NEUTRAL',
  ENEMY = 'ENEMY',
  GREAT_ENEMY = 'GREAT_ENEMY'
}

export enum DignityStatus {
  EXALTED = 'EXALTED',
  DEBILITATED = 'DEBILITATED',
  MOOLATRIKONA = 'MOOLATRIKONA',
  OWN_SIGN = 'OWN_SIGN',
  NEUTRAL = 'NEUTRAL',
  GREAT_FRIEND_SIGN = 'GREAT_FRIEND_SIGN',
  FRIEND_SIGN = 'FRIEND_SIGN',
  NEUTRAL_SIGN = 'NEUTRAL_SIGN',
  ENEMY_SIGN = 'ENEMY_SIGN',
  GREAT_ENEMY_SIGN = 'GREAT_ENEMY_SIGN'
}

export enum PlanetStateCondition {
  NORMAL = 'NORMAL',
  COMBUST = 'COMBUST',
  DEEP_COMBUST = 'DEEP_COMBUST',
  DEEPLY_COMBUST = 'DEEP_COMBUST'
}

export enum DirectionalStrengthStatus {
  FULL_DIG_BALA = 'FULL_DIG_BALA',
  PARTIAL_DIG_BALA = 'PARTIAL_DIG_BALA',
  ZERO_DIG_BALA = 'ZERO_DIG_BALA'
}

export enum MotionState {
  DIRECT = 'DIRECT',
  RETROGRADE = 'RETROGRADE',
  STATIONARY = 'STATIONARY'
}

export enum LajjitaAdiAvastha {
  LAJJITA = 'LAJJITA',
  GARVITA = 'GARVITA',
  KSHUDHITA = 'KSHUDHITA',
  TRUSHITA = 'TRUSHITA',
  MUDITA = 'MUDITA',
  KSHOBHITA = 'KSHOBHITA'
}

export interface BirthDetails {
  name?: string;
  placeOfBirth?: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  ayanamsa: AyanamsaType;
  dateTimeStr: string;
}

export interface PlanetState {
  planet?: Planet;
  condition: PlanetStateCondition;
  motion: {
    state?: MotionState;
    speed?: number;
    retrograde: boolean;
    stationary?: boolean;
  };
  avastha?: LajjitaAdiAvastha;
  combust?: boolean;
}

export interface DignityAnalysis {
  planet?: Planet;
  sign?: Sign;
  status: DignityStatus;
  score?: number;
  description?: string;
  exactDegree?: number;
}

export interface Position {
  planet?: Planet;
  longitude: number;
  eclipticLongitude?: number;
  eclipticLatitude?: number;
  sign: Sign;
  house: number;
  signLongitude: number;
  motion?: {
    speed: number;
    retrograde: boolean;
    stationary: boolean;
  };
}

export type PlanetaryPositions = Record<Planet, Position>;

export interface AspectDetail {
  sourcePlanet: Planet;
  targetPlanet?: Planet;
  targetHouse?: number;
  aspectType: 'FULL' | 'SPECIAL' | 'PARTIAL';
  angle: number;
  orb: number;
  strength: number;
  description: string;
}

export interface TransitPosition {
  planet: Planet;
  longitude: number;
  sign: Sign;
  signNumber?: number;
  house?: number;
  signLongitude?: number;
  isRetrograde?: boolean;
  nakshatraResult?: any;
}

export interface TransitHousePosition {
  planet?: Planet;
  fromMoon: number;
  fromAscendant: number;
  house?: number;
  sign?: Sign;
  transitingPlanets?: Planet[];
}

export interface TransitEvidence {
  ruleId?: string;
  description?: string;
  reason?: string;
  condition?: any;
  planet?: Planet;
  natalPlanet?: Planet;
  aspectType?: any;
  targetSign?: Sign;
  referenceHouse?: number;
  targetHouseFromMoon?: number;
  targetHouseFromAscendant?: number;
}

export interface TransitResult {
  planet: Planet;
  position: TransitPosition;
  housePosition: TransitHousePosition;
  aspects: TransitAspect[];
  transitSign?: Sign;
  houseFromMoon?: number;
  houseFromAscendant?: number;
  condition?: any;
  conditions?: any;
  isRetrograde?: boolean;
  evidence?: readonly TransitEvidence[] | any;
}

export interface TransitAspect {
  transitPlanet?: Planet;
  sourcePlanet?: Planet;
  targetPlanet?: Planet;
  natalPlanet?: Planet;
  natalHouse?: number;
  targetHouseFromMoon?: number;
  targetHouseFromAscendant?: number;
  targetSign?: Sign;
  aspectType?: any;
  orb?: number;
  exactness?: number;
  description?: string;
}

export interface HouseTransitInfo {
  house: number;
  sign: Sign;
  transitingPlanets: Planet[];
  ashtakavargaPoints?: number;
  beneficScore?: number;
  description: string;
}

export interface TransitAnalysis {
  transitDate?: string;
  positions?: Record<Planet, TransitPosition>;
  aspects?: TransitAspect[];
  houseTransits?: HouseTransitInfo[];
  summary?: string[];
  at?: string;
  natalMoonSign?: Sign;
  natalAscendantSign?: Sign;
  results: Partial<Record<Planet, TransitResult>>;
}

export type VargaType = 'D1' | 'D3' | 'D9' | 'D10';

export interface VargaPosition {
  varga: VargaType;
  planet: Planet;
  sign: Sign;
  house: number;
  signLongitude: number;
}

export type VargaPositions = Record<VargaType, Record<Planet, VargaPosition>>;

export interface NakshatraMetadata {
  index?: number;
  number?: number;
  name?: string;
  englishName?: string;
  sanskritName?: string;
  ruler?: Planet;
  lord?: Planet;
  deity?: string;
  symbol?: string;
  gana?: 'DEVA' | 'MANUSHYA' | 'RAKSHASA' | string;
  yoni?: string;
  element?: string;
  startDegree?: number;
  endDegree?: number;
  nakshatra?: Nakshatra;
}

export interface NakshatraResult {
  planet?: Planet;
  nakshatra: NakshatraMetadata | Nakshatra | any;
  pada: number | Pada | any;
  longitude?: number;
  padaLongitude?: number;
  degreeInPada?: number;
  padaNumber?: number;
}

export type NakshatraMap = Record<Planet, NakshatraResult>;

export interface AspectPair {
  aspectingPlanet: Planet;
  sourcePlanet?: Planet;
  targetPlanet: Planet;
  aspectType: 'FULL_7TH' | 'SPECIAL_MARS_4TH' | 'SPECIAL_MARS_8TH' | 'SPECIAL_JUPITER_5TH' | 'SPECIAL_JUPITER_9TH' | 'SPECIAL_SATURN_3RD' | 'SPECIAL_SATURN_10TH';
  drishtiValue: number;
  exactAngle: number;
  description: string;
}

export interface HouseDrishti {
  aspectingPlanet: Planet;
  sourcePlanet?: Planet;
  targetHouse: number;
  aspectType: string;
  drishtiValue: number;
  description: string;
}

export interface NatalGrahaDrishti {
  aspects?: any[];
  planetToPlanetAspects?: AspectPair[];
  planetToHouseAspects?: HouseDrishti[];
  aspectsReceivedByPlanet?: Partial<Record<Planet, AspectPair[]>>;
  aspectsReceivedByHouse?: Partial<Record<number, HouseDrishti[]>>;
  summary?: string[];
  sourcePlanet?: Planet;
  targetPlanet?: Planet;
  sourceHouse?: number;
  targetHouse?: number;
  sourceSign?: Sign;
  targetSign?: Sign;
  houseOffset?: number;
  aspectType?: any;
  description?: string;
  reason?: string;
}

export interface NatalGrahaDrishtiReport extends NatalGrahaDrishti {
  aspects: any[];
}

export interface PlanetFact {
  planet: Planet;
  position: Position;
  dignity: DignityAnalysis;
  state: PlanetState;
  sign?: Sign;
  signMetadata?: SignMetadata;
  nakshatraResult?: NakshatraResult;
  nakshatraMetadata?: NakshatraMetadata;
  house?: number;
}

export interface AscendantDetails {
  sign: Sign;
  longitude: number;
  signLongitude: number;
}

export interface BhavaFact {
  house: number;
  sign: Sign;
  lord: Planet;
  occupants: Planet[];
}

export interface PlanetInfo {
  code: string;
  englishName: string;
  sanskritName: string;
  symbol: string;
}

export interface SignMetadata {
  sign: Sign;
  name?: string;
  englishName?: string;
  sanskritName?: string;
  startDegree?: number;
  endDegree?: number;
  ruler: Planet;
  element: Element;
  modality: Modality;
  gender: Gender;
  polarity: Polarity;
  number?: number;
}

export interface TestVector {
  longitude?: number;
  expectedNakshatra?: string;
  expectedPada?: string;
  expectedSign?: string;
  name?: string;
  details?: BirthDetails;
  expected?: any;
}

export enum ChartType {
  D1 = 'D1',
  RASI = 'D1',
  D3 = 'D3',
  DREKKANA = 'D3',
  D9 = 'D9',
  NAVAMSA = 'D9',
  D10 = 'D10',
  DASAMSA = 'D10'
}
export { PlanetStateCondition as PlanetCondition };
export { MotionState as PlanetMotion };
export { NaturalRelationship as Relationship };
export type PlanetFacts = Record<Planet, PlanetFact>;
export type PlanetPosition = Position;
export type PlanetDignity = DignityAnalysis;
export enum ZodiacType {
  SIDEREAL = 'SIDEREAL',
  TROPICAL = 'TROPICAL'
}

export enum DashaSystem {
  VIMSHOTTARI = 'VIMSHOTTARI'
}

export enum AspectSystem {
  PARASHARI = 'PARASHARI'
}

export const CANONICAL_METHODOLOGY = Object.freeze({
  zodiac: ZodiacType.SIDEREAL,
  ayanamsa: AyanamsaType.LAHIRI,
  houseSystem: HouseSystem.WHOLE_SIGN,
  dashaSystem: DashaSystem.VIMSHOTTARI,
  aspectSystem: AspectSystem.PARASHARI
});

export enum PlanetAnalysisEvidenceType {
  DIGNITY = 'DIGNITY',
  STATE = 'STATE',
  ASPECT = 'ASPECT',
  HOUSE = 'HOUSE',
  GENERAL = 'GENERAL',
  SIGN_PLACEMENT = 'SIGN_PLACEMENT',
  HOUSE_PLACEMENT = 'HOUSE_PLACEMENT',
  NAKSHATRA_PLACEMENT = 'NAKSHATRA_PLACEMENT',
  RETROGRADE = 'RETROGRADE',
  COMBUSTION = 'COMBUSTION',
  ASPECT_CAST = 'ASPECT_CAST',
  ASPECT_RECEIVED = 'ASPECT_RECEIVED'
}

export interface PlanetAnalysisEvidence {
  ruleId: string;
  type: PlanetAnalysisEvidenceType | any;
  description?: string;
  reason?: string;
}

export interface PlanetAnalysis {
  planet: Planet;
  dignity: DignityStatus | any;
  state: PlanetState | any;
  evidence: PlanetAnalysisEvidence[] | readonly PlanetAnalysisEvidence[];
  sign?: Sign;
  house?: number;
  longitude?: number;
  nakshatraResult?: any;
  nakshatraMetadata?: any;
  receivedAspects?: readonly any[];
  castAspects?: readonly any[];
}

export interface PlanetAnalysisReport {
  planets: Record<Planet, PlanetAnalysis>;
}

// NatalGrahaDrishtiReport is defined above

export enum HouseAnalysisEvidenceType {
  OCCUPANT = 'OCCUPANT',
  HOUSE_OCCUPANT = 'HOUSE_OCCUPANT',
  HOUSE_SIGN = 'HOUSE_SIGN',
  HOUSE_SIGN_PLACEMENT = 'HOUSE_SIGN_PLACEMENT',
  HOUSE_LORD = 'HOUSE_LORD',
  HOUSE_LORD_PLACEMENT = 'HOUSE_LORD_PLACEMENT',
  HOUSE_RECEIVED_ASPECT = 'HOUSE_RECEIVED_ASPECT',
  LORD_PLACEMENT = 'LORD_PLACEMENT',
  ASPECT_RECEIVED = 'ASPECT_RECEIVED',
  GENERAL = 'GENERAL'
}

export interface HouseAnalysisEvidence {
  ruleId: string;
  type: HouseAnalysisEvidenceType | any;
  planet?: Planet;
  description?: string;
  reason?: string;
  statement?: string;
  effect?: string;
}

export interface HouseAspectEvidence {
  sourcePlanet?: Planet;
  aspectingPlanet?: Planet;
  aspectType?: string;
  targetHouse?: number;
  reason?: string;
  description?: string;
  drishtiValue?: number;
}

export interface HouseAnalysis {
  house: number;
  sign: Sign;
  occupants: readonly Planet[] | Planet[];
  lord: Planet;
  lordAnalysis?: any;
  receivedAspects?: readonly HouseAspectEvidence[] | any;
  evidence: readonly HouseAnalysisEvidence[] | any;
}

export interface HouseAnalysisItem extends HouseAnalysis {}

export interface HouseAnalysisReport {
  houses: Record<number, HouseAnalysisItem | HouseAnalysis>;
}

export interface PlanetStrengthComponent {
  component: ShadbalaComponent;
  subcomponent?: ShadbalaSubcomponent;
  shastiamsaValue?: number;
  rupaValue?: number;
  value?: number;
  unit?: string;
  status: StrengthComponentStatus;
  description?: string;
  reason?: string;
  ruleId?: string;
}

export interface DrikAspectContribution {
  sourcePlanet: Planet;
  targetPlanet: Planet;
  sourceLongitude: number;
  targetLongitude: number;
  aspectAngle: number;
  sphutaValue: number;
  naturalClassification: 'BENEFIC' | 'MALEFIC';
  rectificationFactor: number;
  rectifiedValue: number;
  ruleId?: string;
  reason?: string;
}

export interface ShadbalaAggregation {
  planet?: Planet;
  status: ShadbalaAggregationStatus;
  totalShastiamsa?: number;
  totalRupa?: number;
  minimumRequiredRupa?: number;
  isStrengthMet?: boolean;
  components?: readonly PlanetStrengthComponent[];
  minimumRequirement?: any;
  ratioToMinimum?: number;
  percentageOfMinimum?: number;
  meetsMinimum?: boolean;
  missingComponents?: readonly string[];
  reason?: string;
}

export interface PlanetaryStrengthEvidence {
  ruleId: string;
  component?: string;
  description?: string;
  subcomponent?: any;
  planet?: Planet;
  reason?: string;
  inputs?: any;
  value?: any;
  shadbalaDetails?: any;
  details?: any;
}

export interface PlanetaryStrength {
  planet: Planet;
  components: readonly PlanetStrengthComponent[];
  calculatedTotal?: number;
  kalaBalaCoreTotal?: number;
  completeKalaBala?: any;
  unit?: string;
  evidence: readonly PlanetaryStrengthEvidence[];
  shadbala: ShadbalaAggregation;
}

export interface PlanetaryStrengthItem {
  planet: Planet;
  totalStrength?: number;
  relativeStrength?: string;
  shadbala?: any;
}

export interface PlanetaryStrengthInput {
  planetFacts: Record<Planet, PlanetFact>;
  birthDetails?: BirthDetails;
}

export interface PlanetaryStrengthReport {
  planets: Record<Planet, PlanetaryStrength>;
  strengths?: Record<Planet, PlanetaryStrengthItem>;
}

export interface YuddhaBalaPair {
  p1?: Planet;
  p2?: Planet;
  planetA?: Planet;
  planetB?: Planet;
  longitudeA?: number;
  longitudeB?: number;
  separation?: number;
  distanceDeg?: number;
  isYuddha?: boolean;
  winner?: Planet;
  loser?: Planet;
  ruleId?: string;
  reason?: string;
}

export interface YuddhaBalaResult {
  winner?: Planet;
  loser?: Planet;
  differenceShastiamsa?: number;
  status?: StrengthComponentStatus;
  value?: number;
  pairs?: readonly YuddhaBalaPair[];
  reason?: string;
  planet?: Planet;
}

export enum TransitCondition {
  BENEFIC = 'BENEFIC',
  MALEFIC = 'MALEFIC',
  NEUTRAL = 'NEUTRAL',
  TRANSIT_ASPECTS_NATAL_PLANET = 'TRANSIT_ASPECTS_NATAL_PLANET',
  TRANSIT_OVER_NATAL_PLANET = 'TRANSIT_OVER_NATAL_PLANET',
  SADE_SATI_RISING = 'SADE_SATI_RISING',
  SADE_SATI_PEAK = 'SADE_SATI_PEAK',
  SADE_SATI_SETTING = 'SADE_SATI_SETTING',
  ASHTAMA_SHANI = 'ASHTAMA_SHANI',
  KANTAKA_SHANI = 'KANTAKA_SHANI',
  SATURN_3RD_FROM_MOON = 'SATURN_3RD_FROM_MOON',
  SATURN_10TH_FROM_MOON = 'SATURN_10TH_FROM_MOON',
  JUPITER_2ND_FROM_MOON = 'JUPITER_2ND_FROM_MOON',
  JUPITER_5TH_FROM_MOON = 'JUPITER_5TH_FROM_MOON',
  JUPITER_7TH_FROM_MOON = 'JUPITER_7TH_FROM_MOON',
  JUPITER_9TH_FROM_MOON = 'JUPITER_9TH_FROM_MOON',
  JUPITER_11TH_FROM_MOON = 'JUPITER_11TH_FROM_MOON'
}

export interface TransitAnalysisResult {
  planet: Planet;
  conditions: readonly (TransitCondition | string)[];
  evidence: readonly TransitEvidence[];
  position?: TransitPosition;
  housePosition?: TransitHousePosition;
  aspects?: TransitAspect[];
  transitSign?: Sign;
  houseFromMoon?: number;
  houseFromAscendant?: number;
}

export interface TransitAnalysisInput {
  at?: string;
  transitDate?: string;
  transit?: any;
  natalMoonSign?: Sign;
  natalAscendantSign?: Sign;
  transitPositions?: any;
  natalPlanetLongitudes?: Partial<Record<Planet, number>>;
}

export interface TransitAnalysisReport {
  at?: string;
  transitDate?: string;
  natalMoonSign?: Sign;
  natalAscendantSign?: Sign;
  results?: Partial<Record<Planet, TransitAnalysisResult>>;
  evidence?: readonly TransitEvidence[];
}

export interface TransitInput {
  at?: string;
  transitDate?: string;
  natalMoonSign?: Sign;
  natalAscendantSign?: Sign;
  natalMoonLongitude?: number;
  natalAscendantLongitude?: number;
  transitPositions?: any;
  transitLongitudes?: any;
}

export enum ShadbalaAggregationStatus {
  COMPLETE = 'COMPLETE',
  INCOMPLETE = 'INCOMPLETE',
  AVAILABLE = 'AVAILABLE',
  PARTIAL = 'PARTIAL',
  UNAVAILABLE = 'UNAVAILABLE'
}

export enum ShadbalaComponent {
  STHANA_BALA = 'STHANA_BALA',
  DIG_BALA = 'DIG_BALA',
  KALA_BALA = 'KALA_BALA',
  CHESHTA_BALA = 'CHESHTA_BALA',
  NAISARGIKA_BALA = 'NAISARGIKA_BALA',
  DRIK_BALA = 'DRIK_BALA'
}

export enum ShadbalaSubcomponent {
  STHANA_BALA = 'STHANA_BALA',
  UCHCHA_BALA = 'UCHCHA_BALA',
  SAPTAVARGAJA_BALA = 'SAPTAVARGAJA_BALA',
  OJA_YUGMA_BALA = 'OJA_YUGMA_BALA',
  KENDRADI_BALA = 'KENDRADI_BALA',
  DREKKANA_BALA = 'DREKKANA_BALA',
  DIG_BALA = 'DIG_BALA',
  KALA_BALA = 'KALA_BALA',
  NATHA_ONATHA_BALA = 'NATHA_ONATHA_BALA',
  NATONNATA_BALA = 'NATHA_ONATHA_BALA',
  PAKSHA_BALA = 'PAKSHA_BALA',
  TRIBHAGA_BALA = 'TRIBHAGA_BALA',
  ABDA_BALA = 'ABDA_BALA',
  VARSHA_BALA = 'ABDA_BALA',
  MASA_BALA = 'MASA_BALA',
  DINA_BALA = 'DINA_BALA',
  VARA_BALA = 'VARA_BALA',
  HORA_BALA = 'HORA_BALA',
  AYANA_BALA = 'AYANA_BALA',
  YUDDHA_BALA = 'YUDDHA_BALA',
  CHESHTA_BALA = 'CHESHTA_BALA',
  NAISARGIKA_BALA = 'NAISARGIKA_BALA',
  DRIK_BALA = 'DRIK_BALA',
  SHADBALA_TOTAL = 'SHADBALA_TOTAL'
}

export enum StrengthComponentStatus {
  CALCULATED = 'CALCULATED',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  EXACT = 'EXACT',
  APPROXIMATE = 'APPROXIMATE',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface ShadbalaMinimumRequirement {
  requiredShastiamsa: number;
  requiredRupa: number;
}

export const SHADBALA_MINIMUM_REQUIREMENTS: Readonly<Record<Planet, ShadbalaMinimumRequirement>> = Object.freeze({
  [Planet.SUN]: Object.freeze({ requiredShastiamsa: 390, requiredRupa: 6.5 }),
  [Planet.MOON]: Object.freeze({ requiredShastiamsa: 360, requiredRupa: 6.0 }),
  [Planet.MARS]: Object.freeze({ requiredShastiamsa: 300, requiredRupa: 5.0 }),
  [Planet.MERCURY]: Object.freeze({ requiredShastiamsa: 420, requiredRupa: 7.0 }),
  [Planet.JUPITER]: Object.freeze({ requiredShastiamsa: 390, requiredRupa: 6.5 }),
  [Planet.VENUS]: Object.freeze({ requiredShastiamsa: 330, requiredRupa: 5.5 }),
  [Planet.SATURN]: Object.freeze({ requiredShastiamsa: 300, requiredRupa: 5.0 }),
  [Planet.RAHU]: Object.freeze({ requiredShastiamsa: 0, requiredRupa: 0 }),
  [Planet.KETU]: Object.freeze({ requiredShastiamsa: 0, requiredRupa: 0 })
});

import type {
  FunctionalRole
} from './engine/functionalNature/functionalRoleTypes';

import type {
  InterpretationConfidence,
  PlanetInterpretationReport
} from './engine/planetInterpretation/planetInterpretationTypes';
import type { HouseInterpretationReport } from './engine/houseInterpretation/houseInterpretationTypes';
import type { DashaInterpretationReport } from './engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  DivisionalInterpretationReport,
  DivisionalDomainMetadata
} from './engine/divisionalInterpretation/divisionalInterpretationTypes';
import type {
  LifeThemeReport,
  LifeThemeAnalysis,
  LifeThemeEvidence,
  LifeThemeInput
} from './engine/lifeThemes/lifeThemeTypes';
import type {
  ChartSynthesisReport,
  ThemeSynthesis,
  SynthesisObservation,
  SynthesisEvidence
} from './engine/chartSynthesis/chartSynthesisTypes';
import type {
  FullNatalAnalysisReport,
  AnalysisAvailability,
  BirthInformationSection,
  MethodologySection,
  ExecutiveSummarySection,
  AscendantSection,
  PlanetReportItem,
  PlanetAnalysisSection,
  HouseReportItem,
  HouseAnalysisSection,
  FunctionalRoleReportItem,
  FunctionalRolesSection,
  YogaReportItem,
  YogasSection,
  PlanetaryStrengthReportItem,
  PlanetaryStrengthSection,
  DivisionalReportItem,
  D9Section,
  D10Section,
  VimshottariSection,
  CurrentDashaSection,
  CurrentTransitSection,
  LifeThemesSection,
  MajorLifePeriod,
  MajorLifePeriodsSection,
  OverallSynthesisSection,
  FullNatalAnalysisInput
} from './engine/fullNatalAnalysis/fullNatalAnalysisTypes';
import type { CareerThemeInterpretation } from './engine/themeInterpretation/themeInterpretationTypes';
import type { WealthThemeInterpretation } from './engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { YogaAnalysisReport, YogaResult } from './engine/yoga/yogaTypes';
import { LifeTheme } from './engine/lifeThemes/lifeThemeTypes';

export { LifeTheme };

export interface Horoscope {
  birthDetails: BirthDetails;
  ascendant?: AscendantDetails;
  positions?: PlanetaryPositions;
  planetFacts: Record<Planet, PlanetFact>;
  bhavas?: Record<number, BhavaFact>;
  vargas?: VargaPositions;
  nakshatras?: NakshatraMap;
  grahaDrishti?: NatalGrahaDrishti;
  fullNatalAnalysis: FullNatalAnalysisReport;
  rasiChart?: any;
  charts?: any;
  vimshottari?: any;
  houseLordship?: any;
  yogas?: any;
  natalGrahaDrishti?: NatalGrahaDrishti;
  planetAnalysis?: any;
  houseAnalysis?: any;
  functionalNatureIntegration?: any;
  functionalRoles?: any;
  planetaryStrength?: any;
  planetInterpretation?: any;
  houseInterpretation?: any;
  dashaInterpretation?: any;
  divisionalInterpretation?: any;
  lifeThemes?: any;
  chartSynthesis?: any;
  themeInterpretationV2?: {
    career?: CareerThemeInterpretation;
    wealth?: WealthThemeInterpretation;
  };
}

export type Chart = Horoscope;

export type {
  YogaAnalysisReport,
  YogaResult,
  InterpretationConfidence,
  FunctionalRole,
  PlanetInterpretationReport,
  HouseInterpretationReport,
  DashaInterpretationReport,
  DivisionalInterpretationReport,
  DivisionalDomainMetadata,
  LifeThemeReport,
  LifeThemeAnalysis,
  LifeThemeEvidence,
  LifeThemeInput,
  ChartSynthesisReport,
  ThemeSynthesis,
  SynthesisObservation,
  SynthesisEvidence,
  FullNatalAnalysisReport,
  AnalysisAvailability,
  BirthInformationSection,
  MethodologySection,
  ExecutiveSummarySection,
  AscendantSection,
  PlanetReportItem,
  PlanetAnalysisSection,
  HouseReportItem,
  HouseAnalysisSection,
  FunctionalRoleReportItem,
  FunctionalRolesSection,
  YogaReportItem,
  YogasSection,
  PlanetaryStrengthReportItem,
  PlanetaryStrengthSection,
  DivisionalReportItem,
  D9Section,
  D10Section,
  VimshottariSection,
  CurrentDashaSection,
  CurrentTransitSection,
  LifeThemesSection,
  MajorLifePeriod,
  MajorLifePeriodsSection,
  OverallSynthesisSection,
  FullNatalAnalysisInput
};
