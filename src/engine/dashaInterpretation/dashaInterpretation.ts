import {
  Planet,
  Sign,
  DashaSystem,
  ShadbalaAggregationStatus
} from '../../types';
import { calculateNaturalRelationship } from '../chartMath';
import { getActiveDasha } from '../dasha/vimshottari';
import {
  InterpretationConfidence
} from '../planetInterpretation/planetInterpretationTypes';
import { HOUSE_DOMAIN_METADATA } from '../houseInterpretation/houseInterpretationTypes';
import {
  DashaInterpretationInput,
  DashaInterpretationReport,
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation,
  DashaPratyantardashaInterpretation,
  DashaPlanetActivation,
  DashaInterpretationEvidence,
  DashaInterpretationSummary,
  DashaYogaReference,
  DashaPairInterpretation,
  ActiveDashaInterpretation,
  DashaBirthAnchor
} from './dashaInterpretationTypes';

function combineInterpretationConfidence(
  ...levels: InterpretationConfidence[]
): InterpretationConfidence {
  if (levels.includes('LOW')) return 'LOW';
  if (levels.includes('MEDIUM')) return 'MEDIUM';
  return 'HIGH';
}

function computeConfidenceForPlanet(
  planet: Planet,
  input: DashaInterpretationInput
): InterpretationConfidence {
  const pInterp = input.planetInterpretation?.planets?.[planet];
  const pRoles = input.functionalRoles?.planets?.[planet];
  const pAnalysis = input.planetAnalysis?.planets?.[planet];

  if (!pInterp || !pRoles || !pAnalysis) {
    return 'LOW';
  }

  if (!pInterp.strength) {
    return 'MEDIUM';
  }

  if (pInterp.strength.availability === 'INCOMPLETE') {
    return 'MEDIUM';
  }

  if (pInterp.strength.availability === 'AVAILABLE') {
    return 'HIGH';
  }

  return 'MEDIUM';
}

function computeOverallConfidence(input: DashaInterpretationInput): InterpretationConfidence {
  if (
    !input.vimshottari ||
    !input.planetInterpretation ||
    !input.houseInterpretation ||
    !input.functionalRoles ||
    !input.natalGrahaDrishti ||
    !input.yogas ||
    !input.planetAnalysis
  ) {
    return 'LOW';
  }

  let allHigh = true;
  for (const p of Object.values(Planet)) {
    const conf = computeConfidenceForPlanet(p, input);
    if (conf === 'LOW') return 'LOW';
    if (conf === 'MEDIUM') allHigh = false;
  }

  return allHigh ? 'HIGH' : 'MEDIUM';
}

