/**
 * P2-09A Career Trajectory Module
 *
 * A deterministic downstream module that converts the authoritative C11 CareerFinalSynthesisResult
 * plus existing DomainEvidence into a long-term career trajectory classification.
 */

// Type exports
export type {
  CareerTrajectoryPattern,
  CareerTrajectoryCurrentPhase,
  CareerTrajectoryOpportunity,
  CareerTrajectoryAnalysis,
  CareerTrajectoryInput
} from './careerTrajectoryTypes';

// Main engine export
export { buildCareerTrajectory } from './careerTrajectoryEngine';
