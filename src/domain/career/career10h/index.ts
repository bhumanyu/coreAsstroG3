/**
 * P2-07F Career 10H Structural Context Module
 *
 * This module provides structural-only analysis of the 10th house from Lagna and Moon
 * reference points. It composes existing engine reports (HouseLordshipReport,
 * HouseAnalysisReport, NatalGrahaDrishtiReport) into a canonical 10H/10L context.
 *
 * This layer adds NO new astrology logic - it only composes and reorganizes existing facts.
 *
 * Exports:
 * - Types: CareerReferencePoint, Career10HContext, Career10HFoundation, etc.
 * - Utils: ID builders, frozen builders, validation functions
 * - Analyzer: analyzeCareer10HContext for extracting 10H context
 * - Resolver: resolveCareer10HFoundation for complete foundation resolution
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

// Utils
export {
  buildCareer10HContextId,
  buildCareer10HContextIdFromHoroscope,
  buildCareer10HFoundationId,
  buildCareer10HEvidenceId,
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