function buildActivation(
  planet: Planet,
  level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA',
  input: DashaInterpretationInput
): DashaPlanetActivation {
  const pInterp = input.planetInterpretation.planets[planet];
  const pRoles = input.functionalRoles.planets[planet];
  const pAnalysis = input.planetAnalysis.planets[planet];

  const house = pInterp.placement.house;
  const houseInterp = input.houseInterpretation?.houses?.[house];
  const houseEvidence = Object.freeze([...(houseInterp?.evidence ?? [])]);

  const sign = pInterp.placement.sign;
  const ownedHouses = pRoles.ownedHouses ?? [];
  const functionalRoles = pRoles.roles ?? [];
  const functionalNature = pRoles.functionalNature;
  const dignity = pAnalysis.dignity?.status;
  const state = pAnalysis.state;
  const strength = pInterp.strength;

  const castAspects = Object.freeze(
    (input.natalGrahaDrishti.aspects ?? []).filter(a => a.sourcePlanet === planet)
  );
  const receivedAspects = Object.freeze(
    (input.natalGrahaDrishti.aspects ?? []).filter(a => a.targetPlanet === planet)
  );

  const yogaParticipation: DashaYogaReference[] = [];
  for (const y of input.yogas.yogas ?? []) {
    if (y.planets.includes(planet)) {
      const rawRel = (y as any).relationship ?? (y as any).participantRelationships?.[planet];
      let relationship: 'PLANET' | 'HOUSE_LORD' | 'OCCUPANT' = 'PLANET';
      if (rawRel === 'HOUSE_LORD' || rawRel === 'OCCUPANT' || rawRel === 'PLANET') {
        relationship = rawRel;
      }
      yogaParticipation.push(
        Object.freeze({
          yogaType: y.type,
          yogaId: y.type,
          strength: y.assessment?.strength,
          finalStatus: y.assessment?.finalStatus,
          relationship
        })
      );
    }
  }

  const evidence: DashaInterpretationEvidence[] = [];

  // DASHA_LORD
  evidence.push(
    Object.freeze({
      ruleId: 'DASHA_LORD_ACTIVATION',
      type: 'DASHA_LORD',
      level,
      planets: Object.freeze([planet]),
      statement: `Dasha lord ${planet} is activated at ${level} level.`,
      effect: 'NEUTRAL',
      source: 'Dasha Engine'
    })
  );

  // HOUSE_PLACEMENT
  evidence.push(
    Object.freeze({
      ruleId: 'DASHA_LORD_PLACEMENT',
      type: 'HOUSE_PLACEMENT',
      level,
      planets: Object.freeze([planet]),
      houses: Object.freeze([house]),
      statement: `Dasha lord ${planet} occupies House ${house}.`,
      effect: 'NEUTRAL',
      source: 'Planet Interpretation'
    })
  );

  // HOUSE_OWNERSHIP
  for (const h of ownedHouses) {
    evidence.push(
      Object.freeze({
        ruleId: `DASHA_LORD_OWNERSHIP_${h}`,
        type: 'HOUSE_OWNERSHIP',
        level,
        planets: Object.freeze([planet]),
        houses: Object.freeze([h]),
        statement: `Dasha lord ${planet} owns House ${h}.`,
        effect: 'NEUTRAL',
        source: 'Functional Roles'
      })
    );
  }

  // FUNCTIONAL_ROLE
  for (const role of functionalRoles) {
    evidence.push(
      Object.freeze({
        ruleId: `DASHA_LORD_ROLE_${role}`,
        type: 'FUNCTIONAL_ROLE',
        level,
        planets: Object.freeze([planet]),
        statement: `Dasha lord ${planet} operates as ${role}.`,
        effect: 'NEUTRAL',
        source: 'Functional Roles'
      })
    );
  }

  // FUNCTIONAL_NATURE
  if (functionalNature) {
    evidence.push(
      Object.freeze({
        ruleId: 'DASHA_LORD_NATURE',
        type: 'FUNCTIONAL_NATURE',
        level,
        planets: Object.freeze([planet]),
        statement: `Dasha lord ${planet} is functionally ${functionalNature}.`,
        effect: 'NEUTRAL',
        source: 'Functional Roles'
      })
    );
  }

  // DIGNITY
  if (dignity) {
    let effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
    if (dignity === 'EXALTED') effect = 'SUPPORT';
    else if (dignity === 'DEBILITATED') effect = 'CHALLENGE';

    evidence.push(
      Object.freeze({
        ruleId: 'DASHA_LORD_DIGNITY',
        type: 'DIGNITY',
        level,
        planets: Object.freeze([planet]),
        statement: `Dasha lord ${planet} is in ${dignity} dignity.`,
        effect,
        source: 'Planet Analysis'
      })
    );
  }

  // STATE
  if (state) {
    let stateStr = '';
    if (state.condition) stateStr += `${state.condition}`;
    if (state.motion?.retrograde) stateStr += (stateStr ? ' and ' : '') + 'retrograde';
    if (!stateStr) stateStr = 'direct';

    evidence.push(
      Object.freeze({
        ruleId: 'DASHA_LORD_STATE',
        type: 'STATE',
        level,
        planets: Object.freeze([planet]),
        statement: `Dasha lord ${planet} is ${stateStr}.`,
        effect: 'NEUTRAL',
        source: 'Planet Analysis'
      })
    );
  }

  // STRENGTH
  evidence.push(
    Object.freeze({
      ruleId: 'DASHA_LORD_STRENGTH',
      type: 'STRENGTH',
      level,
      planets: Object.freeze([planet]),
      statement: `Dasha lord ${planet} strength availability is ${strength?.availability ?? 'NOT_AVAILABLE'}.`,
      effect: 'NEUTRAL',
      source: 'Planet Interpretation'
    })
  );

  // ASPECT_CAST
  for (const a of castAspects) {
    evidence.push(
      Object.freeze({
        ruleId: `DASHA_LORD_CAST_ASPECT_${a.aspectType}_H${a.targetHouse}`,
        type: 'ASPECT_CAST',
        level,
        planets: Object.freeze([planet]),
        houses: Object.freeze([a.targetHouse]),
        statement: `Dasha lord ${planet} casts ${a.aspectType} aspect on House ${a.targetHouse}.`,
        effect: 'NEUTRAL',
        source: 'Natal Graha Drishti'
      })
    );
  }

  // ASPECT_RECEIVED
  for (const a of receivedAspects) {
    evidence.push(
      Object.freeze({
        ruleId: `DASHA_LORD_RECEIVED_ASPECT_${a.aspectType}_P${a.sourcePlanet}`,
        type: 'ASPECT_RECEIVED',
        level,
        planets: Object.freeze([planet, a.sourcePlanet]),
        houses: Object.freeze([a.sourceHouse]),
        statement: `Dasha lord ${planet} receives ${a.aspectType} aspect from ${a.sourcePlanet} in House ${a.sourceHouse}.`,
        effect: 'NEUTRAL',
        source: 'Natal Graha Drishti'
      })
    );
  }

  // YOGA
  for (const yRef of yogaParticipation) {
    evidence.push(
      Object.freeze({
        ruleId: `DASHA_LORD_YOGA_${yRef.yogaType}`,
        type: 'YOGA',
        level,
        planets: Object.freeze([planet]),
        statement: `Dasha lord ${planet} participates in ${yRef.yogaType} yoga (status: ${yRef.finalStatus ?? 'PRESENT'}).`,
        effect: 'NEUTRAL',
        source: 'Yoga Engine'
      })
    );
  }

  // HOUSE_DOMAIN
  let domainStatement: string | undefined;
  let domainSource = 'House Domain Metadata';

  if (houseInterp) {
    domainSource = 'House Interpretation';
    const p16DomainEv = houseInterp.evidence?.find(e => e.type === 'DOMAIN');
    if (p16DomainEv) {
      domainStatement = p16DomainEv.statement;
    } else {
      const domains = HOUSE_DOMAIN_METADATA[house]?.primaryThemes ?? [];
      if (domains.length > 0) {
        domainStatement = `House ${house} governs ${domains.join(', ')}.`;
      }
    }
  } else {
    const domains = HOUSE_DOMAIN_METADATA[house]?.primaryThemes ?? [];
    if (domains.length > 0) {
      domainStatement = `House ${house} governs ${domains.join(', ')}.`;
    }
  }

  if (domainStatement) {
    evidence.push(
      Object.freeze({
        ruleId: 'DASHA_LORD_HOUSE_DOMAIN',
        type: 'HOUSE_DOMAIN',
        level,
        planets: Object.freeze([planet]),
        houses: Object.freeze([house]),
        statement: domainStatement,
        effect: 'NEUTRAL',
        source: domainSource
      })
    );
  }

  return Object.freeze({
    planet,
    house,
    sign,
    ownedHouses: Object.freeze([...ownedHouses]),
    functionalRoles: Object.freeze([...functionalRoles]),
    functionalNature,
    dignity,
    state,
    strength,
    castAspects,
    receivedAspects,
    yogaParticipation: Object.freeze(yogaParticipation),
    houseInterpretationReference: house,
    houseEvidence,
    evidence: Object.freeze(evidence)
  });
}

