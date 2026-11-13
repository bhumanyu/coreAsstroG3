import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechnicalEvidenceDetails } from '../TechnicalEvidenceDetails';
import type { UserFacingEvidence } from '../../../product/life-analysis/evidencePresentation';

function makeEvidence(overrides: Partial<UserFacingEvidence> = {}): UserFacingEvidence {
  return {
    id: 'ev_42',
    title: 'Jupiter in house 2',
    roleLabel: 'Primary factor',
    directionLabel: 'Supportive',
    explanation: 'Jupiter aspects the 2nd house.',
    sourceLabel: 'Birth chart (D1)',
    role: 'PRIMARY',
    direction: 'SUPPORT',
    ruleId: 'RULE-JUP-2ND',
    derivedFromIds: ['ev_base_1', 'ev_base_2'],
    technical: {
      id: 'ev_42',
      ruleId: 'RULE-JUP-2ND',
      source: 'C4_STRUCTURAL_REASONING',
      direction: 'SUPPORT',
      role: 'PRIMARY',
      statement: 'Raw canonical statement. Effect: SUPPORT',
      planet: 'JUPITER',
      house: 2,
      derivedFromIds: ['ev_base_1', 'ev_base_2']
    },
    ...overrides
  };
}

describe('TechnicalEvidenceDetails', () => {
  it('renders collapsed by default and reveals canonical technical fields on expand', async () => {
    const user = userEvent.setup();
    render(<TechnicalEvidenceDetails evidence={makeEvidence()} />);

    const summary = screen.getByText(/technical evidence/i);
    const details = summary.closest('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');

    // Canonical values exist in the DOM contract but are not visible while collapsed.
    expect(screen.queryByText('C4_STRUCTURAL_REASONING')).not.toBeVisible();

    await user.click(summary);

    expect(screen.getByText('ev_42')).toBeVisible();
    expect(screen.getByText('RULE-JUP-2ND')).toBeVisible();
    expect(screen.getByText('C4_STRUCTURAL_REASONING')).toBeVisible();
    expect(screen.getByText('ev_base_1, ev_base_2')).toBeVisible();
    expect(screen.getByText(/Raw canonical statement/)).toBeVisible();
  });
});
