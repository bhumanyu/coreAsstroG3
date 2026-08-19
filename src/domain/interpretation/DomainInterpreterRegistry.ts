import type { DomainInterpreter } from './DomainInterpreter';
import type { DomainId } from './DomainInterpretationTypes';

export class DomainInterpreterRegistry {
  private readonly interpreters: ReadonlyMap<DomainId, DomainInterpreter>;

  constructor(interpreters: readonly DomainInterpreter[]) {
    const map = new Map<DomainId, DomainInterpreter>();

    for (const interpreter of interpreters) {
      if (map.has(interpreter.domain)) {
        throw new Error(
          `Duplicate domain interpreter: ${interpreter.domain}`
        );
      }
      map.set(interpreter.domain, interpreter);
    }

    this.interpreters = map;
  }

  get(domain: DomainId): DomainInterpreter {
    const interpreter = this.interpreters.get(domain);

    if (!interpreter) {
      throw new Error(
        `No domain interpreter registered for ${domain}.`
      );
    }

    return interpreter;
  }

  has(domain: DomainId): boolean {
    return this.interpreters.has(domain);
  }

  domains(): readonly DomainId[] {
    return Object.freeze([...this.interpreters.keys()]);
  }
}