function buildSummary(
  activation: DashaPlanetActivation,
  evidenceList: readonly DashaInterpretationEvidence[]
): DashaInterpretationSummary {
  const primaryFactors: string[] = [
    `Dasha lord ${activation.planet} placed in House ${activation.house} (${activation.sign}).`,
    `Owns House(s): ${activation.ownedHouses.join(', ') || 'None'}.`,
    `Roles: ${activation.functionalRoles.join(', ') || 'None'}.`
  ];
  if (activation.dignity) {
    primaryFactors.push(`Dignity: ${activation.dignity}.`);
  }

  const supportingFactors: string[] = [];
  const challengingFactors: string[] = [];
  const unresolvedFactors: string[] = [];

  for (const ev of evidenceList) {
    if (ev.effect === 'SUPPORT') {
      supportingFactors.push(ev.statement);
    } else if (ev.effect === 'CHALLENGE') {
      challengingFactors.push(ev.statement);
    }
  }

  if (activation.strength?.availability === 'INCOMPLETE') {
    unresolvedFactors.push('Planetary strength assessment is incomplete.');
  } else if (!activation.strength) {
    unresolvedFactors.push('Planetary strength assessment is not available.');
  }

  if (!activation.dignity) {
    unresolvedFactors.push('Dignity information is not available.');
  }

  return Object.freeze({
    primaryFactors: Object.freeze(primaryFactors),
    supportingFactors: Object.freeze(supportingFactors),
    challengingFactors: Object.freeze(challengingFactors),
    unresolvedFactors: Object.freeze(unresolvedFactors)
  });
}

