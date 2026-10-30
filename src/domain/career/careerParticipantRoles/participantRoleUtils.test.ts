import { describe, expect, it } from 'vitest';
import { parseParticipantId } from './participantRoleUtils';

describe('parseParticipantId', () => {
  it.each([
    'PLANET:SUN ',
    'PLANET: SUN',
    'PLANET:',
    'PLANET:PLUTO'
  ])('rejects non-canonical participant ID %s', participantId => {
    expect(parseParticipantId(participantId)).toBeUndefined();
  });

  it('accepts canonical PLANET:SUN', () => {
    expect(parseParticipantId('PLANET:SUN')).toBe('PLANET:SUN');
  });
});
