# Career Rule Audit Register

**Baseline SHA:** `b704d146` — frozen; audit-only, no rule logic modified.
**Scope:** every implemented career rule/evidence producer reachable in the codebase,
organized by layer. "Calculation authority" names the module that owns the verdict;
"downstream consumers" names who reads the output.

Status vocabulary: `verified` (production path + test coverage), `partial` (production
path with documented gaps), `deferred` (charter-deferred, not implemented),
`legacy` (parallel/superseded path still executing), `blocked` (gate prevents use).

---

## A. Theme-interpretation rules — `src/engine/themeInterpretation/rules/career/`

Layer: **theme-rule** (parallel legacy system). All 21 rules execute inside
`interpretCareerTheme` during `calculateHoroscope` (`astroEngine.ts:596`) and land on
`horoscope.themeInterpretationV2.career` → `fullNatalAnalysis` → theme UI panels.
**None feed `interpretCareerV2`.** Status for all: `legacy` (still rendered, not
authoritative for the canonical career conclusion). Backtest eligibility: **no** —
they are not the production reasoning path; use canonical C4–C11 outputs instead.

Common inputs: `ThemeInterpretationContext` built by `buildThemeInterpretationContext`
from `planetAnalysis`, `houseAnalysis`, `planetInterpretation`, `houseInterpretation`,
`functionalRoles`, `yogas`, `planetaryStrength`, `divisionalInterpretation` (D9/D10),
`dashaInterpretation`, `natalGrahaDrishti`. Common authority: the rule file + its
evaluator. Common output: `ThemeInterpretationEvidence` items aggregated by
`computeCareerNatalPromise` / `synthesizeCareerEvidence` into
`CareerThemeInterpretation` (`themeInterpretation.ts`).

