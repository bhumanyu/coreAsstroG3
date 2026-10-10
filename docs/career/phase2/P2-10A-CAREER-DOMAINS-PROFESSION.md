# P2-10A Career Domain/Profession Layer

**Status:** IMPLEMENTED — VERIFICATION PENDING

**Recent Changes (P1/P2 Enforcement):**
- Implemented STRONG source-linkage contract for mechanism composites: required mechanisms must be referenced together by at least one expression in the pattern
- Defined partial source resolution policy for expressions: valid if at least one sourceMechanismId resolves
- Fixed buildProvenance() to derive patternIds strictly from emitted candidates (not all input patterns)
- Added regression tests for unlinked mechanisms, partial resolution, and consumed pattern provenance

## Overview

The P2-10A Career Domain/Profession layer is a standalone, deterministic module that converts already-computed canonical career outputs into broad professional-domain candidates and profession families. This layer does NOT recalculate astrology, does NOT map a planet directly to a job title, and does NOT let D10/Dasha/timing create candidates.

## Module Location

`src/domain/career/careerProfession/`

## Key Principles

1. **No Astrology Recalculation**: This module consumes pre-computed outputs from P2-08A (Career Expression), P2-07C/P2-07D (Career Mechanism), P2-07F (10H Foundation), P2-07G (10L Foundation), P2-08D (D10 Canonical), and P2-08E (Domain Evidence). It does not perform any new astrology calculations.

2. **No Planet→Job Mapping**: This module uses expression types and mechanism types as inputs, not raw planet data. It does not map planets directly to job titles.

3. **D10 Qualification-Only**: D10 data can only qualify existing profession candidates; it never creates new ones. Missing or unavailable D10 is marked as `NOT_PROVIDED` or `UNAVAILABLE`, not as negative evidence.

4. **Pattern-Scoped Resolution**: Rules are resolved within each `patternId` scope. Mechanisms and expressions from different patterns are NOT combined to satisfy a rule. Candidate identity includes the source-pattern set so candidates from distinct patterns are not collapsed.

5. **Deterministic Output**: Equivalent input order produces byte-identical output. All sorting uses code-point comparison, not locale-sensitive `localeCompare`.

## Architecture

### File Structure

```
src/domain/career/careerProfession/
├── careerProfessionTypes.ts      # Type contracts (§3)
├── careerProfessionRules.ts      # Rule registry (§4)
├── careerProfessionEngine.ts     # Resolution engine (§5, §6)
├── careerProfessionUtils.ts      # Utility functions
├── careerProfessionEngine.test.ts # Test suite (§7)
├── careerProfessionBoundary.test.ts # Boundary enforcement (§9)
└── index.ts                      # Public API
```

### Type Contracts (§3)

#### CareerProfessionDomain

Broad professional-domain candidates. These are high-level domain classifications, not exact job titles.

- `TECHNOLOGY`: Technology and software-related domains
- `FINANCE`: Financial services and banking domains
- `HEALTHCARE`: Healthcare and medical domains
- `EDUCATION`: Education and teaching domains
- `LEADERSHIP`: Leadership and management domains
- `COMMUNICATION`: Communication and media domains
- `RESEARCH`: Research and analysis domains
- `SERVICE`: Service-oriented domains
- `INSTITUTIONAL`: Institutional and government domains
- `FOREIGN`: Foreign and international domains
- `REMOTE`: Remote and distributed work domains

#### CareerProfessionFamily

Profession families within domains. These are sub-classifications of domains that group related profession types.

- `TECHNICAL_LEADERSHIP`: Leadership roles in technology
- `FINANCIAL_SERVICES`: Financial service roles
- `MEDICAL_PRACTICE`: Medical practice roles
- `ACADEMIC_TEACHING`: Academic and teaching roles
- `EXECUTIVE_MANAGEMENT`: Executive management roles
- `MEDIA_COMMUNICATION`: Media and communication roles
- `ANALYTICAL_RESEARCH`: Analytical research roles
- `PUBLIC_SERVICE`: Public service roles
- `GOVERNMENT_ADMINISTRATION`: Government administration roles
- `INTERNATIONAL_BUSINESS`: International business roles
- `DISTRIBUTED_TEAMWORK`: Distributed teamwork roles

