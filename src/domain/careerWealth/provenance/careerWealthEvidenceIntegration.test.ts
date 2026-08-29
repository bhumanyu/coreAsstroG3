import { describe, expect, it } from 'vitest';
import {
  createCareerWealthEvidence,
  type CareerWealthEvidence
} from './index';
import { createDomainEvidence } from '../../interpretation/DomainEvidence';
import { Planet } from '../../../types';

describe('CW-06A Integration: Career and Wealth Natal Producer Provenance Attachment', () => {
  it('emits Career evidence with populated provenance of CW- format matching its ruleId', () => {
    // Demonstrating the producer creation pattern via createCareerWealthEvidence
    const careerEvidence: CareerWealthEvidence = createCareerWealthEvidence({
      identity: {
        domain: 'CAREER',
        axis: 'NATAL',
        source: 'D1',
        ruleId: 'CAREER_10TH_LORD_DIGNITY',
        subjectKey: 'SUN',
        effect: 'SUPPORT',
        strength: 'PRIMARY'
      },
      statement: 'Sun as 10th lord is exalted in 10th house',
      strength: 'STRONG',
      house: 10,
      planet: Planet.SUN
    });

    // 1. Assert provenance is present
    expect(careerEvidence.provenance).toBeDefined();

    // 2. Assert deterministic CW- ID format
    expect(careerEvidence.provenance.evidenceId).toBe(
      'CW-CAREER-NATAL-D1-CAREER_10TH_LORD_DIGNITY-SUN-SUPPORT-PRIMARY'
    );
    expect(careerEvidence.id).toBe(careerEvidence.provenance.evidenceId);

    // 3. Assert provenance.ruleId matches the producing ruleId
    expect(careerEvidence.provenance.ruleId).toBe('CAREER_10TH_LORD_DIGNITY');
    expect(careerEvidence.ruleId).toBe(careerEvidence.provenance.ruleId);

    // 4. Assert polarity alignment
    expect(careerEvidence.polarity).toBe('SUPPORTING');
  });

  it('emits Wealth evidence with populated provenance of CW- format matching its ruleId', () => {
    const wealthEvidence: CareerWealthEvidence = createCareerWealthEvidence({
      identity: {
        domain: 'WEALTH',
        axis: 'NATAL',
        source: 'D1',
        ruleId: 'WEALTH_2ND_11TH_DHANA_YOGA',
        subjectKey: 'JUPITER',
        effect: 'SUPPORT',
        strength: 'PRIMARY'
      },
      statement: 'Jupiter forming Dhana Yoga linking 2nd and 11th houses',
      strength: 'STRONG',
      house: 2,
      planet: Planet.JUPITER
    });

    expect(wealthEvidence.provenance).toBeDefined();
    expect(wealthEvidence.provenance.evidenceId).toBe(
      'CW-WEALTH-NATAL-D1-WEALTH_2ND_11TH_DHANA_YOGA-JUPITER-SUPPORT-PRIMARY'
    );
    expect(wealthEvidence.id).toBe(wealthEvidence.provenance.evidenceId);
    expect(wealthEvidence.provenance.ruleId).toBe('WEALTH_2ND_11TH_DHANA_YOGA');
    expect(wealthEvidence.ruleId).toBe('WEALTH_2ND_11TH_DHANA_YOGA');
    expect(wealthEvidence.polarity).toBe('SUPPORTING');
  });

  it('allows attaching provenance alongside existing legacy id without altering legacy id', () => {
    // When a legacy producer builds DomainEvidence with an existing ID, provenance can be attached alongside it
    const legacyEvidence = createDomainEvidence({
      id: 'legacy-career-evidence-123',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      statement: 'Legacy career evidence test',
      ruleId: 'CAREER_10H_STRONG_001',
      provenance: {
        evidenceId: 'CW-CAREER-NATAL-D1-CAREER_10H_STRONG_001-10TH_HOUSE-SUPPORT-PRIMARY',
        ruleId: 'CAREER_10H_STRONG_001',
        domain: 'CAREER',
        axis: 'NATAL',
        source: 'D1',
        effect: 'SUPPORT',
        strength: 'PRIMARY'
      }
    });

    expect(legacyEvidence.id).toBe('legacy-career-evidence-123');
    expect(legacyEvidence.provenance).toBeDefined();
    expect(legacyEvidence.provenance?.evidenceId).toBe(
      'CW-CAREER-NATAL-D1-CAREER_10H_STRONG_001-10TH_HOUSE-SUPPORT-PRIMARY'
    );
    expect(legacyEvidence.provenance?.ruleId).toBe('CAREER_10H_STRONG_001');
  });
});
