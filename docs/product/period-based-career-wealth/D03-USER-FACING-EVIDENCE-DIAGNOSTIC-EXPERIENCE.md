# D03 — User-Facing Evidence and Diagnostic Experience

**Status:** Implemented on feature branch; CI validation pending  
**Branch:** `feat/d03-user-facing-evidence-diagnostics`

## Experience

Career and Wealth pages now include a shared **Evidence, confidence & limitations** panel. It is a presentation-only projection over the canonical ProductAnalysis and D01 confidence/completeness projection.

The panel presents:
- Domain-owned confidence separately from promise strength.
- Evidence coverage and per-layer availability.
- Confidence reasons from the D01 projection.
- User-readable diagnostic messages, with technical diagnostic codes disclosed on demand.
- Evidence occurrences with source, direction and role.
- Rule IDs, occurrence IDs and related references within a technical provenance disclosure.
- Explicit unresolved-reference counts rather than broken links.
- Conflicting/mixed occurrences and challenging evidence without suppressing either.

## State fidelity

The panel consumes D01 metadata and does not derive, increase, or reinterpret backend confidence or availability. D2 is shown as unavailable in Wealth wherever D01 reports it unavailable. Missing evidence is described as an evidence gap, not as evidence of a negative outcome. Promise strength and confidence have separate labels and explanations.

Explicit mixed/conflicting evidence is identified separately. Ordinary challenging evidence retains its own direction label and remains visible in the occurrence list.

## Evidence identity and detail

The current canonical ProductEvidence shape guarantees an evidence occurrence ID, title, statement, direction, role, source and optional rule/derived IDs. D03 displays those fields. Related evidence links are emitted only when the referenced occurrence exists in the same domain evidence list. Unresolved references are counted and shown as unresolved.

Chart factors are not fabricated: this ProductAnalysis projection does not guarantee a chart-factor payload for every ProductEvidence occurrence. Where richer existing evidence components provide chart facts, those remain available in their own detail views.

## Accessibility and responsive behavior

The panel uses semantic sections/headings, labelled region, native disclosure controls, visible keyboard focus for related links, and responsive one-column/sm-to-lg grid layout. Long evidence lists remain scrollable with the page and are not silently truncated. Empty evidence has an explicit empty state.

## Non-goals and limitations

- No astrology, Dasha, chart, confidence, or synthesis calculations are added.
- C11 and CW-05 remain the domain confidence authorities.
- No AI-generated prose replaces deterministic explanations.
- No internal rule/evidence IDs are shown in the default evidence summary; they appear in technical disclosures.
- The component does not expose sensitive internal diagnostics beyond the user-readable message and optional technical code.
