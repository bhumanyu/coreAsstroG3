export type RuntimeBoundary = 'BROWSER' | 'SERVER';

/**
 * Runtime must come from trusted server-only wiring, never from a client DTO,
 * request body, or user-controlled input.
 */
export interface RemoteProviderPolicyInput {
  readonly runtime: RuntimeBoundary;
  readonly remoteAiEnabled: boolean;
  readonly proxyConfigured: boolean;
}

export type RemoteProviderPolicyDenialReason =
  | 'BROWSER_RUNTIME'
  | 'REMOTE_AI_DISABLED'
  | 'PROXY_NOT_CONFIGURED';

export type RemoteProviderPolicyResult =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      readonly reason: RemoteProviderPolicyDenialReason;
    };

/**
 * Evaluates remote-provider readiness without reading credentials or performing
 * network operations. Denials are ordered: runtime, feature flag, then proxy.
 */
export function evaluateRemoteProviderPolicy(
  input: RemoteProviderPolicyInput
): RemoteProviderPolicyResult {
  if (input.runtime === 'BROWSER') {
    return { allowed: false, reason: 'BROWSER_RUNTIME' };
  }
  if (!input.remoteAiEnabled) {
    return { allowed: false, reason: 'REMOTE_AI_DISABLED' };
  }
  if (!input.proxyConfigured) {
    return { allowed: false, reason: 'PROXY_NOT_CONFIGURED' };
  }
  return { allowed: true };
}

export function assertRemoteProviderAllowed(input: RemoteProviderPolicyInput): void {
  const result = evaluateRemoteProviderPolicy(input);
  if (!result.allowed) {
    throw new Error(`Remote AI provider denied: ${result.reason}`);
  }
}
