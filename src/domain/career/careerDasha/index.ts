export * from './careerDashaSynthesisTypes';
export * from './careerDashaRules';
export * from './careerDashaScoring';
export * from './careerDashaSynthesis';

export type { CareerDashaTiming } from './careerDashaSynthesisTypes';
export { resolveCareerDashaEffect } from './careerDashaScoring';

export * from './careerDashaPlanetaryTypes';
export * from './careerDashaPlanetaryRules';
export { calculatePlanetaryScores } from './careerDashaPlanetaryScoring';
export * from './careerDashaPlanetarySynthesis';
export * from './careerDashaD10Context';

export * from './careerDashaActivationTypes';
export * from './careerDashaActivationRules';
export * from './careerDashaActivation';
export * from './careerDashaCanonicalTypes';
export * from './careerDashaIntegration';

// Export key helpers for C9 Dasha activation analysis
export {
    createCanonicalEvidenceKey,
    assertDeepFrozen,
    resolveCareerDashaPlanetDirection,
    isCareerDashaRelevant,
    isCareerDashaConditionUsable,
    isCareerDashaConditionSupportive,
    hasEstablishedCareerPromise,
    doesPlanetActivateCareerPromise,
    doesPlanetChallengeCareerPromise,
    resolveCareerDashaStrength
} from './careerDashaActivationRules';
