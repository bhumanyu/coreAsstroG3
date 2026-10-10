/**
 * P2-10A Career Domain/Profession Module
 *
 * Public API for the canonical profession MODEL and ENGINE.
 * This module provides the pure data model for profession domains and families,
 * plus the profession resolution layer that maps career expression/mechanism types
 * to profession candidates.
 *
 * This is a standalone, deterministic module that converts already-computed canonical
 * career outputs (expressions, mechanisms, 10H/10L foundations, D10 qualification,
 * DomainEvidence) into broad professional-domain candidates and profession families.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - d10/ (except careerD10 canonical types for qualification-only)
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - ai
 * - Any raw horoscope/chart astrology calculation
 *
 * Profession ≠ job title: This module does NOT contain exact job titles
 * like SOFTWARE_ENGINEER, BANKER, DOCTOR, etc. Those belong to a later synthesis layer.
 *
 * NOTE: This module is NOT registered in CareerDomainInterpreterV2.ts or any public app API.
 * It is a standalone module for future integration.
 */

// Types (§3)
export type {
  CareerProfessionDomain,
  CareerProfessionFamily,
  CareerProfessionBasis,
  CareerProfessionD10Status,
  CareerProfessionEvidence,
  CareerProfessionCandidate,
  CareerProfessionAnalysisStatus,
  CareerProfessionAnalysis,
  CareerProfessionProvenance,
  CareerProfessionRefinement,
  CareerProfessionInput
} from './careerProfessionTypes';

// Rules (§4)
export type { CareerProfessionRule } from './careerProfessionRules';
export { CAREER_PROFESSION_RULES } from './careerProfessionRules';

// Utils
export {
  createProfessionCandidateId,
  createProfessionEvidenceId,
  codePointCompare,
  canonicalSortProfessionCandidates,
  canonicalSortProfessionEvidence,
  deduplicateProfessionCandidates,
  deduplicateProfessionEvidence,
  mergeProfessionProvenances,
  freezeProfessionCandidate,
  freezeProfessionAnalysis,
  mergeSourceIds,
  mergeRelatedEvidenceIds
} from './careerProfessionUtils';

// Engine (§5, §6)
export {
  buildCareerProfessionAnalysis
} from './careerProfessionEngine';
