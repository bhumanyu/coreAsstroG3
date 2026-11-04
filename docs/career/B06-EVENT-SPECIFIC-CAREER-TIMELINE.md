# B06 — Event-Specific Career Timeline

## Release decision

**B06 v1 does not enable any event-specific taxonomy type.** The current source catalogue has broad C11 expression modes and generic P2-09B opportunity/challenge/conditional windows, but it does not contain validated event-specific natal rule ownership for the proposed outcomes. The implementation therefore publishes the evidence contract for every proposed type, marks each `UNVALIDATED`, and emits no event-specific candidates.

This is an intentional evidence gate, not an incomplete prediction engine. A future event type must be enabled individually after its rule owner, canonical evidence family, provenance bridge, counter-indications, positive golden fixture, and negative fixtures are reviewed.

## Authority and dependencies

- C11 remains the sole final Career synthesis authority.
- P2-09A remains the source of broad natal trajectory opportunities.
- P2-09B remains the temporal window authority. Its source Dasha dates are copied verbatim; B06 does not calculate, adjust, interpolate, or extend dates.
- B01 Promise, Activation, and Risk axes are consumed as independent evidence projections.
- B02 is required for generic opportunity/conditional windows: it confirms natal promise and linked activation and preserves explicit observed facts separately.
- C9 canonical Dasha evidence resolves activation identity to occurrence IDs and natal root identity keys.
- B03 D1/D10 hierarchy is respected: D10 may qualify an already existing D1 expression, but cannot create D1 promise. No D10 evidence by itself enables a B06 event type.
- A05 temporal authority is not changed. B06 does not recalculate current/as-of Dasha state.
- A07 confidence/coverage conventions are preserved. B06 emits no numeric confidence or probability.

## Proposed event taxonomy and evidence contract

All ten types are currently `UNVALIDATED`, `releaseEnabled = false`, and produce zero event-specific candidates.

| Event type | Required evidence before enablement | Current gap |
|---|---|---|
| `CAREER_ENTRY_START` | D1 natal promise; event-specific entry expression/rule; linked C9 support activation | Broad employment/service modes do not establish first entry/start |
| `JOB_CHANGE_TRANSITION` | D1 transition/mobility expression and rule; linked C9 support activation; same-expression D10 qualification where applicable | Employment, foreign or independent modes do not prove a job change |
| `PROMOTION_ROLE_EXPANSION` | D1 authority/role expansion promise; event-specific rule; same-expression D10 qualification; linked C9 activation | Authority/leadership expression is not promotion evidence |
| `LEADERSHIP_RESPONSIBILITY` | D1 leadership/authority promise; event-specific rule; D10 qualification; linked C9 activation | Broad leadership expression does not establish an appointment/assignment |
| `ENTREPRENEURSHIP_BUSINESS_INITIATION` | D1 independent/business promise; initiation-specific rule; D10 qualification; linked C9 activation | Independent/business mode does not prove business initiation |
| `FOREIGN_REMOTE_OPPORTUNITY` | Explicit D1 foreign/remote expression and rule; D10 qualification; linked C9 activation | Foreign/remote labels do not establish a concrete opportunity |
| `CHALLENGE_INTERRUPTION` | D1 promise context; C11 natal counter-indication; interruption-specific rule; linked C9 challenge activation | Dasha challenge alone does not prove interruption |
| `RECOVERY_REENTRY` | D1 recovery/continuity evidence; prior challenge; subsequent support activation; source-dated temporal order | No validated recovery/continuity evidence family or ordered event rule |
| `PEAK_CONSOLIDATION` | D1 promise; validated sustainability evidence; D10 qualification; linked C9 activation | B01 Sustainability is explicitly NOT_ASSESSED |
| `RETIREMENT_TRANSITION` | Explicit D1 exit evidence and rule; user-confirmed active-career context; source-dated order | No validated retirement rule; age or Dasha alone is insufficient |

## Generic-window retention

B06 does not relabel generic P2-09B windows.

### Opportunity and conditional windows

A generic opportunity/conditional window is retained only when:
- the P2-09B event is a candidate with semantic evidence and rule references;
- a B02 candidate outcome references the exact same source event, opportunity ID and activation ID;
- B02 has non-empty natal-promise and activation occurrence provenance; and
- the B02 guarantee remains `NONE`.

This preserves the B01/C11 natal promise gate and linked canonical C9 activation. Dasha cannot manufacture the opportunity.

### Challenge windows

A generic challenge window is retained only when:
- the P2-09B event activation ID resolves to exactly one canonical C9 evidence identity;
- that C9 record has `effect = CHALLENGES`, `direction = CHALLENGE`, and non-empty natal root IDs;
- its occurrence ID is present in B01 Activation conflicting occurrences and B01 Risk supporting occurrences; and
- at least one C9 natal root identity matches a C11 NATAL CHALLENGE/MIXED conflict identity.

Otherwise the generic challenge window is suppressed with a diagnostic. A Dasha challenge without linked natal counter-evidence is not emitted by B06.

### Window semantics

Every retained window has:
- the exact P2-09B source event ID and generic type;
- source-backed timing copied without modification;
- opportunity and activation references;
- semantic identity IDs, occurrence IDs, root identity keys and rule IDs in separate namespaces;
- explicit qualification conditions and counter-evidence occurrence IDs from B02/B01; and
- an explicit `specificEventInference = NOT_MADE` field; and
- limitations stating that the window is indicative, not a specific or guaranteed outcome.

Overlapping windows remain distinct by source event identity. B06 does not merge, extend, or reorder their temporal intervals.

## Observed outcomes

B06 carries only B02's explicit `USER_REPORTED` report IDs as references. It does not infer an observed event from a generic window or an event-specific candidate. The complete observed fact remains in B02's separate observed-outcomes collection.

## Output and product projection

`CareerEventTimelineAnalysis` contains:
- `taxonomy`: ten individually gated rule contracts;
- `eventCandidates`: empty until a type passes validation;
- `genericWindows`: only natal-linked P2-09B windows retained by B06;
- `observedOutcomeReportIds`: explicit B02 report references only;
- `diagnostics`, status, and statement;
- `guaranteedEventsAvailable = false` and `numericProbabilityAvailable = false`.

The result is attached as a sibling downstream artifact to `CareerConclusionData`; it does not feed C11. It is projected through LifeAnalysis, ProductAnalysis, CareerViewModel, and the Career page. The UI labels generic windows as candidates and displays the unvalidated event taxonomy and evidence gaps.

## Tests

- B02-linked opportunity window retained as generic only.
- Activation without B02 natal promise is suppressed.
- Natal promise without linked activation is suppressed.
- Dasha challenge without C11 natal counter-indication is suppressed.
- Natal-linked challenge with B01 risk/activation provenance is retained as generic only.
- Missing canonical Dasha evidence suppresses a challenge window.
- Overlapping source windows remain distinct.
- All ten taxonomy entries remain unvalidated and no specific event candidate is emitted.
- Observed B02 facts remain separate.
- Deterministic output under event input permutation.
- Product mapping and Career UI labels preserve the generic/specific/observed distinction.

## Non-goals and prohibited behavior

- No guaranteed promotion, job change, business launch, interruption, recovery, peak, retirement or other event prediction.
- No numeric probability, success percentage, or statistical confidence.
- No planet-to-job-title or manifestation-mode-to-event shortcut.
- No Dasha-only event.
- No change to C11, P2-09A/P2-09B temporal authority, or A05 `asOf` resolution.
- No changes to Dasha dates or interval boundaries.
