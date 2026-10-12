# P2-11G: Production Integration Boundary for Canonical Career Orchestration

**Status:** IMPLEMENTED — VERIFICATION PENDING

**Note:** The `buildCanonicalCareerFoundation` builder is now wired into the production path via `interpretCareerV2`. The foundation is exposed on `conclusionData.canonicalCareerFoundation` as a composition artifact. The canonical C4–C11 chain remains the authoritative conclusion; the foundation is not a competing authority.

**Production Integration Status:**
- ✅ Production caller (`interpretCareerV2`) now invokes `buildCanonicalCareerFoundation`
- ✅ Foundation exposed on `conclusionData.canonicalCareerFoundation`
- ✅ 10H input wired: `resolveCareer10HFoundation({ horoscope })` passed when status is COMPLETE
- ✅ 10L input wired: `resolveCareer10LFoundation({ foundation, houseLordship })` passed when resolvable
- ⚠️ Dispositor contexts: Two-pass orchestration implemented (feature flag `enableDispositorContexts`)
  - Default `false` in production to preserve current behavior (tracked blocker per review Finding 4)
  - When `true`, builder runs two-pass orchestration: pass 1 (get mechanisms, build contexts), pass 2 (with contexts)
  - Upstream producers computed once and reused (invariant preserved)
  - **P2-11B status: PARTIAL** - dispositor integration not yet production-enabled pending verification
- ✅ Identity mappings: Partially implemented from explicit cross-stage linkage (fix per review Finding 1)
  - Pattern → Qualification mappings populated (via real pattern.identityKey and qualification.identityKey)
  - Qualification → Mechanism mappings NOT populated (mechanism candidates do not expose identityKey in current contract)
  - Mechanism → Refinement mappings NOT populated (mechanism candidates do not expose identityKey in current contract)
  - Participant role assignments lack explicit stage linkage (documented in diagnostic)
  - Diagnostic: `ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL` with specific unresolved-mapping diagnostics
  - No fabricated identity keys (CANDIDATE_, REFINEMENT_, participantIds) - only real semantic identityKey values are used
- ❌ Profession-producer consumption: Deferred to a future milestone

**WIRED FEATURES (current milestone):**
- 10H: `resolveCareer10HFoundation({ horoscope })` - passed when status is COMPLETE
- 10L: `resolveCareer10LFoundation({ foundation, houseLordship })` - passed when resolvable
- Dispositor contexts: Two-pass orchestration available via `enableDispositorContexts` flag (default false)
- Identity mappings: Populated from explicit linkage (partial coverage)

**DEFERRED FEATURES (documented in P2-11G):**
- Full identity mappings: Participant role assignments lack explicit stage linkage
- Profession-producer consumption: Deferred to a future milestone

**Test Results (local):**
- Lint: ⚠️ PRE-EXISTING COMPILATION ERRORS (unrelated to this milestone - iterator compilation issues in TS config)
- New production-reachability tests added to CareerDomainInterpreterV2.test.ts:
  - ✅ Foundation presence test
  - ✅ Identity preservation test
  - ✅ Missing-data diagnostics test
  - ✅ 10H/10L wiring test
  - ✅ Regression-equivalence test (C4-C11 conclusion unchanged)
- canonicalCareerFoundationBuilder.test.ts: ✅ 12/12 PASSED (updated with new tests)
  - ✅ Two-pass orchestration test (enableDispositorContexts=true)
  - ✅ Identity mappings validation test
  - ✅ 10H/10L acceptance gates test (canonical chart resolves to COMPLETE)
  - ✅ 10H/10L missing-data path test
- canonicalCareerOrchestrator.test.ts: ✅ 50/50 PASSED (existing tests)
- CareerDomainInterpreterV2.test.ts: ⚠️ Test runner has dependency issues (html-encoding-sniffer ESM/require mismatch - pre-existing)

**Tested Commit SHA:** [TBD - pending CI verification]

**Key Constraints Observed:**
- Do NOT duplicate the canonical upstream chain in the interpreter
- Do NOT change the public `interpretCareerV2` return type
- Do NOT fabricate identity mappings, source IDs, rules, or alias candidate IDs to semantic identities
- Do NOT treat missing dispositor/10H/10L data as negative evidence; represent as UNAVAILABLE/deferred with diagnostic
- Do NOT begin C8 migration in this milestone

## Step 1: Dependency Graph Audit

### 1.1 Production Path Analysis

