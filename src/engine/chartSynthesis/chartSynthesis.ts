/** READ-ONLY CHART SYNTHESIS LAYER. MUST NOT RECALCULATE ASTROLOGY OR PRODUCE NUMERIC SCORES/PROBABILITIES/PREDICTIONS. */

import { Planet } from '../../types';
import { LifeTheme } from '../lifeThemes/lifeThemeTypes';
import { InterpretationConfidence } from '../planetInterpretation/planetInterpretationTypes';
import {
  ChartSynthesisInput,
  ChartSynthesisReport,
  ThemeSynthesis,
  SynthesisEvidence,
  SynthesisState,
  SynthesisEvidenceFamily,
  SynthesisObservation
} from './chartSynthesisTypes';
import {
  CHART_SYNTHESIS_THEME_ORDER,
  getSynthesisThemeLabel,
  mapEvidenceSourceToCoarseSource,
  mapEvidenceSourceToFamily
} from './chartSynthesisMetadata';

const PLANET_ORDER: readonly Planet[] = [
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
];

const VARGA_ORDER: readonly ('D1' | 'D9' | 'D10')[] = ['D1', 'D9', 'D10'];

const DASHA_LEVEL_ORDER: readonly (
  | 'MAHADASHA'
  | 'ANTARDASHA'
  | 'PRATYANTARDASHA'
  | 'PAIR'
  | 'CURRENT'
)[] = ['MAHADASHA', 'ANTARDASHA', 'PRATYANTARDASHA', 'PAIR', 'CURRENT'];

const FAMILY_ORDER: readonly SynthesisEvidenceFamily[] = [
  'STRUCTURAL',
  'PLANETARY',
  'YOGA',
  'DIVISIONAL',
  'DASHA'
];

function sortPlanets(planets: readonly Planet[]): readonly Planet[] {
  const set = new Set(planets);
  return Object.freeze(PLANET_ORDER.filter((p) => set.has(p)));
}

function sortHouses(houses: readonly number[]): readonly number[] {
  const set = new Set(houses);
  return Object.freeze(Array.from(set).sort((a, b) => a - b));
}

function sortVargas(vargas: readonly ('D1' | 'D9' | 'D10')[]): readonly ('D1' | 'D9' | 'D10')[] {
  const set = new Set(vargas);
  return Object.freeze(VARGA_ORDER.filter((v) => set.has(v)));
}

function sortDashaLevels(
  levels: readonly ('MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT')[]
): readonly ('MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT')[] {
  const set = new Set(levels);
  return Object.freeze(DASHA_LEVEL_ORDER.filter((l) => set.has(l)));
}

function sortFamilies(families: readonly SynthesisEvidenceFamily[]): readonly SynthesisEvidenceFamily[] {
  const set = new Set(families);
  return Object.freeze(FAMILY_ORDER.filter((f) => set.has(f)));
}

function validateInput(input: ChartSynthesisInput): void {
  if (!input || typeof input !== 'object') {
    throw new TypeError('chartSynthesis input must not be null or undefined.');
  }

  if (input.lifeThemes === undefined || input.lifeThemes === null || !('lifeThemes' in input)) {
    throw new TypeError('chartSynthesis input is missing required field: lifeThemes.');
  }
}

function generateConclusion(state: SynthesisState, label: string): string {
  switch (state) {
    case 'STRONGLY_SUPPORTED':
      return `The theme of ${label} is strongly supported across multiple independent astrological factors.`;
    case 'SUPPORTED':
      return `The theme of ${label} shows clear supporting indicators from astrological alignment.`;
    case 'MIXED':
      return `The theme of ${label} presents a mixed picture with both supporting and challenging factors.`;
    case 'CHALLENGED':
      return `The theme of ${label} faces challenging influences according to the astrological indications.`;
    case 'INSUFFICIENT_EVIDENCE':
      return `Insufficient astrological evidence is present to synthesize a clear indication for ${label}.`;
  }
}

