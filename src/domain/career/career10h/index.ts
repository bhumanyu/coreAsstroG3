/**
 * P2-07F Career 10H Structural Context Module
 *
 * This module provides structural-only analysis of the 10th house from Lagna and Moon
 * reference points. It composes existing engine reports (HouseLordshipReport,
 * HouseAnalysisReport, NatalGrahaDrishtiReport) into a canonical 10H/10L context.
 *
 * This layer adds NO new astrology logic - it only composes and reorganizes existing facts.
 *
 * P2-07G Extension:
 * This module also includes 10L condition and relationship analysis, which extends the
 * 10H structural context to add 10L condition (dignity, motion, combustion) and
 * relationships with six target house lords (1, 5, 6, 8, 9, 12).
 *
 * Exports:
 * - Types: CareerReferencePoint, Career10HContext, Career10HFoundation, etc.
 * - Types (P2-07G): Career10LContext, Career10LFoundation, Career10LCondition, etc.
 * - Utils: ID builders, frozen builders, validation functions
 * - Analyzer: analyzeCareer10HContext for extracting 10H context
 * - Resolver: resolveCareer10HFoundation for complete foundation resolution
 * - Resolver (P2-07G): resolveCareer10LFoundation for 10L condition and relationships
 */

// Types
export type {
  CareerReferencePoint,
  Career10HContext,
  Career10HAspect,
  Career10HProvenance,
  Career10HFoundation,
  Career10HFoundationInput,
  Career10HFoundationStatus,
  Career10HFoundationResult
} from './career10HFoundationTypes';

export type {
  Career10HReportBundle
} from './career10HStructuralAnalyzer';

// Types (P2-07G)
export type {
  Career10LStatus,
  Career10LDataStatus,
  Career10LRelationship,
  Career10LCondition,
  Career10LContext,
  Career10LFoundation,
  Career10LProvenance,
  Career10LFoundationInput,
  Career10LFoundationResult
} from './career10LFoundationTypes';

// Utils
export {
  buildCareer10HContextId,
  buildCareer10HContextIdFromHoroscope,
  buildCareer10HFoundationId,
  freezeCareer10HContext,
  freezeCareer10HFoundation,
  sortParticipantIds,
  dedupParticipantIds,
  isValidReferencePoint,
  isValidHouseNumber
} from './career10HFoundationUtils';

// Analyzer
export {
  analyzeCareer10HContext
} from './career10HStructuralAnalyzer';

// Resolver
export {
  resolveCareer10HFoundation
} from './defaultCareer10HFoundation';

// Resolver (P2-07G)
export {
  resolveCareer10LFoundation,
  DefaultCareer10LFoundation
} from './defaultCareer10LFoundation';

// Condition adapter (P2-07G)
export {
  resolveCareer10LCondition
} from './career10LCondition';

// Relationship foundation (P2-07G)
export {
  resolveCareer10LRelationships,
  CAREER_10L_RELATIONSHIP_HOUSES
} from './career10LRelationships';
