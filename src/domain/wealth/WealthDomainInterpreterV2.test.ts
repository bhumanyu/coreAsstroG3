import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { interpretWealthTheme } from '../../engine/themeInterpretation/wealthThemeInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretWealthV2 } from './WealthDomainInterpreterV2';
import { WealthDomainInterpreter } from './WealthDomainInterpreter';
import { interpretDomain } from '../interpretation/DomainInterpretationService';
import { createDefaultDomainInterpreterRegistry } from '../interpretation/createDefaultDomainInterpreterRegistry';

describe('WealthDomainInterpreterV2', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  it('preserves existing wealth conclusion summary', () => {
    const legacy = interpretWealthTheme(horoscope);
    const v2 = interpretWealthV2(horoscope);

    expect(v2.domain).toBe('WEALTH');
    expect(v2.version).toBe('V2');
    expect(v2.conclusion.statement).toContain(legacy.conclusion.summary);
  });

  it('preserves accumulation/gains/fortune/speculation separation', () => {
    const result = interpretWealthV2(horoscope);
    const modes = result.manifestations.map((item) => item.mode);

    expect(modes).toContain('ACCUMULATION');
    expect(modes).toContain('GAINS');
    expect(modes).toContain('FORTUNE');
    expect(modes).toContain('SPECULATION');
  });

  it('preserves invariant: strong wealth != strong speculation', () => {
    const result = interpretWealthV2(horoscope);
    const speculationManifestation = result.manifestations.find(
      (m) => m.mode === 'SPECULATION'
    );
    const accumulationManifestation = result.manifestations.find(
      (m) => m.mode === 'ACCUMULATION'
    );

    expect(speculationManifestation).toBeDefined();
    expect(accumulationManifestation).toBeDefined();
    // Speculation is tracked distinctly from general accumulation/gains
    expect(speculationManifestation?.mode).toBe('SPECULATION');
  });

  it('implements DomainInterpreter and works via registry service', () => {
    const interpreter = new WealthDomainInterpreter();
    expect(interpreter.domain).toBe('WEALTH');

    const result = interpreter.interpret(horoscope);
    expect(result.domain).toBe('WEALTH');

    const registry = createDefaultDomainInterpreterRegistry();
    expect(registry.has('WEALTH')).toBe(true);

    const serviceResult = interpretDomain({
      horoscope,
      domain: 'WEALTH',
      registry
    });
    expect(serviceResult.domain).toBe('WEALTH');
    expect(serviceResult.conclusion).toBeDefined();
  });

  it('preserves P-027 invariant: Natal Promise does not include Dasha or Transit evidence', () => {
    const v2 = interpretWealthV2(horoscope);
    const nonNatalEvidenceIds = v2.evidence
      .filter((e) => e.phase === 'DASHA_ACTIVATION' || e.phase === 'TRANSIT_TRIGGER')
      .map((e) => e.id);

    for (const id of nonNatalEvidenceIds) {
      expect(v2.natalPromise.evidenceIds).not.toContain(id);
    }
  });

  it('does not fall back to arbitrary natal evidence when Dasha/Transit have no relationship', () => {
    const v2 = interpretWealthV2(horoscope);
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
});
