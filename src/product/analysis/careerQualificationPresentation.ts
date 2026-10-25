/**
 * Profession-analysis states currently exposed to the product layer.
 *
 * These are distinct from pattern-qualification dimension states. In
 * particular, PARTIAL does not mean MIXED and INSUFFICIENT_DATA does not
 * identify missing evidence for any individual pattern.
 */
export type CareerProfessionStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'INSUFFICIENT_DATA';

export interface CareerProfessionStatusCopy {
  readonly label: string;
  readonly explanation: string;
}

const PROFESSION_STATUS_COPY: Readonly<
  Record<CareerProfessionStatus, CareerProfessionStatusCopy>
> = Object.freeze({
  COMPLETE: Object.freeze({
    label: 'Analysis complete',
    explanation:
      'The profession analysis completed for the available inputs.'
  }),
  PARTIAL: Object.freeze({
    label: 'Partial analysis',
    explanation:
      'Some parts of the profession analysis are incomplete. ' +
      'This status alone does not establish a positive or negative career outcome.'
  }),
  INSUFFICIENT_DATA: Object.freeze({
    label: 'Insufficient data',
    explanation:
      'The profession analysis could not be completed with the available inputs. ' +
      'This status alone is not a negative career prediction.'
  })
});

export function getCareerProfessionStatusCopy(
  status: CareerProfessionStatus
): CareerProfessionStatusCopy {
  return PROFESSION_STATUS_COPY[status];
}
