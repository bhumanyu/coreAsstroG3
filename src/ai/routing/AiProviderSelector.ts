import type { AiProvider } from '../types/aiProviderTypes';
import type { AiRequest } from '../types/aiRequestTypes';
import type {
  AiCandidateScoringFactor,
  AiProviderSelection,
  AiProviderSelectionCandidate,
  AiProviderSelectionReason,
  AiRoutingMode,
  AiRoutingOptions
} from './aiRoutingTypes';
import { AiRoutingError } from './AiRoutingError';
import { requiredCapabilitiesForRequest } from './providerCapabilityMap';

export class AiProviderSelector {
  /**
   * Evaluates registered providers against an incoming request and routing options,
   * ranking eligible candidates deterministically and returning the top-ranked provider.
   */
  select(
    providers: readonly AiProvider[],
    request: AiRequest,
    options: AiRoutingOptions = {}
  ): AiProviderSelection {
    const mode: AiRoutingMode = options.mode ?? 'AUTO';
    const preferredProviderId = options.preferredProviderId?.trim();
    const excludedProviderIds = new Set(
      (options.excludedProviderIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    );
    const requiredCaps = requiredCapabilitiesForRequest(request);
    const candidateList: AiProviderSelectionCandidate[] = [];
    const eligibleList: { provider: AiProvider; candidate: AiProviderSelectionCandidate }[] = [];

    for (const provider of providers) {
      const id = provider.identity.id;
      const status = provider.getStatus();
      let rejectedReason: string | undefined;

      // 1. Exclusion check
      if (excludedProviderIds.has(id)) {
        rejectedReason = `Provider "${id}" is excluded in routing options`;
      }
      // 2. Routing mode check
      else if (mode === 'LOCAL_ONLY' && provider.identity.kind !== 'LOCAL_RULES') {
        rejectedReason = `Provider kind "${provider.identity.kind}" is not allowed in LOCAL_ONLY mode`;
      } else if (mode === 'REMOTE_ONLY' && provider.identity.kind !== 'REMOTE_LLM') {
        rejectedReason = `Provider kind "${provider.identity.kind}" is not allowed in REMOTE_ONLY mode`;
      }
      // 3. Availability check
      else if (status.availability === 'UNAVAILABLE') {
        rejectedReason = `Provider availability is UNAVAILABLE: ${status.message ?? 'unspecified'}`;
      }
      // 4. Required capabilities check
      else {
        const missingCaps = requiredCaps.filter((cap) => !provider.capabilities.includes(cap));
        if (missingCaps.length > 0) {
          rejectedReason = `Missing required capabilities: ${missingCaps.join(', ')}`;
        }
      }

      if (rejectedReason) {
        candidateList.push(
          Object.freeze({
            providerId: id,
            providerName: provider.identity.name,
            kind: provider.identity.kind,
            availability: status.availability,
            score: 0,
            eligible: false,
            reasons: Object.freeze([]),
            rejectedReason
          })
        );
      } else {
        let score = 0;
        const reasons: AiCandidateScoringFactor[] = [];

        // Availability score
        if (status.availability === 'AVAILABLE') {
          score += 100;
          reasons.push('AVAILABILITY');
        } else if (status.availability === 'DEGRADED') {
          score += 25;
          reasons.push('AVAILABILITY');
        }

        // Preferred provider match
        if (preferredProviderId && id === preferredProviderId) {
          score += 1000;
          reasons.push('PREFERRED_PROVIDER');
        }

        // Local rules priority
        if (provider.identity.kind === 'LOCAL_RULES') {
          score += 10;
          reasons.push('PRIORITY');
        }

        // Base capability match
        score += 10;
        reasons.push('CAPABILITY_MATCH');

        const candidate: AiProviderSelectionCandidate = Object.freeze({
          providerId: id,
          providerName: provider.identity.name,
          kind: provider.identity.kind,
          availability: status.availability,
          score,
          eligible: true,
          reasons: Object.freeze(reasons)
        });

        candidateList.push(candidate);
        eligibleList.push({ provider, candidate });
      }
    }

    if (preferredProviderId && options.fallbackPolicy === 'NO_FALLBACK') {
      const preferredCandidate = candidateList.find(
        (c) => c.providerId === preferredProviderId
      );
      if (
        preferredCandidate &&
        preferredCandidate.availability === 'UNAVAILABLE' &&
        preferredCandidate.rejectedReason?.startsWith('Provider availability is UNAVAILABLE')
      ) {
        throw new AiRoutingError(
          'PREFERRED_PROVIDER_UNAVAILABLE',
          `Preferred AI provider "${preferredProviderId}" is UNAVAILABLE`,
          request.requestId
        );
      }
    }

    if (eligibleList.length === 0) {
      throw new AiRoutingError(
        'NO_ELIGIBLE_PROVIDER',
        `No eligible AI provider found for task "${request.task}" (mode: ${mode})`,
        request.requestId
      );
    }

    // Sort eligible candidates: highest score first, then deterministic tie-break on provider ID
    eligibleList.sort((a, b) => {
      if (b.candidate.score !== a.candidate.score) {
        return b.candidate.score - a.candidate.score;
      }
      return a.provider.identity.id.localeCompare(b.provider.identity.id);
    });

    const winner = eligibleList[0];
    const orderedCandidates = Object.freeze(eligibleList.map((e) => e.candidate));

    // Derive selection reason
    let selectionReason: AiProviderSelectionReason;
    if (winner.candidate.reasons.includes('PREFERRED_PROVIDER')) {
      selectionReason = 'PREFERRED_PROVIDER';
    } else if (eligibleList.length === 1) {
      selectionReason = 'ONLY_ELIGIBLE_PROVIDER';
    } else {
      selectionReason = 'PRIORITY';
    }

    return Object.freeze({
      provider: winner.provider,
      candidates: Object.freeze(candidateList),
      orderedCandidates,
      reason: selectionReason,
      score: winner.candidate.score
    });
  }
}
