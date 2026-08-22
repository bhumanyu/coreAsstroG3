import type { AiContext, AiEvidence } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
import { notTriggered, triggered } from '../utils/ruleResult';

interface LevelEvaluation {
  readonly effect: LocalRuleEffect;
  readonly supportingIds: readonly string[];
  readonly challengingIds: readonly string[];
}

function evaluateEvidenceIds(
  ids: readonly string[] | undefined,
  evidenceMap: Map<string, AiEvidence>
): LevelEvaluation {
  if (!ids || ids.length === 0) {
    return { effect: 'NEUTRAL', supportingIds: [], challengingIds: [] };
  }

  const supportingIds: string[] = [];
  const challengingIds: string[] = [];

  for (const id of ids) {
    const ev = evidenceMap.get(id);
    if (!ev) continue;
    if (ev.effect === 'SUPPORT') {
      supportingIds.push(id);
    } else if (ev.effect === 'CHALLENGE') {
      challengingIds.push(id);
    }
  }

  let effect: LocalRuleEffect = 'NEUTRAL';
  if (supportingIds.length > challengingIds.length) {
    effect = 'SUPPORT';
  } else if (challengingIds.length > supportingIds.length) {
    effect = 'CHALLENGE';
  } else if (supportingIds.length > 0 && challengingIds.length > 0) {
    effect = 'MIXED';
  }

  return { effect, supportingIds, challengingIds };
}

function combineHierarchicalDashaEffects(
  mdEval: LevelEvaluation,
  adEval: LevelEvaluation,
  pairEval: LevelEvaluation,
  pdEval: LevelEvaluation
): { finalEffect: LocalRuleEffect; secondaryEffect: LocalRuleEffect; baseEffect: LocalRuleEffect } {
  // Combine AD and Pair into secondary modification effect
  let secondaryEffect: LocalRuleEffect = 'NEUTRAL';
  if (
    (adEval.effect === 'SUPPORT' && pairEval.effect === 'CHALLENGE') ||
    (adEval.effect === 'CHALLENGE' && pairEval.effect === 'SUPPORT') ||
    adEval.effect === 'MIXED' ||
    pairEval.effect === 'MIXED'
  ) {
    secondaryEffect = 'MIXED';
  } else if (adEval.effect !== 'NEUTRAL') {
    secondaryEffect = adEval.effect;
  } else if (pairEval.effect !== 'NEUTRAL') {
    secondaryEffect = pairEval.effect;
  }

  // Combine MD (primary) with secondary (AD/pair)
  let baseEffect: LocalRuleEffect = 'NEUTRAL';
  if (mdEval.effect === 'SUPPORT') {
    if (secondaryEffect === 'CHALLENGE' || secondaryEffect === 'MIXED') {
      baseEffect = 'MIXED';
    } else {
      baseEffect = 'SUPPORT';
    }
  } else if (mdEval.effect === 'CHALLENGE') {
    if (secondaryEffect === 'SUPPORT' || secondaryEffect === 'MIXED') {
      baseEffect = 'MIXED';
    } else {
      baseEffect = 'CHALLENGE';
    }
  } else if (mdEval.effect === 'MIXED') {
    baseEffect = 'MIXED';
  } else {
    // MD is NEUTRAL, inherit secondary
    baseEffect = secondaryEffect;
  }

  // PD refinement: PD must not flip an established base direction
  let finalEffect: LocalRuleEffect = baseEffect;
  if (baseEffect === 'NEUTRAL') {
    finalEffect = pdEval.effect;
  }

  return { finalEffect, secondaryEffect, baseEffect };
}

