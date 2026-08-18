import { describe, it, expect } from 'vitest';
import { AiProviderRegistry } from './AiProviderRegistry';
import { createMockProvider } from './testFixtures';

describe('AiProviderRegistry', () => {
  it('should register and retrieve providers correctly', () => {
    const registry = new AiProviderRegistry();
    const mock1 = createMockProvider({ id: 'provider-1', name: 'Provider 1' });
    const mock2 = createMockProvider({ id: 'provider-2', name: 'Provider 2' });

    registry.register(mock1);
    registry.register(mock2);

    expect(registry.has('provider-1')).toBe(true);
    expect(registry.has('provider-2')).toBe(true);
    expect(registry.has('provider-3')).toBe(false);
    expect(registry.get('provider-1')).toBe(mock1);
    expect(registry.get('provider-2')).toBe(mock2);
    expect(registry.get('provider-3')).toBeUndefined();
  });

  it('should reject duplicate provider IDs with a clear error', () => {
    const registry = new AiProviderRegistry();
    const mock1 = createMockProvider({ id: 'provider-duplicate' });
    const mock2 = createMockProvider({ id: 'provider-duplicate' });

    registry.register(mock1);
    expect(() => registry.register(mock2)).toThrow(/already registered/);
  });

  it('should reject empty provider IDs', () => {
    const registry = new AiProviderRegistry();
    const mockEmpty = createMockProvider({ id: '' });
    expect(() => registry.register(mockEmpty)).toThrow(/cannot be empty/);
  });

  it('should return a frozen defensive copy from list()', () => {
    const mock1 = createMockProvider({ id: 'provider-1' });
    const registry = new AiProviderRegistry([mock1]);

    const list = registry.list();
    expect(list.length).toBe(1);
    expect(Object.isFrozen(list)).toBe(true);
    expect(list[0].identity.id).toBe('provider-1');
  });

  it('should unregister providers and clear registry', () => {
    const mock1 = createMockProvider({ id: 'provider-1' });
    const mock2 = createMockProvider({ id: 'provider-2' });
    const registry = new AiProviderRegistry([mock1, mock2]);

    expect(registry.unregister('provider-1')).toBe(true);
    expect(registry.unregister('provider-1')).toBe(false);
    expect(registry.has('provider-1')).toBe(false);
    expect(registry.list().length).toBe(1);

    registry.clear();
    expect(registry.list().length).toBe(0);
  });
});