function buildKeyObservations(themes: readonly ThemeSynthesis[]): readonly SynthesisObservation[] {
  const observations: SynthesisObservation[] = [];

  // 1. Repeated Support
  for (const t of themes) {
    if (t.repeatedSupport) {
      observations.push(
        Object.freeze({
          id: `obs_repeated_support_${t.theme}`,
          type: 'REPEATED_SUPPORT',
          summary: `${t.label} receives repeated support across multiple evidence families (${t.evidenceFamiliesPresent.join(', ')}).`,
          relatedThemes: Object.freeze([t.theme]),
          evidenceReferences: Object.freeze(t.supportingFactors.map((e) => e.id))
        })
      );
    }
  }

  // 2. Cross-Theme Support (planets and houses)
  const planetSupportMap = new Map<
    Planet,
    { themes: LifeTheme[]; evidenceIds: string[]; sourceEvidenceIds: Set<string> }
  >();
  const houseSupportMap = new Map<
    number,
    { themes: LifeTheme[]; evidenceIds: string[]; sourceEvidenceIds: Set<string> }
  >();

  for (const t of themes) {
    for (const e of t.supportingFactors) {
      for (const p of e.planets) {
        let entry = planetSupportMap.get(p);
        if (!entry) {
          entry = { themes: [], evidenceIds: [], sourceEvidenceIds: new Set() };
          planetSupportMap.set(p, entry);
        }
        if (!entry.themes.includes(t.theme)) {
          entry.themes.push(t.theme);
        }
        if (!entry.evidenceIds.includes(e.id)) {
          entry.evidenceIds.push(e.id);
        }
        entry.sourceEvidenceIds.add(e.sourceEvidenceId);
      }
      for (const h of e.houses) {
        let entry = houseSupportMap.get(h);
        if (!entry) {
          entry = { themes: [], evidenceIds: [], sourceEvidenceIds: new Set() };
          houseSupportMap.set(h, entry);
        }
        if (!entry.themes.includes(t.theme)) {
          entry.themes.push(t.theme);
        }
        if (!entry.evidenceIds.includes(e.id)) {
          entry.evidenceIds.push(e.id);
        }
        entry.sourceEvidenceIds.add(e.sourceEvidenceId);
      }
    }
  }

  for (const p of PLANET_ORDER) {
    const entry = planetSupportMap.get(p);
    if (entry && entry.themes.length >= 2) {
      const labels = entry.themes.map(getSynthesisThemeLabel);
      const isIndependent = entry.sourceEvidenceIds.size >= 2;
      const summary = isIndependent
        ? `${p} acts as a supporting planet across multiple independent factors (${labels.join(', ')}).`
        : `${p} contributes supporting evidence to multiple life themes (${labels.join(', ')}).`;

      observations.push(
        Object.freeze({
          id: `obs_cross_support_planet_${p}`,
          type: 'CROSS_THEME_SUPPORT',
          summary,
          relatedThemes: Object.freeze([...entry.themes]),
          evidenceReferences: Object.freeze([...entry.evidenceIds])
        })
      );
    }
  }

  for (let h = 1; h <= 12; h++) {
    const entry = houseSupportMap.get(h);
    if (entry && entry.themes.length >= 2) {
      const labels = entry.themes.map(getSynthesisThemeLabel);
      const isIndependent = entry.sourceEvidenceIds.size >= 2;
      const summary = isIndependent
        ? `House ${h} serves as a supportive structural focal point across multiple independent factors (${labels.join(', ')}).`
        : `House ${h} contributes supporting evidence across multiple life themes (${labels.join(', ')}).`;

      observations.push(
        Object.freeze({
          id: `obs_cross_support_house_${h}`,
          type: 'CROSS_THEME_SUPPORT',
          summary,
          relatedThemes: Object.freeze([...entry.themes]),
          evidenceReferences: Object.freeze([...entry.evidenceIds])
        })
      );
    }
  }

  // 3. Cross-Theme Conflict
  const planetChallengeMap = new Map<Planet, { themes: LifeTheme[]; evidenceIds: string[] }>();
  for (const t of themes) {
    for (const e of t.weakeningFactors) {
      for (const p of e.planets) {
        let entry = planetChallengeMap.get(p);
        if (!entry) {
          entry = { themes: [], evidenceIds: [] };
          planetChallengeMap.set(p, entry);
        }
        if (!entry.themes.includes(t.theme)) {
          entry.themes.push(t.theme);
        }
        if (!entry.evidenceIds.includes(e.id)) {
          entry.evidenceIds.push(e.id);
        }
      }
    }
  }

  for (const p of PLANET_ORDER) {
    const supEntry = planetSupportMap.get(p);
    const chalEntry = planetChallengeMap.get(p);
    if (supEntry && chalEntry && supEntry.themes.length > 0 && chalEntry.themes.length > 0) {
      const supLabels = supEntry.themes.map(getSynthesisThemeLabel);
      const chalLabels = chalEntry.themes.map(getSynthesisThemeLabel);
      const combinedThemes = Array.from(new Set([...supEntry.themes, ...chalEntry.themes]));
      const combinedEv = Array.from(new Set([...supEntry.evidenceIds, ...chalEntry.evidenceIds]));
      observations.push(
        Object.freeze({
          id: `obs_cross_conflict_planet_${p}`,
          type: 'CROSS_THEME_CONFLICT',
          summary: `${p} provides supporting influence in ${supLabels.join(', ')} while presenting challenging influence in ${chalLabels.join(', ')}.`,
          relatedThemes: Object.freeze(combinedThemes),
          evidenceReferences: Object.freeze(combinedEv)
        })
      );
    }
  }

  // 4. Timing Dependent
  for (const t of themes) {
    if (t.timingDependent) {
      observations.push(
        Object.freeze({
          id: `obs_timing_dependent_${t.theme}`,
          type: 'TIMING_DEPENDENT',
          summary: `${t.label} is active during specific Dasha periods.`,
          relatedThemes: Object.freeze([t.theme]),
          evidenceReferences: Object.freeze(t.timingFactors.map((e) => e.id))
        })
      );
    }
  }

  // 5. Limited Evidence
  for (const t of themes) {
    if (t.state === 'INSUFFICIENT_EVIDENCE') {
      observations.push(
        Object.freeze({
          id: `obs_limited_evidence_${t.theme}`,
          type: 'LIMITED_EVIDENCE',
          summary: `${t.label} has limited or neutral astrological evidence available.`,
          relatedThemes: Object.freeze([t.theme]),
          evidenceReferences: Object.freeze(t.evidence.map((e) => e.id))
        })
      );
    }
  }

  return Object.freeze(observations);
}

