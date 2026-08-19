import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  interpretCareerV2,
  resolveCareerConclusionStrength,
  calculateDomainStrength
} from './CareerDomainInterpreterV2';
import { CareerDomainInterpreter } from './CareerDomainInterpreter';
import { interpretDomain } from '../interpretation/DomainInterpretationService';
import { createDefaultDomainInterpreterRegistry } from '../interpretation/createDefaultDomainInterpreterRegistry';
import { createDomainEvidence, detectDomainConflicts } from '../interpretation';

describe('CareerDomainInterpreterV2', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  it('preserves existing career conclusion', () => {
    const legacy = interpretCareerTheme(horoscope);
    const v2 = interpretCareerV2(horoscope);

    expect(v2.domain).toBe('CAREER');
    expect(v2.version).toBe('V2');
    expect(v2.conclusion.statement).toContain(legacy.conclusion.summary);
  });

  it('separates natal promise from dasha activation', () => {
    const v2 = interpretCareerV2(horoscope);

    expect(v2.natalPromise).toBeDefined();
    expect(v2.natalPromise.domain).toBe('CAREER');
    expect(v2.dashaActivation).toBeDefined();
    expect(v2.dashaActivation.domain).toBe('CAREER');
    expect(v2.transitTrigger).toBeDefined();
    expect(v2.transitTrigger.domain).toBe('CAREER');
  });

  it('uses D10 as explicit career confirmation', () => {
    const v2 = interpretCareerV2(horoscope);

    expect(
      v2.vargaConfirmations.some((item) => item.varga === 'D10')
    ).toBe(true);
  });

  it('provides distinct manifestation modes rather than single strength', () => {
    const v2 = interpretCareerV2(horoscope);

    expect(v2.manifestations.length).toBeGreaterThanOrEqual(3);
    const modes = v2.manifestations.map((m) => m.mode);
    expect(modes).toContain('LEADERSHIP');
    expect(modes).toContain('EMPLOYMENT');
    expect(modes).toContain('TECHNICAL_SPECIALIZATION');
  });

  it('implements DomainInterpreter and works via registry service', () => {
    const interpreter = new CareerDomainInterpreter();
    expect(interpreter.domain).toBe('CAREER');

    const result = interpreter.interpret(horoscope);
    expect(result.domain).toBe('CAREER');

    const registry = createDefaultDomainInterpreterRegistry();
    expect(registry.has('CAREER')).toBe(true);

    const serviceResult = interpretDomain({
      horoscope,
      domain: 'CAREER',
      registry
    });
    expect(serviceResult.domain).toBe('CAREER');
    expect(serviceResult.conclusion).toBeDefined();
  });

  it('preserves P-027 invariant: Natal Promise does not include Dasha evidence', () => {
    const v2 = interpretCareerV2(horoscope);
    const dashaEvidenceIds = v2.evidence
      .filter((e) => e.phase === 'DASHA_ACTIVATION')
      .map((e) => e.id);

    for (const dashaId of dashaEvidenceIds) {
      expect(v2.natalPromise.evidenceIds).not.toContain(dashaId);
    }
  });

  it('does not fall back to arbitrary natal evidence when Dasha/Transit have no relationship', () => {
    const v2 = interpretCareerV2(horoscope);
    const dashaEvidence = v2.evidence.filter((e) => e.phase === 'DASHA_ACTIVATION');
    const expectedDashaLinks = Array.from(
      new Set(dashaEvidence.flatMap((e) => e.relatedEvidenceIds))
    );

    expect(v2.dashaActivation.activatedPromiseEvidenceIds).toEqual(expectedDashaLinks);
    if (dashaEvidence.length > 0 && expectedDashaLinks.length === 0) {
      expect(v2.dashaActivation.effect).toBe('UNKNOWN');
    }

    const transitEvidence = v2.evidence.filter((e) => e.phase === 'TRANSIT_TRIGGER');
    const expectedTransitLinks = Array.from(
      new Set(transitEvidence.flatMap((e) => e.relatedEvidenceIds))
    );

    expect(v2.transitTrigger.triggeredPromiseEvidenceIds).toEqual(expectedTransitLinks);
    if (transitEvidence.length > 0 && expectedTransitLinks.length === 0) {
      expect(v2.transitTrigger.effect).toBe('UNKNOWN');
    }
  });

  it('distinguishes primary promise from multiple modifier/timing/varga conflicts without collapsing natal strength', () => {
    // Controlled fixture: PRIMARY support + VARGA challenge + TIMING challenge + TRANSIT challenge
    const fixtureEvidence = [
      createDomainEvidence({
        id: 'CAREER-PRIMARY-01',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: '10th lord strongly placed in kendra with directional strength',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 95,
        relatedEvidenceIds: []
      }),
      createDomainEvidence({
        id: 'CAREER-PRIMARY-02',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Sun exalted in 10th house indicating strong leadership promise',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 90,
        relatedEvidenceIds: []
      }),
      createDomainEvidence({
        id: 'CAREER-VARGA-01',
        domain: 'CAREER',
        role: 'CONFIRMATION',
        phase: 'VARGA_CONFIRMATION',
        source: 'D10',
        statement: '10th lord debilitated in D10 Dasamsa',
        polarity: 'CHALLENGING',
        strength: 'MODERATE',
        priority: 70,
        relatedEvidenceIds: ['CAREER-PRIMARY-01']
      }),
      createDomainEvidence({
        id: 'CAREER-TIMING-01',
        domain: 'CAREER',
        role: 'TIMING',
        phase: 'DASHA_ACTIVATION',
        source: 'DASHA',
        statement: 'Current Mahadasha lord is 8th lord creating career friction',
        polarity: 'CHALLENGING',
        strength: 'MODERATE',
        priority: 30,
        relatedEvidenceIds: ['CAREER-PRIMARY-01']
      }),
      createDomainEvidence({
        id: 'CAREER-TRANSIT-01',
        domain: 'CAREER',
        role: 'TIMING',
        phase: 'TRANSIT_TRIGGER',
        source: 'TRANSIT',
        statement: 'Saturn transiting 10th house bringing heavy workload and delays',
        polarity: 'CHALLENGING',
        strength: 'MODERATE',
        priority: 30,
        relatedEvidenceIds: ['CAREER-PRIMARY-01']
      })
    ];

    // Verify multi-tiered conflict detection accurately detects all 3 distinct conflict tiers
    const detectedConflicts = detectDomainConflicts('CAREER', fixtureEvidence);
    expect(detectedConflicts.length).toBe(3);

    const detectedTiers = detectedConflicts.map((c) => c.tier);
    expect(detectedTiers).toContain('PRIMARY_VS_VARGA');
    expect(detectedTiers).toContain('PRIMARY_VS_TIMING');
    expect(detectedTiers).toContain('PRIMARY_VS_TRANSIT');
    expect(new Set(detectedTiers).size).toBe(3);

    // Verify Natal Promise strength is calculated solely from natal factors and remains strong
    const natalSupporting = fixtureEvidence.filter(
      (e) => e.phase === 'NATAL_PROMISE' && e.polarity === 'SUPPORTING'
    );
    const natalChallenging = fixtureEvidence.filter(
      (e) => e.phase === 'NATAL_PROMISE' && e.polarity === 'CHALLENGING'
    );
    const natalStrength = calculateDomainStrength(natalSupporting, natalChallenging);
    expect(natalStrength).toBe('VERY_STRONG');

    // Verify conclusion strength logic preserves hierarchy:
    // When D10 conflicts, it applies systematic varga downgrade (VERY_STRONG -> STRONG)
    // but does NOT collapse to generic MIXED or WEAK due to timing/transit conflicts
    const conclusionWithVargaConflict = resolveCareerConclusionStrength(
      natalStrength,
      'CONFLICTS',
      detectedConflicts
    );
    expect(conclusionWithVargaConflict).toBe('STRONG');

    // When D10 confirms, timing and transit conflicts preserve the strong natal promise
    const timingOnlyConflicts = detectedConflicts.filter(
      (c) => c.tier === 'PRIMARY_VS_TIMING' || c.tier === 'PRIMARY_VS_TRANSIT'
    );
    const conclusionWithTimingOnlyConflicts = resolveCareerConclusionStrength(
      'STRONG',
      'CONFIRMS',
      timingOnlyConflicts
    );
    expect(conclusionWithTimingOnlyConflicts).toBe('STRONG');
  });
});
