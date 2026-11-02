import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import type { WealthEvidenceProducerRecord } from './wealthEvidenceProducer';
import { produceWealthDomainEvidence, resolveD2ProducerRelationship } from './wealthEvidenceProducer';
import {
  buildWealthEvidence,
  mapWealthDimension,
  mapWealthDashaPeriod,
  mapWealthPhase,
  mapWealthPolarity,
  mapWealthPriority,
  mapWealthRole,
  mapWealthSource,
  mapWealthSourceType,
  mapWealthStrength
} from './wealthEvidenceMapper';
import { linkWealthEvidence } from './wealthEvidenceLinker';
import { WealthEvidenceFamily } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { VargaRelationship } from '../../engine/themeInterpretation/themeInterpretationTypes';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet } from '../../types';

describe('Wealth evidence producer adapter contract', () => {
  it('maps every producer field consumed by the Wealth mapper and linker', () => {
    const produced = produceWealthDomainEvidence({
      horoscope: calculateHoroscope(CANONICAL_BIRTH_DETAILS)
    });
    expect(produced.evidence.length).toBeGreaterThan(0);

    const mapped = linkWealthEvidence(buildWealthEvidence(produced.evidence));
    expect(mapped).toHaveLength(produced.evidence.length);

    produced.evidence.forEach((record, index) => {
      const domainEvidence = mapped[index];
      expect(domainEvidence).toBeDefined();
      expect(domainEvidence.ruleId).toBe(record.ruleId);
      expect(domainEvidence.evidenceFamily).toBe(record.evidenceFamily);
      expect(domainEvidence.statement).toBe(record.statement);
      expect(domainEvidence.sourceType).toBe(mapWealthSourceType(record));
      expect(domainEvidence.role).toBe(mapWealthRole(record));
      expect(domainEvidence.phase).toBe(mapWealthPhase(record));
      expect(domainEvidence.source).toBe(mapWealthSource(record));
      expect(domainEvidence.polarity).toBe(mapWealthPolarity(record.effect));
      expect(domainEvidence.strength).toBe(mapWealthStrength(record.strength));
      expect(domainEvidence.priority).toBe(mapWealthPriority(record.priority));
      expect(domainEvidence.dimension).toBe(mapWealthDimension(record));
      expect(domainEvidence.timing?.period).toBe(
        mapWealthDashaPeriod(record) ??
          (record.transitEvidence?.planet ? 'MD' : undefined)
      );
      expect(domainEvidence.planet).toBe(
        record.timingEvidence?.planet ??
          record.transitEvidence?.planet ??
          record.planets?.[0]
      );
      expect(domainEvidence.house).toBe(record.houses?.[0]);
      expect(domainEvidence.id).toBe(record.id);
      if (record.identityKey) {
        expect(domainEvidence.identityKey).toBe(record.identityKey);
      }
      if (record.ruleId === 'WEALTH_VENUS_KARAKA_001') {
        expect(domainEvidence.provenance?.ruleId).toBe(record.ruleId);
      }
      for (const relatedId of domainEvidence.relatedEvidenceIds) {
        expect(mapped.some((candidate) => candidate.id === relatedId)).toBe(true);
      }
    });
  });

  it('preserves canonical identities for mapped links across all source metadata variants', () => {
    const records: readonly WealthEvidenceProducerRecord[] = [
      {
        id: 'OCC-SECOND',
        identityKey: 'SEM-SECOND',
        ruleId: 'WEALTH_SECOND_HOUSE_FIXTURE',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: 'Second-house wealth structure',
        planets: [Planet.VENUS],
        houses: [2],
        factors: [{ label: 'house', value: '2', role: 'PRIMARY' }],
        conditional: true,
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'OCC-D2',
        ruleId: 'WEALTH_D2_FIXTURE',
        evidenceFamily: WealthEvidenceFamily.D2,
        priority: 'CONFIRMATORY',
        strength: 'MODERATE',
        effect: 'SUPPORT',
        statement: 'D2 confirms accumulation',
        vargaEvidence: {
          varga: 'D2',
          relationship: 'CONFIRMS',
          statement: 'Declared D2 confirmation',
          effect: 'SUPPORT'
        }
      },
      {
        id: 'OCC-DASHA',
        ruleId: 'WEALTH_DASHA_FIXTURE',
        evidenceFamily: WealthEvidenceFamily.DASHA,
        priority: 'TIMING',
        strength: 'MODERATE',
        effect: 'SUPPORT',
        statement: 'Dasha activates accumulation',
        dimension: 'TIMING',
        timingEvidence: {
          dashaLevel: 'MAHADASHA',
          planet: Planet.VENUS,
          relevanceReason: 'Activates the second house',
          houses: [2]
        }
      },
      {
        id: 'OCC-TRANSIT',
        ruleId: 'WEALTH_TRANSIT_FIXTURE',
        evidenceFamily: WealthEvidenceFamily.TRANSIT,
        priority: 'TIMING',
        strength: 'WEAK',
        effect: 'CHALLENGE',
        statement: 'Transit challenges accumulation',
        transitEvidence: {
          planet: Planet.VENUS,
          house: 2,
          effect: 'CHALLENGE',
          relevanceReason: 'Crosses the second house'
        }
      }
    ];

    const mapped = linkWealthEvidence(buildWealthEvidence(records));
    const d2 = mapped.find((item) => item.id === 'OCC-D2');
    const dasha = mapped.find((item) => item.id === 'OCC-DASHA');
    const transit = mapped.find((item) => item.id === 'OCC-TRANSIT');
    expect(mapped[0].id).toBe('OCC-SECOND');
    expect(mapped[0].identityKey).toBe('SEM-SECOND');
    expect(d2?.relatedEvidenceIds).toEqual(['OCC-SECOND']);
    expect(dasha?.relatedEvidenceIds).toEqual(['OCC-SECOND']);
    expect(transit?.relatedEvidenceIds).toEqual(['OCC-SECOND']);
    expect(mapped[0].relatedEvidenceIds).toEqual([]);
  });

  it('preserves distinct occurrences that share a canonical identity key', () => {
    const records: readonly WealthEvidenceProducerRecord[] = [
      {
        id: 'OCC-SECOND-A',
        identityKey: 'SEM-SECOND',
        ruleId: 'WEALTH_SECOND_HOUSE_FIXTURE_A',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: 'First second-house occurrence',
        houses: [2]
      },
      {
        id: 'OCC-SECOND-B',
        identityKey: 'SEM-SECOND',
        ruleId: 'WEALTH_SECOND_HOUSE_FIXTURE_B',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'MODERATE',
        effect: 'CHALLENGE',
        statement: 'Second second-house occurrence',
        houses: [2]
      }
    ];

    const mapped = buildWealthEvidence(records);
    expect(mapped).toHaveLength(2);
    expect(mapped.map((item) => item.id)).toEqual(['OCC-SECOND-A', 'OCC-SECOND-B']);
    expect(mapped.map((item) => item.identityKey)).toEqual(['SEM-SECOND', 'SEM-SECOND']);
  });

  it('rejects duplicate producer occurrence IDs', () => {
    const record: WealthEvidenceProducerRecord = {
      id: 'DUPLICATE-OCCURRENCE',
      ruleId: 'WEALTH_SECOND_HOUSE_FIXTURE',
      evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
      priority: 'PRIMARY',
      strength: 'STRONG',
      effect: 'SUPPORT',
      statement: 'Duplicate identity contract fixture'
    };
    expect(() => buildWealthEvidence([record, { ...record, statement: 'duplicate' }]))
      .toThrow('Duplicate Wealth producer occurrence ID: DUPLICATE-OCCURRENCE');
  });
});

