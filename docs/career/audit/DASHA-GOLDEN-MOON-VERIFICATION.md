# Dasha Golden Verification — Swiss Moon Authority

The selected-period golden values in
`src/test/fixtures/selectedPeriodGoldenFixtures.ts` changed only because the
birth Moon and derived Vimshottari anchor changed from the old approximation
to Swiss Ephemeris.

## Canonical 1988 birth chart

| Quantity | Reference/old value | Swiss engine value | Delta |
|---|---:|---:|---:|
| Canonical Moon sidereal longitude | 282.2994051952583° | 282.38713965414956° | +0.0877344588913° |
| Starting nakshatra | Shravana | Shravana | unchanged |
| Starting nakshatra lord | Moon | Moon | unchanged |
| Nakshatra progress fraction | 0.1724553896 | 0.1790354741 | +0.0065800845 |

Shravana spans 280°–293.333333°. The old Moon position is
(282.2994051952583−280)/13.333333 = 0.1724553896; the Swiss position is
0.1790354741.

The canonical first-Mahadasha/Antardasha golden interval changed from:

- `1988-05-08T04:00:00Z` to `1989-07-17T14:03:37.957Z`

to:

- `1988-05-08T04:00:00Z` to `1989-06-23T13:15:01.237Z`

This is a 24.034958 days shorter Moon-Mahadasha balance. It follows from the
larger Swiss Moon progress fraction: the remaining balance of the same Moon
Mahadasha is smaller, so the first-MD boundary occurs earlier. No Dasha
sequence, duration, or subdivision code was tuned or changed.

The selected future-period IDs changed as a deterministic consequence of the
same later Dasha timeline:

| Golden field | Old | New |
|---|---|---|
| Mahadasha | `v2\|VIMSHOTTARI\|md\|MOON\|2106-08-18T06:33:37.957Z\|2108-05-09T04:00:00.000Z` | `v2\|VIMSHOTTARI\|md\|MOON\|2106-07-25T05:45:01.237Z\|2108-05-09T04:00:00.000Z` |
| Antardasha | `v2\|VIMSHOTTARI\|ad\|MOON\|2106-08-18T06:33:37.957Z\|2107-06-18T15:33:37.957Z` | `v2\|VIMSHOTTARI\|ad\|MOON\|2106-07-25T05:45:01.237Z\|2107-05-25T14:45:01.237Z` |

## Independent Gate0 comparison

The existing Gate0 harness confirms the Dasha arithmetic decomposition:

- R→R: first-MD anchors 67/67, 0 ms boundary error.
- R→E: 67/67 structurally agreeing; MD/AD/PD matched boundary error 0 ms.
- E→E: compared against the independent reference Dasha using Swiss Moon
  input; boundaries agree by the Moon residual budget and are partitioned as
  established by starting nakshatra in the parity report.

The golden changes are therefore attributed to a new Moon-input balance, not
to a change in `vimshottari.ts`. `vimshottari.ts` and `chartMath.ts` remain
unchanged.
