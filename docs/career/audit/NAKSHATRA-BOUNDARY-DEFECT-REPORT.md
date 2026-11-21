# Gate-0 Nakshatra Pada Boundary Defect — Resolved

## Resolution status

**Resolved in commit `953cd218`.** G0-08 replaced the production
nakshatra/pada lookup with a global half-open longitude grid. Gate-0 now
records 405/405 nakshatra/pada boundary vectors passing.

No planetary position, fixture expected value, `vimshottari.ts`, or
`chartMath.ts` logic was changed.

## Root cause

The old pada calculation mixed decimal-rounded nakshatra metadata with
offsets derived from `40 / 3`. At exact boundaries, the engine could report
the preceding pada: for example, Krittika/1 instead of Krittika/2 at 30°.

## Fix

Commit `953cd218` uses a global half-open `40 / 3` grid for nakshatra
classification and its 1/4 pada subdivisions. Exact boundaries belong to
the next interval; the `1e-12` degree tolerance absorbs only floating-point
representation noise.

## Historical 27 failure cases

These are preserved as historical evidence. They are not current failures.

| Boundary ID | Original exact boundary longitude (approx. degrees) |
|---|---:|
| PADA-BOUNDARY-10 | 30 |
| PADA-BOUNDARY-11 | 33.333333 |
| PADA-BOUNDARY-12 | 36.666667 |
| PADA-BOUNDARY-22 | 70 |
| PADA-BOUNDARY-23 | 73.333333 |
| PADA-BOUNDARY-24 | 76.666667 |
| PADA-BOUNDARY-34 | 110 |
| PADA-BOUNDARY-35 | 113.333333 |
| PADA-BOUNDARY-36 | 116.666667 |
| PADA-BOUNDARY-46 | 150 |
| PADA-BOUNDARY-47 | 153.333333 |
| PADA-BOUNDARY-48 | 156.666667 |
| PADA-BOUNDARY-58 | 190 |
| PADA-BOUNDARY-59 | 193.333333 |
| PADA-BOUNDARY-60 | 196.666667 |
| PADA-BOUNDARY-70 | 230 |
| PADA-BOUNDARY-71 | 233.333333 |
| PADA-BOUNDARY-72 | 236.666667 |
| PADA-BOUNDARY-82 | 270 |
| PADA-BOUNDARY-83 | 273.333333 |
| PADA-BOUNDARY-84 | 276.666667 |
| PADA-BOUNDARY-94 | 310 |
| PADA-BOUNDARY-95 | 313.333333 |
| PADA-BOUNDARY-96 | 316.666667 |
| PADA-BOUNDARY-106 | 350 |
| PADA-BOUNDARY-107 | 353.333333 |
| PADA-BOUNDARY-108 | 356.666667 |