#### CareerProfessionBasis

What establishes a profession candidate.

- `EXPRESSION`: Established from expression types
- `MECHANISM`: Established from mechanism types
- `10H_FOUNDATION`: Established from 10H foundation (context only)
- `10L_FOUNDATION`: Established from 10L foundation (context only)
- `D10_QUALIFICATION`: Established from D10 qualification (qualification-only)
- `DOMAIN_EVIDENCE`: Established from DomainEvidence

#### CareerProfessionD10Status

D10 qualification status for a profession candidate.

- `QUALIFIED`: D10 qualification is available and supports this candidate
- `NOT_PROVIDED`: D10 data is not provided (input missing)
- `UNAVAILABLE`: D10 data is provided but no qualification matches this candidate
- `NOT_APPLICABLE`: D10 qualification is not applicable to this candidate

**Critical Note:** D10 can only qualify an existing candidate; it never creates one. Missing/unavailable D10 is `NOT_PROVIDED`/`UNAVAILABLE`, not negative evidence.

#### CareerProfessionCandidate

Canonical profession record derived from career outputs.

- `candidateId`: Unique identifier including source-pattern set
- `domain`: The broad professional-domain candidate
- `family`: The profession family within the domain
- `basis`: What establishes this candidate
- `expressionTypes`: Expression types that contributed to this candidate
- `mechanismTypes`: Mechanism types that contributed to this candidate
- `patternIds`: Pattern IDs from which this candidate was derived (pattern-scoped)
- `d10Status`: D10 qualification status
- `evidence`: Evidence records linking this candidate to its sources
- `domainEvidenceIds`: IDs of DomainEvidence records that support this candidate
- `relatedEvidenceIds`: IDs of related evidence records
- `ruleId`: ID of the profession rule that produced this candidate

#### CareerProfessionAnalysis

Result of profession resolution.

- `candidates`: The set of profession candidates
- `status`: `COMPLETE`, `PARTIAL`, or `INSUFFICIENT_DATA`
- `unresolvedExpressionTypes`: Expression types with no matching profession rule
- `mappedTypes`: Expression types actually consumed by emitted candidates
- `missingInputs`: List of missing input types
- `provenance`: Aggregate provenance for the entire analysis

#### CareerProfessionInput

Input for profession resolution.

- `expressions`: Career expression analysis result from P2-08A
- `mechanisms`: Career mechanism candidates from P2-07C/P2-07D
- `career10HFoundation`: 10H foundation from P2-07F (optional context)
- `career10LFoundation`: 10L foundation from P2-07G (optional context)
- `careerD10CanonicalAnalysis`: D10 canonical analysis from P2-08D (qualification-only)
- `domainEvidence`: Domain evidence records from P2-08E (optional context)

### Rule Registry (§4)

#### CareerProfessionRule

Rule descriptor for expression/mechanism → profession mapping.

- `ruleId`: Unique identifier for the rule
- `domain`: The profession domain produced by this rule
- `family`: The profession family produced by this rule
- `basis`: What establishes this candidate
- `requiredExpressionTypes`: Expression types that trigger this rule (optional)
- `requiredMechanismTypes`: Mechanism types that trigger this rule (optional)
- `precedence`: Ordering metadata for rule evaluation order (higher = evaluated first). Current behavior emits every match; precedence does not suppress lower-precedence matches.

#### Rule Semantics

- At least one of `requiredExpressionTypes` or `requiredMechanismTypes` must be specified.
- If both are specified, ALL must be present for the rule to match (AND semantics).
- Composite rules with multiple mechanism types require ALL to be present (every check).
- **STRONG source-linkage contract for mechanism composites**: Required mechanisms must be referenced together by at least one expression in the pattern, indicating they share a deterministic source relationship (e.g., participate in a common qualifying expression). Mechanisms that merely co-occur in the same pattern without shared linkage are rejected. This matches the project's established provenance discipline.
- Rules never map a planet directly to a job title.
- Rules never let D10/Dasha/timing create candidates.

#### CAREER_PROFESSION_RULES

Frozen registry of career profession rules, ordered by precedence (highest first).

