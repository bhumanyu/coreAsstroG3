export const OPENAI_REASONING_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      enum: ['SUCCESS', 'PARTIAL', 'ERROR']
    },
    conclusion: {
      type: 'string'
    },
    supportingEvidenceIds: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    challengingEvidenceIds: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    unresolvedQuestions: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    warnings: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  required: [
    'status',
    'conclusion',
    'supportingEvidenceIds',
    'challengingEvidenceIds',
    'unresolvedQuestions',
    'warnings'
  ]
} as const);