| Rule ID | Source file | Astrological concept | Inputs consumed | Trigger / exclusion | Output semantics | Downstream consumers | Tests | Status | Backtest |
|---|---|---|---|---|---|---|---|---|---|
| CAREER_10H_STRONG_001 | careerHouseRules.ts:92 | Strong vs afflicted 10H | `evaluateHouseStatus(ctx,10)` status/effect/occupants/lord | fires when status STRONG or effect SUPPORT | PRIMARY SUPPORT evidence, strength/effect from house eval | theme conclusion, family summaries | tests/careerHouseRules.test.ts | legacy | no |
| CAREER_10H_LORD_AFFLICTION_001 | careerHouseRules.ts:119 | Strong house tempered by afflicted lord/occupant | house status + `hasAfflictedLordOrOccupant`, lordDignity | requires strong/support house AND afflicted lord/occupant | PRIMARY CHALLENGE evidence | theme conclusion | same | legacy | no |
| CAREER_10H_AFFLICTION_001 | careerHouseRules.ts:151 | Afflicted/challenged 10H | house status/effect | fires when AFFLICTED or CHALLENGE | PRIMARY CHALLENGE evidence | theme conclusion | same | legacy | no |
| CAREER_10H_OCCUPANT_001 | careerHouseRules.ts:178 | 10H occupants shape public-work expression | `h10.occupants`, house status | fires when occupants exist; effect NEUTRAL→conditional, SUPPORT/CHALLENGE per house status | SECONDARY evidence, conditional flag | theme conclusion | same | legacy | no |
| CAREER_6H_SERVICE_001 | careerHouseRules.ts:215 | 6H service/competition | `evaluateHouseStatus(ctx,6)` + `checkHouseLink(6,10)` | fires when 6H strong/afflicted OR 6H–10H linked | SECONDARY evidence; effect CHALLENGE if afflicted | theme conclusion | same | legacy | no |
| CAREER_11H_GAINS_001 | careerHouseRules.ts:247 | 11H gains/networks | `evaluateHouseStatus(ctx,11)` + `checkHouseLink(10,11)` | fires when 11H strong/afflicted OR 10H–11H linked | SECONDARY evidence | theme conclusion | same | legacy | no |
| CAREER_2H_WEALTH_001 | careerHouseRules.ts:278 | 2H accumulated wealth | `evaluateHouseStatus(ctx,2)` + `checkHouseLink(2,10)` | fires when 2H strong/afflicted OR 2H–10H linked | SECONDARY evidence | theme conclusion | same | legacy | no |
| CAREER_6H_10H_LINK_001 | careerHouseRules.ts:310 | 6H–10H structural link | `detectCareerHouseRelationships` (domain helper), lords 6/10 | fires when any relationship detected | SECONDARY SUPPORT evidence w/ relationship reason | theme conclusion | same + careerHouseRelationship tests | legacy | no |
| CAREER_10H_11H_LINK_001 | careerHouseRules.ts:338 | 10H–11H direct linkage | same mechanism, houses 10/11 | fires when linked | SECONDARY STRONG SUPPORT evidence | theme conclusion | same | legacy | no |
| CAREER_10L_DIGNITY_001 | careerLordRules.ts:15 | 10L dignity+placement (incl. functional roles, Shadbala-as-confirmation) | `evaluateHouseLord(ctx,10)` — see nuance §D | fires when lord resolvable | PRIMARY evidence, dimension NATAL_STRUCTURE | theme conclusion | tests/careerLordRules (via house tests) | legacy | no |
| CAREER_6L_10L_LINK_001 | careerLordRules.ts:66 | Single lord of 6H+10H | `getHouseLord(6)`, `getHouseLord(10)` equality | fires only when l6 === l10 | SECONDARY STRONG SUPPORT | theme conclusion | same | legacy | no |
| CAREER_10L_11L_LINK_001 | careerLordRules.ts:95 | Single lord of 10H+11H | lord equality 10/11 | fires only when l10 === l11 | SECONDARY STRONG SUPPORT | theme conclusion | same | legacy | no |
| CAREER_SUN_RELEVANCE_001 … CAREER_JUPITER_RELEVANCE_001 (5 rules) | careerPlanetRules.ts:206–296 | Natural-karaka relevance to career (Sun=authority, Saturn=karma, Mercury=commerce, Mars=drive, Jupiter=wisdom) | `evaluateKarakaPlanet`: rules10H / occupies10H / connectsTo10HOr10L (same-house-as-10L, graha drishti, received aspects) / career-yoga participation / 6-11-2-house + 10H link; dignity, functional roles, Shadbala (CONFIRMATION role only) | fires only when `isRelevant`; Venus/Moon have NO karaka rule (not in CAREER_KARAKA_DEFINITIONS) | SECONDARY evidence; effect SUPPORT unless dignity CHALLENGE→conditional | theme conclusion | tests/careerPlanetRules.test.ts | legacy | no |
| CAREER_ASPECT_10H_001 | careerAspectRules.ts:12 | Graha drishti aspects received by 10H | `evaluateAspectOnHouse(ctx,10)` | fires per aspecting planet when aspects exist | SECONDARY evidence per aspect, dimension MODIFIER | theme conclusion | tests (aspect evaluator suite) | legacy | no |
| CAREER_YOGA_CONFIRMATION_001 | careerYogaRules.ts:12 | Career-relevant yoga participation | `evaluateCareerYogas(ctx)` | fires per detected career yoga | CONFIRMATORY evidence, dimension CONFIRMATION | theme conclusion; upgrades SUPPORTED→STRONGLY_SUPPORTED in synthesis | yoga evaluator tests | legacy | no |
| CAREER_D10_CONFIRMATION_001 | careerVargaRules.ts:45 | Introductory D10 confirmation of 10H promise | `evaluateD10VargaConfirmation(ctx, natalPromise)`; `divisionalInterpretation.d10` required | always emits when D10 present (even UNAVAILABLE relationship, for traceability); runs AFTER non-D10 rules with natalPromise injected | CONFIRMATORY evidence; MODIFIES→conditional | theme conclusion; can downgrade STRONGLY_SUPPORTED on D10 conflict | tests/careerD10Integration.test.ts (theme) | legacy | no |
| CAREER_DASHA_TIMING_001 | careerDashaRules.ts:12 | Active MD/AD/PD lord activating natal career factors | `evaluateCareerDashaTiming(ctx)` (dashaEvaluator) | fires per active period lord with relevance reason | TIMING evidence, conditional, NEUTRAL effect | theme conclusion (timing layer only) | dasha evaluator tests | legacy | no |

