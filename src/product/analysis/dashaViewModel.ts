/**
 * Dasha & Timing View Model & Selectors (P-UI-07)
 *
 * Pure projection layer over the canonical ProductAnalysis aggregate.
 * Does NOT perform any domain, astrology, Vimshottari, transit, or scoring calculations.
 * Reconciles strictly over the canonical types from productAnalysisTypes.ts.
 */

import type {
  ProductAnalysis,
  ProductStatus,
  ProductAvailability,
  ProductDirection,
  ProductEvidence,
  ProductEvidenceRole,
  ProductDashaPeriod,
  ProductWarning,
  TransitEffect,
  TransitProductResult
} from './productAnalysisTypes';
import { selectDashaHierarchy, selectAllEvidence } from './productAnalysisSelectors';

export interface DashaPeriodViewModel {
  readonly level: ProductDashaPeriod['level'];
  readonly planet: string | null;
  readonly start: string | null;
  readonly end: string | null;
  readonly role: ProductEvidenceRole;
  readonly direction: ProductDirection;
  readonly statement: string | null;
  readonly available: boolean;
  readonly effect?: string;
  readonly evidenceIds?: readonly string[];
}

export interface DashaHeroViewModel {
  readonly availability: ProductAvailability;
  readonly status: ProductStatus;
  readonly asOf: string;
  readonly summary?: string;
  readonly currentPeriodLabel: string;
  readonly mdPlanet: string | null;
  readonly adPlanet: string | null;
  readonly pdPlanet: string | null;
  readonly warnings?: readonly ProductWarning[];
}

export interface DashaDomainActivationViewModel {
  readonly status: ProductAvailability;
  readonly periods: readonly DashaPeriodViewModel[];
  readonly statement?: string;
  readonly currentPressure?: string;
}

export interface DashaDomainTransitViewModel {
  readonly status: ProductAvailability;
  readonly effect: TransitEffect | string;
  readonly statement?: string;
}

export interface DashaTransitViewModel {
  readonly career: DashaDomainTransitViewModel;
  readonly wealth: DashaDomainTransitViewModel;
}

