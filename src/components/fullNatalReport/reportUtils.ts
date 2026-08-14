export const REPORT_SECTION_IDS = [
  'birth-information',
  'methodology',
  'executive-summary',
  'ascendant',
  'planets',
  'houses',
  'functional-roles',
  'yogas',
  'planetary-strength',
  'd9',
  'd10',
  'vimshottari',
  'current-dasha',
  'current-transit',
  'life-themes',
  'major-life-periods',
  'overall-synthesis'
] as const;

export type ReportSectionId = (typeof REPORT_SECTION_IDS)[number];

export interface NavigationItem {
  readonly id: ReportSectionId;
  readonly number: number;
  readonly label: string;
}

export const REPORT_NAVIGATION: readonly NavigationItem[] = [
  { id: 'birth-information', number: 1, label: 'Birth Information' },
  { id: 'methodology', number: 2, label: 'Methodology & Scope' },
  { id: 'executive-summary', number: 3, label: 'Executive Summary' },
  { id: 'ascendant', number: 4, label: 'Ascendant (Lagna)' },
  { id: 'planets', number: 5, label: 'Planetary Analysis' },
  { id: 'houses', number: 6, label: 'House Analysis' },
  { id: 'functional-roles', number: 7, label: 'Functional Roles' },
  { id: 'yogas', number: 8, label: 'Yoga Formations' },
  { id: 'planetary-strength', number: 9, label: 'Planetary Strengths' },
  { id: 'd9', number: 10, label: 'D9 Navamsha' },
  { id: 'd10', number: 11, label: 'D10 Dashamsha' },
  { id: 'vimshottari', number: 12, label: 'Vimshottari Dasha' },
  { id: 'current-dasha', number: 13, label: 'Active Dasha' },
  { id: 'current-transit', number: 14, label: 'Current Transit' },
  { id: 'life-themes', number: 15, label: 'Life Themes' },
  { id: 'major-life-periods', number: 16, label: 'Major Life Periods' },
  { id: 'overall-synthesis', number: 17, label: 'Overall Synthesis' }
];

export function formatLongitude(deg?: number): string {
  if (deg === undefined || deg === null || Number.isNaN(deg)) {
    return 'N/A';
  }
  return `${deg.toFixed(2)}°`;
}

export function formatConfidence(conf?: string): string {
  if (!conf) return 'UNKNOWN';
  return conf.toUpperCase();
}

export function formatAvailability(status?: string): string {
  if (!status) return 'UNAVAILABLE';
  switch (status.toUpperCase()) {
    case 'AVAILABLE':
      return 'Available';
    case 'PARTIAL':
      return 'Partial Analysis';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return status;
  }
}

export function formatPlanetName(planet?: string): string {
  if (!planet) return 'N/A';
  return planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
}

export function formatSignName(sign?: string): string {
  if (!sign) return 'N/A';
  return sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
}

export function formatLifeThemeLabel(theme?: string): string {
  if (!theme) return 'N/A';
  return theme
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatYogaCategory(category?: string): string {
  if (!category) return 'N/A';
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatFunctionalRole(role?: string): string {
  if (!role) return 'NEUTRAL';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}
