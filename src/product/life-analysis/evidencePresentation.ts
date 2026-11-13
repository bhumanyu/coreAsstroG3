import type { ProductEvidence } from '../analysis/productAnalysisTypes';
import {
  ENGLISH_USER_FACING_COPY,
  type UserFacingCopyProvider
} from './userFacingInterpretation';

export interface UserFacingEvidence {
  readonly id: string;
  readonly title: string;
  readonly roleLabel: string;
  readonly directionLabel: string;
  readonly explanation: string;
  readonly sourceLabel: string;
  readonly role: ProductEvidence['role'];
  readonly direction: ProductEvidence['direction'];
  readonly ruleId?: string;
  readonly derivedFromIds: readonly string[];
  readonly technical: {
    readonly id: string;
    readonly ruleId?: string;
    readonly source: string;
    readonly direction: string;
    readonly role: string;
    readonly statement: string;
    readonly sourceType?: string;
    readonly phase?: string;
    readonly dimension?: string;
    readonly house?: number;
    readonly houses?: readonly number[];
    readonly planet?: string;
    readonly derivedFromIds?: readonly string[];
  };
}

function lookup<Key extends string>(
  map: Readonly<Record<Key, string>>,
  key: string
): string | undefined {
  return Object.prototype.hasOwnProperty.call(map, key)
    ? map[key as Key]
    : undefined;
}

function validHouse(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12;
}

function cleanStatement(statement: string): string {
  return statement
    .replace(/\b(?:Career relevance|Effect):\s*[A-Z][A-Z0-9_]*\.?/gi, '')
    .replace(/\s+([,.])/g, '$1')
    .replace(/([,.])\s*([,.])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/[,.]\s*$/, '');
}

export function buildUserFacingEvidence(
  evidence: ProductEvidence,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingEvidence {
  const rawSource = evidence.source.trim().toUpperCase();
  const sourceLabel = lookup(copy.evidenceSourceLabels, rawSource)
    ?? copy.unknownEvidenceSourceLabel;
  const roleLabel = lookup(copy.evidenceRoleLabels, evidence.role)
    ?? copy.unknownEvidenceRoleLabel;
  const directionLabel = lookup(copy.evidenceDirectionLabels, evidence.direction)
    ?? copy.unknownEvidenceDirectionLabel;
  const houses = (evidence.houses ?? []).filter(validHouse);
  const house = validHouse(evidence.house) ? evidence.house : undefined;
  const planet = evidence.planet?.trim();

  let title = sourceLabel;
  if (houses.length >= 2) {
    title = copy.evidenceHousePairTitle(houses[0], houses[1]);
  } else if (house !== undefined && planet) {
    title = copy.evidencePlanetTitle(planet, house);
  } else if (house !== undefined) {
    title = copy.evidenceHouseTitle(house, evidence.sourceType);
  } else if (planet) {
    title = copy.evidencePlanetTitle(planet);
  }

  const explanation = cleanStatement(evidence.statement)
    || copy.evidenceSummary(roleLabel, directionLabel);

  return {
    id: evidence.id,
    title,
    roleLabel,
    directionLabel,
    explanation,
    sourceLabel,
    role: evidence.role,
    direction: evidence.direction,
    ruleId: evidence.ruleId,
    derivedFromIds: evidence.derivedFromIds ?? [],
    technical: {
      id: evidence.id,
      ruleId: evidence.ruleId,
      source: evidence.source,
      direction: evidence.direction,
      role: evidence.role,
      statement: evidence.statement,
      sourceType: evidence.sourceType,
      phase: evidence.phase,
      dimension: evidence.dimension,
      house: evidence.house,
      houses: evidence.houses,
      planet: evidence.planet,
      derivedFromIds: evidence.derivedFromIds
    }
  };
}
