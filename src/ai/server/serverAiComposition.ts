/**
 * Server-side AI composition boundary.
 *
 * This module is the ONLY place where remote AI providers (e.g. OpenAI) are
 * constructed. It must be imported exclusively by trusted server code
 * (the future PR-017 proxy host or another server entry point). It is
 * deliberately NOT exported through `src/ai/browser.ts` or the client
 * bundle, and provider credentials must come from server configuration —
 * never from `VITE_*` variables, request DTOs, or client input.
 *
 * Usage in a server composition root:
 *
 *   const ai = createServerAiComposition(serverAiConfigurationFromEnv(process.env));
 *   const service = new ProductAnalysisService({
 *     ...defaultProductAnalysisDependencies,
 *     aiRouter: ai.aiRouter,
 *     aiRoutingMode: ai.aiRoutingMode,
 *     aiProviderTimeoutMs: ai.aiProviderTimeoutMs
 *   });
 *
 * When the remote provider policy denies remote AI (disabled flag or missing
 * credentials), the returned router is local-only and routingMode is
 * 'LOCAL_ONLY', preserving the deterministic P-026 fallback contract.
 */

import type { AiRouter } from '../routing/AiRouter';
import { createDefaultAiRouter } from '../routing/createDefaultAiRouter';
import { createOpenAiProvider } from '../providers/openai/openAiProviderFactory';
import {
  evaluateRemoteProviderPolicy,
  type RemoteProviderPolicyDenialReason
} from '../security/remoteProviderPolicy';

/**
 * Trusted server configuration for remote AI. `remoteAiEnabled` and the
 * provider credential must originate from server-side configuration only.
 */
export interface ServerAiConfiguration {
  /** Server feature flag; remote AI stays off unless explicitly enabled. */
  readonly remoteAiEnabled: boolean;
  /** Provider credential. Server-only secret; never exposed to clients. */
  readonly openAiApiKey?: string;
  readonly openAiModel?: string;
  readonly openAiEndpoint?: string;
  readonly openAiTimeoutMs?: number;
}

export type ServerAiRemoteStatus =
  | 'CONFIGURED'
  | 'DISABLED'
  | 'NOT_CONFIGURED';

export interface ServerAiComposition {
  /** Router to inject into ProductAnalysisDependencies.aiRouter. */
  readonly aiRouter: AiRouter;
  /** Routing preference to inject into ProductAnalysisDependencies.aiRoutingMode. */
  readonly aiRoutingMode: 'LOCAL_ONLY' | 'REMOTE_PRIMARY';
  /** Optional provider timeout to inject into ProductAnalysisDependencies.aiProviderTimeoutMs. */
  readonly aiProviderTimeoutMs?: number;
  /** Whether a remote provider was registered with the router. */
  readonly remoteStatus: ServerAiRemoteStatus;
  /** Policy denial reason when remote AI was not configured. */
  readonly policyDenialReason?: RemoteProviderPolicyDenialReason;
}

/**
 * Builds the AI composition for a server runtime. Remote provider
 * construction is gated by evaluateRemoteProviderPolicy: the runtime is
 * hard-coded to 'SERVER' (this module must never run in a browser), the
 * enablement flag and credential presence come from trusted configuration.
 */
export function createServerAiComposition(
  config: ServerAiConfiguration
): ServerAiComposition {
  const apiKey = config.openAiApiKey?.trim() ?? '';

  const policy = evaluateRemoteProviderPolicy({
    runtime: 'SERVER',
    remoteAiEnabled: config.remoteAiEnabled,
    proxyConfigured: apiKey.length > 0
  });

  if (!policy.allowed) {
    return Object.freeze({
      aiRouter: createDefaultAiRouter(),
      aiRoutingMode: 'LOCAL_ONLY' as const,
      remoteStatus: policy.reason === 'REMOTE_AI_DISABLED'
        ? 'DISABLED' as const
        : 'NOT_CONFIGURED' as const,
      policyDenialReason: policy.reason
    });
  }

  const remoteProvider = createOpenAiProvider({
    apiKey,
    ...(config.openAiModel !== undefined ? { model: config.openAiModel } : {}),
    ...(config.openAiEndpoint !== undefined ? { endpoint: config.openAiEndpoint } : {}),
    ...(config.openAiTimeoutMs !== undefined ? { timeoutMs: config.openAiTimeoutMs } : {})
  });

  return Object.freeze({
    aiRouter: createDefaultAiRouter({ remoteProvider }),
    aiRoutingMode: 'REMOTE_PRIMARY' as const,
    ...(config.openAiTimeoutMs !== undefined
      ? { aiProviderTimeoutMs: config.openAiTimeoutMs }
      : {}),
    remoteStatus: 'CONFIGURED' as const
  });
}

/** Environment shape consumed by serverAiConfigurationFromEnv. */
export type ServerAiEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Maps trusted server environment variables to ServerAiConfiguration.
 * Recognized variables:
 *   COREASTRO_REMOTE_AI_ENABLED  — 'true' enables remote AI
 *   OPENAI_API_KEY               — provider credential (server-only)
 *   OPENAI_MODEL                 — optional model override
 *   OPENAI_ENDPOINT              — optional endpoint override
 *   OPENAI_TIMEOUT_MS            — optional positive timeout in milliseconds
 */
export function serverAiConfigurationFromEnv(
  env: ServerAiEnvironment
): ServerAiConfiguration {
  const rawTimeout = env.OPENAI_TIMEOUT_MS;
  const timeoutMs = rawTimeout !== undefined ? Number(rawTimeout) : undefined;

  return Object.freeze({
    remoteAiEnabled: env.COREASTRO_REMOTE_AI_ENABLED === 'true',
    ...(env.OPENAI_API_KEY !== undefined ? { openAiApiKey: env.OPENAI_API_KEY } : {}),
    ...(env.OPENAI_MODEL !== undefined ? { openAiModel: env.OPENAI_MODEL } : {}),
    ...(env.OPENAI_ENDPOINT !== undefined ? { openAiEndpoint: env.OPENAI_ENDPOINT } : {}),
    ...(timeoutMs !== undefined && Number.isFinite(timeoutMs) && timeoutMs > 0
      ? { openAiTimeoutMs: timeoutMs }
      : {})
  });
}