export const DASHA_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-DASHA-001',
    domain: 'DASHA',
    priority: 90,
    evaluate(context: AiContext) {
      if (!context.dasha.active && context.dasha.periods.length === 0) {
        return notTriggered();
      }

      const active = context.dasha.active;
      const dashaEvidence = rankEvidence(
        context.evidence.filter(
          (e) => e.source === 'DASHA' || e.dashaLevel != null || e.timingReason != null
        )
      );

      const supportingIds = dashaEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = dashaEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (supportingIds.length > challengingIds.length) {
        effect = 'SUPPORT';
      } else if (challengingIds.length > supportingIds.length) {
        effect = 'CHALLENGE';
      } else if (supportingIds.length > 0 && challengingIds.length > 0) {
        effect = 'MIXED';
      }

      const statement = active
        ? `Active Vimshottari period hierarchy: Mahadasha of ${active.mahadasha} (primary)${
            active.antardasha ? `, Antardasha of ${active.antardasha} (secondary)` : ''
          }${
            active.pratyantardasha ? `, Pratyantardasha of ${active.pratyantardasha} (short-term)` : ''
          }.`
        : `Vimshottari Dasha system configured with ${context.dasha.periods.length} life cycle periods.`;

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-DASHA-002',
    domain: 'DASHA',
    priority: 75,
    evaluate(context: AiContext) {
      if (!context.dasha.active) {
        return triggered(
          'NEUTRAL',
          'No active Vimshottari Dasha period is available for timing interpretation.'
        );
      }

      const interpretation = context.dasha.interpretation;
      if (interpretation && interpretation.status === 'AVAILABLE') {
        const evidenceMap = new Map<string, AiEvidence>();
        for (const ev of context.evidence) {
          evidenceMap.set(ev.id, ev);
        }

        const md = interpretation.mahadasha;
        const ad = interpretation.antardasha;
        const pd = interpretation.pratyantardasha;
        const pair = interpretation.pair;

        const topLevelEval = evaluateEvidenceIds(interpretation.evidenceIds, evidenceMap);
        const mdEval = evaluateEvidenceIds(md?.evidenceIds, evidenceMap);
        const adEval = evaluateEvidenceIds(ad?.evidenceIds, evidenceMap);
        const pairEval = evaluateEvidenceIds(pair?.relationshipEvidenceIds, evidenceMap);
        const pdEval = evaluateEvidenceIds(pd?.evidenceIds, evidenceMap);

        const supportingIds = Array.from(
          new Set([
            ...topLevelEval.supportingIds,
            ...mdEval.supportingIds,
            ...adEval.supportingIds,
            ...pairEval.supportingIds,
            ...pdEval.supportingIds
          ])
        );

        const challengingIds = Array.from(
          new Set([
            ...topLevelEval.challengingIds,
            ...mdEval.challengingIds,
            ...adEval.challengingIds,
            ...pairEval.challengingIds,
            ...pdEval.challengingIds
          ])
        );

        if (supportingIds.length === 0 && challengingIds.length === 0) {
          return triggered(
            'NEUTRAL',
            'No directional timing evidence is available for the active Vimshottari period.',
            [],
            []
          );
        }

        const { finalEffect, secondaryEffect } = combineHierarchicalDashaEffects(
          mdEval,
          adEval,
          pairEval,
          pdEval
        );

        const parts: string[] = [];
        if (md) {
          parts.push(
            `Mahadasha of ${md.planet} establishes a ${mdEval.effect.toLowerCase()} primary timing foundation.`
          );
        }
        if (ad) {
          const modText =
            secondaryEffect === 'SUPPORT'
              ? 'reinforces supporting timing trends.'
              : secondaryEffect === 'CHALLENGE'
              ? 'introduces challenging timing influences.'
              : secondaryEffect === 'MIXED'
              ? 'presents mixed timing influences.'
              : 'operates with neutral modification.';
          parts.push(
            `Antardasha of ${ad.planet}${
              pair ? ` (with ${pair.mahadashaLord}-${pair.antardashaLord} relationship)` : ''
            } ${modText}`
          );
        }
        if (pd) {
          parts.push(
            `Pratyantardasha of ${pd.planet} provides ${pdEval.effect.toLowerCase()} short-term refinement.`
          );
        }
        parts.push(`Hierarchical timing outcome is ${finalEffect}.`);

        return triggered(finalEffect, parts.join(' '), supportingIds, challengingIds);
      }

      const timingEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            e.source === 'DASHA' ||
            e.dimension === 'TIMING' ||
            e.priority === 'TIMING' ||
            e.timingReason != null
        )
      );

      if (timingEvidence.length === 0) {
        return notTriggered();
      }

      const supportingIds = timingEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = timingEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (supportingIds.length > challengingIds.length) {
        effect = 'SUPPORT';
      } else if (challengingIds.length > supportingIds.length) {
        effect = 'CHALLENGE';
      } else if (supportingIds.length > 0 && challengingIds.length > 0) {
        effect = 'MIXED';
      }

      let statement =
        'No directional timing evidence is available for the active Vimshottari period.';

      if (effect === 'SUPPORT') {
        statement =
          'The active Vimshottari period has supporting deterministic timing evidence.';
      } else if (effect === 'CHALLENGE') {
        statement =
          'The active Vimshottari period has challenging deterministic timing evidence.';
      } else if (effect === 'MIXED') {
        statement =
          'The active Vimshottari period has both supporting and challenging deterministic timing evidence.';
      }

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
