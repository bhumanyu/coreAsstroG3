import { describe, expect, it } from 'vitest';
import {
  assertUniqueDomainEvidenceOccurrenceIds,
  createDomainEvidence,
  validateDomainEvidenceRootLinks
} from './DomainEvidence';

describe('DomainEvidence root and occurrence identity contract (A03)', () => {
  const base = {
    sourceType: 'STRUCTURAL' as const,
    domain: 'CAREER' as const,
    role: 'PRIMARY' as const,
    phase: 'NATAL_PROMISE' as const,
    source: 'D1' as const,
    statement: 'Root identity contract fixture',
    polarity: 'SUPPORTING' as const,
    strength: 'STRONG' as const,
    priority: 1,
    relatedEvidenceIds: []
  };

  it('keeps semantic root references separate from occurrence and producer IDs', () => {
    const evidence = createDomainEvidence({
      ...base,
      id: 'derived-occurrence-1',
      identityKey: 'derived-semantic-identity',
      relatedEvidenceIds: ['producer-occurrence-1'],
      rootEvidenceIds: ['root-semantic-b', 'root-semantic-a']
    });

    expect(evidence.id).toBe('derived-occurrence-1');
    expect(evidence.identityKey).toBe('derived-semantic-identity');
    expect(evidence.relatedEvidenceIds).toEqual(['producer-occurrence-1']);
    expect(evidence.rootEvidenceIds).toEqual(['root-semantic-a', 'root-semantic-b']);
    expect(Object.isFrozen(evidence.rootEvidenceIds)).toBe(true);
  });

  it('allows distinct occurrences to share one semantic identity', () => {
    const first = createDomainEvidence({
      ...base,
      id: 'mixed-support-occurrence',
      identityKey: 'one-semantic-fact'
    });
    const second = createDomainEvidence({
      ...base,
      id: 'mixed-challenge-occurrence',
      identityKey: 'one-semantic-fact',
      polarity: 'CHALLENGING'
    });

    expect(() => assertUniqueDomainEvidenceOccurrenceIds([first, second])).not.toThrow();
    expect(first.identityKey).toBe(second.identityKey);
    expect(first.id).not.toBe(second.id);
  });

  it('rejects duplicate occurrence IDs even when semantic identities differ', () => {
    const first = createDomainEvidence({
      ...base,
      id: 'duplicate-occurrence',
      identityKey: 'semantic-a'
    });
    const second = createDomainEvidence({
      ...base,
      id: 'duplicate-occurrence',
      identityKey: 'semantic-b'
    });

    expect(() => assertUniqueDomainEvidenceOccurrenceIds([first, second]))
      .toThrow(/Duplicate DomainEvidence occurrence ID detect  it('rejects cyclic root dependencies between semantic identities', () => {
    const first = createDomainEvidence({
      ...base,
      id: 'root-a-occurrence',
      identityKey: 'root-a-semantic',
      rootEvidenceIds: ['root-b-semantic']
    });
    const second = createDomainEvidence({
      ...base,
      id: 'root-b-occurrence',
      identityKey: 'root-b-semantic',
      rootEvidenceIds: ['root-a-semantic']
    });

    const validation = validateDomainEvidenceRootLinks([first, second]);
    expect(validation.isValid).toBe(false);
    expect(validation.unresolved).toContainEqual(expect.objectContaining({
      code: 'ROOT_EVIDENCE_CYCLE'
    }));
  });

ed: duplicate-occurrence/);
  });

  it('rejects empty, duplicate, sentinel, and self-referential root links', () => {
    expect(() => createDomainEvidence({
      ...base,
      id: 'occurrence-empty-root',
      rootEvidenceIds: ['  ']
    })).toThrow(/rootEvidenceIds must contain non-empty/);

    expect(() => createDomainEvidence({
      ...base,
      id: 'occurrence-duplicate-roots',
      rootEvidenceIds: ['root-a', 'root-a']
    })).toThrow(/rootEvidenceIds must be unique/);

    expect(() => createDomainEvidence({
      ...base,
      id: 'occurrence-sentinel-root',
      rootEvidenceIds: ['__UNRESOLVED_IDENTITY__']
    })).toThrow(/unresolved identity sentinel/);

    expect(() => createDomainEvidence({
      ...base,
      id: 'occurrence-self-root',
      identityKey: 'same-semantic-identity',
      rootEvidenceIds: ['same-semantic-identity']
    })).toThrow(/own identityKey/);
  });
});
