import { DashaReasoningEvidence, DashaEvidenceEffect } from './dashaReasoningTypes';
import { DirectionalEvidenceInput } from './dashaDirectionalEvidence';

function findFactId(
  evidenceList: readonly DashaReasoningEvidence[] | undefined,
  predicate: (e: DashaReasoningEvidence) => boolean,
  fallbackId: string
): string {
  if (evidenceList) {
    const found = evidenceList.find(predicate);
    if (found) {
      return found.id;
    }
  }
  return fallbackId;
}

/**
 * Derives directional dasha reasoning evidence (IMPLICATION and OUTCOME levels)
 * from structured activation inputs.
 *
 * Rules:
 * 1. Placement and ownership establish thematic RELEVANCE (IMPLICATION level with NEUTRAL effect).
 * 2. Planetary condition (dignity, functional nature, state, strength, yogas) is synthesized into
 *    a directional OUTCOME with SUPPORT, CHALLENGE, or MIXED effect and deterministic confidence.
 * 3. Preserves complete source evidence lineage.
 */
export function deriveDirectionalDashaEvidence(
  input: DirectionalEvidenceInput
): readonly DashaReasoningEvidence[] {
  const derived: DashaReasoningEvidence[] = [];
  const reasoningFacts = input.reasoningEvidence ?? [];

  // Pass-through any pre-existing IMPLICATION or OUTCOME items
  for (const item of reasoningFacts) {
    if (item.level === 'IMPLICATION' || item.level === 'OUTCOME') {
      derived.push(item);
    }
  }

  // 1. Placement Implication (Relevance only -> NEUTRAL)
  const placementFactId = findFactId(
    reasoningFacts,
    (e) => e.level === 'FACT' && e.basis === 'PLACEMENT' && e.activatedHouses.includes(input.house),
    `DASHA_REASONING:FACT:DASHA_LORD_PLACEMENT:${input.planet}:${input.house}:NEUTRAL`
  );

  derived.push(
    Object.freeze({
      id: `DASHA_REASONING:IMPLICATION:PLACEMENT_RELEVANCE:${input.planet}:${input.house}:NEUTRAL`,
      level: 'IMPLICATION',
      basis: 'PLACEMENT',
      effect: 'NEUTRAL',
      statement: `Placement of ${input.planet} in House ${input.house} establishes thematic activation for House ${input.house} affairs during this dasha.`,
      confidence: 1.0,
      sourceEvidenceIds: Object.freeze([placementFactId]),
      activatedHouses: Object.freeze([input.house])
    })
  );

  // 2. Ownership Implications (Relevance only -> NEUTRAL)
  const ownedHouses = input.ownedHouses ?? [];
  for (const h of ownedHouses) {
    const ownershipFactId = findFactId(
      reasoningFacts,
      (e) => e.level === 'FACT' && e.basis === 'OWNERSHIP' && e.activatedHouses.includes(h),
      `DASHA_REASONING:FACT:DASHA_LORD_OWNERSHIP_${h}:${input.planet}:${h}:NEUTRAL`
    );

    derived.push(
      Object.freeze({
        id: `DASHA_REASONING:IMPLICATION:OWNERSHIP_RELEVANCE_${h}:${input.planet}:${h}:NEUTRAL`,
        level: 'IMPLICATION',
        basis: 'OWNERSHIP',
        effect: 'NEUTRAL',
        statement: `Ownership of House ${h} by ${input.planet} establishes thematic activation for House ${h} affairs during this dasha.`,
        confidence: 1.0,
        sourceEvidenceIds: Object.freeze([ownershipFactId]),
        activatedHouses: Object.freeze([h])
      })
    );
  }

  // 3. Cast Aspect Implications (Relevance -> NEUTRAL)
  if (input.castAspects && input.castAspects.length > 0) {
    for (const aspect of input.castAspects) {
      if (aspect.targetHouse !== undefined) {
        const targetH = aspect.targetHouse;
        const aspectFactId = findFactId(
          reasoningFacts,
          (e) => e.level === 'FACT' && e.basis === 'ASPECT' && e.activatedHouses.includes(targetH),
          `DASHA_REASONING:FACT:DASHA_LORD_CAST_ASPECT_${aspect.aspectType}_H${targetH}:${input.planet}:${targetH}:NEUTRAL`
        );

        derived.push(
          Object.freeze({
            id: `DASHA_REASONING:IMPLICATION:CAST_ASPECT_${aspect.aspectType}_H${targetH}:${input.planet}:${targetH}:NEUTRAL`,
            level: 'IMPLICATION',
            basis: 'ASPECT',
            effect: 'NEUTRAL',
            statement: `Dasha lord ${input.planet} casts ${aspect.aspectType} aspect on House ${targetH}, exerting directional influence.`,
            confidence: 1.0,
            sourceEvidenceIds: Object.freeze([aspectFactId]),
            activatedHouses: Object.freeze([targetH])
          })
        );
      }
    }
  }

  // 4. Directional Planetary Condition Outcome Synthesis
  let supportScore = 0;
  let challengeScore = 0;
  const contributingFactIds: string[] = [];

  // A. Dignity
  if (input.dignity) {
    const dignityStr = String(input.dignity);
    const dignityFactId = findFactId(
      reasoningFacts,
      (e) => e.level === 'FACT' && e.basis === 'DIGNITY',
      `DASHA_REASONING:FACT:DASHA_LORD_DIGNITY:${input.planet}::${dignityStr === 'EXALTED' ? 'SUPPORT' : dignityStr === 'DEBILITATED' ? 'CHALLENGE' : 'NEUTRAL'}`
    );

    if (dignityStr === 'EXALTED') {
      supportScore += 2.0;
      contributingFactIds.push(dignityFactId);
    } else if (dignityStr === 'MOOLATRIKONA') {
      supportScore += 1.5;
      contributingFactIds.push(dignityFactId);
    } else if (dignityStr === 'OWN_SIGN' || dignityStr === 'OWN') {
      supportScore += 1.25;
      contributingFactIds.push(dignityFactId);
    } else if (dignityStr === 'GREAT_FRIEND_SIGN' || dignityStr === 'GREAT_FRIEND' || dignityStr === 'FRIEND_SIGN' || dignityStr === 'FRIEND') {
      supportScore += 0.75;
      contributingFactIds.push(dignityFactId);
    } else if (dignityStr === 'DEBILITATED') {
      challengeScore += 2.0;
      contributingFactIds.push(dignityFactId);
    } else if (dignityStr === 'GREAT_ENEMY_SIGN' || dignityStr === 'GREAT_ENEMY' || dignityStr === 'ENEMY_SIGN' || dignityStr === 'ENEMY') {
      challengeScore += 0.75;
      contributingFactIds.push(dignityFactId);
    }
  }

  // B. Functional Nature / Roles
  if (input.functionalNature) {
    const natureStr = String(input.functionalNature);
    const natureFactId = findFactId(
      reasoningFacts,
      (e) => e.level === 'FACT' && e.basis === 'FUNCTIONAL_NATURE',
      `DASHA_REASONING:FACT:DASHA_LORD_NATURE:${input.planet}::NEUTRAL`
    );

    if (natureStr === 'BENEFIC') {
      supportScore += 1.25;
      contributingFactIds.push(natureFactId);
    } else if (natureStr === 'MALEFIC') {
      challengeScore += 1.25;
      contributingFactIds.push(natureFactId);
    }
  }

  const isYogakaraka = input.functionalRoles && input.functionalRoles.some((r) => String(r) === 'YOGAKARAKA');
  if (isYogakaraka) {
    supportScore += 1.5;
  }

  // C. Planetary State / Afflictions
  if (input.state) {
    const stateFactId = findFactId(
      reasoningFacts,
      (e) => e.level === 'FACT' && e.basis === 'STATE',
      `DASHA_REASONING:FACT:DASHA_LORD_STATE:${input.planet}::NEUTRAL`
    );

    const conditionStr = String(input.state.condition ?? '');
    const isCombust = conditionStr === 'COMBUST' || conditionStr === 'DEEP_COMBUST' || Boolean((input.state as { combust?: boolean }).combust);

    if (isCombust) {
      challengeScore += 1.5;
      contributingFactIds.push(stateFactId);
    }
  }

  // D. Planetary Strength
  if (input.strength) {
    const strengthFactId = findFactId(
      reasoningFacts,
      (e) => e.level === 'FACT' && e.basis === 'STRENGTH',
      `DASHA_REASONING:FACT:DASHA_LORD_STRENGTH:${input.planet}::NEUTRAL`
    );

    if (typeof input.strength.totalRupa === 'number') {
      if (input.strength.totalRupa >= 7.0) {
        supportScore += 1.5;
        contributingFactIds.push(strengthFactId);
      } else if (input.strength.totalRupa < 5.0) {
        challengeScore += 1.5;
        contributingFactIds.push(strengthFactId);
      }
    } else if (input.strength.meetsMinimum === true) {
      supportScore += 1.0;
      contributingFactIds.push(strengthFactId);
    } else if (input.strength.meetsMinimum === false) {
      challengeScore += 1.0;
      contributingFactIds.push(strengthFactId);
    }
  }

  // E. Benefic Yogas
  if (input.yogaParticipation && input.yogaParticipation.length > 0) {
    let yogaScoreAdded = 0;
    for (const y of input.yogaParticipation) {
      if (y.finalStatus !== 'CANCELLED' && yogaScoreAdded < 3.0) {
        const yogaFactId = findFactId(
          reasoningFacts,
          (e) => e.level === 'FACT' && e.basis === 'YOGA' && (e.id.includes(y.yogaType) || e.statement.includes(y.yogaType)),
          `DASHA_REASONING:FACT:DASHA_LORD_YOGA_${y.yogaType}:${input.planet}::NEUTRAL`
        );
        supportScore += 1.0;
        yogaScoreAdded += 1.0;
        contributingFactIds.push(yogaFactId);
      }
    }
  }

  const totalPoints = supportScore + challengeScore;
  let outcomeEffect: DashaEvidenceEffect = 'NEUTRAL';
  let outcomeConfidence = 0;
  let outcomeStatement = `Planetary condition of ${input.planet} has neutral directional strength without dominant supportive or challenging factors.`;

  if (totalPoints > 0) {
    if (challengeScore === 0 && supportScore > 0) {
      outcomeEffect = 'SUPPORT';
      outcomeConfidence = Math.min(1.0, Math.max(0.5, supportScore / 3.0));
      outcomeStatement = `Planetary condition of ${input.planet} indicates supportive astrological influences based on dignity, functional nature, and strength.`;
    } else if (supportScore === 0 && challengeScore > 0) {
      outcomeEffect = 'CHALLENGE';
      outcomeConfidence = Math.min(1.0, Math.max(0.5, challengeScore / 3.0));
      outcomeStatement = `Planetary condition of ${input.planet} indicates challenging astrological influences based on dignity, affliction, or weakness.`;
    } else {
      if (supportScore >= 1.5 * challengeScore) {
        outcomeEffect = 'SUPPORT';
        outcomeConfidence = Math.min(1.0, Math.max(0.3, (supportScore - challengeScore) / totalPoints));
        outcomeStatement = `Planetary condition of ${input.planet} leans supportive despite minor challenging factors.`;
      } else if (challengeScore >= 1.5 * supportScore) {
        outcomeEffect = 'CHALLENGE';
        outcomeConfidence = Math.min(1.0, Math.max(0.3, (challengeScore - supportScore) / totalPoints));
        outcomeStatement = `Planetary condition of ${input.planet} leans challenging despite minor supportive factors.`;
      } else {
        outcomeEffect = 'MIXED';
        outcomeConfidence = Math.min(1.0, Math.abs(supportScore - challengeScore) / totalPoints);
        outcomeStatement = `Planetary condition of ${input.planet} shows mixed supportive and challenging influences.`;
      }
    }
  }

  const allActivatedHouses = Array.from(
    new Set([input.house, ...(input.ownedHouses ?? [])])
  ).sort((a, b) => a - b);

  derived.push(
    Object.freeze({
      id: `DASHA_REASONING:OUTCOME:PLANETARY_CONDITION:${input.planet}::${outcomeEffect}`,
      level: 'OUTCOME',
      basis: 'COMBINATION',
      effect: outcomeEffect,
      statement: outcomeStatement,
      confidence: outcomeConfidence,
      sourceEvidenceIds: Object.freeze([...new Set(contributingFactIds)]),
      activatedHouses: Object.freeze(allActivatedHouses)
    })
  );

  return Object.freeze(derived);
}
