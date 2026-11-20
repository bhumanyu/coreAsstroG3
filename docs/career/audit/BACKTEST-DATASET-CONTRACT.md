# Backtest Dataset Contract — Career Intelligence

**Baseline SHA:** `b704d146` — audit/design document; no code modified.
**Purpose:** define the anonymized case schema and cohort/evaluation protocol for
measuring whether the canonical career pipeline (`interpretCareerV2`, C4–C11 +
profession/trajectory/events) predicts real career outcomes well enough to trust.

## 1. Relationship to existing fixtures — critical distinction

The golden fixtures under `src/domain/career/__tests__/golden/`
(`goldenCareerFixtures.ts`, scenarios G01–G20) are **acceptance tests, not backtest
observations**. Every scenario reuses `CANONICAL_BIRTH_DETAILS` (a single birth,
1988-05-08) with varied `asOf`/temporal contexts; `expectedC11Fields` encode the
*current engine's* accepted outputs (e.g. G01 notes "Canonical chart produces MIXED
(actual behavior)"). They verify pipeline determinism and contract invariants —
they cannot measure predictive accuracy because (a) there is exactly one natal chart,
(b) expected values were authored from engine behavior, not independent outcomes.

Backtest cases are therefore a **new, separate dataset** with real-world career
histories. Golden fixtures remain regression/acceptance gates; backtest data is
never used to tune rules in a way that would invalidate the golden baselines.

## 2. Calculation metadata (must match `GOLDEN_TEST_METHODOLOGY`)

Each case records the methodology envelope so engine comparisons are apples-to-apples
(`goldenCareerFixtures.ts:56–64`):

```yaml
methodology:
  zodiacSystem: SIDEREAL
  houseSystem: WHOLE_SIGN
  ayanamsa: LAHIRI
  calculationEngine: ASTRO_CORE_V1        # current engine; re-run under replacement core if Fork A executes
  rulesEngine: PARASHARA_CLASSICAL_RULES_V2
  vargaRules: PARASHARA_D10_D2
  dashaSystem: VIMSHOTTARI
```

If the Gate-0 decision fork replaces the astronomy core, backtest cases must be
re-run under the new core and methodology bumped accordingly — never mix engines
within one metric.

## 3. Anonymized case schema

```yaml
case:
  caseId: "BT-0001"                    # random; no derivable link to identity
  birth:
    date: "YYYY-MM-DD"
    timeUtc: "HH:MM:SSZ"               # UTC instant; if only local time known, record accuracy
    timeAccuracy: "EXACT" | "APPROXIMATE_15M" | "APPROXIMATE_1H" | "UNKNOWN"
    latitude: 12.34                    # decimal degrees
    longitude: 56.78
    timeZone: "Asia/Dubai"             # IANA, for local-representation audit only
  # --- optional when timeAccuracy is UNKNOWN; engine must degrade to UNAVAILABLE, not guess ---

  calculationMetadata: { /* §2 methodology block */ }

  chartFacts:                          # populated by running the engine; stored for audit, NOT hand-authored
    d1: { /* signs/house placements per planet + ascendant */ }
    d9: { /* navamsa longitudes per planet */ }
    d10: { /* dasamsa longitudes per planet */ }
    vimshottari: { /* MD/AD/PD sequence with start/end instants */ }

  careerHistory:                       # the observation — the only hand-authored section
    - eventId: "EVT-01"
      eventType: "FIRST_EMPLOYMENT" | "PROMOTION" | "JOB_CHANGE" | "SELF_EMPLOYMENT_START"
              | "BUSINESS_VENTURE" | "LEADERSHIP_ROLE" | "RELOCATION_FOREIGN"
              | "EDUCATION_COMPLETION" | "CAREER_INTERRUPTION" | "RETIREMENT"
      dateApprox: "YYYY-MM"            # month/year granularity is sufficient; day optional
      dateAccuracy: "EXACT" | "MONTH" | "SEASON" | "YEAR"
      description: "free text, anonymized"

  observedOutcome:
    professionDomain: "MEDICINE" | "ENGINEERING" | "LAW" | "FINANCE" | "IT"
                   | "EDUCATION" | "GOVERNMENT" | "ENTREPRENEURSHIP" | "AGRI"
                   | "CREATIVE" | "SERVICE" | "OTHER"
    roleFamily: "EMPLOYEE" | "MANAGER" | "EXECUTIVE" | "FOUNDER" | "FREELANCER"
               | "PROFESSIONAL_PRACTICE" | "LABOR" | "STUDENT" | "OTHER"
    evidenceQuality: "DOCUMENTED" | "SELF_REPORTED_SINGLE" | "SELF_REPORTED_CORROBORATED"
    outcomeConfidence: "HIGH" | "MEDIUM" | "LOW"   # confidence in the observation itself
```

Rules:

- `caseId` random, assigned at intake; no names, places finer than ~city, or dates
  beyond birth + career events.
- `chartFacts` are engine outputs stored verbatim for reproducibility — they are NOT
  expected values and never seed reference fixtures (Gate-0 rule).
- Missing birth time ⇒ `timeAccuracy: UNKNOWN`; house-dependent outputs must surface
  UNAVAILABLE/NOT_PROVIDED downstream rather than being silently computed.
- `evidenceQuality`/`outcomeConfidence` gate which cases count toward headline metrics
  (see §5).

## 4. Cohort

- **Exploratory cohort:** 30 cases — stratified across profession domains, hemispheres,
  eras (e.g. career events 1960–2025), and birth-time accuracy levels. Used for
  pipeline debugging and metric estimation.
- **Holdout:** 10–20 cases, collected under the same schema but sealed until the
  exploratory metrics stabilize. Reported separately; never used for tuning.
- Cases enter the dataset only with consent-equivalent anonymization review; no PII.

## 5. Per-target metrics

For each case, run `interpretCareerV2` (via `interpretDomain`) and compare
`conclusionData.careerProfessionAnalysis` / `canonicalCareerFinalSynthesis` /
`careerEventTimeline` outputs against `observedOutcome`/`careerHistory`:

| Target | Metric | Notes |
|---|---|---|
| Profession domain | top-1 and top-3 hit rate | candidate domain list vs `professionDomain` |
| Service-vs-business | precision / recall | binary split of roleFamily/professionDomain |
| Leadership-vs-technical | precision / recall | binary split |
| Foreign/relocation indicators | precision / recall | vs `RELOCATION_FOREIGN` events |
| Dated career events | timing error | absolute month distance between predicted window (careerEvents/careerEventTimeline) and `dateApprox`; report median + p90 |
| Coverage | reported separately | fraction of cases where the relevant output is AVAILABLE vs UNAVAILABLE/NOT_PROVIDED — never folded into accuracy |

Metric rules:

- Compute headline metrics on `evidenceQuality ∈ {DOCUMENTED, SELF_REPORTED_CORROBORATED}`
  and `outcomeConfidence ∈ {HIGH, MEDIUM}`; low-confidence observations are reported
  in a sensitivity table, not silently included.
- UNAVAILABLE outputs count as misses for hit-rate metrics but are **also** reported
  via the coverage metric — the two are never conflated.
- Timing error uses month granularity; cases with `dateAccuracy: YEAR` contribute to
  coverage only, not timing error.
- All metrics are computed per engine core version; results across the Gate-0 fork
  are reported side-by-side, not averaged.

## 6. Acceptance use

Backtest results inform the Gate-0/Gate-A decision record and charter reviews; they
do **not** override golden acceptance tests, which remain the blocking regression
gate. A backtest regression without a golden regression is a data-quality finding,
not an automatic code change.
