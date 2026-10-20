# Part 1 Investigation: Canonical C11 Qualification Input Trace

## Summary

This investigation traces why `resolvedMechanisms` is empty for the Jupiter-Ketu chart (CANONICAL_BIRTH_DETAILS), which reproduces `CAREER_QUALIFICATION_UNAVAILABLE` in the selected-period builder.

## Investigation Methodology

Instrumented the canonical career foundation build to collect intermediate metrics:
- Number of patterns produced
- Number of patternQualifications by status (QUALIFIED/INSUFFICIENT_DATA/UNQUALIFIED)
- Final resolvedMechanisms.length
- Diagnostics for ORCHESTRATION_UNQUALIFIED_PATTERN_MECHANISM_*
- Diagnostics for ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE

Compared outcomes with `enableDispositorContexts: false` (production default) vs `true` (two-pass orchestration).

## Findings

### 1. Pattern Production

**Status**: Patterns ARE produced for this chart.

- **Patterns count**: 1
- **Pattern qualification status**: INSUFFICIENT_DATA (not UNQUALIFIED)
- **Pattern details**:
  - Pattern ID: `CAREER_PATTERN:CAREER_HOUSE_NETWORK:CAREER_HOUSE_NETWORK:HOUSES:6,8,11:TOPOLOGY:STAR:RELATIONSHIPS:LORD_OF:PLANET:MARS→HOUSE:11|LORD_OF:PLANET:MARS→HOUSE:6`
  - Family: CAREER_HOUSE_NETWORK
  - Level: HOUSE_NETWORK
  - Classification: CAREER_HOUSE_NETWORK
  - Houses: [6, 8, 11]
  - Establishing relationships: LORD_OF:PLANET:MARS→HOUSE:11, LORD_OF:PLANET:MARS→HOUSE:6

### 2. Pattern Qualification

**Status**: Pattern is INSUFFICIENT_DATA, not UNQUALIFIED.

- Total pattern qualifications: 1
- QUALIFIED: 0
- INSUFFICIENT_DATA: 1
- UNQUALIFIED: 0

**Conclusion**: The pattern passed the gating policy in the orchestrator (UNQUALIFIED patterns are skipped, INSUFFICIENT_DATA patterns proceed to mechanism resolution).

### 3. Mechanism Resolution

**Status**: Resolved mechanisms is genuinely empty due to rule coverage gap.

- Resolved mechanisms count: 0
- Unqualified pattern mechanism diagnostics: 0 (no patterns were gated as UNQUALIFIED)

**Root cause**: The pattern does not match any mechanism resolver rules. The resolver currently only supports dusthana transformation patterns:
- RULE_MECHANISM_PATTERN_DUSTHANA_8_10 (requires houses 8 and 10)
- RULE_MECHANISM_PATTERN_DUSTHANA_12_10 (requires houses 12 and 10)
- RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10 (requires houses 8, 12, and 10)

The pattern has houses [6, 8, 11] but lacks house 10, so it does not match any dusthana transformation rules. Consequently, the resolver returns an empty candidate set for this pattern.

**This is a genuine limitation, not a bug**: The pattern is structurally valid (INSUFFICIENT_DATA qualification) but falls outside the current rule coverage (only dusthana transformation patterns are implemented per spec §25).

### 4. enableDispositorContexts Flag Impact

**Status**: Flag does NOT materially change resolvedMechanisms count for this chart.

- Resolved mechanisms (enableDispositorContexts=false): 0
- Resolved mechanisms (enableDispositorContexts=true): 0
- Difference: 0

**Conclusion**: The hard-coded `enableDispositorContexts: false` in CareerDomainInterpreterV2.ts (line 258) does not affect the outcome for this chart. Even with dispositor contexts enabled, the pattern still produces 0 mechanisms because it doesn't match any resolver rules.

### 5. Diagnostics

- ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE: WARNING (expected when flag is false)
- ORCHESTRATION_UNQUALIFIED_PATTERN_MECHANISM_*: 0 (no patterns were gated as UNQUALIFIED)

## Conclusion

**resolvedMechanisms is genuinely empty for this chart due to a genuine limitation, not an upstream bug.**

The investigation confirms:
1. Patterns are produced (1 pattern with houses [6, 8, 11])
2. Pattern qualification is INSUFFICIENT_DATA (proceeds to mechanism resolution per gating policy)
3. Mechanism resolution produces 0 candidates because the pattern does not match any resolver rules (only dusthana transformation patterns with house 10 are currently implemented)
4. The `enableDispositorContexts: false` flag does not materially change the outcome
5. No upstream dropped-input bug exists - the emptiness is due to rule coverage gap

The `UNAVAILABLE` qualification basis in the selected-period builder is therefore justified for this chart, as canonical candidates are genuinely empty (not a silent proxy fallback).

## Recommendation

The `UNAVAILABLE` path implemented in commit 746d386 is correct for this chart. The root cause of empty mechanisms is rule coverage (only dusthana transformation patterns implemented), not a data pipeline bug. Future work to expand mechanism rule coverage (e.g., Kendra-Trikona, Parivartana patterns) would address this limitation at the source.

## Instrumentation Artifacts

The temporary investigation test file `src/domain/career/orchestration/canonicalCareerFoundationInvestigation.test.ts` contains the instrumentation used to collect these metrics. This file can be removed after this investigation is complete.
