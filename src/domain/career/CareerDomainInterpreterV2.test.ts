import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { interpretCareerTheme } from '../../engine/themeInterpretation/themeInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';
import { CareerDomainInterpreter } from './CareerDomainInterpreter';
import { interpretDomain } from '../interpretation/DomainInterpretationService';
import { createDefaultDomainInterpreterRegistry } from '../interpretation/createDefaultDomainInterpreterRegistry';

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
    const v2 = interpretCareerV2(horoscope);
    if (v2.conflicts.length > 1) {
      const tiers = v2.conflicts.map((c) => c.tier);
      const uniqueTiers = new Set(tiers);
      expect(uniqueTiers.size).toBeGreaterThanOrEqual(1);
    }
    // Natal promise strength remains strong or moderate even if timing/transit is challenging
    expect(['STRONG', 'VERY_STRONG', 'MODERATE']).toContain(v2.natalPromise.strength);
    expect(v2.conclusion.statement.length).toBeGreaterThan(0);
  });
});
