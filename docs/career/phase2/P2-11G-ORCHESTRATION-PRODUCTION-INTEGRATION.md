# P2-11G: Production Integration Boundary for Canonical Career Orchestration

**Status:** COMPOSITION BOUNDARY PREPARED — NOT WIRED INTO PRODUCTION

**Note:** The `buildCanonicalCareerFoundation` builder exists and is tested, but no production service invokes it yet. The P2-11F blocker (profession-producer upstream inputs absent from the production path) remains unresolved. This milestone establishes the composition boundary but does not wire it into the production path.

**Production Integration Status:**
- No production caller currently invokes `buildCanonicalCareerFoundation`
- The orchestrator upstream chain (structural → graph → networks → patterns → relevance → condition) is only exercised in tests
- Profession-producer consumption of the foundation output remains deferred to a future milestone

**Test Results (local):**
- Lint: ✅ PASSED (`tsc --noEmit`)
- P2-11G integration test: ✅ 9/9 PASSED
- canonicalCareerOrchestrator.test.ts: ✅ 50/50 PASSED
- careerPatternQualification.test.ts: ✅ 78/78 PASSED
- CareerDomainInterpreterV2.test.ts: ✅ 64/64 PASSED
- canonicalCareerEvidenceMapper.test.ts: ✅ 63/63 PASSED
- **Total: 264/264 PASSED**

**Tested Commit SHA:** `39bf2d9e1281c8dd319826e37a5b34e2f8775a49`

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

### 1.3 Documented Deferred Dependencies

The following dependencies are explicitly documented as deferred:

1. **Dispositor Contexts** (`ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE`):
   - The orchestrator's `buildMechanismRefinements` requires dispositor contexts
   - `DefaultCareerDispositorContextFactory` in `src/domain/career/careerMechanism/dispositor/careerMechanismDispositorAdapter.ts` can produce dispositor contexts from a candidate + horoscope
   - Currently NOT wired in production
   - Must remain UNAVAILABLE unless explicitly enabled

2. **Cross-Stage Identity Mappings** (`ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED`):
   - Producers do not yet supply explicit identity mappings across stages (pattern → qualification → mechanism → refinement)
   - Orchestrator emits diagnostic `ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED` rather than silently emitting empty mappings
   - Identity mappings remain as an empty array `[]` in the foundation

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

**Decision:** Dispositor contexts remain an explicit deferred dependency in this milestone.

- `dispositorContexts` is NOT provided to the orchestrator
- All mechanism refinements are marked `UNRESOLVED` with status `UNAVAILABLE`
- A diagnostic `ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE` is emitted
- This is documented as a tracked gate rather than silently leaving refinements unavailable

**Future enablement:** In a future milestone, dispositor contexts can be wired via:
```typescript
const dispositorContexts = defaultCareerDispositorContextFactory.create(
  candidate,
  defaultCareerDispositorEngineAdapter,
  horoscope
);
```

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
