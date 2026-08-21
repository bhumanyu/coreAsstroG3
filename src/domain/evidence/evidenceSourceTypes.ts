export type EvidenceSourceType =
  | 'HOUSE'
  | 'PLANET'
  | 'LORDSHIP'
  | 'ASPECT'
  | 'YOGA'
  | 'VARGA'
  | 'STRENGTH'
  | 'DASHA'
  | 'TRANSIT'
  | 'OTHER';

const VALID_EVIDENCE_SOURCE_TYPES: ReadonlySet<string> = new Set<EvidenceSourceType>([
  'HOUSE',
  'PLANET',
  'LORDSHIP',
  'ASPECT',
  'YOGA',
  'VARGA',
  'STRENGTH',
  'DASHA',
  'TRANSIT',
  'OTHER'
]);

export function isEvidenceSourceType(value: unknown): value is EvidenceSourceType {
  return typeof value === 'string' && VALID_EVIDENCE_SOURCE_TYPES.has(value);
}
