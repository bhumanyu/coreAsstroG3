/**
 * Recursively freezes an object and its nested properties.
 * Guards against primitives, null/undefined, and already frozen objects.
 */
export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Object.isFrozen(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      deepFreeze(value[i]);
    }
  } else {
    for (const key of Object.keys(value)) {
      const prop = (value as Record<string, unknown>)[key];
      if (prop !== null && typeof prop === 'object') {
        deepFreeze(prop);
      }
    }
  }

  return Object.freeze(value);
}
