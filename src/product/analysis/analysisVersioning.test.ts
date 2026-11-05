import { describe, expect, it } from 'vitest';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { migrateLegacyProductAnalysis, assessHistoricalReplay, sameDeterministicVersionManifest, aiExplanationVersionChanged } from './analysisVersioning';
import { buildFailedProductAnalysis } from './productAnalysisMapper';
import type { ProductAnalysisVersionManifest } from './productAnalysisTypes';

describe('D02 analysis version manifest', () => {
  it('records core runtime versions and explicit gaps for unavailable independent components', () => {
    const context = createAnalysisContext({ asOf: '2026-11-05T00:00:00Z' });
    const failed = buildFailedProductAnalysis({
      dateTimeStr: '1990-01-01T00:00:00Z', timeZone: 'Asia/Kolkata',
      latitude: 12.9, longitude: 77.6, ayanamsa: 'LAHIRI'
    } as any, 'fixture failure', context);
    const manifest = failed.versionManifest;
    expect(manifest?.deterministic.calculationEngine).toMatchObject({ status: 'RECORDED', version: context.engineVersion });
    expect(manifest?.deterministic.ruleCatalogue).toMatchObject({ status: 'RECORDED', version: context.rulesVersion });
    expect(manifest?.deterministic.careerSynthesis.status).toBe('NOT_RECORDED');
    expect(manifest?.deterministic.wealthSynthesis.status).toBe('NOT_RECORDED');
    expect(manifest?.deterministic.referenceDatasets.DEFAULT.status).toBe('NOT_RECORDED');
    expect(manifest?.deterministic.replay.status).toBe('NOT_REPLAYABLE');
  });

  it('records supplied independent versions and privacy-safe configuration identifiers', () => {
    const context = createAnalysisContext({
      asOf: '2026-11-05T00:00:00Z',
      versionConfiguration: {
        calculationEngine: 'ASTRO-9',
        referenceDatasets: { ephemeris: 'SE-2026.2', classicalRules: 'RULESET-5' },
        ruleCatalogue: 'RULE-CAT-7',
        careerLogic: 'CAREER-4',
        wealthLogic: 'WEALTH-6',
        careerSynthesis: 'C11-3',
        wealthSynthesis: 'CW05-2',
        outputSchema: 'ProductAnalysis-v2',
        configuration: { housePolicy: 'WHOLE_SIGN', strictDashaValidation: true },
        inputRetention: 'RETAINED_BY_CALLER',
        requiredCodeAvailable: true,
        requiredDatasetsAvailable: true
      }
    });
    expect(context.versionConfiguration?.referenceDatasets?.ephemeris).toBe('SE-2026.2');
    expect(Object.isFrozen(context.versionConfiguration)).toBe(true);
    expect(Object.isFrozen(context.versionConfiguration?.configuration)).toBe(true);
    const projected = buildFailedProductAnalysis({
      dateTimeStr: '1990-01-01T00:00:00Z', timeZone: 'Asia/Kolkata',
      latitude: 12.9, longitude: 77.6, ayanamsa: 'LAHIRI'
    } as any, 'fixture failure', context).versionManifest?.deterministic;
    expect(projected?.referenceDatasets.ephemeris).toMatchObject({ status: 'RECORDED', version: 'SE-2026.2' });
    expect(projected?.careerSynthesis).toMatchObject({ status: 'RECORDED', version: 'C11-3' });
    expect(projected?.wealthSynthesis).toMatchObject({ status: 'RECORDED', version: 'CW05-2' });
  });

  it('migrates legacy records without inventing missing historical versions', () => {
    const legacy = buildFailedProductAnalysis({
      dateTimeStr: '1990-01-01T00:00:00Z', timeZone: 'Asia/Kolkata',
      latitude: 12.9, longitude: 77.6, ayanamsa: 'LAHIRI'
    } as any, 'legacy fixture', createAnalysisContext({ asOf: '2025-01-01T00:00:00Z' }));
    const legacyWithoutManifest = { ...legacy, versionManifest: undefined };
    const migrated = migrateLegacyProductAnalysis(legacyWithoutManifest);
    expect(migrated.versionManifest?.deterministic.calculationEngine)
      .toMatchObject({ status: 'RECORDED', version: legacy.engineVersion });
    expect(migrated.versionManifest?.deterministic.careerSynthesis)
      .toMatchObject({ status: 'NOT_RECORDED', reason: 'PRE_D02_RECORD_DID_NOT_CAPTURE_THIS_VERSION' });
    expect(migrated.versionManifest?.deterministic.replay.status).toBe('NOT_REPLAYABLE');
    expect(legacyWithoutManifest.versionManifest).toBeUndefined();
    expect(migrateLegacyProductAnalysis(migrated)).toBe(migrated);
  });

  it('only declares replayable when inputs, code, datasets and required versions are all confirmed', () => {
    expect(assessHistoricalReplay({
      requiredInputsRetained: true, requiredCodeAvailable: true,
      requiredDatasetsAvailable: true, manifestComplete: true
    }).status).toBe('REPLAYABLE_WITH_RETAINED_INPUTS');
    const limited = assessHistoricalReplay({
      requiredInputsRetained: null, requiredCodeAvailable: true,
      requiredDatasetsAvailable: false, manifestComplete: true
    });
    expect(limited.status).toBe('NOT_REPLAYABLE');
    expect(limited.reasonCodes).toContain('REQUIRED_INPUTS_NOT_CONFIRMED_RETAINED');
    expect(limited.reasonCodes).toContain('REQUIRED_DATASETS_NOT_CONFIRMED_AVAILABLE');
  });

  it('produces the same deterministic manifest for the same context and retained identifiers', () => {
    const input = {
      asOf: '2026-11-05T00:00:00Z',
      versionConfiguration: {
        referenceDatasets: { ephemeris: 'EPH-1' },
        careerLogic: 'CAREER-1', wealthLogic: 'WEALTH-1',
        careerSynthesis: 'C11-1', wealthSynthesis: 'CW05-1',
        outputSchema: 'PRODUCT-1',
        inputRetention: 'RETAINED_BY_CALLER' as const,
        requiredCodeAvailable: true, requiredDatasetsAvailable: true
      }
    };
    const first = createAnalysisContext(input);
    const second = createAnalysisContext(input);
    const birth = {
      dateTimeStr: '1990-01-01T00:00:00Z', timeZone: 'Asia/Kolkata',
      latitude: 12.9, longitude: 77.6, ayanamsa: 'LAHIRI'
    };
    const firstManifest = buildFailedProductAnalysis(birth as any, 'fixture', first).versionManifest!.deterministic;
    const secondManifest = buildFailedProductAnalysis(birth as any, 'fixture', second).versionManifest!.deterministic;
    expect(firstManifest).toEqual(secondManifest);
    expect(firstManifest.replay.status).toBe('REPLAYABLE_WITH_RETAINED_INPUTS');
  });

  it('keeps AI explanation version changes outside deterministic identity', () => {
    const base = buildFailedProductAnalysis({
      dateTimeStr: '1990-01-01T00:00:00Z', timeZone: 'Asia/Kolkata',
      latitude: 12.9, longitude: 77.6, ayanamsa: 'LAHIRI'
    } as any, 'fixture failure', createAnalysisContext({ asOf: '2026-11-05T00:00:00Z' })).versionManifest;
    if (!base) throw new Error('expected D02 version manifest');
    const withAiA: ProductAnalysisVersionManifest = {
      ...base,
      aiExplanations: [{
        manifestVersion: 'D02-AI-v1',
        providerId: { status: 'RECORDED', version: 'provider-a' },
        providerVersion: { status: 'RECORDED', version: '1.0' },
        model: { status: 'RECORDED', version: 'model-a' },
        promptTemplate: { status: 'RECORDED', version: 'prompt-1' },
        outputSchema: { status: 'NOT_RECORDED', reason: 'not supplied' },
        routingMode: { status: 'RECORDED', version: 'LOCAL_ONLY' }
      }]
    };
    const withAiB: ProductAnalysisVersionManifest = {
      ...withAiA,
      aiExplanations: [{ ...withAiA.aiExplanations[0],
        providerId: { status: 'RECORDED', version: 'provider-b' },
        model: { status: 'RECORDED', version: 'model-b' },
        promptTemplate: { status: 'RECORDED', version: 'prompt-2' }
      }]
    };
    expect(sameDeterministicVersionManifest(withAiA, withAiB)).toBe(true);
    expect(aiExplanationVersionChanged(withAiA.aiExplanations, withAiB.aiExplanations)).toBe(true);
  });
});
