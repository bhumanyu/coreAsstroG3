import type {
  Horoscope,
  HouseAnalysisReport,
  NatalGrahaDrishtiReport,
  Planet,
  PlanetFacts
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

  // Build full report bundle for analysis
  const fullBundle: Career10HReportBundle = {
    houseLordship: reports.houseLordship,
    houseAnalysis: reports.houseAnalysis,
    natalGrahaDrishti: reports.natalGrahaDrishti,
    planetFacts: reports.planetFacts
  };

  // Analyze Lagna context
  const lagnaContext = analyzeCareer10HContext(fullBundle, 'LAGNA');
  if (!lagnaContext) {
    missingInputs.push('lagnaContext');
  }

  // Analyze Moon context
  const moonContext = analyzeCareer10HContext(fullBundle, 'MOON');
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
): {
  houseLordship?: HouseLordshipReport;
  houseAnalysis?: HouseAnalysisReport;
  natalGrahaDrishti?: NatalGrahaDrishtiReport;
  planetFacts?: PlanetFacts;
} {
  const reports: {
    houseLordship?: HouseLordshipReport;
    houseAnalysis?: HouseAnalysisReport;
    natalGrahaDrishti?: NatalGrahaDrishtiReport;
    planetFacts?: PlanetFacts;
  } = {};

  // Try to get from pre-computed reports first
  reports.houseLordship = input.houseLordship ?? input.horoscope?.houseLordship;
  if (!reports.houseLordship) {
    missingInputs.push('houseLordship');
  }

  reports.houseAnalysis = input.houseAnalysis ?? input.horoscope?.houseAnalysis;
  if (!reports.houseAnalysis) {
    missingInputs.push('houseAnalysis');
  }

  reports.natalGrahaDrishti = input.natalGrahaDrishti ?? input.horoscope?.natalGrahaDrishti ?? input.horoscope?.grahaDrishti;
  // natalGrahaDrishti is an enrichment, not a structural prerequisite
  // Don't add to missingInputs - contexts can be built without it

  reports.planetFacts = input.horoscope?.planetFacts;
  if (!reports.planetFacts) {
    missingInputs.push('planetFacts');
  }

  // At this point, we've populated all available fields
  // The resolver will check for required fields before proceeding
  return reports;
}
