import type { RemoteAiErrorCode } from './remoteAiTypes';

export class RemoteAiError extends Error {
  readonly code: RemoteAiErrorCode;
  readonly statusCode?: number;
  readonly requestId?: string;

  constructor(
    code: RemoteAiErrorCode,
    message: string,
    options: {
      readonly statusCode?: number;
      readonly requestId?: string;
      readonly cause?: unknown;
    } = {}
  ) {
    super(message);

    this.name = 'RemoteAiError';
    this.code = code;
    this.statusCode = options.statusCode;
    this.requestId = options.requestId;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