function buildPairInterpretation(
  mdLord: Planet,
  adLord: Planet,
  input: DashaInterpretationInput
): DashaPairInterpretation {
  const mdRoles = input.functionalRoles.planets[mdLord];
  const adRoles = input.functionalRoles.planets[adLord];
  const mdInterp = input.planetInterpretation.planets[mdLord];
  const adInterp = input.planetInterpretation.planets[adLord];

  const mdOwned = mdRoles.ownedHouses ?? [];
  const adOwned = adRoles.ownedHouses ?? [];

  const sharedHouses = Object.freeze(
    mdOwned.filter(h => adOwned.includes(h)).sort((a, b) => a - b)
  );

  const combinedSet = new Set<number>([
    ...mdOwned,
    ...adOwned,
    mdInterp.placement.house,
    adInterp.placement.house
  ]);
  const combinedHouseSet = Object.freeze(Array.from(combinedSet).sort((a, b) => a - b));

  const relEvidence: DashaInterpretationEvidence[] = [];

  for (const sh of sharedHouses) {
    relEvidence.push(
      Object.freeze({
        ruleId: `PAIR_SHARED_HOUSE_${sh}`,
        type: 'SHARED_HOUSE',
        level: 'PAIR',
        planets: Object.freeze([mdLord, adLord]),
        houses: Object.freeze([sh]),
        statement: `Mahadasha lord ${mdLord} and Antardasha lord ${adLord} share ownership of House ${sh}.`,
        effect: 'NEUTRAL',
        source: 'Functional Roles'
      })
    );
  }

  relEvidence.push(
    Object.freeze({
      ruleId: 'PAIR_MD_PLACEMENT',
      type: 'HOUSE_PLACEMENT',
      level: 'PAIR',
      planets: Object.freeze([mdLord]),
      houses: Object.freeze([mdInterp.placement.house]),
      statement: `Mahadasha lord ${mdLord} occupies House ${mdInterp.placement.house}.`,
      effect: 'NEUTRAL',
      source: 'Planet Interpretation'
    })
  );

  relEvidence.push(
    Object.freeze({
      ruleId: 'PAIR_AD_PLACEMENT',
      type: 'HOUSE_PLACEMENT',
      level: 'PAIR',
      planets: Object.freeze([adLord]),
      houses: Object.freeze([adInterp.placement.house]),
      statement: `Antardasha lord ${adLord} occupies House ${adInterp.placement.house}.`,
      effect: 'NEUTRAL',
      source: 'Planet Interpretation'
    })
  );

  const rel = calculateNaturalRelationship(mdLord, adLord);
  relEvidence.push(
    Object.freeze({
      ruleId: 'PAIR_NATURAL_RELATIONSHIP',
      type: 'PLANETARY_RELATIONSHIP',
      level: 'PAIR',
      planets: Object.freeze([mdLord, adLord]),
      statement: `Mahadasha lord ${mdLord} and Antardasha lord ${adLord} have a natural ${rel.toLowerCase()} relationship.`,
      effect: 'NEUTRAL',
      source: 'Natural Relationship Math'
    })
  );

  return Object.freeze({
    mahadashaLord: mdLord,
    antardashaLord: adLord,
    sharedHouses,
    combinedHouseSet,
    relationshipEvidence: Object.freeze(relEvidence)
  });
}

function parseAndValidateDate(value: string, label: string): number {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    throw new TypeError(`Malformed Vimshottari timeline: invalid ${label} date.`);
  }
  return time;
}