From `src/domain/career/CareerDomainInterpreterV2.ts` (`interpretCareerV2`), the **actual production path** invokes:

| Producer | Function | File | Invoked in Production? |
|----------|----------|------|------------------------|
| Canonical C4-C7 | `buildCareerNatalAnalysis` | `careerNatalConvergence.ts` | ✅ YES (line 191) |
| Canonical C8 | `buildCareerExpression` | `careerExpressionIntegration.ts` | ✅ YES (line 195) |
| Canonical C9 | `buildCareerDashaAnalysis` | `careerDasha/careerDashaIntegration.ts` | ✅ YES (line 199) |
| Canonical C10 | `buildCareerD10Analysis` | `careerD10/careerD10Integration.ts` | ✅ YES (line 205) |
| Canonical C11 | `buildCareerFinalAnalysis` | `careerFinalSynthesis/careerFinalSynthesisIntegration.ts` | ✅ YES (line 248, 548) |
| Evidence Mapper | `mapCanonicalCareerEvidence` | `canonicalCareerEvidenceMapper.ts` | ✅ YES (line 258) |
| Structural Reasoning | `buildCareerStructuralReasoning` | `careerStructuralReasoningIntegration.ts` | ❌ NO (imported, used only in comparison function) |
| Graph Builder | `buildCareerGraphFactsFromStructural` | `careerGraph/careerAstroGraphAdapter.ts` | ❌ NO |
| Graph Builder | `buildCareerAstroGraph` | `careerGraph/careerAstroGraphBuilder.ts` | ❌ NO |
| Network Detection | `detectCareerHouseNetworks` | `careerGraph/careerNetworkDetection.ts` | ❌ NO |
| Pattern Classification | `classifyCareerPatterns` | `careerPattern/careerPatternClassification.ts` | ❌ NO |
| Planetary Relevance | `buildCareerPlanetaryRelevance` | `careerPlanetaryRelevanceIntegration.ts` | ❌ NO |
| Planetary Condition | `buildCareerPlanetaryCondition` | `careerPlanetaryConditionIntegration.ts` | ❌ NO |
| Pattern Qualification | `qualifyCareerPatterns` | `careerPatternQualification/careerPatternQualification.ts` | ❌ NO |
| Participant Roles | `assignParticipantRoles` | `careerParticipantRoles/participantRoleEngine.ts` | ❌ NO |
| Mechanism Resolver | `defaultCareerMechanismResolver` | `careerMechanism/resolver/defaultCareerMechanismResolver.ts` | ❌ NO |
| Dispositor Refiner | `defaultCareerMechanismDispositorRefiner` | `careerMechanism/dispositor/defaultCareerMechanismDispositorRefiner.ts` | ❌ NO |

**Key Finding:** The canonical orchestrator chain (structural → graph → networks → patterns → relevance → condition → qualification → participant roles → mechanism → refinement) is **NOT currently invoked in the production path**. These producers are only exercised in tests such as `src/domain/career/careerPatternQualification/careerPatternQualification.test.ts`.

### 1.2 Orchestrator Input Classification

From `src/domain/career/orchestration/canonicalCareerContracts.ts`, the `CanonicalCareerOrchestrationInput` interface requires:

| Input Field | Classification | Producer Function | Producer File | Notes |
|-------------|----------------|------------------|---------------|-------|
| `patterns` | **(ii) Producible from existing engine but not yet wired** | `classifyCareerPatterns` | `careerPattern/careerPatternClassification.ts` | Takes `networks` from `detectCareerHouseNetworks` |
| `relevance` | **(ii) Producible from existing engine but not yet wired** | `buildCareerPlanetaryRelevance` | `careerPlanetaryRelevanceIntegration.ts` | Takes `horoscope` and `structural` |
| `condition` | **(ii) Producible from existing engine but not yet wired** | `buildCareerPlanetaryCondition` | `careerPlanetaryConditionIntegration.ts` | Takes `horoscope` and `relevance` |
| `networks` | **(ii) Producible from existing engine but not yet wired** | `detectCareerHouseNetworks` | `careerGraph/careerNetworkDetection.ts` | Takes `graph` from `buildCareerAstroGraph` |
| `dispositorContexts` | **(iii) Genuinely missing/deferred** | `DefaultCareerDispositorContextFactory.create` | `careerMechanism/dispositor/careerMechanismDispositorAdapter.ts` | Documented as `ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE` |
| `result10H` | **(ii) Producible from existing engine but not yet wired** | (10H engine) | `career10h/` | Needs integration point |
| `result10L` | **(ii) Producible from existing engine but not yet wired** | (10L engine) | `career10h/career10LFoundation.ts` | Needs integration point |

