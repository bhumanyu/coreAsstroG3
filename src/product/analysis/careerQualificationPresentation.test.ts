import { describe, expect, it } from 'vitest';
import {
  getCareerProfessionStatusCopy,
  type CareerProfessionStatus
} from './careerQualificationPresentation';

const professionStatuses: readonly CareerProfessionStatus[] = [
  'COMPLETE',
  'PARTIAL',
  'INSUFFICIENT_DATA'
];

describe('career profession status presentation', () => {
  it.each([
    [
      'COMPLETE',
      'Analysis complete',
      'The profession analysis completed for the available inputs.'
    ],
    [
      'PARTIAL',
      'Partial analysis',
      'Some parts of the profession analysis are incomplete. This status alone does not establish a positive or negative career outcome.'
    ],
    [
      'INSUFFICIENT_DATA',
      'Insufficient data',
      'The profession analysis could not be completed with the available inputs. This status alone is not a negative career prediction.'
    ]
  ] as const)('preserves %s as an accurately qualified analysis status', (status, label, explanation) => {
    expect(getCareerProfessionStatusCopy(status)).toEqual({ label, explanation });
  });

  it('provides copy for every profession status', () => {
    for (const status of professionStatuses) {
      expect(getCareerProfessionStatusCopy(status).label.length).toBeGreaterThan(0);
      expect(getCareerProfessionStatusCopy(status).explanation.length).toBeGreaterThan(0);
    }
  });
});