describe('resolveD2ProducerRelationship — A08 containment', () => {
  const d2Record = (effect: WealthEvidenceProducerRecord['effect'], relationship?: VargaRelationship): WealthEvidenceProducerRecord => ({
    id: 'D2-' + effect + '-' + (relationship ?? 'UNDECLARED'),
    ruleId: 'WEALTH_D2_RELATIONSHIP_TEST',
    evidenceFamily: WealthEvidenceFamily.D2,
    priority: 'CONFIRMATORY',
    strength: 'MODERATE',
    effect,
    statement: 'D2 relationship containment test',
    ...(relationship ? { vargaEvidence: { varga: 'D2', relationship, statement: 'Declared D2 relationship', effect } } : {})
  });

  it('keeps D2 unavailable when absent', () => {
    expect(resolveD2ProducerRelationship([])).toBe('UNAVAILABLE');
  });

  it('keeps D2 unavailable when a single relationship is declared', () => {
    expect(resolveD2ProducerRelationship([d2Record('SUPPORT', 'CONFIRMS')])).toBe('UNAVAILABLE');
  });

  it('keeps D2 unavailable when declarations conflict', () => {
    expect(resolveD2ProducerRelationship([d2Record('SUPPORT', 'CONFIRMS'), d2Record('CHALLENGE', 'CONFLICTS')])).toBe('UNAVAILABLE');
  });

  it('keeps D2 unavailable when relationship metadata is malformed', () => {
    expect(resolveD2ProducerRelationship([d2Record('SUPPORT', 'MALFORMED' as VargaRelationship)])).toBe('UNAVAILABLE');
  });

  it('does not infer a relationship from supporting and challenging polarity', () => {
    expect(resolveD2ProducerRelationship([d2Record('SUPPORT'), d2Record('CHALLENGE')])).toBe('UNAVAILABLE');
  });
});
