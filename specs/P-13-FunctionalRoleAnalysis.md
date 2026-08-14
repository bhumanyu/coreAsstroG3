# P-13 Functional Role Analysis Specification

## 1. Overview
`FunctionalRoleAnalysis` serves as the single authoritative functional classifier for planetary bodies in coreAstroG2.
It unifies house lordship roles, badhaka house determination, and functional nature derivation into a single, canonical report (`FunctionalRoleAnalysisReport`).

---

## 2. Functional Roles Taxonomy
All planets are evaluated for the following canonical roles defined in `FunctionalRole`:
- `LAGNA_LORD` (Owns House 1)
- `KENDRA_LORD` (Owns non-Lagna Kendra houses: 4, 7, 10 or 1)
- `TRIKONA_LORD` (Owns Trikona houses: 1, 5, 9)
- `DUSTHANA_LORD` (Owns Dusthana houses: 6, 8, 12)
- `MARAKA_LORD` (Owns Maraka houses: 2, 7)
- `BADHAKA_LORD` (Owns Badhaka house based on Ascendant modality)
- `YOGAKARAKA` (Owns a non-Lagna Kendra AND a non-Lagna Trikona house)
- `SECOND_LORD` (Owns House 2)
- `THIRD_LORD` (Owns House 3)
- `ELEVENTH_LORD` (Owns House 11)

---

## 3. Role-Aware Functional Nature Derivation
Functional nature is derived directly from functional roles and house lordships via `determineFunctionalNatureFromRoles` with conservative priority ordering:

1. **(A) Yogakaraka Rule:** If planet has role `YOGAKARAKA` $\rightarrow$ `BENEFIC`.
2. **(B) Lagna Ownership:** Lagna ownership contributes positively but does not override (e.g. Trikona + Dusthana $\rightarrow$ `MIXED`).
3. **(C) Trikona + Dusthana Combination:** If planet owns both a Trikona house (1, 5, 9) and a Dusthana house (6, 8, 12) $\rightarrow$ `MIXED`.
4. **(D) Trikona without Dusthana:** If planet owns a Trikona house and no Dusthana house $\rightarrow$ `BENEFIC`.
5. **(E) Dusthana without Trikona:** If planet owns a Dusthana house and no Trikona house $\rightarrow$ `MALEFIC`.
6. **(F) Neutral Default:** Neither Trikona nor Dusthana ownership $\rightarrow$ `NEUTRAL`.

---

## 4. Integration Architecture
In `astroEngine.ts`, `analyzeFunctionalRoles` is called once after house lordship analysis. Its report (`functionalRoles`) is passed into downstream integrators like `analyzeFunctionalNatureIntegration`, ensuring a single authoritative source of truth across the engine pipeline.