**Composite Rules (precedence 200):**
- `RULE_PROFESSION_TECHNICAL_LEADERSHIP`: INNOVATION + AUTHORITY → TECHNOLOGY / TECHNICAL_LEADERSHIP
- `RULE_PROFESSION_ANALYTICAL_RESEARCH`: RESEARCH + SPECIALIZED_KNOWLEDGE → RESEARCH / ANALYTICAL_RESEARCH

**Primary Expression Mappings (precedence 100):**
- `RULE_PROFESSION_AUTHORITY`: AUTHORITY_EXPRESSION → LEADERSHIP / EXECUTIVE_MANAGEMENT
- `RULE_PROFESSION_LEADERSHIP`: LEADERSHIP_EXPRESSION → LEADERSHIP / EXECUTIVE_MANAGEMENT
- `RULE_PROFESSION_TEACHING`: TEACHING_EXPRESSION → EDUCATION / ACADEMIC_TEACHING
- `RULE_PROFESSION_RESEARCH`: RESEARCH_WORK → RESEARCH / ANALYTICAL_RESEARCH
- `RULE_PROFESSION_COMMUNICATION`: COMMUNICATION_WORK → COMMUNICATION / MEDIA_COMMUNICATION
- `RULE_PROFESSION_WRITING`: WRITING_WORK → COMMUNICATION / MEDIA_COMMUNICATION
- `RULE_PROFESSION_INNOVATION`: INNOVATION_WORK → TECHNOLOGY / TECHNICAL_LEADERSHIP
- `RULE_PROFESSION_SERVICE`: SERVICE_WORK → SERVICE / PUBLIC_SERVICE
- `RULE_PROFESSION_FINANCIAL`: FINANCIAL_WORK → FINANCE / FINANCIAL_SERVICES
- `RULE_PROFESSION_INSURANCE`: INSURANCE_WORK → FINANCE / FINANCIAL_SERVICES
- `RULE_PROFESSION_TAXATION`: TAXATION_WORK → FINANCE / FINANCIAL_SERVICES
- `RULE_PROFESSION_COMPLIANCE`: COMPLIANCE_WORK → FINANCE / FINANCIAL_SERVICES
- `RULE_PROFESSION_CRISIS_MANAGEMENT`: CRISIS_MANAGEMENT_WORK → SERVICE / PUBLIC_SERVICE
- `RULE_PROFESSION_INSTITUTIONAL`: INSTITUTIONAL_WORK_EXPRESSION → INSTITUTIONAL / GOVERNMENT_ADMINISTRATION
- `RULE_PROFESSION_ISOLATED`: ISOLATED_WORK_EXPRESSION → INSTITUTIONAL / GOVERNMENT_ADMINISTRATION
- `RULE_PROFESSION_FOREIGN`: FOREIGN_WORK_EXPRESSION → FOREIGN / INTERNATIONAL_BUSINESS
- `RULE_PROFESSION_REMOTE`: REMOTE_WORK_EXPRESSION → REMOTE / DISTRIBUTED_TEAMWORK
- `RULE_PROFESSION_ANALYTICAL_SPECIALIZED`: ANALYTICAL_SPECIALIZED_WORK → RESEARCH / ANALYTICAL_RESEARCH

### Resolution Engine (§5, §6)

#### buildCareerProfessionAnalysis

Main entry point for profession resolution.

**Pattern-Scoped Resolution (§6):**
- Resolves rules within each `patternId` scope using `expression.provenance.patternIds` and `mechanism.patternId`.
- Does NOT combine mechanisms/expressions from different patterns to satisfy a composite rule.
- Candidate identity includes the source-pattern set so candidates from distinct patterns are not collapsed.

**Source-Linkage Resolution (P1):**
- For expression-driven rules: expressions must reference at least one mechanism in the pattern via `sourceMechanismIds`.
- **Partial resolution policy**: An expression is valid if at least one of its `sourceMechanismIds` resolves to a pattern mechanism. Unresolved source references are ignored for validity, but evidence `sourceIds` include only expression IDs (not mechanism IDs) to avoid implying full linkage when only partial resolution occurred.
- For mechanism composites: STRONG source-linkage contract - required mechanisms must be referenced together by at least one expression in the pattern, indicating they share a deterministic source relationship.