export function validateDashaInterpretationInput(input: DashaInterpretationInput): void {
  if (!input) {
    throw new TypeError('Dasha interpretation input must not be null or undefined.');
  }

  if (!input.vimshottari) {
    throw new TypeError('Vimshottari dasha timeline is required.');
  }
  if (!input.planetInterpretation) {
    throw new TypeError('Planet interpretation report is required.');
  }
  if (!input.houseInterpretation) {
    throw new TypeError('House interpretation report is required.');
  }
  if (!input.functionalRoles) {
    throw new TypeError('Functional roles analysis report is required.');
  }
  if (!input.natalGrahaDrishti) {
    throw new TypeError('Natal graha drishti report is required.');
  }
  if (!input.yogas) {
    throw new TypeError('Yoga analysis report is required.');
  }
  if (!input.planetAnalysis) {
    throw new TypeError('Planet analysis report is required.');
  }

  for (const p of Object.values(Planet)) {
    if (!input.planetInterpretation.planets?.[p]) {
      throw new TypeError(`planetInterpretation is missing required planet: ${p}.`);
    }
    if (!input.functionalRoles.planets?.[p]) {
      throw new TypeError(`functionalRoles is missing required planet: ${p}.`);
    }
    if (!input.planetAnalysis.planets?.[p]) {
      throw new TypeError(`planetAnalysis is missing required planet: ${p}.`);
    }
  }

  if (!input.vimshottari.mahadashas || !Array.isArray(input.vimshottari.mahadashas) || input.vimshottari.mahadashas.length === 0) {
    throw new TypeError('Malformed Vimshottari timeline: mahadashas array must be non-empty.');
  }

  for (let i = 0; i < input.vimshottari.mahadashas.length; i++) {
    const md = input.vimshottari.mahadashas[i];
    if (!md.start || !md.end) {
      throw new TypeError(`Malformed Vimshottari timeline: invalid Mahadasha dates for ${md.planet}.`);
    }
    const mdStartTime = parseAndValidateDate(md.start, 'Mahadasha');
    const mdEndTime = parseAndValidateDate(md.end, 'Mahadasha');

    if (mdEndTime < mdStartTime) {
      throw new TypeError(`Malformed Vimshottari timeline: invalid Mahadasha dates for ${md.planet}.`);
    }

    if (i > 0) {
      const prevMd = input.vimshottari.mahadashas[i - 1];
      const prevMdEndTime = parseAndValidateDate(prevMd.end, 'Mahadasha');
      if (prevMd.end !== md.start && prevMdEndTime !== mdStartTime) {
        throw new TypeError('Malformed Vimshottari timeline: non-contiguous Mahadasha boundaries.');
      }
    }

    if (!Array.isArray(md.antardashas) || md.antardashas.length === 0) {
      throw new TypeError(`Malformed Vimshottari timeline: antardashas array must be non-empty for ${md.planet}.`);
    }

    if (md.antardashas[0].start !== md.start && parseAndValidateDate(md.antardashas[0].start, 'Antardasha') !== mdStartTime) {
      throw new TypeError(
        `Malformed Vimshottari timeline: Antardasha sequence does not start at Mahadasha start for ${md.planet}.`
      );
    }

    const lastAd = md.antardashas[md.antardashas.length - 1];
    if (lastAd.end !== md.end && parseAndValidateDate(lastAd.end, 'Antardasha') !== mdEndTime) {
      throw new TypeError(
        `Malformed Vimshottari timeline: Antardasha sequence does not end at Mahadasha end for ${md.planet}.`
      );
    }

    for (let j = 0; j < md.antardashas.length; j++) {
      const ad = md.antardashas[j];
      if (!ad.start || !ad.end) {
        throw new TypeError(`Malformed Vimshottari timeline: invalid Antardasha dates for ${ad.planet}.`);
      }
      const adStartTime = parseAndValidateDate(ad.start, 'Antardasha');
      const adEndTime = parseAndValidateDate(ad.end, 'Antardasha');

      if (adEndTime < adStartTime) {
        throw new TypeError(`Malformed Vimshottari timeline: invalid Antardasha dates for ${ad.planet}.`);
      }

      if (adStartTime < mdStartTime || adEndTime > mdEndTime) {
        throw new TypeError(`Malformed Vimshottari timeline: Antardasha ${ad.planet} window falls outside Mahadasha ${md.planet}.`);
      }

      if (j > 0) {
        const prevAd = md.antardashas[j - 1];
        const prevAdEndTime = parseAndValidateDate(prevAd.end, 'Antardasha');
        if (prevAd.end !== ad.start && prevAdEndTime !== adStartTime) {
          throw new TypeError('Malformed Vimshottari timeline: non-contiguous Antardasha boundaries.');
        }
      }

      if (!Array.isArray(ad.pratyantardashas) || ad.pratyantardashas.length === 0) {
        throw new TypeError(`Malformed Vimshottari timeline: pratyantardashas array must be non-empty for ${ad.planet}.`);
      }

      if (ad.pratyantardashas[0].start !== ad.start && parseAndValidateDate(ad.pratyantardashas[0].start, 'Pratyantardasha') !== adStartTime) {
        throw new TypeError(
          `Malformed Vimshottari timeline: Pratyantardasha sequence does not start at Antardasha start for ${ad.planet}.`
        );
      }

      const lastPd = ad.pratyantardashas[ad.pratyantardashas.length - 1];
      if (lastPd.end !== ad.end && parseAndValidateDate(lastPd.end, 'Pratyantardasha') !== adEndTime) {
        throw new TypeError(
          `Malformed Vimshottari timeline: Pratyantardasha sequence does not end at Antardasha end for ${ad.planet}.`
        );
      }

      for (let k = 0; k < ad.pratyantardashas.length; k++) {
        const pd = ad.pratyantardashas[k];
        if (!pd.start || !pd.end) {
          throw new TypeError(`Malformed Vimshottari timeline: invalid Pratyantardasha dates for ${pd.planet}.`);
        }
        const pdStartTime = parseAndValidateDate(pd.start, 'Pratyantardasha');
        const pdEndTime = parseAndValidateDate(pd.end, 'Pratyantardasha');

        if (pdEndTime < pdStartTime) {
          throw new TypeError(`Malformed Vimshottari timeline: invalid Pratyantardasha dates for ${pd.planet}.`);
        }

        if (pdStartTime < adStartTime || pdEndTime > adEndTime) {
          throw new TypeError(`Malformed Vimshottari timeline: Pratyantardasha ${pd.planet} window falls outside Antardasha ${ad.planet}.`);
        }

        if (k > 0) {
          const prevPd = ad.pratyantardashas[k - 1];
          const prevPdEndTime = parseAndValidateDate(prevPd.end, 'Pratyantardasha');
          if (prevPd.end !== pd.start && prevPdEndTime !== pdStartTime) {
            throw new TypeError('Malformed Vimshottari timeline: non-contiguous Pratyantardasha boundaries.');
          }
        }
      }
    }
  }
}

