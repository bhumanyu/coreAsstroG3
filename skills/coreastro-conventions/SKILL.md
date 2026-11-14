---
name: coreastro-conventions
description: Compact repository guide for making safe, spec-first changes in CoreAstroG3.
---

# CoreAstroG3 Conventions

Use this as a quick routing guide; consult [`PLAYBOOK.md`](../../PLAYBOOK.md) for the full workflow and rationale, and [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for test configuration.

## Layer map

| Layer | Location | Responsibility |
|---|---|---|
| Engine | `src/engine/` | Deterministic astrological calculations and chart facts |
| Domain | `src/domain/` | Career/Wealth semantic reasoning, evidence, and hierarchy |
| Product | `src/product/` | Orchestration, temporal state, synthesis, and view models |
| AI | `src/ai/` | Context building, provider routing, and optional explanations |
| UI | `src/pages/`, `src/components/` | Presentation; consumes product view models only |

Keep the data flow one-directional: **Engine → Domain → Product → AI → UI**. AI consumes precomputed results and never feeds back into domain reasoning. UI must not call domain interpreters or engine calculations directly.

## Non-negotiable invariants

- AI output never changes engine calculations or domain reasoning.
- Use one shared `AnalysisContext` and `AnalysisTemporalState`; do not create parallel temporal states.
- Freeze domain evidence and reasoning results with `Object.freeze`.
- Preserve the fixed CW-01 hierarchy: **Primary Natal Promise → Secondary Structural Support → Modifiers → Yoga/Classical Confirmation → Varga Confirmation → Dasha Activation → Transit Trigger → Conflict Resolution → Final Domain Conclusion → Reasoning Trace → WHY/AI Explanation**.
- Do not rebuild existing Vimshottari Dasha or Nakshatra calculations; D1/D10/D2 calculations; AI routing; or Life Analysis UI architecture. Consume their existing outputs.
- `UNAVAILABLE` must never be treated as `CHALLENGE`; insufficient evidence remains `UNAVAILABLE` or `UNDETERMINED`.
- D10 qualifies Career and D2 qualifies Wealth; neither replaces or silently rewrites D1.

## Change-type routing

- **Engine/calculation:** change `src/engine/`; update relevant golden fixtures in `src/test/fixtures/canonicalChart.ts`; cover calculation changes with tests and document the change in its spec.
- **Domain reasoning:** change `src/domain/career/` or `src/domain/wealth/`; add/update co-located `*.test.ts` and `*.semanticFreeze.test.ts`. Preserve the CW-01 order.
- **AI, context, provider, or routing:** change `src/ai/`; add/update co-located tests and ensure domain results remain deterministic and unchanged.
- **UI/presentation:** change `src/pages/` or `src/components/`; consume product view models only, with no direct domain reasoning or engine calls.

## Verification

Before committing, always run these in order:

1. `npm run lint`
2. `npm test`

Vitest uses a Windows-compatible single-fork configuration (`forks`, `singleFork: true`) and a 120-second test timeout. Avoid concurrent/watch-mode Vitest processes on Windows. A semantic-freeze failure signals a changed semantic contract: update frozen fixtures only when intentional, and document the justification in the relevant spec or commit.

## Spec-first workflow

Author or update the relevant document in `specs/` before implementation. Use the repository prefixes: `PR-###` (product/architecture), `CW-##` (Career/Wealth), `P-##` (planetary strength), or `YOGA-###` (yoga). Define the problem, approach, invariants, affected files, and verification; update the spec with learnings and reference it in commit messages and PR descriptions.

## Key file locations

| Purpose | File |
|---|---|
| Engine calculations | `src/engine/astroEngine.ts` |
| Domain reasoning types | `src/domain/reasoning/reasoningTypes.ts` |
| Career interpreter | `src/domain/career/CareerDomainInterpreterV2.ts` |
| Wealth interpreter | `src/domain/wealth/WealthDomainInterpreterV2.ts` |
| Reasoning hierarchy | `src/domain/reasoning/reasoningHierarchy.ts` |
| Life Analysis product service | `src/product/life-analysis/lifeAnalysisProductService.ts` |
| AI routing | `src/ai/routing/AiRouter.ts` |
| Stage-1 integration harness | `src/integration/stage1/stage1IntegrationHarness.ts` |
| Canonical chart / golden fixtures | `src/test/fixtures/canonicalChart.ts` |
