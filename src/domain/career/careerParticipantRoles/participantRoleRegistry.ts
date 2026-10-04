import type { CareerPatternClassification } from '../careerPattern/careerPatternTypes';
import type { ParticipantRolePolicy } from './participantRoleTypes';
import { ServiceProfessionGainsRolePolicy } from './policies/serviceProfessionGainsRolePolicy';
import { CareerHouseNetworkRolePolicy } from './policies/careerHouseNetworkRolePolicy';

/**
 * P2-07B Participant Role Policy Registry
 *
 * Registry mapping CareerPatternClassification to participant role policies.
 *
 * Per spec: initially maps:
 * - SERVICE_TO_PROFESSION_TO_GAINS → serviceProfessionGainsRolePolicy
 * - CAREER_HOUSE_NETWORK → careerHouseNetworkRolePolicy
 * - All other classifications → null (no policy)
 *
 * Additional policies can be added as methodology is frozen for other classifications.
 */
export const PARTICIPANT_ROLE_POLICIES: Readonly<
  Record<CareerPatternClassification, ParticipantRolePolicy | null>
> = Object.freeze({
  CAREER_HOUSE_NETWORK: new CareerHouseNetworkRolePolicy(),
  WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS: null,
  COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS: null,
  CREATIVE_DHARMA_TO_PROFESSION: null,
  DHARMA_KARMA_ALIGNMENT: null,
  SERVICE_TO_PROFESSION_TO_GAINS: new ServiceProfessionGainsRolePolicy(),
  PROFESSION_TO_GAINS: null,
  UPACHAYA_PROGRESSION: null,
  PARIVARTANA_YOGA: null,
  DUSTHANA_CAREER_TRANSFORMATION: null,
  CAREER_YOGA_STRUCTURE: null,
  AUTHORITY_PATTERN: null,
  PROFESSIONAL_RISE_PATTERN: null
});
