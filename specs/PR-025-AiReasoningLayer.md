# PR-025: AI Reasoning Layer (Deterministic Grounding & Projection Architecture)

## Architecture Overview
The AI Reasoning Layer is integrated into the CoreAstro TypeScript/React application (`src/ai/`). The AI layer operates as a distinct domain context that strictly consumes deterministic facts produced by the Vedic astrology calculation engine (`src/engine/astroEngine.ts`, `themeInterpretationV2`, etc.) via a structured grounding DTO (`AiContext`).

The AI layer is strictly **projection-only**:
- It never recalculates astrology rules, planet positions, sign lordships, or yogas.
- It fails fast if mandatory deterministic engine facts are missing from the `Horoscope` aggregate.
- It guarantees 100% determinism and preserves golden-chart validation integrity.

## Directory Structure (`src/ai/`)
1. `src/ai/types/`:
   - `aiTypes.ts`: Schema versioning (`1.0.0`), confidence, availability, and evidence effect enums.
   - `aiContextTypes.ts`: Domain models for Ascendant, Planets, Houses, Yogas, Dasha, Divisionals (D9/D10), Theme interpretations (`CareerFact`, `WealthFact`, `WealthSubthemeFact`), and `AiEvidence`.
   - `aiRequestTypes.ts`: Request models (`AiRequest`, `AiTask`).
   - `aiResponseTypes.ts`: Response models (`AiResponse`, `AiResponseMetadata`).
   - `aiReasoningResult.ts`: Structured reasoning results (`AiReasoningResult`, `AiReasoningStatus`).
   - `aiProviderTypes.ts`: Provider abstraction (`AiProvider`, `AiProviderIdentity`, `AiCapability`).

2. `src/ai/context/`:
   - `aiContextFactory.ts`: Pure factory (`buildAiContext(horoscope: Horoscope)`) mapping deterministic engine outputs to an immutable `AiContext`.
   - `aiContextPrivacy.ts`: Definition of forbidden PII / raw birth detail keys (`dateOfBirth`, `timeOfBirth`, `latitude`, `longitude`, `birthPlace`, `rawChart`, etc.).
   - `deepFreeze.ts`: Deep immutability utility ensuring projected data structures cannot be mutated.

3. `src/ai/api/`:
   - `createAiRequest.ts`: Helper for creating validated, frozen `AiRequest` payloads.

## Grounding DTO (`AiContext`)
- **Schema Version**: Explicitly versioned (e.g. `"1.0.0"`).
- **Source & Methodology**: Records deterministic engine metadata and Vedic methodology parameters (Sidereal, Lahiri ayanamsa, Whole Sign houses, Vimshottari dasha, Parashari aspects).
- **Facts**:
  - `AscendantFact`: Sign and lord derived directly from chart facts.
  - `PlanetFactSummary`: 9 Vedic planets (Sun through Ketu) in standard sequence with dignity, state, house, functional roles, shadbala status, and nakshatra data.
  - `HouseFactSummary`: Houses 1–12 with occupied planets, aspects received, sign, and lord.
  - `YogaFactSummary`: Identified yogas with assessment status, strength, participating planets, and houses.
  - `DashaFacts`: Vimshottari mahadasha periods and active dasha period (Mahadasha, Antardasha, Pratyantardasha).
  - `DivisionalFacts`: Varga confirmations (D9 Navamsa, D10 Dasamsa; D2 documented as unpopulated).
  - `CareerFact` & `WealthFact`: Sourced directly from `horoscope.themeInterpretationV2` including natal promise, D10 confirmation status, supporting/challenging factors, and the four wealth subthemes (`ACCUMULATION`, `GAINS`, `FORTUNE`, `SPECULATION`).
  - `AiEvidence`: Normalized evidence items with deterministic canonical identity keys.

## Privacy & Hallucination Boundary
Raw birth details (`birthDetails`, `dateOfBirth`, `dob`, `timeOfBirth`, `birthTime`, `latitude`, `longitude`, `lat`, `lng`, `birthPlace`, `placeOfBirth`, `rawChart`) are strictly excluded from `AiContext` and `AiRequest`. This protects user privacy and prevents LLM hallucination on raw astronomical coordinates.

## Verification & Testing
- `aiContextFactory.test.ts`: Validates deterministic projection of all chart facts, varga relationships, career/wealth theme integration, and immutability.
- `aiContextSanitization.test.ts`: Verifies complete exclusion of forbidden PII/raw birth keys and ensures deep immutability across the projected context tree.
