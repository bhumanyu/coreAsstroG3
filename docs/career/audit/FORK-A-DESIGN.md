# Fork A Design: Swiss Ephemeris Licensing and Astronomy Authority

## License decision

**Status: pending legal review; distribution blocked.**

`@kuntay/swisseph` and `@kuntay/swisseph-data` are licensed AGPL-3.0-or-later.
Using this binding does not remove the AGPL obligation. Release/distribution
requires either (1) a complete AGPL-3.0-or-later source-availability plan for
the application and its corresponding source, or (2) a valid Swiss Ephemeris
Professional License from Astrodienst. Development and validation may proceed
without making this decision; no distribution artifact should be published
until the selected path is recorded as accepted by the maintainer/legal reviewer.

Runtime dependencies:
- `@kuntay/swisseph@0.2.2`
- `@kuntay/swisseph-data@0.2.2`
- Swiss Ephemeris core `2.10.03`

## Ephemeris configuration

- Data: `sepl_18.se1`, `semo_18.se1`, `seas_18.se1`, `sefstars.txt`, and
  `seorbel.txt`, DE441-derived .se1 data, 1800-2399 CE.
- Position authority: single Swiss Ephemeris authority; the legacy
  astronomy-engine implementation is not hybridized.
- Coordinate frame: geocentric, apparent/ecliptic-of-date.
- Flags: `SEFLG_SWIEPH`/Swiss ephemeris with `SEFLG_SPEED`; no topocentric,
  no true-position, and no heliocentric override.
- Time scale: `swe.calc_ut`/the binding's `calc(jdUt, ...)` contract accepts
  Universal Time Julian day; `swe_calc_ut` applies Delta-T internally. The
  engine does not add `Delta-T` to the UT Julian day.
- Ascendant: `swe.houses(jdUt, latitude, longitude,
  HouseSystem.EqualWholeSign)` and the returned tropical ascendant. The
  sidereal application subtracts the selected ayanamsa.
- Ayanamsa: Lahiri by default via `swe.setSiderealMode(Ayanamsa.Lahiri)` and
  `swe.ayanamsa(jdUt)`.
- Raman: Swiss sidereal mode `Ayanamsa.Raman`.
- Fagan/Bradley: Swiss sidereal mode `Ayanamsa.FaganBradley`.
- Krishnamurti: Swiss sidereal mode `Ayanamsa.Krishnamurti`.
- Tropical: offset is `0.0` degrees (no ayanamsa offset).
- Nodes: mean lunar node for `Planet.RAHU`; `Planet.KETU` is mean-node longitude
  plus 180 degrees, with the node latitude negated in the adapter.
