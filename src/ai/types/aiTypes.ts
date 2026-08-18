export const AI_CONTEXT_SCHEMA_VERSION = '1.0.0' as const;
export type AiContextSchemaVersion = typeof AI_CONTEXT_SCHEMA_VERSION;

export type AiAvailability = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
export type AiConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type AiEvidenceEffect = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' | 'UNKNOWN';
