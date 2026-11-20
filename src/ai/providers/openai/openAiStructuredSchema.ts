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

export const OPENAI_SELECTED_PERIOD_REASONING_SCHEMA = Object.freeze({
  ...OPENAI_REASONING_SCHEMA,
  properties: {
    ...OPENAI_REASONING_SCHEMA.properties,
    likelyThemes: {
      type: 'array',
      items: { type: 'string' }
    },
    supportingReasons: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          text: { type: 'string' },
          evidenceIds: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' }
          }
        },
        required: ['text', 'evidenceIds']
      }
    },
    risks: {
      type: 'array',
      items: { type: 'string' }
    },
    uncertainties: {
      type: 'array',
      items: { type: 'string' }
    },
    practicalFocus: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: [
    ...OPENAI_REASONING_SCHEMA.required,
    'likelyThemes',
    'supportingReasons',
    'risks',
    'uncertainties',
    'practicalFocus'
  ]
} as const);