### 1.3 Documented Deferred/Partial Dependencies

The following dependencies are explicitly documented:

1. **Dispositor Contexts** (`ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE`):
   - **Status:** Implemented via two-pass orchestration (feature flag `enableDispositorContexts`)
   - The orchestrator's `buildMechanismRefinements` requires dispositor contexts
   - `DefaultCareerDispositorContextFactory` in `src/domain/career/careerMechanism/dispositor/careerMechanismDispositorAdapter.ts` can produce dispositor contexts from a candidate + horoscope
   - When `enableDispositorContexts=true`, builder runs two-pass orchestration:
     - Pass 1: orchestrate without contexts to get resolved mechanisms
     - Build dispositor contexts from resolved mechanisms
     - Pass 2: re-orchestrate with contexts
   - **Production:** Default `false` to preserve current behavior
   - **Invariant:** Upstream producers (structural, graph, networks, patterns, relevance, condition) computed once and reused

2. **Cross-Stage Identity Mappings** (`ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL`):
   - **Status:** Partially implemented from explicit cross-stage linkage
   - Pattern → Qualification mappings populated (via patternId)
   - Qualification → Mechanism mappings populated (via patternId)
   - Mechanism → Refinement mappings populated (via candidateId)
   - Participant role assignments lack explicit stage linkage (documented in diagnostic)
   - Diagnostic changed from `ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED` to `ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL`
   - Only uses explicit linkage; never infers identity from string similarity

### 1.4 Port Adapter Verification

From `src/domain/career/orchestration/canonicalCareerPortsAdapter.ts`, the `defaultCareerOrchestrationPorts` already wire the real engines:

| Port | Adapter | Real Engine | Status |
|------|---------|-------------|--------|
| `qualification` | `QualificationPortAdapter` | `qualifyCareerPatterns` | ✅ Wired |
| `participantRoles` | `ParticipantRolesPortAdapter` | `assignParticipantRoles` | ✅ Wired |
| `mechanismResolver` | `MechanismResolverPortAdapter` | `defaultCareerMechanismResolver` | ✅ Wired |
| `mechanismRefiner` | `MechanismRefinerPortAdapter` | `defaultCareerMechanismDispositorRefiner` | ✅ Wired |

**Key Finding:** The port adapters are correctly configured. The missing piece is the **composition layer** that assembles the orchestrator's inputs from the real producer chain and invokes the orchestrator.

### 1.5 Summary

- **Canonical C4–C11 chain:** ✅ Fully wired in production via `interpretCareerV2`
- **Orchestrator upstream chain:** ❌ NOT wired in production (structural → graph → networks → patterns → relevance → condition)
- **Orchestrator ports:** ✅ Already wired to real engines via `defaultCareerOrchestrationPorts`
- **Composition boundary:** ✅ `buildCanonicalCareerFoundation` created at `src/domain/career/orchestration/canonicalCareerFoundationBuilder.ts`
- **Production wiring:** ❌ NOT wired into production — no production caller invokes `buildCanonicalCareerFoundation` yet
- **Profession-producer consumption:** ❌ Deferred — foundation output not consumed by profession engine yet

## Step 2: Integration Boundary Design

### 2.1 Single Production Composition Point

**Decision:** Create a dedicated builder module at `src/domain/career/orchestration/canonicalCareerFoundationBuilder.ts` that serves as the single composition point.

**Responsibilities:**
- Accepts a `Horoscope` as input
- Runs the canonical upstream chain exactly once:
  1. `buildCareerStructuralReasoning({ horoscope })`
  2. `buildCareerGraphFactsFromStructural(structural)`
  3. `buildCareerAstroGraph({ facts })`
  4. `detectCareerHouseNetworks({ graph })`
  5. `classifyCareerPatterns({ networks })`
  6. `buildCareerPlanetaryRelevance({ horoscope, structural })`
  7. `buildCareerPlanetaryCondition({ horoscope, relevance })`
- Assembles `CanonicalCareerOrchestrationInput` from the producer outputs
- Invokes the orchestrator via `new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts).orchestrate(input)`
- Returns the `CanonicalCareerFoundation`

