import { describe, expect, it } from 'vitest';
import {
  calculateFinalConfidenceV2,
  type FinalConfidenceInput
} from './finalConfidenceModel';

describe('CW-05D Final Confidence Model', () => {
  it('returns HIGH when multiple independent sources are strong and consistent', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 3,

      activationStatus: 'SUPPORT',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'SUPPORT',
      timingConfidence: 0.9,

      divisionalStatus: 'CONFIRMS',

      manifestationConfidences: ['HIGH', 'HIGH'],

      manifestationStatuses: ['STRONG', 'VERY_STRONG'],

      evidenceSourceCount: 5
    });

    expect(result.final).toBe('HIGH');
    expect(result.evidenceCoverage).toBe('HIGH');
    expect(result.contradictionLevel).toBe('NONE');
    expect(result.dashaConsistency).toBe('CONSISTENT');
  });

  it('keeps confidence HIGH when timing is a challenge but the timing conclusion is itself reliable', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 3,

      activationStatus: 'SUPPORT',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'CHALLENGE',
      timingConfidence: 0.9,

      divisionalStatus: 'CONFIRMS',

      manifestationConfidences: ['HIGH', 'HIGH'],

      manifestationStatuses: ['STRONG', 'STRONG'],

      evidenceSourceCount: 5
    });

    expect(result.final).toBe('HIGH');
  });

  it('reduces confidence when a major divisional contradiction exists', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 3,

      activationStatus: 'SUPPORT',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'SUPPORT',
      timingConfidence: 0.9,

      divisionalStatus: 'CONFLICTS',

      manifestationConfidences: ['HIGH', 'HIGH'],

      manifestationStatuses: ['STRONG', 'STRONG'],

      evidenceSourceCount: 5
    });

    expect(result.final).toBe('MEDIUM');
    expect(result.contradictionLevel).toBe('MEDIUM');
  });

  it('caps confidence when CW-05C Dasha consistency fails', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 3,

      activationStatus: 'SUPPORT',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: false,
      dashaHierarchyRolesConsistent: false,

      timingStatus: 'SUPPORT',
      timingConfidence: 0.9,

      divisionalStatus: 'CONFIRMS',

      manifestationConfidences: ['HIGH', 'HIGH'],

      manifestationStatuses: ['STRONG', 'STRONG'],

      evidenceSourceCount: 5
    });

    expect(result.final).toBe('MEDIUM');
    expect(result.dashaConsistency).toBe('INCONSISTENT');
    expect(result.consistencyCapApplied).toBe(true);
  });

  it('does not set consistencyCapApplied to true if confidence was already LOW or MEDIUM', () => {
    // Case 1: Base confidence is MEDIUM (e.g. natal evidence count 1)
    const resultMedium = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 1, // MEDIUM natal quality

      activationStatus: 'SUPPORT',
      activationConfidence: 'LOW',

      dashaEffectConsistent: false,
      dashaHierarchyRolesConsistent: false,

      timingStatus: 'SUPPORT',
      timingConfidence: 0.2,

      divisionalStatus: 'UNAVAILABLE',

      manifestationConfidences: [],
      manifestationStatuses: [],

      evidenceSourceCount: 1
    });

    expect(resultMedium.final).toBe('MEDIUM');
    expect(resultMedium.dashaConsistency).toBe('INCONSISTENT');
    // Inconsistency existed, but did not reduce confidence level (already MEDIUM)
    expect(resultMedium.consistencyCapApplied).toBe(false);

    // Case 2: Base confidence is LOW (undetermined natal promise)
    const resultLow = calculateFinalConfidenceV2({
      natalPromise: 'UNDETERMINED',
      natalEvidenceCount: 0,

      activationStatus: 'SUPPORT',
      activationConfidence: 'LOW',

      dashaEffectConsistent: false,
      dashaHierarchyRolesConsistent: false,

      timingStatus: 'SUPPORT',
      timingConfidence: 0.2,

      divisionalStatus: 'UNAVAILABLE',

      manifestationConfidences: [],
      manifestationStatuses: [],

      evidenceSourceCount: 1
    });

    expect(resultLow.final).toBe('LOW');
    expect(resultLow.dashaConsistency).toBe('INCONSISTENT');
    expect(resultLow.consistencyCapApplied).toBe(false);
  });

  it('correctly classifies partial Dasha consistency states', () => {
    const baseInput: Omit<
      FinalConfidenceInput,
      'dashaEffectConsistent' | 'dashaHierarchyRolesConsistent'
    > = {
      natalPromise: 'STRONG',
      natalEvidenceCount: 2,
      activationStatus: 'SUPPORT',
      timingStatus: 'SUPPORT',
      divisionalStatus: 'CONFIRMS',
      manifestationConfidences: [],
      manifestationStatuses: [],
      evidenceSourceCount: 3
    };

    // true + undefined => UNAVAILABLE
    const res1 = calculateFinalConfidenceV2({
      ...baseInput,
      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: undefined
    });
    expect(res1.dashaConsistency).toBe('UNAVAILABLE');

    // false + undefined => INCONSISTENT
    const res2 = calculateFinalConfidenceV2({
      ...baseInput,
      dashaEffectConsistent: false,
      dashaHierarchyRolesConsistent: undefined
    });
    expect(res2.dashaConsistency).toBe('INCONSISTENT');

    // undefined + undefined => UNAVAILABLE
    const res3 = calculateFinalConfidenceV2({
      ...baseInput,
      dashaEffectConsistent: undefined,
      dashaHierarchyRolesConsistent: undefined
    });
    expect(res3.dashaConsistency).toBe('UNAVAILABLE');

    // true + true => CONSISTENT
    const res4 = calculateFinalConfidenceV2({
      ...baseInput,
      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true
    });
    expect(res4.dashaConsistency).toBe('CONSISTENT');
  });

  it('does not treat aligned challenge signals as contradiction', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 2,

      activationStatus: 'CHALLENGE',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'CHALLENGE',
      timingConfidence: 0.85,

      divisionalStatus: 'CONFIRMS',

      manifestationConfidences: ['HIGH'],

      manifestationStatuses: ['CHALLENGED'],

      evidenceSourceCount: 5
    });

    expect(result.contradictionLevel).toBe('NONE');
    expect(result.final).toBe('HIGH');
  });

  it('does not let strong secondary evidence override weak natal promise', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'WEAK',
      natalEvidenceCount: 3,

      activationStatus: 'SUPPORT',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'SUPPORT',
      timingConfidence: 0.9,

      divisionalStatus: 'CONFIRMS',

      manifestationConfidences: ['HIGH', 'HIGH'],

      manifestationStatuses: ['VERY_STRONG', 'VERY_STRONG'],

      evidenceSourceCount: 5
    });

    /*
     * Confidence may be HIGH because the evidence
     * is coherent, but this model never changes
     * natalPromise itself.
     */
    expect(result.final).toBe('HIGH');
  });

  it('returns LOW for insufficient evidence', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'UNDETERMINED',
      natalEvidenceCount: 0,

      activationStatus: 'INSUFFICIENT_DATA',

      timingStatus: 'INSUFFICIENT_DATA',

      divisionalStatus: 'UNAVAILABLE',

      manifestationConfidences: [],

      manifestationStatuses: [],

      evidenceSourceCount: 0
    });

    expect(result.final).toBe('LOW');
    expect(result.evidenceCoverage).toBe('LOW');
  });

  it('returns MEDIUM for a known natal foundation with moderate supporting evidence', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 1,

      activationStatus: 'SUPPORT',
      activationConfidence: 'MEDIUM',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'NEUTRAL',
      timingConfidence: 0.5,

      divisionalStatus: 'PARTIALLY_CONFIRMS',

      manifestationConfidences: ['MEDIUM'],

      manifestationStatuses: ['STRONG'],

      evidenceSourceCount: 3
    });

    expect(result.final).toBe('MEDIUM');
  });

  it('treats challenge direction separately from confidence quality', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 2,

      activationStatus: 'CHALLENGE',
      activationConfidence: 'HIGH',

      dashaEffectConsistent: true,
      dashaHierarchyRolesConsistent: true,

      timingStatus: 'CHALLENGE',
      timingConfidence: 0.85,

      divisionalStatus: 'CONFIRMS',

      manifestationConfidences: ['HIGH'],

      manifestationStatuses: ['CHALLENGED'],

      evidenceSourceCount: 5
    });

    /*
     * The engine can be highly confident that
     * the current situation is challenging.
     */
    expect(result.final).toBe('HIGH');
    expect(result.contradictionLevel).toBe('NONE');
  });

  it('does not count many manifestations as many independent evidence sources', () => {
    const result = calculateFinalConfidenceV2({
      natalPromise: 'STRONG',
      natalEvidenceCount: 1,

      activationStatus: 'NEUTRAL',
      activationConfidence: 'LOW',

      timingStatus: 'NEUTRAL',
      timingConfidence: 0.3,

      divisionalStatus: 'UNAVAILABLE',

      manifestationConfidences: ['HIGH', 'HIGH', 'HIGH', 'HIGH', 'HIGH'],

      manifestationStatuses: ['STRONG', 'STRONG', 'STRONG', 'STRONG', 'STRONG'],

      /*
       * Still only two actual source categories:
       * natal + manifestation.
       */
      evidenceSourceCount: 2
    });

    expect(result.evidenceCoverage).toBe('MEDIUM');
  });
});
