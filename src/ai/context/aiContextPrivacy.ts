export const FORBIDDEN_AI_CONTEXT_KEYS = [
  'birthDetails',
  'dateOfBirth',
  'dob',
  'timeOfBirth',
  'birthTime',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'birthPlace',
  'placeOfBirth',
  'rawChart'
] as const;

export type ForbiddenAiContextKey = (typeof FORBIDDEN_AI_CONTEXT_KEYS)[number];

export const forbiddenAiContextKeys = new Set<string>(FORBIDDEN_AI_CONTEXT_KEYS);