export function analyzeDashaInterpretation(
  input: DashaInterpretationInput
): DashaInterpretationReport {
  validateDashaInterpretationInput(input);

  const birthAnchor: DashaBirthAnchor = Object.freeze({
    nakshatra: input.vimshottari.nakshatra,
    nakshatraLord: input.vimshottari.nakshatraLord,
    nakshatraProgress: input.vimshottari.nakshatraProgress,
    remainingFraction: input.vimshottari.remainingFraction
  });

  const mahadashasInterp: DashaMahadashaInterpretation[] = [];

  for (const md of input.vimshottari.mahadashas) {
    const mdLord = md.planet;
    const mdActivation = buildActivation(mdLord, 'MAHADASHA', input);
    const mdSummary = buildSummary(mdActivation, mdActivation.evidence);

    const antardashasInterp: DashaAntardashaInterpretation[] = [];

    for (const ad of md.antardashas) {
      const adLord = ad.planet;
      const adActivation = buildActivation(adLord, 'ANTARDASHA', input);
      const adSummary = buildSummary(adActivation, adActivation.evidence);
      const pairInterp = buildPairInterpretation(mdLord, adLord, input);

      const pratyantardashasInterp: DashaPratyantardashaInterpretation[] = [];

      for (const pd of ad.pratyantardashas) {
        const pdLord = pd.planet;
        const pdActivation = buildActivation(pdLord, 'PRATYANTARDASHA', input);
        const pdSummary = buildSummary(pdActivation, pdActivation.evidence);

        const pdInterp: DashaPratyantardashaInterpretation = Object.freeze({
          planet: pdLord,
          start: pd.start,
          end: pd.end,
          natal: pdActivation,
          evidence: pdActivation.evidence,
          confidence: computeConfidenceForPlanet(pdLord, input),
          summary: pdSummary
        });

        pratyantardashasInterp.push(pdInterp);
      }

      const adInterp: DashaAntardashaInterpretation = Object.freeze({
        planet: adLord,
        start: ad.start,
        end: ad.end,
        natal: adActivation,
        pratyantardashas: Object.freeze(pratyantardashasInterp),
        evidence: adActivation.evidence,
        confidence: computeConfidenceForPlanet(adLord, input),
        summary: adSummary,
        pairInterpretation: pairInterp
      });

      antardashasInterp.push(adInterp);
    }

    const mdInterp: DashaMahadashaInterpretation = Object.freeze({
      planet: mdLord,
      start: md.start,
      end: md.end,
      natal: mdActivation,
      antardashas: Object.freeze(antardashasInterp),
      evidence: mdActivation.evidence,
      confidence: computeConfidenceForPlanet(mdLord, input),
      summary: mdSummary
    });

    mahadashasInterp.push(mdInterp);
  }

  const reportConfidence = computeOverallConfidence(input);

  const report: DashaInterpretationReport = Object.freeze({
    system: DashaSystem.VIMSHOTTARI,
    birthAnchor,
    mahadashas: Object.freeze(mahadashasInterp),
    confidence: reportConfidence
  });

  return report;
}

