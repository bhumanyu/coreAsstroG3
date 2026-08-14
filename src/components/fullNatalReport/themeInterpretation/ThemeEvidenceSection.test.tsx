import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeEvidenceSection } from './ThemeEvidenceSection';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';

describe('ThemeEvidenceSection Component', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalCareer = horoscope.themeInterpretationV2?.career!;

  it('renders both By Dimension and By Factor Family toggles, defaulting to Dimension', () => {
    render(
      <ThemeEvidenceSection
        id="career-evidence-section"
        evidence={canonicalCareer.evidence}
        groupedEvidence={canonicalCareer.groupedEvidence}
        familySummaries={canonicalCareer.familySummaries}
      />
    );

    const dimensionBtn = screen.getByRole('button', { name: /By Dimension/i });
    const familyBtn = screen.getByRole('button', { name: /By Factor Family/i });

    expect(dimensionBtn).toBeInTheDocument();
    expect(familyBtn).toBeInTheDocument();

    // Default view: Dimension is active (has bg-indigo-600)
    expect(dimensionBtn.className).toContain('bg-indigo-600');
    expect(familyBtn.className).not.toContain('bg-indigo-600');

    // Dimension headers rendered
    expect(screen.getByText(/Natal Structure/i)).toBeInTheDocument();
  });

  it('switches view when By Factor Family button is clicked', () => {
    render(
      <ThemeEvidenceSection
        id="career-evidence-section"
        evidence={canonicalCareer.evidence}
        groupedEvidence={canonicalCareer.groupedEvidence}
        familySummaries={canonicalCareer.familySummaries}
      />
    );

    const dimensionBtn = screen.getByRole('button', { name: /By Dimension/i });
    const familyBtn = screen.getByRole('button', { name: /By Factor Family/i });

    fireEvent.click(familyBtn);

    // Factor Family tab is now active
    expect(familyBtn.className).toContain('bg-indigo-600');
    expect(dimensionBtn.className).not.toContain('bg-indigo-600');

    // Switch back to Dimension
    fireEvent.click(dimensionBtn);
    expect(dimensionBtn.className).toContain('bg-indigo-600');
  });

  it('returns null when evidence is empty', () => {
    const { container } = render(
      <ThemeEvidenceSection id="empty-section" evidence={[]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
