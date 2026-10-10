export * from './careerTypes';
export * from './careerEvidenceMapper';
export * from './careerEvidenceLinker';
export * from './careerManifestations';
export * from './careerConclusion';
export * from './careerDataCompleteness';
export * from './CareerDomainInterpreterV2';
export * from './CareerDomainInterpreter';
export * from './career-v2-golden.fixture';
export * from './careerDasha';
export * from './careerHouseRelationship';
export * from './careerHouseRelationshipSemantics';
export * from './careerStructuralReasoning';
export * from './careerLordRelationshipSemantics';
export * from './careerLordRelationshipIntegration';
export * from './careerPlanetaryRelevance';
export * from './careerPlanetaryCondition';
export * from './careerExpression';
export * from './careerExpressionIntegration';
export * from './careerD10';
export * from './careerNatalAnalysis';
export * from './careerNatalConvergence';
export * from './careerPlanetaryRelevanceIntegration';
export * from './careerPlanetaryConditionIntegration';
export * from './careerFinalSynthesis';
export * from './careerGraph';
export * from './careerPattern';
export * from './careerPatternQualification';
export * from './careerParticipantRoles';
export * from './careerMechanism';
export * from './careerTrajectory';

// Orchestration exports (selective to avoid conflicts)
export {
    CanonicalCareerOrchestrator,
    type CanonicalCareerFoundation,
    type CanonicalCareerOrchestrationInput,
    type CareerOrchestrationPorts,
    type QualificationPort,
    type ParticipantRolesPort,
    type MechanismResolverPort,
    type MechanismRefinerPort,
    type PatternCandidate,
    type PatternQualification,
    type ResolvedMechanism,
    type MechanismRefinement,
    type CareerFoundationSupplement,
    type IdentityMapping,
    type OrchestrationDiagnostic,
    type EvidenceIdentityKey,
    type OccurrenceId,
    type SourceId,
    type RuleId,
    type MechanismId,
    type StageEvidence,
    type StageReference,
    validateUniquePatternIds,
    validateQualificationPatternReferences,
    validateUniqueMechanismIds,
    validateMechanismPatternReferences,
    validateRefinementCandidateReferences,
    validateIdentityMappings,
    validateCanonicalCareerFoundation,
    QualificationPortAdapter,
    ParticipantRolesPortAdapter,
    MechanismResolverPortAdapter,
    MechanismRefinerPortAdapter,
    qualificationPortAdapter,
    participantRolesPortAdapter,
    mechanismResolverPortAdapter,
    mechanismRefinerPortAdapter,
    defaultCareerOrchestrationPorts
} from './orchestration';


export {
    // Type exports
    type CareerDispositorStartRole,
    type CareerDispositorRelationship,
    type CareerDispositorTermination,
    type CareerDispositorDestination,
    type CareerDispositorLink,
    type CareerDispositorChain,
    type CareerDispositorProvenance,
    type CareerDispositorStart,
    type CareerDispositorIntegrationInput,
    type CareerDispositorResult,
    // Identity exports
    buildCareerDispositorIdentityKey,
    buildCareerDispositorChainId,
    // Rules exports (renamed to avoid conflict with careerPattern)
    CAREER_HOUSES as DISPOSITOR_CAREER_HOUSES,
    CAREER_LORD_START_HOUSES,
    MAX_DISPOSITOR_DEPTH,
    isCareerHouse as dispositorIsCareerHouse,
    resolveCareerDestination,
    resolveTermination,
    // Core dispositor exports
    traverseDispositorChain,
    detectMutualReception,
    // Integration exports
    buildCareerDispositorStartPlanets,
    buildCareerDispositorStartsFromStructural,
    buildCareerDispositorAnalysis
} from './careerDispositor';
