import type { AiRoutingErrorCode } from './aiRoutingTypes';

export class AiRoutingError extends Error {
  readonly code: AiRoutingErrorCode;
  readonly requestId?: string;

  constructor(code: AiRoutingErrorCode, message: string, requestId?: string) {
    super(message);
    this.name = 'AiRoutingError';
    this.code = code;
    this.requestId = requestId;
    Object.setPrototypeOf(this, AiRoutingError.prototype);
  }
}
