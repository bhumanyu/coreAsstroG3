# PLAYBOOK — Planning and Safely Making Changes

This document is the single reference for contributors to understand which layer to touch, what invariants to preserve, and how to verify changes in the CoreAstroEngine repository.

---

## 1. Layer Map

| Layer | Directory | Responsibility | Data Flow |
|-------|-----------|----------------|------------|
| **Calculation Engine** | `src/engine/` | Astrological calculations (horoscope, planets, houses, Dasha, vargas) | Produces deterministic astrological facts |
| **Domain Reasoning** | `src/domain/` | Semantic interpretation (Career, Wealth, reasoning hierarchy, evidence deduplication) | Consumes engine facts, produces domain evidence |
| **Product** | `src/product/` | Product orchestration, view models, temporal state management | Orchestrates domain interpreters, builds presentation models |
| **UI** | `src/pages/`, `src/components/` | React presentation layer | Consumes product view models only |
| **AI** | `src/ai/` | AI provider routing, context building, explanation generation | Consumes pre-computed domain results |

### One-Directional Data Flow

The product pipeline follows strict one-directional data flow (see `src/product/life-analysis/lifeAnalysisProductService.ts`):

```text
Horoscope (engine)
    ↓
Domain Interpreters (Career V2, Wealth V2)
    ↓
LifeAnalysis Synthesis
    ↓
AI Context (consumes pre-computed results)
    ↓
AI Explanation (optional, never feeds back)
    ↓
View Models (product)
    ↓
UI (presentation only)
```

**Critical invariant**: AI never feeds back into domain reasoning. Domain interpreters compute exactly once, and results are passed through to AI context without recomputation.

---

## 2. Non-Negotiable Invariants

### 2.1 Deterministic Core

- **AI never feeds back**: AI explanation is a pure presentation layer that consumes pre-computed domain results. AI outputs never influence domain reasoning or engine calculations.
- **Single temporal state**: All domain reasoning uses a single `AnalysisContext` and `AnalysisTemporalState` (defined in `src/domain/reasoning/reasoningTypes.ts`). Multiple parallel temporal states are forbidden.
- **Immutability**: Domain evidence and reasoning results are frozen (`Object.freeze`) to prevent mutation during pipeline execution.

### 2.2 CW-01 Reasoning Hierarchy Order

The Career & Wealth reasoning hierarchy order is fixed (from `specs/CW-01_Career_Wealth_Reasoning_Hierarchy_IMPLEMENTATION.md`):

```text
Primary Natal Promise
        ↓
Secondary Structural Support
        ↓
Modifiers
        ↓
Yoga / Classical Confirmation
        ↓
Varga Confirmation
        ↓
Dasha Activation
        ↓
Transit Trigger
        ↓
Conflict Resolution
        ↓
Final Domain Conclusion
        ↓
Reasoning Trace
        ↓
WHY / AI Explanation
```

**Core rule**: Natal promise establishes what the chart can support. Dasha activates or challenges that promise. Transit modifies or triggers timing. Later layers must not silently erase a strong natal promise unless an explicit conflict rule exists.

### 2.3 Do Not Rebuild Existing Engines

Never rebuild these existing engines in CW-01 or any other spec:
- Vimshottari Dasha calculation
- Nakshatra calculation
- D1 (natal chart) calculation
- D10 (Dasamsa) calculation
- D2 (Hora) calculation
- AI provider architecture
- AI routing architecture
- Life Analysis UI architecture
- Full Natal Report architecture

CW-01 and all domain reasoning specs **consume** existing deterministic facts/evidence. They do not replace engine calculations.

### 2.4 Evidence Quality Over Quantity

- A strong primary factor can outweigh multiple weak secondary factors.
- Evidence quality is determined by layer precedence and strength weights, not by count.

### 2.5 Promise ≠ Activation ≠ Trigger

```text
Natal Promise = structural capacity
Dasha Activation = period-level activation/modification
Transit Trigger = current timing pressure/opportunity
```