**Evaluators shared by theme rules** (`src/engine/themeInterpretation/evaluators/`):
`houseEvaluator`, `lordEvaluator`, `placementEvaluator`, `dignityEvaluator`,
`functionalRoleEvaluator`, `strengthEvaluator` (Shadbala), `aspectEvaluator`,
`yogaEvaluator`, `vargaEvaluator`, `dashaEvaluator`. These are consumed ONLY by the
theme layer (plus `careerHouseRelationship` domain helper) — see nuance §D.

## B. C-domain contracts — `src/domain/career/` (canonical production path)

Layer: **C-domain contract**. All feed `interpretCareerV2` per GATE-A-CALL-GRAPH.md.
Rule/evidence IDs are dynamic namespaces (e.g. `CAREER_LORD_*`, `CAREER_HOUSE_*`,
`C4_STRUCTURAL_*`, `C9_DASHA_*`, `C10_D10_*`, `CAREER_D10:*`, `CAREER_D10_QUAL:*`);
counts below are emitted-ID families, not single rules.

| Contract module | Source file(s) | Astrological concept | Inputs consumed | Authority / trigger | Output semantics | Downstream consumers | Tests | Status | Backtest |
|---|---|---|---|---|---|---|---|---|---|
| C4–C7 natal convergence | careerNatalConvergence.ts (+ careerStructuralReasoning*, careerGraph/, careerPattern/, careerPlanetaryRelevance*, careerPlanetaryCondition*) | Structural promise: houses, lords, relationships, networks, pattern qualification, planetary relevance/condition | Horoscope facts (houses, signs, lords, drishti, dignity, strength, combustion, motion) | Structural direction/strength + evidence[]; UNAVAILABLE/NEUTRAL propagate honestly | Natal analysis (structural/relevance/condition/evidence) | Foundation builder (preComputedInputs), C9, C10, C11, mapper, axes | extensive *.test.ts per module | verified | yes (natal layer) |
| Planetary condition | careerPlanetaryCondition.ts + Integration | Per-planet condition (dignity, combustion, motion, house context) | planet facts, house, dignity, combustion state, motion | Emits condition enum per planet; missing → UNAVAILABLE/INSUFFICIENT_DATA | Condition facts feeding relevance/foundation | Foundation, C8–C11 | careerPlanetaryCondition*.test.ts | verified | yes |
| Planetary relevance | careerPlanetaryRelevance.ts + Integration | Which planets are career-relevant and how | houses owned/occupied, 10H/10L links, aspects | Relevance classification per planet | Relevance layer of natal analysis | Foundation, C8 | careerPlanetaryRelevance*.test.ts | verified | yes |
| Structural reasoning | careerStructuralReasoning.ts + Integration | Direction/strength verdict from primary factors | house/lord/occupant/aspect facts | Produces CareerStructuralDirection (SUPPORT/CHALLENGE/MIXED/NEUTRAL/UNAVAILABLE) + strength | structural.primarySupport/primaryChallenge → D10 context, C11 | Foundation, C10 context, C11 | careerStructuralReasoning*.test.ts | verified | yes |
| House/lord relationship semantics | careerHouseRelationship.ts, careerHouseRelationshipSemantics.ts, careerLordRelationship*.ts | Lord-to-lord / lord-to-house relationships (incl. dusthana handling per P2-06B) | house lords, graha drishti, occupants | `detectCareerHouseRelationships` predicate set | Relationship records feeding structural + theme-link rules | Structural reasoning, theme house-link rules | dedicated semantics/negative-suite tests | verified | yes |
| Graph + house networks | careerGraph/ (careerAstroGraph*, careerHouseNetwork*, careerNetworkDetection*) | Career-relevant graph topology and network detection | structural facts | Graph facts + detected networks | Graph/network facts → pattern classification | Foundation, patterns | careerGraph.test.ts, network tests | verified | partial (derived) |
| Pattern classification | careerPattern/ (classification, predicates, yoga detector, kendra/trikona, dusthana validation) | Career yoga/pattern qualification with negative suite | graph facts, relationships, planetary condition | Qualified/unqualified patterns w/ provenance; dusthana transformation rules | Qualified pattern set → mechanism candidates | Foundation → C8 mechanisms | extensive pattern test suite | verified | yes |
| Dispositor model | careerDispositor/ + careerMechanism/dispositor/ | Dispositor-chain refinement (P2-04/P2-07E) | lord chains, house ownership | Two-pass refinement when `enableDispositorContexts` | mechanismRefinements → C8 | Foundation builder, C8 | dispositor adapter tests | partial (two-pass, gated) | yes |
| Mechanism model + resolver | careerMechanism/ (registry, types, resolver/), career10h/ | Mechanism candidates from qualified patterns; 10H/10L foundations | patterns, graph, houses, supplements | `resolvedMechanisms` + supplements (10H COMPLETE-gated, 10L resolvable) | CareerMechanismCandidate[] → C8 | C8 resolver, profession engine | mechanism resolver tests | verified | yes |
| C8 expression | careerExpression/careerExpressionRules.ts + defaultCareerExpressionResolver.ts + adapters | Expression modes/types resolved from mechanisms + 10H/10L | mechanism candidates, refinements, foundations | Resolver → canonical result; `adaptMechanismExpressionToLegacy` → legacy shape; explicit unavailable when no mechanisms (no natal fallback) | expressions[] consumed by C9/C10/C11 + profession | C9, C10, C11, mapper, profession | careerExpression*.test.ts | verified | yes |
| C9 dasha activation | careerDasha/careerDashaIntegration.ts (+ Activation, PlanetaryRules/Synthesis/Scoring, Rules, D10Context) | Vimshottari MD/AD/PD activation of natal career promise | horoscope dasha timeline, natal, expression, `temporalState.dashaInterpretation` | Level hierarchy w/ diagnosticTrace; condition assessment per level | canonicalDashaAnalysis (levels, evidence, hierarchy) | C11, mapper, trajectory/events, outcome, timeline, trace | careerDasha*.test.ts | verified | yes (with locked ephemeris) |
| C10 d10 qualification | careerD10/careerD10Qualification*.ts + careerD10Integration.ts | D10 divisional qualification of natal promise + per-expression qualification | D10 chart facts (houses/planets/conditions), natal direction/strength, C8 expressions | Gates: UNAVAILABLE→early, !hasNatalCareerPromise→INSUFFICIENT_DATA, !d10Available→UNAVAILABLE; then resolveD10Direction/Effect/Strength; canonical evidence + conflicts + expressionQualifications | CareerD10CanonicalAnalysis (relationship, evidence, expressionQualifications) | C11, mapper (VARGA_CONFIRMATION), profession engine, vargaConfirmation | careerD10*.test.ts (extensive) | partial — see Gate A §4 NEUTRAL divergence | yes |
| C11 final synthesis | careerFinalSynthesis/careerFinalSynthesisIntegration.ts + Types | Authoritative career conclusion from C4–C10 + timing | natal, expression, dasha, d10, timing synthesis | Two-pass build (preliminary for mapper, final with timing); invariants C11-INV-* | CareerFinalSynthesisResult (direction/strength/status/confidence/evidenceIds) | conclusion, mapper validation, axes, trajectory, profession (natalPromiseDirection), outcome, timeline | careerFinalSynthesis*.test.ts, golden acceptance | verified | yes |
| Canonical evidence mapper | canonicalCareerEvidenceMapper.ts | Single evidence assembly C4–C10 → DomainEvidence | all canonical analyses + preliminary C11 | identityKey dedup; phase mapping; C11 reference validation; unmappable strengths excluded | evidence[] + c11Validation + contradictory/root validation | everything downstream in interpreter | canonicalCareerEvidenceMapper.test.ts | verified | yes |
| Evidence continuity | evidenceContinuity.ts | Identity/provenance/reference/counting continuity | evidence, C11 ids, c11Validation, upstreamSourceIds, contradictions | Throws on invalid (hard boundary); injectable via options.continuityValidator (test seam) | EvidenceContinuityReport | acceptance boundary | continuity tests in interpreter suites | verified | yes |
| CW-01 reasoning hierarchy | careerReasoningHierarchy.ts | Legacy-shaped reasoning trace/hierarchy over canonical evidence | evidence, d10Confirmation, dashaTimings, transit, conflicts | Produces trace + compatibility manifestations + timing confidence | reasoningTrace (version CW-01), manifestations mode list | DomainInterpretation.reasoningTrace, conclusion adapter | careerReasoningHierarchy.test.ts | legacy (trace layer) | partial |
| CW-09 dasha synthesis | careerDasha/careerDashaSynthesis.ts | Weighted dasha scoring (legacy) | dashaInterpretation, d10Context | Weighted combined effect; scores must not render in UI | careerDashaSynthesis → timing synthesis, AI context, reconciliation | careerTimingSynthesis inputs, conclusionData | careerDashaSynthesis.test.ts | legacy | no |
| Timing synthesis | domain/timing/careerWealthTiming/ (careerTransitSynthesis, careerTimingSynthesis types) | Transit + timing overlay on natal/dasha | horoscope forecast context, careerDashaSynthesis | Requires valid asOf forecast context else INSUFFICIENT_DATA fields | CareerTimingSynthesis → C11 pass 2 | C11 final | careerWealthTiming tests | verified | partial |
| Trajectory | careerTrajectory/careerTrajectoryEngine.ts | Career trajectory projection from C11 + evidence | finalSynthesis, evidence set | Downstream consumer only; does not feed C11 | careerTrajectory | careerEvents, outcome, timeline, conclusionData | careerTrajectoryEngine.test.ts | verified | yes |
| Events | careerEvents/careerEventEngine.ts | Career event windows from trajectory + C9 | trajectory, canonicalDashaAnalysis | Downstream only | careerEvents | outcome, timeline, conclusionData | careerEventEngine.test.ts | verified | yes |
| Profession analysis | careerProfession/ (careerProfessionEngine.ts, Rules, Ranking) | Profession domain candidates ranked with D10 qualification + B04 ranking | C8 canonical result, mechanism candidates, 10H/10L foundations, canonicalD10, domainEvidence, natalPromiseDirection | Fail-soft try/catch → professionAnalysisFailure diagnostic; D10 status per candidate (QUALIFIED/PARTIAL/CONFLICTED/UNAVAILABLE/NOT_PROVIDED) | CareerProfessionAnalysis → conclusionData | product/AI projections | careerProfession*.test.ts | verified | yes |
| Outcome qualification (B02) | careerOutcomeQualification/careerOutcomeEngine.ts | Qualify candidate windows vs observed outcomes | axes, C11, trajectory, events, dasha, profession, observedCareerOutcomes | No outcome inferred from chart; observed facts passed through | careerOutcomeAnalysis | event timeline, conclusionData | careerOutcomeEngine.test.ts | verified | yes |
| Event timeline (B06) | careerEventTimeline/careerEventTimelineEngine.ts | Generic event windows linked to natal promise + canonical dasha | axes, C11, trajectory, events, dasha, outcomeAnalysis | Event-specific taxonomy gated OFF pending evidence contract | careerEventTimeline | conclusionData | careerEventTimelineEngine.test.ts | partial (taxonomy deferred) | yes |
| Analytical axes (B01) | careerFinalSynthesis/careerAnalyticalAxes.ts | Orthogonal axis projections beside C11 | natal, dasha, d10, finalSynthesis | Sibling projection; C11 contract unchanged | careerAnalyticalAxes | outcome, timeline, conclusionData | careerAnalyticalAxes.test.ts | verified | yes |
| Orchestration foundation | orchestration/canonicalCareerFoundationBuilder.ts (+ canonicalCareerOrchestrator.ts, portsAdapter, contracts, validation) | Single composition point running upstream chain once | horoscope + preComputedInputs | Composes structural→graph→networks→patterns→relevance→condition→10H/10L→orchestrator; no re-derivation | CanonicalCareerFoundation (resolvedMechanisms, supplements, refinements, diagnostics, quarantine) | C8 inputs, internalArtifacts | canonicalCareerFoundationBuilder.test.ts, orchestrator tests | verified | n/a (composition) |
| Semantic source registry | careerSemanticSourceRegistry.ts | Registry of canonical source/rule identities for traceability | static registry | Inventory/validation of source IDs | registry consulted by semantic inventory tests | tests, provenance checks | careerSemanticSourceInventory.test.ts | verified | n/a |

