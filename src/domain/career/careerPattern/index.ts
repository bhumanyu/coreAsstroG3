/**
 * P2-03 Career Pattern Classification Module
 *
 * This module provides pattern-identity/classification for Career patterns.
 * It sits ABOVE the CareerHouseNetwork detection (P2-02) and BELOW the qualification layer.
 *
 * This layer is pure structural pattern-identity/classification only - it does NOT calculate
 * strength, confidence, scores, qualification, activation, Dasha, D10, transit, mechanism,
 * or prediction anywhere in the output.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

// Selective export to avoid CareerMechanism conflict with careerMechanism
export type {
    CareerPatternFamily,
    CareerPatternLevel,
    CareerPatternClassification,
    CareerPatternHouseRole,
    ParivartanaCareerType,
    CareerPatternClassificationEvidence,
    CareerPatternClassificationEvidenceArray,
    CareerPatternClassificationProvenance,
    CareerPatternRelationship,
    CareerPatternConflict,
    CareerPattern,
    CareerPatternClassificationInput,
    CareerPatternClassificationResult,
    CareerYogaPattern,
    CareerPatternEvidence,
    CareerPatternAnalysis,
    CareerMechanismType
} from './careerPatternTypes';

export * from './careerPatternIdentity';
export * from './careerPatternPredicates';
export * from './careerPatternClassificationRules';
export * from './careerPatternClassification';
export * from './careerPatternProvenance';
export * from './dusthanaRelationshipTypes';
export * from './dusthanaRelationshipValidation';
export * from './dusthanaTransformationDetector';
export * from './careerYogaDetector';
export * from './kendraTrikonaDetector';
export * from './careerPatternAnalysis';