These are distinct layers and must not be conflated.

### 2.6 Missing Evidence Is Not Negative Evidence

`UNAVAILABLE` must never silently become `CHALLENGE`. Insufficient data must remain as `UNAVAILABLE` or `UNDETERMINED`.

### 2.7 D10/D2 Are Qualifiers, Not Replacements

- D10 qualifies Career (does not silently rewrite D1)
- D2 will eventually qualify Wealth (does not silently rewrite D1)
- Varga confirmation is a modifier layer, not a replacement for natal promise

---

## 3. Change-Type Playbook

### 3.1 Engine/Calculation Changes

**When**: Modifying astrological calculations (planet positions, house calculations, Dasha timing, varga computations).

**Where**: `src/engine/`

**Steps**:
1. Identify the specific calculation module (e.g., `src/engine/astroEngine.ts`)
2. Add or modify calculation logic
3. Update related golden fixtures in `src/test/fixtures/canonicalChart.ts`
4. Run `npm run lint` to verify TypeScript compilation
5. Run `npm test` to verify all tests pass
6. Update any affected domain tests that depend on specific calculation outputs
7. Document the calculation change in the relevant spec file

**Guardrails**: Engine changes are high-risk. Ensure backward compatibility with existing domain reasoning unless explicitly breaking.

### 3.2 Domain Reasoning Changes

**When**: Modifying Career/ Wealth semantic interpretation, reasoning hierarchy, evidence classification, or deduplication logic.

**Where**: `src/domain/career/` or `src/domain/wealth/`

**File Structure Pattern** (mirror `src/domain/career/`):
```
src/domain/[domain]/
├── [domain]Types.ts
├── [domain]Module.ts
├── [domain]Module.test.ts          ← co-located unit tests
├── [domain]Module.semanticFreeze.test.ts  ← semantic freeze tests
├── __fixtures__/
│   └── [specific].fixture.ts      ← test fixtures
└── submodules/
    ├── submodule.ts
    └── submodule.test.ts
```

**Steps**:
1. Add or modify domain reasoning logic in the appropriate module
2. Create or update co-located `*.test.ts` file with unit tests
3. Create or update `*.semanticFreeze.test.ts` to freeze semantic contracts (rule IDs, house portfolios, manifestation mappings)
4. Run `npm run lint` to verify TypeScript compilation
5. Run `npm test` to verify all tests pass
6. If semantic freeze tests fail, intentionally update the frozen values with justification
7. Update integration tests if the change affects the reasoning hierarchy output
8. Document the semantic change in the relevant spec file (e.g., `docs/career/CW-R1-CAREER-CONVERGENCE-CONTRACT.md`)

**Guardrails**: Domain reasoning changes must preserve the CW-01 hierarchy order and invariants. Semantic freeze test failures require intentional fixture updates with documentation.

### 3.3 AI Provider/Routing Changes

**When**: Modifying AI provider implementations, routing logic, context building, or explanation generation.

**Where**: `src/ai/`

**Directory Structure**:
```
src/ai/
├── api/                    ← AI request/response APIs
├── context/                ← AI context building and sanitization
├── product/                ← AI explanation service
├── providers/
│   ├── local/             ← Local Vedic rules provider
│   ├── openai/            ← OpenAI provider adapter
│   └── remote/            ← Generic remote provider
├── reliability/            ← Retry and reliability policies
├── routing/                ← Provider routing and selection
└── types/                  ← AI type definitions
```

**Steps**:
1. Identify the AI layer being modified (provider, routing, context, or explanation)
2. Add or modify AI logic in the appropriate module
3. Create or update co-located `*.test.ts` file
4. Run `npm run lint` to verify TypeScript compilation
5. Run `npm test` to verify all tests pass
6. Test with `LOCAL_ONLY` routing mode before enabling remote providers
7. Verify that AI changes do not affect deterministic domain reasoning (run domain tests)
8. Update relevant spec files (e.g., `specs/PR-025*.md` for AI routing)

