# Wealth Evidence Source-Type Contract

`buildWealthEvidence` classifies natal evidence from the 2nd, 5th, 9th, and 11th
houses and their lords as `STRUCTURAL`. Planetary, strength, aspect, and yoga
families retain their existing source types. Explicit divisional evidence
(`WealthEvidenceFamily.D2` or evidence carrying `vargaEvidence`) is classified as
`VARGA` and retains `source: 'D2'` where the evidence identifies D2. Transit
classification takes precedence over varga and timing classification; varga
classification takes precedence over Dasha/timing classification.

VARGA denotes evidence that is actually present in the input, not a conclusion
about missing divisional data. A natal-only evidence list therefore produces no
`D2` source and no `VARGA` source type. This source classification does not
change Wealth promise, activation, dimension, or evidence-ID rules.
