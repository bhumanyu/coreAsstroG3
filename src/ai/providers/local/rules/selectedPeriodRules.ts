import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import type { AiContext } from '../../../types/aiContextTypes';

/**
 * Selected-period analysis rules for local Vedic rules engine.
 *
 * These rules operate over the canonical selected-period synthesis context
 * (context.selectedPeriod) to produce structured conclusions about the
 * selected Mahadasha-Antardasha period.
 *
 * Rules never fabricate evidence IDs - they only reference IDs that exist
 * in the projection's supportingEvidenceIds/challengingEvidenceIds arrays.
 */

export const SELECTED_PERIOD_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  Object.freeze({
    id: 'SP-01-CAREER-EXPRESSIONS',
    domain: 'DASHA',
    priority: 100,
    evaluate: (context: AiContext) => {
      if (!context.selectedPeriod) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const sp = context.selectedPeriod;
      const career = sp.career;

      if (career.expressions.length === 0) {
        return {
          triggered: true,
          effect: 'NEUTRAL' as LocalRuleEffect,
          statement: 'No career expressions are linked to the selected period.',
          unresolvedQuestions: [
            'Career activation may be unavailable for this period.'
          ]
        };
      }

      const activatingExprs = career.expressions.filter(e =>
        e.status === 'ACTIVATES' || e.status === 'PARTIALLY_ACTIVATES'
      );
      const challengingExprs = career.expressions.filter(e =>
        e.status === 'CHALLENGES' || e.status === 'DOES_NOT_ACTIVATE'
      );

      if (activatingExprs.length > challengingExprs.length) {
        return {
          triggered: true,
          effect: 'SUPPORT' as LocalRuleEffect,
          statement: `Career expressions show predominantly ${activatingExprs.length} activating indicators versus ${challengingExprs.length} challenging for the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period.`,
          supportingEvidenceIds: activatingExprs.flatMap(e => [
            ...e.expressionEvidenceIds,
            ...e.qualifiedEvidenceIds,
            ...e.mdDashaEvidenceIds,
            ...e.adDashaEvidenceIds
          ])
        };
      }

      if (challengingExprs.length > activatingExprs.length) {
        return {
          triggered: true,
          effect: 'CHALLENGE' as LocalRuleEffect,
          statement: `Career expressions show predominantly ${challengingExprs.length} challenging indicators versus ${activatingExprs.length} activating for the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period.`,
          challengingEvidenceIds: challengingExprs.flatMap(e => [
            ...e.expressionEvidenceIds,
            ...e.unqualifiedEvidenceIds,
            ...e.mdDashaEvidenceIds,
            ...e.adDashaEvidenceIds
          ])
        };
      }

      return {
        triggered: true,
        effect: 'MIXED' as LocalRuleEffect,
        statement: `Career expressions show balanced activation with ${activatingExprs.length} activating and ${challengingExprs.length} challenging indicators for the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period.`,
        supportingEvidenceIds: activatingExprs.flatMap(e => e.expressionEvidenceIds),
        challengingEvidenceIds: challengingExprs.flatMap(e => e.expressionEvidenceIds)
      };
    }
  }),

  Object.freeze({
    id: 'SP-02-WEALTH-DIMENSIONS',
    domain: 'DASHA',
    priority: 90,
    evaluate: (context: AiContext) => {
      if (!context.selectedPeriod) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const sp = context.selectedPeriod;
      const wealth = sp.wealth.dimensions;

      const activatingDims = Object.values(wealth).filter(d =>
        d.effect === 'ACTIVATES' || d.effect === 'PARTIALLY_ACTIVATES'
      );
      const challengingDims = Object.values(wealth).filter(d =>
        d.effect === 'CHALLENGES' || d.effect === 'DOES_NOT_ACTIVATE'
      );

      if (activatingDims.length === 0 && challengingDims.length === 0) {
        return {
          triggered: true,
          effect: 'NEUTRAL' as LocalRuleEffect,
          statement: 'Wealth dimension analysis shows insufficient data for the selected period.',
          unresolvedQuestions: [
            'Wealth activation may be unavailable for this period.'
          ]
        };
      }

      if (activatingDims.length > challengingDims.length) {
        const dimNames = activatingDims.map(d => d.dimension).join(', ');
        return {
          triggered: true,
          effect: 'SUPPORT' as LocalRuleEffect,
          statement: `Wealth dimensions show predominantly activating indicators in ${activatingDims.length} areas (${dimNames}) for the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period.`,
          supportingEvidenceIds: activatingDims.flatMap(d => d.promiseEvidenceIds)
        };
      }

      if (challengingDims.length > activatingDims.length) {
        const dimNames = challengingDims.map(d => d.dimension).join(', ');
        return {
          triggered: true,
          effect: 'CHALLENGE' as LocalRuleEffect,
          statement: `Wealth dimensions show predominantly challenging indicators in ${challengingDims.length} areas (${dimNames}) for the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period.`,
          challengingEvidenceIds: challengingDims.flatMap(d => d.promiseEvidenceIds)
        };
      }

      return {
        triggered: true,
        effect: 'MIXED' as LocalRuleEffect,
        statement: `Wealth dimensions show balanced activation with ${activatingDims.length} activating and ${challengingDims.length} challenging areas for the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period.`,
        supportingEvidenceIds: activatingDims.flatMap(d => d.promiseEvidenceIds),
        challengingEvidenceIds: challengingDims.flatMap(d => d.promiseEvidenceIds)
      };
    }
  }),

  Object.freeze({
    id: 'SP-03-MISSING-INPUTS',
    domain: 'DASHA',
    priority: 80,
    evaluate: (context: AiContext) => {
      if (!context.selectedPeriod) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const sp = context.selectedPeriod;

      if (sp.missingInputs.length === 0) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const careerMissing = sp.missingInputs.filter(mi => mi.domain === 'CAREER');
      const wealthMissing = sp.missingInputs.filter(mi => mi.domain === 'WEALTH');

      const questions: string[] = [];
      if (careerMissing.length > 0) {
        questions.push(`Career domain has ${careerMissing.length} missing inputs: ${careerMissing.map(mi => mi.code).join(', ')}.`);
      }
      if (wealthMissing.length > 0) {
        questions.push(`Wealth domain has ${wealthMissing.length} missing inputs: ${wealthMissing.map(mi => mi.code).join(', ')}.`);
      }

      return {
        triggered: true,
        effect: 'NEUTRAL' as LocalRuleEffect,
        statement: `Selected-period synthesis has ${sp.missingInputs.length} missing inputs across domains.`,
        unresolvedQuestions: questions
      };
    }
  }),

  Object.freeze({
    id: 'SP-04-DIAGNOSTICS',
    domain: 'DASHA',
    priority: 70,
    evaluate: (context: AiContext) => {
      if (!context.selectedPeriod) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const sp = context.selectedPeriod;

      if (sp.diagnostics.length === 0) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const warningCodes = sp.diagnostics.map(d => d.code);
      return {
        triggered: true,
        effect: 'NEUTRAL' as LocalRuleEffect,
        statement: `Selected-period synthesis reports ${sp.diagnostics.length} diagnostic codes: ${warningCodes.join(', ')}.`,
        warnings: sp.diagnostics.map(d => `${d.code}: ${d.message}`)
      };
    }
  }),

  Object.freeze({
    id: 'SP-05-EVIDENCE-SUMMARY',
    domain: 'DASHA',
    priority: 60,
    evaluate: (context: AiContext) => {
      if (!context.selectedPeriod) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const sp = context.selectedPeriod;

      if (sp.evidence.length === 0) {
        return {
          triggered: true,
          effect: 'NEUTRAL' as LocalRuleEffect,
          statement: 'No evidence references are available for the selected period.',
          unresolvedQuestions: [
            'Evidence resolution may be incomplete for this period.'
          ]
        };
      }

      const supportingCount = sp.supportingEvidenceIds.length;
      const challengingCount = sp.challengingEvidenceIds.length;

      return {
        triggered: true,
        effect: 'NEUTRAL' as LocalRuleEffect,
        statement: `Selected-period synthesis references ${sp.evidence.length} evidence items with ${supportingCount} supporting and ${challengingCount} challenging indicators.`,
        supportingEvidenceIds: sp.supportingEvidenceIds,
        challengingEvidenceIds: sp.challengingEvidenceIds
      };
    }
  }),

  Object.freeze({
    id: 'SP-06-TEMPORAL-RELATION',
    domain: 'DASHA',
    priority: 50,
    evaluate: (context: AiContext) => {
      if (!context.selectedPeriod) {
        return { triggered: false, effect: 'NEUTRAL' as LocalRuleEffect, statement: '' };
      }

      const sp = context.selectedPeriod;

      let statement = '';
      switch (sp.temporalRelation) {
        case 'PAST':
          statement = `The selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period is in the past relative to the analysis date (${sp.analysisAsOf}).`;
          break;
        case 'CURRENT':
          statement = `The selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period is currently active as of ${sp.analysisAsOf}.`;
          break;
        case 'FUTURE':
          statement = `The selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period is in the future relative to the analysis date (${sp.analysisAsOf}).`;
          break;
        case 'UNKNOWN':
          statement = `The temporal relation of the selected ${sp.mahadashaPlanet}-${sp.antardashaPlanet} period could not be determined.`;
          break;
      }

      return {
        triggered: true,
        effect: 'NEUTRAL' as LocalRuleEffect,
        statement
      };
    }
  })
]);