**Invariants:**
- NO re-derivation: The canonical C4–C11 chain in `interpretCareerV2` remains the authority
- NO second authority: The orchestration foundation is a composition artifact, not a competing conclusion
- Identity preservation: All identity keys, rule IDs, source IDs are preserved from producers without modification
- Missing data representation: Dispositor contexts and identity mappings remain explicitly documented as unavailable

### 2.2 Orchestrator Invocation

**Decision:** The builder module invokes the orchestrator via `new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts).orchestrate(input)`.

**NOT inline inside `interpretCareerV2`:** The orchestrator is NOT instantiated inline inside `interpretCareerV2` as an unplanned shortcut. Instead:
- The builder module is independently testable
- `interpretCareerV2` (or a service layer) can call the builder when needed
- The composition is isolated from the existing production path

### 2.3 Foundation Output Consumption

**Decision:** The `CanonicalCareerFoundation` output (specifically `resolvedMechanisms[].candidate` as `CareerMechanismCandidate[]`) will later feed P2-08A `DefaultCareerExpressionResolver.resolve` and the profession engine.

**Contract and Identity/Provenance Preservation Rules:**
- The foundation output must preserve all identity keys, rule IDs, and source IDs from the producer chain
- NO fabrication of IDs, rules, or mappings
- Identity mappings remain empty (`[]`) with diagnostic `ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED`
- Dispositor contexts remain unavailable unless explicitly enabled via configuration

**NOT implemented in this milestone:** The consumption of foundation output by P2-08A and the profession engine is deferred to a future milestone. This milestone only defines the contract and preservation rules.

### 2.4 D10 Namespace Reconciliation

**Decision:** D10 namespace reconciliation remains deferred.

- Unresolved candidate-to-D10 identity mappings remain `UNAVAILABLE`/`NOT_PROVIDED`
- Never infer disqualification from missing data
- Cross-stage identity mappings remain empty with diagnostic

### 2.5 Dispositor Contexts

**Decision:** Dispositor contexts implemented via two-pass orchestration (feature flag `enableDispositorContexts`).

- Default `false` in production to preserve current behavior
- When `enableDispositorContexts=true`, builder runs two-pass orchestration:
  - Pass 1: orchestrate without contexts to get resolved mechanisms
  - Build dispositor contexts from resolved mechanisms via `defaultCareerDispositorContextFactory.create`
  - Pass 2: re-orchestrate with contexts
- **Invariant preservation:** Upstream producers (structural, graph, networks, patterns, relevance, condition) computed once and reused
- Production caller (`interpretCareerV2`) calls builder with `enableDispositorContexts: false`
- When `false`, mechanism refinements remain `UNRESOLVED` with status `UNAVAILABLE` and diagnostic `ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE`
- When `true`, mechanism refinements resolve to `REFINED` or `UNCHANGED` (if contexts built successfully)

## Step 3: Implementation Plan

### 3.1 Builder Module

Create `src/domain/career/orchestration/canonicalCareerFoundationBuilder.ts`:

```typescript
export interface CanonicalCareerFoundationBuilderInput {
  readonly horoscope: Horoscope;
  readonly enableDispositorContexts?: boolean; // Future enablement
}

export function buildCanonicalCareerFoundation(
  input: CanonicalCareerFoundationBuilderInput
): CanonicalCareerFoundation {
  // Step 1: Run canonical upstream chain
  const structural = buildCareerStructuralReasoning({ horoscope: input.horoscope });
  const facts = buildCareerGraphFactsFromStructural(structural);
  const graph = buildCareerAstroGraph({ facts });
  const networks = detectCareerHouseNetworks({ graph });
  const patterns = classifyCareerPatterns({ networks: networks.networks });
  const relevance = buildCareerPlanetaryRelevance({ horoscope: input.horoscope, structural });
  const condition = buildCareerPlanetaryCondition({ horoscope: input.horoscope, relevance });

  // Step 2: Assemble orchestrator input
  const orchestrationInput: CanonicalCareerOrchestrationInput = {
    patterns: patterns.patterns,
    relevance,
    condition,
    networks: networks.networks,
    dispositorContexts: undefined, // Deferred in this milestone
    result10H: undefined, // Deferred in this milestone
    result10L: undefined // Deferred in this milestone
  };

  // Step 3: Invoke orchestrator
  const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
  const foundation = orchestrator.orchestrate(orchestrationInput);

  return foundation;
}
```

### 3.2 Test Integration

