import { expect } from 'vitest';
import type { DomainInterpretation } from '../../domain/interpretation/DomainInterpretation';
import type { Stage1IntegrationResult } from './stage1IntegrationTypes';
import { isAiExplanationStructuredOutput } from '../../ai/product/aiExplanationTypes';

/**
 * Validates that all evidence IDs referenced in a DomainInterpretation's conclusion
 * and manifestations exist in the interpretation's own evidence collection.
 */
export function assertEvidenceIdsExist(interp: DomainInterpretation): void {
  const ownEvidenceIds = new Set(interp.evidence.map((e) => e.id));

  // Check conclusion supportingEvidenceIds
  for (const id of interp.conclusion.supportingEvidenceIds ?? []) {
    expect(
      ownEvidenceIds.has(id),
      `Domain ${interp.domain} conclusion supporting evidence ID '${id}' not found in own evidence`
    ).toBe(true);
  }

  // Check conclusion challengingEvidenceIds
  for (const id of interp.conclusion.challengingEvidenceIds ?? []) {
    expect(
      ownEvidenceIds.has(id),
      `Domain ${interp.domain} conclusion challenging evidence ID '${id}' not found in own evidence`
    ).toBe(true);
  }

  // Check conclusion primaryEvidenceIds
  for (const id of interp.conclusion.primaryEvidenceIds ?? []) {
    expect(
      ownEvidenceIds.has(id),
      `Domain ${interp.domain} conclusion primary evidence ID '${id}' not found in own evidence`
    ).toBe(true);
  }

  // Check manifestation evidenceIds
  for (const manifestation of interp.manifestations) {
    for (const id of manifestation.evidenceIds) {
      expect(
        ownEvidenceIds.has(id),
        `Domain ${interp.domain} manifestation (${manifestation.mode}) evidence ID '${id}' not found in own evidence`
      ).toBe(true);
    }
  }
}

/**
 * Validates that all evidence IDs in the AI structured output exist in AiContext.evidence.
 */
export function assertAiStructuredEvidenceIds(result: Stage1IntegrationResult): void {
  const structuredOutput = result.routingResult.response.structuredOutput;
  if (!isAiExplanationStructuredOutput(structuredOutput)) {
    return;
  }

  const aiEvidenceIds = new Set(result.aiContext.evidence.map((e) => e.id));

  for (const id of structuredOutput.supportingEvidenceIds ?? []) {
    expect(
      aiEvidenceIds.has(id),
      `AI structured output supporting evidence ID '${id}' not found in AiContext.evidence`
    ).toBe(true);
  }

  for (const id of structuredOutput.challengingEvidenceIds ?? []) {
    expect(
      aiEvidenceIds.has(id),
      `AI structured output challenging evidence ID '${id}' not found in AiContext.evidence`
    ).toBe(true);
  }
}

/**
 * Validates that all evidence objects in the resolved AiExplanationViewModel exist in AiContext.evidence.
 */
export function assertExplanationEvidenceExists(result: Stage1IntegrationResult): void {
  if (result.explanation.kind !== 'SUCCESS') {
    return;
  }

  const aiEvidenceIds = new Set(result.aiContext.evidence.map((e) => e.id));

  for (const item of result.explanation.supportingEvidence) {
    expect(
      aiEvidenceIds.has(item.evidence.id),
      `Explanation supporting evidence ID '${item.evidence.id}' not found in AiContext.evidence`
    ).toBe(true);
  }

  for (const item of result.explanation.challengingEvidence) {
    expect(
      aiEvidenceIds.has(item.evidence.id),
      `Explanation challenging evidence ID '${item.evidence.id}' not found in AiContext.evidence`
    ).toBe(true);
  }
}

/**
 * Master Stage-1 Traceability assertion function.
 * Validates:
 * 1. Career domain internal evidence traceability
 * 2. Wealth domain internal evidence traceability
 * 3. AI Router structured output evidence ID preservation
 * 4. AI Explanation Service resolved evidence traceability
 */
export function assertStage1Traceability(result: Stage1IntegrationResult): void {
  assertEvidenceIdsExist(result.career);
  assertEvidenceIdsExist(result.wealth);
  assertAiStructuredEvidenceIds(result);
  assertExplanationEvidenceExists(result);
}