## C. Deferred pattern families — charter §27 (`docs/career/phase2/P2-00-CAREER-INTELLIGENCE-CHARTER.md`)

All `deferred`; none implemented in the production path:

| Family | Status | Notes |
|---|---|---|
| Jaimini | deferred | incl. Jaimini karakas generally |
| Atmakaraka (AK) | deferred | |
| Amatyakaraka (AMK) | deferred | |
| Karakamsha / A10 | deferred | |
| Arudha Lagna | deferred | |
| Argala | deferred | |
| Nakshatra refinement (as pattern family) | deferred | nakshatra used only for dasha anchors/padas |
| Narayana dasha | deferred | only Vimshottari implemented (`dasha/vimshottari.ts`) |
| Chara dasha | deferred | |
| D9 implementation | deferred | charter: "D9 cannot independently create natal Career promise … deferred to a later P2 wave"; C10 uses D10 only |
| Specialized profession ontology / complex Raja Yoga taxonomy | deferred | profession engine uses mechanism/expression modes instead |

## D. Recorded nuances (verified at b704d146)

1. **Shadbala as CONFIRMATION:** in the theme layer, `evaluateHouseLord`
   (`evaluators/lordEvaluator.ts:160–166`) and `evaluateKarakaPlanet`
   (`careerPlanetRules.ts:136–142`) push a `Shadbala Strength` factor with
   `role: 'CONFIRMATION'` **only when `strengthFacts.available`** — it annotates,
   never sets effect/strength. In the C-domain, planetary condition treats
   combustion/motion as **required dimensions** (missing → not silently neutral).