**Guardrails**: AI changes must never feed back into domain reasoning. AI is a pure presentation layer that consumes pre-computed domain results.

### 3.4 UI Changes

**When**: Modifying React components, pages, or presentation logic.

**Where**: `src/pages/` and `src/components/`

**Steps**:
1. Identify the UI component or page being modified
2. Add or modify React component logic
3. Ensure the component only consumes product view models (never directly calls domain interpreters)
4. Run `npm run lint` to verify TypeScript compilation
5. Run `npm test` to verify all tests pass
6. Test the UI changes manually with `npm run dev`
7. Verify that UI changes do not affect domain reasoning or engine calculations

**Guardrails**: UI components must be pure presentation layers. They should never contain domain reasoning logic or directly call engine functions.

---

## 4. Testing & Guardrails

### 4.1 Test Commands

From `package.json`:
- `npm test` — Run the test suite with Vitest
- `npm run lint` — TypeScript compilation check (`tsc --noEmit`)
- `npm run dev` — Start development server for manual UI testing
- `npm run build` — Compile and build production assets

### 4.2 Stage-1 Integration Harness

Location: `src/integration/stage1/stage1IntegrationHarness.ts`

The Stage-1 integration harness orchestrates the full product pipeline:
```text
Horoscope → Domain Interpreters → LifeAnalysis → AiContext → AiRequest → AiRouter → AiExplanationService
```

**Purpose**: Integration testing of the complete deterministic pipeline with optional AI explanation.

**Usage**: Used by integration tests to verify end-to-end behavior across layers. The harness ensures single canonical execution of domain interpreters (Career V2, Wealth V2) and passes pre-computed results to AI context without duplicate calculation.

**Important**: The harness is strictly integration/test infrastructure and must not be used as a production context factory. Production context creation belongs solely in `ProductAnalysisService`.

### 4.3 Golden Fixtures

Location: `src/test/fixtures/canonicalChart.ts`

Golden fixtures provide repository-internal baseline snapshots for the canonical birth chart. These are **not** externally validated ephemeris benchmarks, but they serve as:
- Deterministic calculation baselines
- Test data for integration tests
- Regression detection for engine changes

**When golden fixture tests fail**:
1. Verify if the change is intentional (e.g., engine improvement)
2. If intentional, update the golden fixture values with clear justification
3. If unintentional, investigate the calculation change or domain logic change
4. Document the reason for fixture updates in the relevant spec or commit message

### 4.4 Semantic Freeze Tests

Location: Domain modules (e.g., `src/domain/career/careerTypes.semanticFreeze.test.ts`)

Semantic freeze tests lock down semantic contracts:
- Rule ID mappings
- House/lord portfolios
- Manifestation rule mappings
- Type definitions

**When semantic freeze tests fail**:
1. This indicates a deterministic output change in semantic contracts
2. Verify if the change is intentional (e.g., domain reasoning improvement)
3. If intentional, update the frozen values with clear justification
4. Document the semantic change in the relevant spec file
5. Ensure backward compatibility is considered for dependent systems

**Example**:
```typescript
describe('CW-R1 C1 — Career structural portfolio freeze', () => {
  it('freezes primary Career houses', () => {
    expect([...CAREER_PRIMARY_HOUSES]).toEqual([10]);
  });
});
```

### 4.5 Integration Test Failures

Integration test failures in `src/integration/stage1/` or domain integration tests indicate:
- Breaking changes in domain reasoning output
- Data flow violations between layers
- Type contract violations
- Temporal state calculation errors

**Resolution**: Investigate the specific layer causing the failure and ensure the change preserves the data flow invariants.

---

## 5. Spec/PR Conventions

### 5.1 Numbered Spec Naming

Spec files in `specs/` follow a structured naming convention:

