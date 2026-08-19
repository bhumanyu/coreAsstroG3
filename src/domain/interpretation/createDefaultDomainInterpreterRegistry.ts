import { DomainInterpreterRegistry } from './DomainInterpreterRegistry';
import { CareerDomainInterpreter } from '../career/CareerDomainInterpreter';
import { WealthDomainInterpreter } from '../wealth/WealthDomainInterpreter';

export function createDefaultDomainInterpreterRegistry(): DomainInterpreterRegistry {
  return new DomainInterpreterRegistry([
    new CareerDomainInterpreter(),
    new WealthDomainInterpreter()
  ]);
}