2. **Functional-role logic in lordEvaluator** (`lordEvaluator.ts:100–135`):
   Yogakaraka can upgrade a conditional placement to SUPPORT/STRONG or force
   NEUTRAL/MODERATE under adverse dignity/placement; Lagna lord adds a
   CONFIRMATION factor; Dusthana/Maraka/Badhaka lordship marks the factor CONFLICT
   and makes SUPPORT conditional. This logic exists **only** in the theme layer —
   the C-domain dispositor/functional-role model is separate (careerMechanism/
   careerDispositor).
3. **`src/engine/yoga/lakshmiYoga.ts` exists** and is registered in `yogaEngine.ts`
   (line 18/31) as a general yoga detector, but **no career rule consumes it** —
   `evaluateCareerYogas` (career yogaEvaluator) uses its own career-relevant yoga
   set. Lakshmi Yoga therefore has no career-path consumer.
4. **D10 label divergence:** see GATE-A-CALL-GRAPH.md §4 — `resolveD10Effect`'s
   NEUTRAL arms are unreachable behind `hasNatalCareerPromise`; report only.
5. **Transit evidence deferred:** no canonical transit producer exists; the
   interpreter filters `phase === 'TRANSIT_TRIGGER' || source === 'TRANSIT'` which
   currently yields empty → `NO_MATERIAL_TRIGGER` (comments lines 589–595).
6. **Selected-period builder (PBA-07)** prepared but not wired (API-only status,
   comments lines 346–361).