**D10 Status Resolution (Critical Trap):**
- The P2-08A `expressionId` is built from `createCareerExpressionId(expressionType, sourceMechanismIds)`.
- D10 canonical expression qualifications are keyed on the legacy mode-based `CareerExpression`.
- These are DIFFERENT identity namespaces. A naive string-equality match will NEVER match.
- **Resolution:** Return `NOT_PROVIDED`/`UNAVAILABLE` and document that D10 per-expression qualification is deferred because the identity namespaces are not yet reconciled.
- In all cases, D10 must only qualify an existing candidate and must never create one.
- Missing/unavailable D10 is `NOT_PROVIDED`/`UNAVAILABLE`, not negative evidence.

**Provenance Discipline:**
- `evidenceIds`, `sourceIds`, `ruleIds` are in separate namespaces.
- Do not fabricate source IDs. Carry real upstream source IDs where they genuinely exist, otherwise leave empty rather than inventing.
- `DomainEvidence.provenance.source` is a source label, not necessarily a source ID, so treat it carefully.
- Unreferenced `DomainEvidence` (not linked via `relatedEvidenceIds` to the candidate's base evidence) must never create or activate a candidate.
- **Consumed pattern IDs**: Provenance `patternIds` are derived strictly from emitted candidates' `patternIds`, not from all input patterns. Input patterns that produce no candidates do not appear in consumed provenance.

**Determinism:**
- Output is deterministically sorted and deeply frozen.
- Equivalent input order must produce byte-identical output.
- Uses code-point string comparator (not locale-sensitive `localeCompare`) for all sorts.

### Utility Functions

#### ID Generation

- `createProfessionCandidateId(domain, family, patternIds, basis)`: Stable candidate ID including pattern set
- `createProfessionEvidenceId(basis, ruleId, sourceIds)`: Stable evidence ID

#### Sorting

- `codePointCompare(a, b)`: Code-point string comparator for deterministic sorting
- `canonicalSortProfessionCandidates(candidates)`: Sort candidates by candidateId
- `canonicalSortProfessionEvidence(evidence)`: Sort evidence by evidenceId

#### Deduplication

- `deduplicateProfessionCandidates(candidates)`: Deduplicate by candidateId
- `deduplicateProfessionEvidence(evidence)`: Deduplicate by evidenceId

#### Merging

- `mergeProfessionProvenances(provenances)`: Merge and deduplicate provenance arrays
- `mergeSourceIds(sourceIdArrays)`: Merge and deduplicate source IDs
- `mergeRelatedEvidenceIds(evidenceIdArrays)`: Merge and deduplicate related evidence IDs

#### Freezing

- `freezeProfessionCandidate(candidate)`: Deep freeze a candidate
- `freezeProfessionAnalysis(analysis)`: Deep freeze an analysis

### Test Suite (§7)

#### Test Cases

1. **Explicit-rule-only emission**: Candidates only emitted for rules that match
2. **No planet→profession mapping**: Does not map planets directly to profession domains
3. **No cross-pattern combination**: Does not combine mechanisms/expressions from different patterns
4. **Source-mechanism-supports-expression check**: Verifies source mechanisms support the expression
5. **D10 cannot create**: D10 alone cannot create profession candidates
6. **D10 only qualifies**: D10 only qualifies existing candidates, never creates them
7. **Missing-D10/10H/10L not negative**: Missing D10/10H/10L is not negative evidence
8. **Unreferenced DomainEvidence cannot create**: Unreferenced DomainEvidence cannot create candidates
9. **ID-namespace separation**: evidenceIds, sourceIds, ruleIds in separate namespaces
10. **Conflicting candidates preserved**: Conflicting candidates from different rules are preserved
11. **Determinism under permutation**: Produces identical results under input permutation
12. **Immutability/no input mutation**: Does not modify input, returns frozen output
13. **Unresolved expression-type reporting**: Reports expression types with no matching rule, computes mappedTypes from actually consumed expression types
14. **STRONG source-linkage for mechanism composites**: Mechanism composites require shared source linkage (referenced together by at least one expression)
15. **Partial source resolution for expressions**: Expressions are valid if at least one sourceMechanismId resolves; evidence sourceIds include only expression IDs
16. **Consumed pattern IDs in provenance**: Provenance patternIds derived from emitted candidates only, not all input patterns

### Boundary Enforcement (§9)

#### Forbidden Imports

The module must NOT import from:
- `careerDasha`
- `d10/` (except `careerD10CanonicalTypes` for qualification-only)
- `careerFinalSynthesis`
- `domain/timing`
- `transit`
- `ai`
- Any raw horoscope/chart astrology calculation

The boundary test (`careerProfessionBoundary.test.ts`) enforces these restrictions by scanning all `.ts` files in the module directory for forbidden import patterns.

### Integration Status

**NOT YET INTEGRATED:** This module is NOT registered in `CareerDomainInterpreterV2.ts` or any public app API. It is a standalone module for future integration.

### Deferred Work

#### D10 Expression Identity Namespace Reconciliation (Known Qualification Gap)

The P2-08A `expressionId` (e.g., `EXPR:RESEARCH_WORK:MECH1,MECH2`) does not match the D10 canonical `expressionId` (legacy mode-based `CareerExpression` identity). Without a documented mapping between these namespaces, D10 per-expression qualification is deferred.

**Current Behavior:**
- `applyD10Qualification` returns `NOT_PROVIDED` when D10 data is missing
- `applyD10Qualification` returns `UNAVAILABLE` when D10 data is provided but identity namespaces are not reconciled
- `UNAVAILABLE` is never read as negative evidence downstream
- D10 only qualifies existing candidates; it never creates them

**Resolution Path:**
1. Implement and unit-test a documented mapping between P2-08A expression identity and D10 canonical expression identity
2. OR: If no reliable mapping exists, continue to return `NOT_PROVIDED`/`UNAVAILABLE` and document that D10 per-expression qualification is deferred

**Status:** This is a known qualification gap. Functional D10 qualification will be implemented once a tested P2-08A↔D10 expression-identity mapping exists.

#### Refinement Adapters

The following refinement adapters are not implemented in this pass:
- D9 refinement adapter
- Dispositor refinement adapter
- Sign-element refinement adapter
- Career-house refinement adapter

These are represented by the `CareerProfessionRefinement` type but not yet implemented.

### Evidence/Source/Rule ID Separation

- **evidenceIds**: Unique identifiers for evidence records (prefix: `EVID:`)
- **sourceIds**: IDs of source records from upstream modules (expressions, mechanisms, etc.)
- **ruleIds**: IDs of rules that produced candidates (prefix: `RULE_PROFESSION_*`)

These namespaces are kept separate to maintain clear provenance chains.

### Domain vs Profession Family vs Job Title

This module explicitly distinguishes between:
- **Domain candidate**: Broad professional-domain (e.g., TECHNOLOGY, FINANCE)
- **Profession family**: Sub-classification within a domain (e.g., TECHNICAL_LEADERSHIP, FINANCIAL_SERVICES)
- **Job title**: Exact job title (e.g., SOFTWARE_ENGINEER, BANKER, DOCTOR) - NOT produced by this module

Job titles belong to a later synthesis layer (P2-10B or beyond).

### Module Conventions

This module follows the conventions established by:
- `src/domain/career/careerExpression/`
- `src/domain/career/careerD10/`
- `src/domain/career/career10h/`

Specifically:
- Types file defines all type contracts
- Rules file defines frozen rule registry
- Engine file implements resolution logic
- Utils file provides helper functions
- Test file implements comprehensive test suite
- Boundary test enforces forbidden imports
- Index file re-exports public API

### Verification

**Type Checking:** Run `npm run lint` (`tsc --noEmit`) to verify all imports compile correctly.

**Testing:** Run `npm test -- careerProfessionEngine.test.ts` plus the `careerExpression`, `careerMechanism`, `career10h`, and `careerD10` suites to confirm no regression.

**CI Status:** This module is IMPLEMENTED but VERIFICATION IS PENDING. Do not claim CI passed without observable remote workflow results.

## References

- P2-08A Career Expression Model
- P2-07C Career Mechanism Model
- P2-07D Career Mechanism Resolver
- P2-07F 10H Structural Context
- P2-07G 10L Condition and Relationships
- P2-08D Canonical C11 (D10)
- P2-08E P1 Domain Evidence
