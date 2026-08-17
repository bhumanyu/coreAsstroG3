import type { AiRequest, AiTask } from '../types/aiRequestTypes';
import type { AiContext } from '../types/aiContextTypes';
import { deepFreeze } from '../context/deepFreeze';

export function createAiRequest(
  task: AiTask,
  context: AiContext,
  responseFormat: 'STRUCTURED' | 'NARRATIVE' = 'STRUCTURED',
  requestId: string = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
): AiRequest {
  const request: AiRequest = {
    requestId,
    schemaVersion: context.schemaVersion,
    task,
    context,
    responseFormat
  };

  return deepFreeze(request);
}