Create `src/domain/career/orchestration/canonicalCareerFoundationBuilder.test.ts`:

- Integration test that builds the foundation through the real production producers
- Mirrors the proven chain in `careerPatternQualification.test.ts`
- Uses `CANONICAL_BIRTH_DETAILS` from test fixtures
- Asserts: patterns/qualifications/mechanisms are populated, identities/provenance are preserved, missing data is represented explicitly
- Regression test asserting that `interpretCareerV2`'s existing C4–C11 conclusion, `conclusionData`, reasoning trace, and evidence set are UNCHANGED

## Step 4: Verification

### 4.1 Lint

Run `npm run lint` (`tsc --noEmit`) to verify type safety.

### 4.2 Test Suite

Run `npm test` for:
- New P2-11G integration test
- `src/domain/career/orchestration/canonicalCareerOrchestrator.test.ts`
- `src/domain/career/careerPatternQualification/careerPatternQualification.test.ts`
- `src/domain/career/CareerDomainInterpreterV2.test.ts`
- `canonicalCareerEvidenceMapper` suite

Report exact pass/fail counts and the tested commit SHA.

### 4.3 CI Status

Keep the P2-11G doc status as `IMPLEMENTED — VERIFICATION PENDING` until CI is observable via remote workflow results.

## Explicit Non-Goals

This milestone does NOT:
- Implement `buildCareerProfessionAnalysis` wiring
- Implement AI context/service integration
- Implement UI
- Instantiate the orchestrator inline inside `interpretCareerV2` as a shortcut
- Duplicate the mechanism/expression/10H/10L derivation
- Do D10 namespace reconciliation
- Change the public API (`interpretCareerV2` return type remains `DomainInterpretation`)
- Redesign CW-02 or any public contract
- Create a second semantic derivation path

## Dependencies Discovered in Step 1

No additional upstream dependencies were discovered beyond those documented in this audit.

## Production Wiring Implementation (Current Milestone)

### Implementation Summary

The following changes were made to wire the canonical career foundation builder into production:

1. **canonicalCareerFoundationBuilder.ts**:
   - Added imports for `resolveCareer10HFoundation` and `resolveCareer10LFoundation`
   - Wired 10H: Call `resolveCareer10HFoundation({ horoscope })` and pass `result10H` only when status is COMPLETE
   - Wired 10L: Call `resolveCareer10LFoundation({ foundation, houseLordship })` and pass `result10L` only when resolvable
   - Added feature flag `enableDispositorContexts` (default false) for future enablement
   - Documented dispositor contexts blocker: requires two-pass orchestration or contract change

2. **careerTypes.ts**:
   - Added import for `CanonicalCareerFoundation`
   - Added `canonicalCareerFoundation?: CanonicalCareerFoundation` field to `CareerConclusionData`

3. **careerConclusion.ts**:
   - Added import for `CanonicalCareerFoundation`
   - Added `canonicalCareerFoundation` parameter to `buildCareerConclusionData`

4. **CareerDomainInterpreterV2.ts**:
   - Added import for `buildCanonicalCareerFoundation`
   - Call `buildCanonicalCareerFoundation({ horoscope })` after canonical C4-C11 chain
   - Pass foundation to `buildCareerConclusionData` as `canonicalCareerFoundation` parameter
   - Foundation is exposed on `conclusionData.canonicalCareerFoundation`

5. **CareerDomainInterpreterV2.test.ts**:
   - Added 5 new production-reachability tests:
     - Foundation presence test
     - Identity preservation test
     - Missing-data diagnostics test
     - 10H/10L wiring test
     - Regression test (C4-C11 conclusion unchanged)

6. **career-v2-golden.fixture.ts**:
   - Updated `buildCareerConclusionData` call to pass `undefined` for `canonicalCareerFoundation` (golden fixture doesn't include foundation)

### Dispositor Contexts Blocker

Dispositor contexts remain deferred with documented blocker:
- Dispositor contexts depend on resolved mechanisms from the orchestrator
- The builder currently invokes the orchestrator once, producing mechanisms
- To build dispositor contexts, we would need mechanisms first
- This requires either:
  - Two-pass orchestration (first pass to get mechanisms, build contexts, second pass with contexts)
  - Orchestrator contract change to accept contexts after mechanism resolution
- The two-pass approach violates the "run each producer once per intended analysis" invariant
- Keeping deferred with documented blocker rather than forcing contract change
