import React from 'react';
import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeEvidenceSection } from './ThemeEvidenceSection';
import { ThemeEvidenceItem } from './ThemeEvidenceItem';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import i18n from '../../../i18n/i18n';

describe('ThemeEvidenceSection Component', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalCareer = horoscope.themeInterpretationV2?.career!;

  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

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

  it('localizes evidence display enums in Hindi without changing the statement', async () => {
    const previousLanguage = i18n.language;
    await i18n.changeLanguage('hi');
    const evidence = {
      ...canonicalCareer.evidence[0],
      effect: 'SUPPORT' as const,
      strength: 'STRONG' as const,
      priority: 'PRIMARY' as const
    };

    try {
      const { container } = render(<ThemeEvidenceItem evidence={evidence} />);
      expect(container).toHaveTextContent('समर्थन');
      expect(container).toHaveTextContent('प्रबल');
      expect(container).toHaveTextContent('प्रमुख');
      expect(container).not.toHaveTextContent(/\b(?:SUPPORT|STRONG|PRIMARY)\b/);
      expect(container).toHaveTextContent(evidence.statement);
    } finally {
      await i18n.changeLanguage(previousLanguage);
    }
  });
});
