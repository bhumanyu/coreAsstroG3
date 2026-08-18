import type { AiProvider } from '../types/aiProviderTypes';
import { AiRoutingError } from './AiRoutingError';

export class AiProviderRegistry {
  private readonly providers: Map<string, AiProvider> = new Map();

  constructor(initialProviders?: readonly AiProvider[]) {
    if (initialProviders) {
      this.registerMany(initialProviders);
    }
  }

  /**
   * Registers a single AI provider.
   * Throws an error if provider ID is empty or already registered.
   */
  register(provider: AiProvider): void {
    if (!provider || !provider.identity || !provider.identity.id || provider.identity.id.trim() === '') {
      throw new AiRoutingError(
        'INVALID_PROVIDER',
        'Provider ID cannot be empty'
      );
    }

    const rawId = provider.identity.id;
    if (rawId !== rawId.trim()) {
      throw new AiRoutingError(
        'INVALID_PROVIDER',
        'Provider ID must not contain leading or trailing whitespace'
      );
    }

    if (this.providers.has(rawId)) {
      throw new AiRoutingError(
        'INVALID_PROVIDER',
        `Provider with ID "${rawId}" is already registered`
      );
    }

    this.providers.set(rawId, provider);
  }

  /**
   * Registers multiple AI providers in sequence.
   */
  registerMany(providers: readonly AiProvider[]): void {
    for (const provider of providers) {
      this.register(provider);
    }
  }

  /**
   * Unregisters a provider by its unique identifier.
   * Returns true if a provider was removed, false otherwise.
   */
  unregister(id: string): boolean {
    return this.providers.delete(id.trim());
  }

  /**
   * Retrieves a registered provider by its identifier.
   */
  get(id: string): AiProvider | undefined {
    return this.providers.get(id.trim());
  }

  /**
   * Checks if a provider with the given identifier is registered.
   */
  has(id: string): boolean {
    return this.providers.has(id.trim());
  }

  /**
   * Returns a frozen defensive copy of all registered providers.
   */
  list(): readonly AiProvider[] {
    return Object.freeze(Array.from(this.providers.values()));
  }

  /**
   * Clears all registered providers.
   */
  clear(): void {
    this.providers.clear();
  }
}