export function synthesizeChart(input: ChartSynthesisInput): ChartSynthesisReport {
  validateInput(input);

  const p19ThemesMap = new Map(
    input.lifeThemes.themes.map((t) => [t.theme, t])
  );

  const processedThemes: ThemeSynthesis[] = [];

  for (const themeKey of CHART_SYNTHESIS_THEME_ORDER) {
    const p19Theme = p19ThemesMap.get(themeKey);
    const label = getSynthesisThemeLabel(themeKey);

    const rawEvidenceList = p19Theme ? p19Theme.evidence : [];

    const evidence: SynthesisEvidence[] = rawEvidenceList.map((ev) => {
      const family = mapEvidenceSourceToFamily(ev.source);
      const source = mapEvidenceSourceToCoarseSource(ev.source);
      const varga = ev.varga;
      const id = `${ev.theme}_${ev.source}_${ev.ruleId}_${ev.sourceReference ?? ''}`;
      const sourceEvidenceId = `${ev.source}_${ev.ruleId}_${ev.sourceReference ?? ''}`;

      return Object.freeze({
        id,
        sourceEvidenceId,
        theme: ev.theme,
        source,
        family,
        effect: ev.effect,
        statement: ev.statement,
        ruleId: ev.ruleId,
        sourceReference: ev.sourceReference,
        planets: ev.planets ? Object.freeze([...ev.planets]) : Object.freeze([]),
        houses: ev.houses ? Object.freeze([...ev.houses]) : Object.freeze([]),
        varga,
        dashaLevel: ev.dashaLevel
      });
    });

    const frozenEvidence = Object.freeze(evidence);

    const supportingFactors = Object.freeze(
      frozenEvidence.filter((e) => e.effect === 'SUPPORT')
    );
    const weakeningFactors = Object.freeze(
      frozenEvidence.filter((e) => e.effect === 'CHALLENGE')
    );
    const timingFactors = Object.freeze(
      frozenEvidence.filter((e) => e.family === 'DASHA' || e.dashaLevel !== undefined)
    );

    const nonNeutral = frozenEvidence.filter((e) => e.effect !== 'NEUTRAL');
    const hasMixed = frozenEvidence.some((e) => e.effect === 'MIXED');
    const hasSupport = supportingFactors.length > 0;
    const hasChallenge = weakeningFactors.length > 0;

    let state: SynthesisState = 'INSUFFICIENT_EVIDENCE';
    if (nonNeutral.length === 0) {
      state = 'INSUFFICIENT_EVIDENCE';
    } else if (hasMixed || (hasSupport && hasChallenge)) {
      state = 'MIXED';
    } else if (hasSupport) {
      const supportFamilies = new Set(supportingFactors.map((e) => e.family));
      if (supportFamilies.size >= 2) {
        state = 'STRONGLY_SUPPORTED';
      } else {
        state = 'SUPPORTED';
      }
    } else if (hasChallenge) {
      state = 'CHALLENGED';
    }

    const supportFamilySet = new Set(supportingFactors.map((e) => e.family));
    const repeatedSupport = supportFamilySet.size >= 2;
    const conflictingIndicators = hasMixed || (hasSupport && hasChallenge);
    const timingDependent = timingFactors.length > 0;

    const evidenceFamiliesPresent = sortFamilies(
      Array.from(new Set(frozenEvidence.map((e) => e.family)))
    );

    const p19Conf: InterpretationConfidence = p19Theme ? p19Theme.confidence : 'LOW';
    const p19Rank = p19Conf === 'HIGH' ? 3 : p19Conf === 'MEDIUM' ? 2 : 1;
    const distinctFamiliesCount = evidenceFamiliesPresent.length;

    let confidence: InterpretationConfidence = 'LOW';
    if (distinctFamiliesCount === 0) {
      confidence = 'LOW';
    } else if (distinctFamiliesCount === 1) {
      const rank = Math.min(p19Rank, 2);
      confidence = rank === 2 ? 'MEDIUM' : 'LOW';
    } else {
      const rank = p19Rank === 3 ? 3 : p19Rank === 2 ? 3 : 2;
      confidence = rank === 3 ? 'HIGH' : 'MEDIUM';
    }

    const relevantPlanets = sortPlanets(
      frozenEvidence.flatMap((e) => e.planets)
    );
    const relevantHouses = sortHouses(
      frozenEvidence.flatMap((e) => e.houses)
    );
    const relevantVargas = sortVargas(
      frozenEvidence.map((e) => e.varga).filter((v): v is 'D1' | 'D9' | 'D10' => v !== undefined)
    );
    const relevantDashaLevels = sortDashaLevels(
      frozenEvidence.map((e) => e.dashaLevel).filter((d): d is 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT' => d !== undefined)
    );

    const conclusion = generateConclusion(state, label);

    const themeSynthesis: ThemeSynthesis = Object.freeze({
      theme: themeKey,
      label,
      state,
      confidence,
      repeatedSupport,
      conflictingIndicators,
      timingDependent,
      supportingFactors,
      weakeningFactors,
      timingFactors,
      evidence: frozenEvidence,
      evidenceFamiliesPresent,
      relevantPlanets,
      relevantHouses,
      relevantVargas,
      relevantDashaLevels,
      conclusion
    });

    processedThemes.push(themeSynthesis);
  }

  const themes = Object.freeze(processedThemes);

  const strongestThemes = Object.freeze(
    themes.filter((t) => t.state === 'STRONGLY_SUPPORTED')
  );
  const weakestThemes = Object.freeze(
    themes.filter((t) => t.state === 'CHALLENGED')
  );
  const mixedThemes = Object.freeze(
    themes.filter((t) => t.state === 'MIXED')
  );
  const repeatedSupportThemes = Object.freeze(
    themes.filter((t) => t.repeatedSupport)
  );
  const timingDependentThemes = Object.freeze(
    themes.filter((t) => t.timingDependent)
  );

  const keyObservations = buildKeyObservations(themes);

  // Proportional overall confidence policy rationale:
  // Evaluates overall chart synthesis confidence based on themes that have sufficient evidence.
  // - If all meaningful themes have HIGH confidence, overall confidence is HIGH.
  // - If there are no meaningful themes OR more than half of meaningful themes have LOW confidence, overall confidence is LOW.
  // - Otherwise, overall confidence is MEDIUM.
  const meaningfulThemes = themes.filter((t) => t.state !== 'INSUFFICIENT_EVIDENCE');

  let overallConfidence: InterpretationConfidence = 'MEDIUM';
  if (meaningfulThemes.length > 0 && meaningfulThemes.every((t) => t.confidence === 'HIGH')) {
    overallConfidence = 'HIGH';
  } else if (
    meaningfulThemes.length === 0 ||
    meaningfulThemes.filter((t) => t.confidence === 'LOW').length > meaningfulThemes.length / 2
  ) {
    overallConfidence = 'LOW';
  } else {
    overallConfidence = 'MEDIUM';
  }

  const overallConclusion = `Chart synthesis indicates ${strongestThemes.length} strongly supported theme(s), ${mixedThemes.length} theme(s) with mixed indicators, and ${weakestThemes.length} challenged theme(s) across the chart structure. Overall synthesis confidence is ${overallConfidence}.`;

  return Object.freeze({
    themes,
    strongestThemes,
    weakestThemes,
    mixedThemes,
    repeatedSupportThemes,
    timingDependentThemes,
    keyObservations,
    overallConfidence,
    overallConclusion
  });
}
