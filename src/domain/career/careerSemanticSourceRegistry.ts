/**
 * CW-R1 / C1
 *
 * Career Semantic Source Registry
 * --------------------------------
 *
 * This file is an audit/freeze contract for the existing Career semantic
 * sources in the repository.
 *
 * IMPORTANT:
 * - This registry does NOT calculate astrology.
 * - This registry does NOT generate evidence.
 * - This registry does NOT change Career reasoning.
 * - This registry does NOT replace any existing rule engine.
 *
 * Its purpose is to make the current semantic ownership explicit so that
 * subsequent CW-R1 work does not accidentally create duplicate semantics.
 */

export type CareerSemanticOwnership =
  | 'STRUCTURAL'
  | 'RELEVANCE'
  | 'CONDITION'
  | 'RELATIONSHIP'
  | 'EXPRESSION'
  | 'QUALIFICATION'
  | 'TIMING'
  | 'MAPPING'
  | 'REASONING';

export type CareerSemanticImplementationStatus =
  | 'EXISTING'
  | 'PARTIAL'
  | 'IMPLICIT'
  | 'MISSING';

export interface CareerSemanticSource {
  readonly ruleId: string;
  readonly sourceFile: string;
  readonly ownership: readonly CareerSemanticOwnership[];
  readonly currentMeaning: string;
  readonly status: CareerSemanticImplementationStatus;
  /**
   * Architectural guardrail/documentation only.
   *
   * This list is not a runtime dependency validator.
   * Future implementation PRs must respect this ownership boundary.
   */
  readonly mustNotBeDuplicatedBy: readonly string[];
}

const freezeOwnership = (items: CareerSemanticOwnership[]): readonly CareerSemanticOwnership[] => Object.freeze(items);