export function analyzeActiveDasha(
  input: DashaInterpretationInput,
  at: string | Date
): ActiveDashaInterpretation | null {
  validateDashaInterpretationInput(input);

  if (!at) {
    throw new TypeError('at timestamp parameter is required for active dasha analysis.');
  }

  const atDate = typeof at === 'string' ? new Date(at) : at;
  if (!(atDate instanceof Date) || isNaN(atDate.getTime())) {
    throw new TypeError('Invalid date for at parameter.');
  }

  const activeState = getActiveDasha(input.vimshottari, at);
  if (!activeState) {
    return null;
  }

  const mdLord = activeState.mahadasha.planet;
  const adLord = activeState.antardasha.planet;
  const pdLord = activeState.pratyantardasha.planet;

  const mdActivation = buildActivation(mdLord, 'MAHADASHA', input);
  const adActivation = buildActivation(adLord, 'ANTARDASHA', input);
  const pdActivation = buildActivation(pdLord, 'PRATYANTARDASHA', input);

  const mdSummary = buildSummary(mdActivation, mdActivation.evidence);
  const adSummary = buildSummary(adActivation, adActivation.evidence);
  const pdSummary = buildSummary(pdActivation, pdActivation.evidence);

  const pairInterp = buildPairInterpretation(mdLord, adLord, input);

  const pdInterp: DashaPratyantardashaInterpretation = Object.freeze({
    planet: pdLord,
    start: activeState.pratyantardasha.start,
    end: activeState.pratyantardasha.end,
    natal: pdActivation,
    evidence: pdActivation.evidence,
    confidence: computeConfidenceForPlanet(pdLord, input),
    summary: pdSummary
  });

  const adInterp: DashaAntardashaInterpretation = Object.freeze({
    planet: adLord,
    start: activeState.antardasha.start,
    end: activeState.antardasha.end,
    natal: adActivation,
    pratyantardashas: Object.freeze([pdInterp]),
    evidence: adActivation.evidence,
    confidence: computeConfidenceForPlanet(adLord, input),
    summary: adSummary,
    pairInterpretation: pairInterp
  });

  const mdInterp: DashaMahadashaInterpretation = Object.freeze({
    planet: mdLord,
    start: activeState.mahadasha.start,
    end: activeState.mahadasha.end,
    natal: mdActivation,
    antardashas: Object.freeze([adInterp]),
    evidence: mdActivation.evidence,
    confidence: computeConfidenceForPlanet(mdLord, input),
    summary: mdSummary
  });

  const allEvidence = Object.freeze([
    ...mdActivation.evidence,
    ...adActivation.evidence,
    ...pdActivation.evidence,
    ...pairInterp.relationshipEvidence
  ]);

  const mdConfidence = computeConfidenceForPlanet(mdLord, input);
  const adConfidence = computeConfidenceForPlanet(adLord, input);
  const pdConfidence = computeConfidenceForPlanet(pdLord, input);

  const activeConfidence = combineInterpretationConfidence(
    mdConfidence,
    adConfidence,
    pdConfidence
  );

  return Object.freeze({
    at: typeof at === 'string' ? at : at.toISOString(),
    mahadasha: mdInterp,
    antardasha: adInterp,
    pratyantardasha: pdInterp,
    evidence: allEvidence,
    confidence: activeConfidence
  });
}
