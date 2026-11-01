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
      if (record.identityKey) {
        expect(domainEvidence.identityKey).toBe(record.identityKey);
      }
      if (record.ruleId === 'WEALTH_VENUS_KARAKA_001') {
        expect(domainEvidence.provenance?.ruleId).toBe(record.ruleId);
        expect(domainEvidence.id).toBe(domainEvidence.provenance?.evidenceId);
      } else {
        expect(domainEvidence.id).toBe(record.identityKey ?? record.id);
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
    expect(mapped[0].id).toBe('SEM-SECOND');
    expect(mapped[0].identityKey).toBe('SEM-SECOND');
    expect(d2?.relatedEvidenceIds).toEqual(['SEM-SECOND']);
    expect(dasha?.relatedEvidenceIds).toEqual(['SEM-SECOND']);
    expect(transit?.relatedEvidenceIds).toEqual(['SEM-SECOND']);
    expect(mapped[0].relatedEvidenceIds).toEqual([]);
  });
});

describe('resolveD2ProducerRelationship', () => {
  const d2Record = (
    effect: WealthEvidenceProducerRecord['effect'],
    relationship?: VargaRelationship
  ): WealthEvidenceProducerRecord => ({
    id: `D2-${effect}-${relationship ?? 'UNDECLARED'}`,
    ruleId: 'WEALTH_D2_RELATIONSHIP_TEST',
    evidenceFamily: WealthEvidenceFamily.D2,
    priority: 'CONFIRMATORY',
    strength: 'MODERATE',
    effect,
    statement: 'D2 relationship contract test',
    ...(relationship
      ? {
          vargaEvidence: {
            varga: 'D2',
            relationship,
            statement: 'Declared D2 relationship',
            effect
          }
        }
      : {})
  });

  it('returns UNAVAILABLE for conflicting declared relationships', () => {
    expect(resolveD2ProducerRelationship([
      d2Record('SUPPORT', 'CONFIRMS'),
      d2Record('CHALLENGE', 'CONFLICTS')
    ])).toBe('UNAVAILABLE');
  });

  it('uses the single declared relationship when other evidence is undeclared', () => {
    expect(resolveD2ProducerRelationship([
      d2Record('SUPPORT', 'CONFIRMS'),
      d2Record('CHALLENGE')
    ])).toBe('CONFIRMS');
  });

  it('derives PARTIALLY_CONFIRMS from mixed effects only when none are declared', () => {
    expect(resolveD2ProducerRelationship([
      d2Record('SUPPORT'),
      d2Record('CHALLENGE')
    ])).toBe('PARTIALLY_CONFIRMS');
  });
});
