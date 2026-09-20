# CW-R1 C1 — Career Semantic Source Freeze

## Purpose

This document freezes the existing Career semantic sources before
implementation of CW-R1 Career structural reasoning.

C1 is an audit/freeze phase.

It does not introduce new Career semantics.

---

## Canonical Career pipeline

ThemeInterpretation
    ↓
Career Evidence Mapping
    ↓
DomainEvidence
    ↓
Canonical Evidence Deduplication
    ↓
Career Reasoning
    ↓
Career Expression
    ↓
D10 Qualification
    ↓
Dasha Activation / Timing
    ↓
Final Career Conclusion

---

## Structural sources

### Houses

- CAREER_10H_STRONG_001
- CAREER_10H_AFFLICTION_001
- CAREER_10H_OCCUPANT_001
- CAREER_6H_SERVICE_001
- CAREER_11H_GAINS_001
- CAREER_2H_WEALTH_001

### Lords

- CAREER_10L_DIGNITY_001

### House relationships

- CAREER_6H_10H_LINK_001
- CAREER_10H_11H_LINK_001
- CAREER_6L_10L_LINK_001
- CAREER_10L_11L_LINK_001

---

## Planetary relevance sources

- CAREER_SUN_RELEVANCE_001
- CAREER_SATURN_RELEVANCE_001
- CAREER_MERCURY_RELEVANCE_001
- CAREER_MARS_RELEVANCE_001
- CAREER_JUPITER_RELEVANCE_001

---

## Modifier / confirmation sources

### Aspect

- CAREER_ASPECT_10H_001

### Yoga

- CAREER_YOGA_CONFIRMATION_001

### D10

- CAREER_D10_CONFIRMATION_001

---

## Timing source

- CAREER_DASHA_TIMING_001

---

## Career manifestation vocabulary

### Declared CareerManifestationMode vocabulary

The type currently declares 11 possible modes:

- LEADERSHIP
- MANAGEMENT
- TECHNICAL_SPECIALIZATION
- SERVICE_EMPLOYMENT
- AUTHORITY
- INDEPENDENT_WORK
- BUSINESS_ENTREPRENEURSHIP
- PUBLIC_INSTITUTIONAL
- SPECIALIZATION
- EMPLOYMENT
- ENTREPRENEURSHIP

### Currently mapped manifestation modes

The current CAREER_MANIFESTATION_RULES implementation maps only:

- LEADERSHIP
- MANAGEMENT
- TECHNICAL_SPECIALIZATION
- SERVICE_EMPLOYMENT
- AUTHORITY
- INDEPENDENT_WORK
- BUSINESS_ENTREPRENEURSHIP

The remaining declared union members are not treated as implemented
manifestation mappings by C1.

The existing manifestation rule mapping remains authoritative for C1.

---

## Career house portfolio

Primary:

- 10

Supporting:

- 6
- 2
- 11

Challenging:

- 8
- 12

Primary lord:

- 10L

Supporting lords:

- 6L
- 2L
- 11L

Challenging lords:

- 8L
- 12L

---

## Important current limitations

### House relationships

The current implementation represents relationships through:

- linked
- reason

rather than a typed relationship taxonomy.

C2 will introduce structured relationship semantics.

C1 must not change this.

### Planetary relevance

Planetary relevance is already implemented in careerPlanetRules.ts.

C3 must refine this source rather than introduce a second relevance engine.

### D10

D10 already exists at both:

- Theme Interpretation confirmation level
- dedicated Career manifestation level

D10 is a qualification/confirmation layer.

D10 must not independently establish Career promise.

### Dasha

Dasha currently has:

- basic Career timing evidence
- CW-09 planetary synthesis

These are not to be replaced by a third Dasha engine.

---

## Hard invariants

1. DomainEvidence remains the canonical Career evidence envelope.

2. ThemeInterpretation remains the authoritative producer of existing
   Career evidence.

3. Career evidence mapping remains the boundary between engine evidence
   and domain reasoning.

4. Career reasoning must not recalculate natal astrology.

5. D10 cannot establish Career promise independently.

6. Dasha cannot establish natal Career promise independently.

7. Transit cannot establish natal Career promise independently.

8. Missing evidence is not negative evidence.

9. Existing Career rule IDs must not silently change.

10. Existing manifestation modes must not silently change.

11. C1 must not modify the semantic behavior of existing Career rules.

12. C2-C7 must extend the frozen sources rather than create parallel
    Career semantic engines.

---

## C1 completion condition

C1 is complete when:

- all current Career rule IDs are inventoried;
- all rule sources are identified;
- semantic ownership is documented;
- actual rule arrays are tested against the inventory;
- Career house portfolio is frozen;
- manifestation mapping is frozen;
- DomainEvidence remains canonical;
- D10/Dasha ownership boundaries are documented;
- no production Career behavior has changed.
