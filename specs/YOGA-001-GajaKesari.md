# YOGA-001: Gaja Kesari Yoga Specification

## Purpose
This specification defines the detection logic and implementation rules for **Gaja Kesari Yoga** in the `coreastro` engine.

## Classical Definition
Gaja Kesari Yoga is a major Raja Yoga formed when Jupiter occupies a Kendra (1st, 4th, 7th, or 10th house position) relative to the Moon. In classical Vedic astrology, it bestows fame, intelligence, virtue, authority, and prosperity.

## Supported Conditions
In the initial implementation, Gaja Kesari Yoga is evaluated strictly based on mutual Kendra house placement between Moon and Jupiter:

- **Planet Pair**: Moon (`Planet.MOON`) and Jupiter (`Planet.JUPITER`).
- **Kendra House Difference**: Modular house distance between Jupiter's house and Moon's house is `0`, `3`, `6`, or `9` (representing 1st, 4th, 7th, or 10th houses relative to the Moon).
- **Category**: `YogaCategory.RAJA`.
- **Strength**: `YogaStrength.STRONG` (fixed in this PR).
- **Explanation**: `"Gaja Kesari Yoga formed because Jupiter occupies a Kendra from the Moon."`.

## Ignored Conditions for Future Revisions
The following classical nuances and modifiers are intentionally out of scope for this initial implementation and deferred to future PRs:
- Combustion of Jupiter or Moon
- Planetary afflictions or malefic aspects
- Papakartari yoga involvement
- Debility or Neecha Bhanga (debility cancellation)
- Aspect corrections or modifications
- Waning vs. Waxing Moon status
- Additional benefic/malefic functional lordships

## Examples
- **Moon in House 1, Jupiter in House 1**: Kendra diff = 0 → Yoga Present (`YogaType.GAJA_KESARI`).
- **Moon in House 1, Jupiter in House 4**: Kendra diff = 3 → Yoga Present (`YogaType.GAJA_KESARI`).
- **Moon in House 1, Jupiter in House 7**: Kendra diff = 6 → Yoga Present (`YogaType.GAJA_KESARI`).
- **Moon in House 1, Jupiter in House 10**: Kendra diff = 9 → Yoga Present (`YogaType.GAJA_KESARI`).
- **Moon in House 1, Jupiter in House 2**: Kendra diff = 1 → No Yoga.

## Validation Charts
Validation cases are maintained in `modules/astrology-engine/src/test/resources/validation/gaja-kesari.csv`:
```csv
chartId,moonHouse,jupiterHouse,expected
1,1,1,true
2,1,4,true
3,1,7,true
4,1,10,true
5,1,2,false
6,1,5,false
7,1,8,false
```

## References
- *Brihat Parashara Hora Shastra* (BPHS), Chapter on Yogas.
- *Phaladeepika*, Chapter 6 (Yoga Phala).