export interface DashaQualificationViewModel {
  readonly title: string;
  readonly statement: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DashaEvidenceViewModel {
  readonly total: number;
  readonly groups: Record<ProductEvidenceRole, readonly ProductEvidence[]>;
}

export interface DashaViewModel {
  readonly status: ProductStatus;
  readonly hero: DashaHeroViewModel;
  readonly hierarchy: readonly DashaPeriodViewModel[];
  readonly careerActivation: DashaDomainActivationViewModel;
  readonly wealthActivation: DashaDomainActivationViewModel;
  readonly transit: DashaTransitViewModel;
  readonly evidence: DashaEvidenceViewModel;
  readonly qualifications: readonly DashaQualificationViewModel[];
  readonly warnings: readonly string[];
}

/**
 * Normalizes a canonical ProductDashaPeriod into DashaPeriodViewModel.
 * Preserves role and direction as independent dimensions.
 */
export function mapDashaPeriod(period: ProductDashaPeriod): DashaPeriodViewModel {
  return {
    level: period.level,
    planet: period.planet ?? null,
    start: period.start ?? null,
    end: period.end ?? null,
    role: period.role,
    direction: period.direction,
    statement: period.statement ?? null,
    available: true,
    effect: period.effect,
    evidenceIds: period.evidenceIds ?? []
  };
}

export function mapDomainTransit(transit?: TransitProductResult): DashaDomainTransitViewModel {
  if (!transit) {
    return {
      status: 'UNAVAILABLE',
      effect: 'UNAVAILABLE',
      statement: undefined
    };
  }
  return {
    status: transit.status ?? 'UNAVAILABLE',
    effect: transit.effect ?? 'UNAVAILABLE',
    statement: transit.statement
  };
}

/**
 * Pure projection of ProductAnalysis into DashaViewModel.
 * Adheres strictly to spec §24:
 * - MD/AD/PD roles distinct
 * - Role and direction independent
 * - PARTIAL retains available periods with a PARTIAL indicator
 * - Transit surfaced as timing/trigger context
 * - No predictive percentages or scoring calculations
 */
export function selectDashaViewModel(analysis: ProductAnalysis): DashaViewModel {
  // 1. Hierarchy: ordered MD/AD/PD periods from selectDashaHierarchy
  const rawPeriods = selectDashaHierarchy(analysis);
  const hierarchy: readonly DashaPeriodViewModel[] = rawPeriods.map(mapDashaPeriod);

  // 2. Hero availability: 3 present -> AVAILABLE, 0 -> UNAVAILABLE, otherwise PARTIAL
  const md = analysis.dasha.current.mahadasha;
  const ad = analysis.dasha.current.antardasha;
  const pd = analysis.dasha.current.pratyantardasha;

  const presentCount = [md, ad, pd].filter(Boolean).length;
  const heroAvailability: ProductAvailability =
    presentCount === 3
      ? 'AVAILABLE'
      : presentCount === 0
      ? 'UNAVAILABLE'
      : 'PARTIAL';

  const mdPlanet = md?.planet ?? null;
  const adPlanet = ad?.planet ?? null;
  const pdPlanet = pd?.planet ?? null;

  const planetParts = [mdPlanet, adPlanet, pdPlanet].filter(
    (p): p is string => typeof p === 'string' && p.trim().length > 0
  );
  const currentPeriodLabel =
    planetParts.length > 0 ? planetParts.join(' → ') : 'Timing Unavailable';

  const hero: DashaHeroViewModel = {
    availability: heroAvailability,
    status: analysis.status,
    asOf: analysis.dasha.asOf ?? analysis.asOf,
    summary: analysis.dasha.summary,
    currentPeriodLabel,
    mdPlanet,
    adPlanet,
    pdPlanet,
    warnings: analysis.warnings
  };

  // 3. Career activation: read from analysis.career.activation.dasha
  const careerDasha = analysis.career.activation.dasha;
  const careerActivation: DashaDomainActivationViewModel = {
    status: careerDasha.status,
    periods: (careerDasha.periods ?? []).map(mapDashaPeriod),
    statement: careerDasha.currentActivation,
    currentPressure: careerDasha.currentPressure
  };

  // 4. Wealth activation: read from analysis.wealth.activation.dasha
  const wealthDasha = analysis.wealth.activation.dasha;
  const wealthActivation: DashaDomainActivationViewModel = {
    status: wealthDasha.status,
    periods: (wealthDasha.periods ?? []).map(mapDashaPeriod),
    statement: wealthDasha.statement
  };

  // 5. Transit timing: project career and wealth transits independently
  const transit: DashaTransitViewModel = {
    career: mapDomainTransit(analysis.career?.activation?.transit),
    wealth: mapDomainTransit(analysis.wealth?.activation?.transit)
  };

  // 6. Evidence: combine career + wealth evidence, dedupe by id, group by ProductEvidenceRole
  const allEvidence = selectAllEvidence(analysis);
  const groups: Record<ProductEvidenceRole, ProductEvidence[]> = {
    PRIMARY: [],
    SUPPORTING: [],
    CHALLENGING: [],
    MODIFIER: [],
    REFINEMENT: [],
    CONFLICTING: [],
    NEUTRAL: []
  };
  for (const item of allEvidence) {
    if (groups[item.role]) {
      groups[item.role].push(item);
    } else {
      groups.NEUTRAL.push(item);
    }
  }
  const evidence: DashaEvidenceViewModel = {
    total: allEvidence.length,
    groups
  };

  // 7. Qualifications: combine career + wealth qualifications
  const careerQuals = analysis.career.qualifications ?? [];
  const wealthQuals = analysis.wealth.qualifications ?? [];
  const combinedQuals = [...careerQuals, ...wealthQuals];
  const qualifications: readonly DashaQualificationViewModel[] = combinedQuals.map((q) => ({
    title: q.type,
    statement: q.description,
    severity: q.severity
  }));

  // 8. Warnings: map analysis.warnings to string messages
  const warnings: readonly string[] = (analysis.warnings ?? []).map((w) => w.message);

  return {
    status: analysis.status,
    hero,
    hierarchy,
    careerActivation,
    wealthActivation,
    transit,
    evidence,
    qualifications,
    warnings
  };
}