| Prefix | Meaning | Examples |
|--------|---------|----------|
| `PR-###` | Product/Architecture PR | `PR-024A-GoldenValidationSuite.md`, `PR-025*-AIProviderRouting.md` |
| `CW-##` | Career/Wealth spec | `CW-01_Career_Wealth_Reasoning_Hierarchy_IMPLEMENTATION.md` |
| `P-##` | Planetary strength spec | `P-06-PlanetaryStrength.md`, `P-11-Complete-Shadbala.md` |
| `YOGA-###` | Yoga spec | `YOGA-001-GajaKesari.md` |

### 5.2 Spec-First Development

**Practice**: Always author a spec before implementing code changes.

**Process**:
1. Create or update the relevant spec file in `specs/`
2. Define the problem, approach, and invariants
3. Specify the file structure and type changes
4. Document the testing strategy
5. Implement the code following the spec
6. Update the spec with any implementation learnings
7. Reference the spec in commit messages and PR descriptions

**Benefits**:
- Clear documentation of intent
- Reviewable before implementation
- Traceability from code to design
- Reduced ambiguity during implementation

### 5.3 Documentation Conventions

- **Contract documents**: Located in `docs/[domain]/` (e.g., `docs/career/CW-R1-CAREER-CONVERGENCE-CONTRACT.md`)
- **Spec documents**: Located in `specs/` with numbered naming
- **README updates**: Update domain-specific READMEs when adding new modules
- **Inline documentation**: Use JSDoc for exported functions and types

---

## 6. Quick Reference

### 6.1 Key File Locations

| Purpose | Location |
|---------|----------|
| Engine calculations | `src/engine/astroEngine.ts` |
| Domain reasoning types | `src/domain/reasoning/reasoningTypes.ts` |
| Career interpreter | `src/domain/career/CareerDomainInterpreterV2.ts` |
| Wealth interpreter | `src/domain/wealth/WealthDomainInterpreterV2.ts` |
| Reasoning hierarchy | `src/domain/reasoning/reasoningHierarchy.ts` |
| Evidence deduplication | `src/domain/reasoning/deduplicateEvidence.ts` |
| Product service | `src/product/life-analysis/lifeAnalysisProductService.ts` |
| AI routing | `src/ai/routing/AiRouter.ts` |
| Integration harness | `src/integration/stage1/stage1IntegrationHarness.ts` |
| Golden fixtures | `src/test/fixtures/canonicalChart.ts` |
| Canonical birth details | `src/test/fixtures/canonicalChart.ts` (CANONICAL_BIRTH_DETAILS) |

### 6.2 Critical Invariants Summary

1. **Deterministic core**: AI never feeds back, single temporal state
2. **CW-01 hierarchy order**: Fixed reasoning layer precedence
3. **No engine rebuilding**: Consume existing calculations, don't replace
4. **One-directional flow**: Engine → Domain → Product → AI → UI
5. **Evidence quality**: Strong primary > multiple weak secondary
6. **Missing ≠ negative**: UNAVAILABLE must not become CHALLENGE
7. **Varga as qualifier**: D10/D2 modify, don't replace D1

### 6.3 Before Making Changes

1. **Identify the layer**: Use the Layer Map to determine which directory to modify
2. **Check existing specs**: Look for relevant specs in `specs/` that may guide the change
3. **Review invariants**: Ensure the change preserves non-negotiable invariants
4. **Plan tests**: Determine which tests need to be added or updated
5. **Consider impact**: Assess downstream effects on other layers
6. **Write spec first**: Author or update the spec before implementing code
7. **Run guardrails**: Execute `npm run lint` and `npm test` before committing

---

## 7. Getting Help

- **Architecture questions**: Refer to relevant spec files in `specs/`
- **Layer responsibility**: Use the Layer Map to identify the correct layer
- **Testing issues**: Check semantic freeze tests and golden fixtures
- **Integration failures**: Review the Stage-1 integration harness
- **Type errors**: Run `npm run lint` for TypeScript compilation details
- **Test failures**: Run `npm test` for detailed Vitest output

---

This PLAYBOOK is the single reference for planning and safely making changes. When in doubt, consult the relevant spec file and verify that the change preserves the non-negotiable invariants.