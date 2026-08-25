import type {
  CareerFinalSynthesisInput,
  CareerWealthFinalSynthesis,
  WealthFinalSynthesisInput
} from './careerWealthFinalSynthesisTypes';
import { synthesizeCareerFinal } from './careerFinalSynthesis';
import { synthesizeWealthFinal } from './wealthFinalSynthesis';

export interface CareerWealthFinalSynthesisService {
  synthesizeCareer(input: CareerFinalSynthesisInput): CareerWealthFinalSynthesis;
  synthesizeWealth(input: WealthFinalSynthesisInput): CareerWealthFinalSynthesis;
}

export class DefaultCareerWealthFinalSynthesisService
  implements CareerWealthFinalSynthesisService {
  synthesizeCareer(input: CareerFinalSynthesisInput): CareerWealthFinalSynthesis {
    return synthesizeCareerFinal(input);
  }

  synthesizeWealth(input: WealthFinalSynthesisInput): CareerWealthFinalSynthesis {
    return synthesizeWealthFinal(input);
  }
}
