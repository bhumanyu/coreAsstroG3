import { Planet, Sign, PlanetState, NatalGrahaDrishti } from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { DashaYogaReference } from './dashaInterpretationTypes';
import { PlanetStrengthInterpretation } from '../planetInterpretation/planetInterpretationTypes';
import { DashaReasoningEvidence } from './dashaReasoningTypes';

export type { DashaReasoningEvidence };

export interface DirectionalEvidenceInput {
  readonly planet: Planet;
  readonly house: number;
  readonly sign: Sign;
  readonly ownedHouses?: readonly number[];
  readonly functionalRoles?: readonly FunctionalRole[];
  readonly functionalNature?: FunctionalNature;
  readonly dignity?: string;
  readonly state?: PlanetState;
  readonly strength?: PlanetStrengthInterpretation;
  readonly castAspects?: readonly NatalGrahaDrishti[];
  readonly receivedAspects?: readonly NatalGrahaDrishti[];
  readonly yogaParticipation?: readonly DashaYogaReference[];
  readonly reasoningEvidence?: readonly DashaReasoningEvidence[];
}