export const CAREER_SEMANTIC_SOURCE_REGISTRY: readonly CareerSemanticSource[] =
  Object.freeze([
    /*
     * -----------------------------------------------------------------------
     * 10TH HOUSE
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_10H_STRONG_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'CONDITION'
      ]),
      currentMeaning:
        '10th house provides primary natal Career support when its evaluated house status is strong or supportive.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerReasoningHierarchy',
        'careerManifestationSynthesis'
      ])
    }),

    Object.freeze({
      ruleId: 'CAREER_10H_AFFLICTION_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'CONDITION'
      ]),
      currentMeaning:
        '10th house provides primary natal Career challenge when its evaluated status is afflicted or challenging.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerReasoningHierarchy',
        'careerManifestationSynthesis'
      ])
    }),

    Object.freeze({
      ruleId: 'CAREER_10H_OCCUPANT_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'RELEVANCE',
        'EXPRESSION'
      ]),
      currentMeaning:
        'Occupation of the 10th house is recognized as a secondary Career factor that shapes public/work expression.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerPlanetRules'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * 6TH HOUSE
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_6H_SERVICE_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'RELEVANCE',
        'CONDITION',
        'EXPRESSION'
      ]),
      currentMeaning:
        '6th house contributes service, daily work, problem-solving and competition semantics to Career.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerManifestationSynthesis'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * 11TH HOUSE
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_11H_GAINS_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'RELEVANCE',
        'CONDITION'
      ]),
      currentMeaning:
        '11th house contributes income from profession, gains and networks to Career.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerManifestationSynthesis'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * 2ND HOUSE
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_2H_WEALTH_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'RELEVANCE',
        'CONDITION'
      ]),
      currentMeaning:
        '2nd house contributes accumulated wealth, professional speech and assets as a secondary Career factor.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'wealthReasoningHierarchy'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * HOUSE RELATIONSHIPS
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_6H_10H_LINK_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'RELATIONSHIP',
        'RELEVANCE'
      ]),
      currentMeaning:
        'A structural relationship between the 6th and 10th houses is treated as Career support.',
      status: 'IMPLICIT',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerReasoningHierarchy'
      ])
    }),

    Object.freeze({
      ruleId: 'CAREER_10H_11H_LINK_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerHouseRules.ts',
      ownership: freezeOwnership([
        'RELATIONSHIP',
        'RELEVANCE'
      ]),
      currentMeaning:
        'A structural relationship between the 10th and 11th houses is treated as direct Career/gains support.',
      status: 'IMPLICIT',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerReasoningHierarchy'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * LORDSHIP
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_10L_DIGNITY_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerLordRules.ts',
      ownership: freezeOwnership([
        'STRUCTURAL',
        'CONDITION',
        'RELEVANCE'
      ]),
      currentMeaning:
        'The 10th lord is a primary Career factor whose dignity and evaluated condition contribute to Career promise.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerPlanetRules'
      ])
    }),

    Object.freeze({
      ruleId: 'CAREER_6L_10L_LINK_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerLordRules.ts',
      ownership: freezeOwnership([
        'RELATIONSHIP',
        'RELEVANCE'
      ]),
      currentMeaning:
        'The same planet ruling both the 6th and 10th houses creates a direct structural service-to-career relationship.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerHouseRules'
      ])
    }),

    Object.freeze({
      ruleId: 'CAREER_10L_11L_LINK_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerLordRules.ts',
      ownership: freezeOwnership([
        'RELATIONSHIP',
        'RELEVANCE'
      ]),
      currentMeaning:
        'The same planet ruling both the 10th and 11th houses creates a direct career-to-gains relationship.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerHouseRules'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * PLANETARY CAREER RELEVANCE
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_SUN_RELEVANCE_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerPlanetRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'CONDITION',
        'EXPRESSION'
      ]),
      currentMeaning:
        'Sun is considered for public status, authority, managerial authority, executive dignity and government standing when structurally connected to Career factors.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([])
    }),

    Object.freeze({
      ruleId: 'CAREER_SATURN_RELEVANCE_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerPlanetRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'CONDITION',
        'EXPRESSION'
      ]),
      currentMeaning:
        'Saturn is considered for professional endurance, institutional structures, discipline and labor duties when structurally connected to Career factors.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([])
    }),

    Object.freeze({
      ruleId: 'CAREER_MERCURY_RELEVANCE_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerPlanetRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'CONDITION',
        'EXPRESSION'
      ]),
      currentMeaning:
        'Mercury is considered for commerce, analytical reasoning, communication and trade skills when structurally connected to Career factors.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([])
    }),

    Object.freeze({
      ruleId: 'CAREER_MARS_RELEVANCE_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerPlanetRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'CONDITION',
        'EXPRESSION'
      ]),
      currentMeaning:
        'Mars is considered for executive drive, initiative, courage and technical problem solving when structurally connected to Career factors.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([])
    }),

    Object.freeze({
      ruleId: 'CAREER_JUPITER_RELEVANCE_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerPlanetRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'CONDITION',
        'EXPRESSION'
      ]),
      currentMeaning:
        'Jupiter is considered for wisdom, counsel, administration and organizational guidance when structurally connected to Career factors.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([])
    }),

    /*
     * -----------------------------------------------------------------------
     * ASPECT
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_ASPECT_10H_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerAspectRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'CONDITION'
      ]),
      currentMeaning:
        'Planetary aspects received by the 10th house are treated as Career modifiers.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerHouseRules'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * YOGA
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_YOGA_CONFIRMATION_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerYogaRules.ts',
      ownership: freezeOwnership([
        'RELEVANCE',
        'QUALIFICATION'
      ]),
      currentMeaning:
        'Career-relevant Yogas provide confirmatory evidence rather than primary Career promise.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerReasoningHierarchy'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * D10
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_D10_CONFIRMATION_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerVargaRules.ts',
      ownership: freezeOwnership([
        'QUALIFICATION'
      ]),
      currentMeaning:
        'D10 provides divisional confirmation/modification of the natal Career promise.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerHouseRules',
        'careerLordRules'
      ])
    }),

    /*
     * -----------------------------------------------------------------------
     * DASHA
     * -----------------------------------------------------------------------
     */

    Object.freeze({
      ruleId: 'CAREER_DASHA_TIMING_001',
      sourceFile:
        'src/engine/themeInterpretation/rules/career/careerDashaRules.ts',
      ownership: freezeOwnership([
        'TIMING'
      ]),
      currentMeaning:
        'Active MD/AD/PD planetary periods provide Career activation timing evidence.',
      status: 'EXISTING',
      mustNotBeDuplicatedBy: Object.freeze([
        'careerReasoningHierarchy'
      ])
    })
  ]);

export const CAREER_SEMANTIC_SOURCE_RULE_IDS: readonly string[] =
  Object.freeze(
    CAREER_SEMANTIC_SOURCE_REGISTRY.map((item) => item.ruleId)
  );

export function getCareerSemanticSource(
  ruleId: string
): CareerSemanticSource | undefined {
  return CAREER_SEMANTIC_SOURCE_REGISTRY.find(
    (item) => item.ruleId === ruleId
  );
}

export function getCareerSemanticSourcesByOwnership(
  ownership: CareerSemanticOwnership
): readonly CareerSemanticSource[] {
  return Object.freeze(
    CAREER_SEMANTIC_SOURCE_REGISTRY.filter((item) =>
      item.ownership.includes(ownership)
    )
  );
}
