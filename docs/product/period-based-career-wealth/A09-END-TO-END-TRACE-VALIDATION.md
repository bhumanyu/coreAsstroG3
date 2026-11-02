# A09 — End-to-End Reasoning Trace Validation

## Trace chain contract
The trace report preserves this chain without substituting identifiers across namespaces:

`Conclusion node → C11/CW-05 synthesis rule → DomainEvidence occurrence ID → producer/source rule ID → chart input (source, planet, house, Dasha period) or explicit sourceRecordId`

- `DomainEvidence.id` and `ReasoningNode.evidenceId` are occurrence IDs.
- `identityKey` and `rootEvidenceIds` remain semantic identity keys.
- `relatedEvidenceIds` remain upstream occurrence IDs and are validated only against occurrence IDs.
- `DomainEvidence.ruleId` and provenance `ruleId` are preserved separately as source-rule and producer-rule references.
- Chart input references are built only from explicit source, planet, house or timing fields. An exact `sourceRecordId` may be supplied by a producer. No synthetic calculation or source-record IDs are generated.

## Completeness diagnostics
Each Career C11 and Wealth CW-05 reasoning graph now carries a serializable `traceCompleteness` report. It records the canonical conclusion node, synthesis rule, resolved evidence occurrence links and diagnostics.

Diagnostics include:
- `MISSING_EVIDENCE_OCCURRENCE`
- `MISSING_SOURCE_RULE`
- `MISSING_CHART_CALCULATION_LINK`
- `INVALID_RELATED_EVIDENCE_LINK`
- `UNRESOLVED_ROOT_EVIDENCE_LINK`
- `MISSING_SEMANTIC_IDENTITY`
- `NO_EVIDENCE_OCCURRENCES`

A trace is COMPLETE only when no required links are missing or invalid. PARTIAL indicates resolved occurrences with missing links; INCOMPLETE indicates missing synthesis evidence occurrences or no resolvable links.

## Production integration
- Career passes C11 evidence references in the semantic identity namespace.
- Wealth passes CW-05 evidence references in the occurrence namespace.
- Both graph builders preserve the final conclusion node ID and attach the report to the graph stored in `conclusionData.reasoningTraceGraph`.
- Life-analysis view models expose C11 confidence coverage/reasons and both Career/Wealth trace completeness; the Career UI labels evidence confidence separately from promise strength.
- AI career and Wealth projections carry the same report when present.
- Evidence graph nodes use the exact `DomainEvidence.id` as occurrence identity and retain `identityKey` separately.
- AI evidence projections preserve occurrence IDs, semantic identity keys, source-record IDs, related occurrence IDs and root semantic identity keys.

## Validation fixtures
Fixtures cover full Career and Wealth chains, missing producer rule, missing chart calculation link, explicit source record ID, invalid related-evidence link, duplicate semantic identity with distinct occurrences, and API-style JSON round-trip serialization.

A diagnostic is a statement about trace completeness only; it does not change evidence weight, synthesis confidence or the canonical conclusion.
