import type {
  Horoscope,
  HouseAnalysisReport,
  NatalGrahaDrishtiReport,
  Planet
} from '../../../types';
import type { HouseLordshipReport } from '../../../engine/houseLordship/houseLordship';
import type {
  Career10HFoundationInput,
  Career10HFoundationResult,
  Career10HFoundationStatus,
  Career10HFoundation
} from './career10HFoundationTypes';
import {
  analyzeCareer10HContext,
  Career10HReportBundle
} from './career10HStructuralAnalyzer';
import {
  freezeCareer10HFoundation
} from './career10HFoundationUtils';

/**
 * P2-07F Default Career 10H Foundation Resolver
 *
 * This module provides the main entry point for resolving 10H foundation from
 * either a horoscope or a bundle of pre-computed reports.
 *
 * This function calls analyzeCareer10HContext twice (once for LAGNA, once for MOON)
 * and returns a complete foundation. It handles INSUFFICIENT_DATA gracefully by
 * returning partial contexts (never fabricates missing data).
 */

/**
 * Resolves the 10H foundation from the provided input.
 *
 * @param input - Either a horoscope or a bundle of pre-computed reports
 * @returns Career10HFoundationResult with status and foundation
 */
export function resolveCareer10HFoundation(
  input: Career10HFoundationInput
): Career10HFoundationResult {
  const missingInputs: string[] = [];

  // Extract reports from input
  const reports = extractReports(input, missingInputs);

  // If we can't extract minimal required data, return INSUFFICIENT_DATA
  if (!reports.houseLordship || !reports.houseAnalysis || !reports.planetFacts) {
    return {
      status: 'INSUFFICIENT_DATA' as Career10HFoundationStatus,
      foundation: {
        lagnaContext: null,
        moonContext: null
      },
      missingInputs: Object.freeze(missingInputs)
    };
  }

  // Analyze Lagna context
  const lagnaContext = analyzeCareer10HContext(reports, 'LAGNA');
  if (!lagnaContext) {
    missingInputs.push('lagnaContext');
  }

  // Analyze Moon context
  const moonContext = analyzeCareer10HContext(reports, 'MOON');
  if (!moonContext) {
    missingInputs.push('moonContext');
  }

  // Build foundation
  const foundation: Career10HFoundation = {
    lagnaContext,
    moonContext
  };

  // Determine status
  const status: Career10HFoundationStatus =
    missingInputs.length === 0 ? 'COMPLETE' : 'INSUFFICIENT_DATA';

  // Freeze and return
  return {
    status,
    foundation: freezeCareer10HFoundation(foundation),
    missingInputs: Object.freeze(missingInputs)
  };
}

/**
 * Extracts reports from the input, populating missingInputs list.
 */
function extractReports(
  input: Career10HFoundationInput,
  missingInputs: string[]
): Career10HReportBundle {
  const reports: Partial<Career10HReportBundle> = {};

  // Try to get from pre-computed reports first
  if (input.houseLordship) {
    (reports as any).houseLordship = input.houseLordship;
  } else if (input.horoscope?.houseLordship) {
    (reports as any).houseLordship = input.horoscope.houseLordship;
  } else {
    missingInputs.push('houseLordship');
  }

  if (input.houseAnalysis) {
    (reports as any).houseAnalysis = input.houseAnalysis;
  } else if (input.horoscope?.houseAnalysis) {
    (reports as any).houseAnalysis = input.horoscope.houseAnalysis;
  } else {
    missingInputs.push('houseAnalysis');
  }

  if (input.natalGrahaDrishti) {
    (reports as any).natalGrahaDrishti = input.natalGrahaDrishti;
  } else if (input.horoscope?.natalGrahaDrishti || input.horoscope?.grahaDrishti) {
    (reports as any).natalGrahaDrishti = input.horoscope.natalGrahaDrishti || input.horoscope.grahaDrishti;
  } else {
    missingInputs.push('natalGrahaDrishti');
  }

  if (input.horoscope?.planetFacts) {
    (reports as any).planetFacts = input.horoscope.planetFacts;
  } else {
    missingInputs.push('planetFacts');
  }

  return reports as Career10HReportBundle;
}
