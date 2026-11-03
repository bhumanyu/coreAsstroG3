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
 * - D10 calculation integration (canonical D10 types and the shared mode mapping are qualification-only)
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - ai
 * - Any raw horoscope/chart astrology calculation
 *
 * Profession ≠ job title: This module does NOT contain exact job titles
 * like SOFTWARE_ENGINEER, BANKER, DOCTOR, etc. Those belong to a later synthesis layer.
 *
 * INTEGRATION: CareerDomainInterpreterV2 supplies the C11 D1 promise and canonical C10 qualification.
 * B04 ranking is projected through ProductAnalysis, CareerViewModel, and Career profession UI.
 */

// Types (§3)
export type {
  CareerProfessionDomain,
  CareerProfessionFamily,
  CareerProfessionBasis,
  CareerProfessionD10Status,
  CareerProfessionD10Qualification,
  CareerProfessionRankingStatus,
  CareerProfessionCandidateConfidence,
  CareerProfessionRankedCandidate,
  CareerProfessionScoreContribution,
  CareerProfessionRanking,
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

// B04 deterministic ranking
export { buildCareerProfessionRanking } from './careerProfessionRanking';
