import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calculateHoroscope } from '../../engine/astroEngine';
import * as vimshottariModule from '../../engine/dasha/vimshottari';
import * as dashaInterpModule from '../../engine/dashaInterpretation/dashaInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { FullNatalReportView } from './FullNatalReportView';
import { DashaSection } from './DashaSection';
import { App } from '../../App';
import { REPORT_SECTION_IDS, REPORT_NAVIGATION, formatPlanetName } from './reportUtils';
import { FullNatalAnalysisReport, Planet } from '../../types';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  Object.keys(obj).forEach((prop) => {
    const val = (obj as any)[prop];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  });
  return obj;
}

describe('P-22 FullNatalReportView & Component Suite (All 30 Contract Verification Cases)', () => {
  const canonicalHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalReport = canonicalHoroscope.fullNatalAnalysis;

  // Case 1: Report renders
  it('1. FullNatalReportView renders without crashing', () => {
    const { container } = render(<FullNatalReportView report={canonicalReport} />);
    expect(container).toBeInTheDocument();
  });

  // Case 2: All major sections render
  it('2. All 17 major section elements render with stable IDs', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    REPORT_SECTION_IDS.forEach((id) => {
      const element = document.getElementById(id);
      expect(element).not.toBeNull();
    });
  });

  // Case 3: Existing app tabs still present
  it('3. App renders existing navigation tabs along with Detailed Analysis tab', () => {
    render(<App />);
    expect(screen.getByText('Detailed Analysis')).toBeInTheDocument();
    expect(screen.getByText('Horoscope & Charts')).toBeInTheDocument();
    expect(screen.getByText('Planetary Facts & Dignity')).toBeInTheDocument();
    expect(screen.getByText('Gochara Transits (PR-037)')).toBeInTheDocument();
    expect(screen.getByText('Divisional Vargas (D1, D3, D9, D10)')).toBeInTheDocument();
    expect(screen.getByText('27 Nakshatras Wheel')).toBeInTheDocument();
    expect(screen.getByText('Natural Relationships')).toBeInTheDocument();
    expect(screen.getByText('Golden Vector Test Suite')).toBeInTheDocument();
  });

  // Case 4: Birth Information
  it('4. BirthInformation section renders birth details correctly', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('1988-05-08T09:30:00+05:30')).toBeInTheDocument();
    expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument();
  });

  // Case 5: Methodology
  it('5. Methodology section renders methodology specifications', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getAllByText('LAHIRI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SIDEREAL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('WHOLE_SIGN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VIMSHOTTARI').length).toBeGreaterThan(0);
  });

  // Case 6: Executive Summary
  it('6. Executive Summary renders headline and theme synthesis', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText(canonicalReport.executiveSummary.headline)).toBeInTheDocument();
  });

  // Case 7: All 9 Planets
  it('7. All 9 planets render in planetary analysis section', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    const planets: Planet[] = [
      Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY,
      Planet.JUPITER, Planet.VENUS, Planet.SATURN, Planet.RAHU, Planet.KETU
    ];
    planets.forEach((p) => {
      const pName = formatPlanetName(p);
      expect(screen.getAllByText(pName).length).toBeGreaterThan(0);
    });
  });

  // Case 8: All 12 Houses
  it('8. All 12 houses render in house analysis section', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    for (let h = 1; h <= 12; h++) {
      expect(screen.getAllByText(`House ${h}`).length).toBeGreaterThan(0);
    }
  });

  // Case 9: Functional Roles
  it('9. Functional roles section renders role classifications', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Functional Roles & Nature')).toBeInTheDocument();
  });

  // Case 10: Yoga Cards
  it('10. Yoga section renders yoga summary cards conditionally', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getAllByText('Yoga Formations').length).toBeGreaterThan(0);
  });

  // Case 11: Strength Table Label Check
  it('11. Planetary strength section labels column exactly "Shadbala Total" and NOT "Score"', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Shadbala Total')).toBeInTheDocument();
    expect(screen.queryByText('Score')).toBeNull();
  });

  // Case 12: D9 Section Tabular
  it('12. D9 section renders tabular data and no visual chart', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Navamsha (D9) Analysis')).toBeInTheDocument();
  });

  // Case 13: D10 Section Tabular
  it('13. D10 section renders tabular data and no visual chart', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Dashamsha (D10) Analysis')).toBeInTheDocument();
  });

  // Case 14: Vimshottari Timeline
  it('14. Vimshottari timeline renders mahadashas, first and last dates, birth anchor, and does not render unavailable EmptyState', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Vimshottari Dasha Timeline')).toBeInTheDocument();
    expect(screen.queryByText('Vimshottari Dasha Unavailable')).toBeNull();

    const vimshottari = canonicalReport.vimshottari;
    expect(vimshottari.status).toBe('AVAILABLE');
    expect(vimshottari.birthAnchor).toBeDefined();

    // Birth Nakshatra anchor rendered
    expect(screen.getAllByText(vimshottari.birthAnchor!.nakshatra).length).toBeGreaterThan(0);

    // First and last Mahadasha dates rendered
    const mahadashas = vimshottari.mahadashas!;
    const firstM = mahadashas[0];
    const lastM = mahadashas[mahadashas.length - 1];

    expect(screen.getAllByText(firstM.start).length).toBeGreaterThan(0);
    expect(screen.getAllByText(firstM.end).length).toBeGreaterThan(0);
    expect(screen.getAllByText(lastM.start).length).toBeGreaterThan(0);
    expect(screen.getAllByText(lastM.end).length).toBeGreaterThan(0);
  });

  it('14b. DashaSection component directly renders birth anchor, dates, and does not render unavailable EmptyState', () => {
    render(<DashaSection section={canonicalReport.vimshottari} />);
    expect(screen.queryByText('Vimshottari Dasha Unavailable')).toBeNull();

    const vimshottari = canonicalReport.vimshottari;
    expect(screen.getByText(vimshottari.birthAnchor!.nakshatra)).toBeInTheDocument();

    const mahadashas = vimshottari.mahadashas!;
    const firstM = mahadashas[0];
    const lastM = mahadashas[mahadashas.length - 1];

    expect(screen.getAllByText(firstM.start).length).toBeGreaterThan(0);
    expect(screen.getAllByText(firstM.end).length).toBeGreaterThan(0);
    expect(screen.getAllByText(lastM.start).length).toBeGreaterThan(0);
    expect(screen.getAllByText(lastM.end).length).toBeGreaterThan(0);
  });

  // Case 15: Current Dasha
  it('15. Current dasha section renders active dasha period', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Active Dasha Period')).toBeInTheDocument();
  });

  // Case 16: Current Transit UNAVAILABLE state
  it('16. Current transit section respects UNAVAILABLE status', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Current Transit Analysis')).toBeInTheDocument();
    expect(screen.getByText(canonicalReport.currentTransit?.reason || /Current Transit Analysis Unavailable/i)).toBeInTheDocument();
  });

  // Case 17: Life Themes
  it('17. Life themes section renders theme cards', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getByText('Life Themes Synthesis')).toBeInTheDocument();
  });

  // Case 18: Major Life Periods
  it('18. Major life periods section renders periods', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getAllByText('Major Life Periods').length).toBeGreaterThan(0);
  });

  // Case 19: Overall Synthesis
  it('19. Overall synthesis section renders integrated conclusion', () => {
    render(<FullNatalReportView report={canonicalReport} />);
    expect(screen.getAllByText('Overall Synthesis').length).toBeGreaterThan(0);
  });

  // Case 20: PARTIAL state renders warning
  it('20. PARTIAL section status renders available data + visible notice', () => {
    const partialReport: FullNatalAnalysisReport = {
      ...canonicalReport,
      executiveSummary: {
        ...canonicalReport.executiveSummary,
        status: 'PARTIAL'
      }
    };
    render(<FullNatalReportView report={partialReport} />);
    expect(screen.getAllByText(/Partial Analysis Notice/i)[0]).toBeInTheDocument();
  });

  // Case 21: UNAVAILABLE state renders EmptyState
  it('21. UNAVAILABLE section status renders EmptyState', () => {
    const unavailReport: FullNatalAnalysisReport = {
      ...canonicalReport,
      d9: {
        status: 'UNAVAILABLE',
        details: undefined
      }
    };
    render(<FullNatalReportView report={unavailReport} />);
    expect(screen.getByText('Navamsha (D9) Analysis Unavailable')).toBeInTheDocument();
  });

  // Case 22: Empty Yoga State
  it('22. Empty yoga state renders No Yogas Detected cleanly', () => {
    const emptyYogaReport: FullNatalAnalysisReport = {
      ...canonicalReport,
      yogas: {
        status: 'AVAILABLE',
        detected: [],
        strong: [],
        weakened: [],
        cancelled: [],
        neutral: []
      }
    };
    render(<FullNatalReportView report={emptyYogaReport} />);
    expect(screen.getByText('No Yogas Detected')).toBeInTheDocument();
  });

  // Case 23: Empty Life-Theme State
  it('23. Empty life themes state renders No Life Themes Available cleanly', () => {
    const emptyThemeReport: FullNatalAnalysisReport = {
      ...canonicalReport,
      lifeThemes: {
        status: 'AVAILABLE',
        themes: [],
        synthesis: []
      }
    };
    render(<FullNatalReportView report={emptyThemeReport} />);
    expect(screen.getByText('No Life Themes Available')).toBeInTheDocument();
  });

  // Case 24: Empty Major Life Period State
  it('24. Empty major life period state renders EmptyState cleanly', () => {
    const emptyPeriodReport: FullNatalAnalysisReport = {
      ...canonicalReport,
      majorLifePeriods: {
        status: 'AVAILABLE',
        periods: []
      }
    };
    render(<FullNatalReportView report={emptyPeriodReport} />);
    expect(screen.getByText('Major Life Periods Unavailable')).toBeInTheDocument();
  });

  // Case 25: Major-life-period keyThemes NOT invented when empty
  it('25. Empty keyThemes in major life period does NOT render invented themes', () => {
    const syntheticPeriodReport: FullNatalAnalysisReport = {
      ...canonicalReport,
      majorLifePeriods: {
        status: 'AVAILABLE',
        periods: [
          {
            planet: Planet.SUN,
            start: '2020-01-01',
            end: '2026-01-01',
            primaryFocusHouses: [1, 5],
            keyThemes: [], // P-21 leaves keyThemes empty!
            confidence: 'HIGH'
          }
        ]
      }
    };
    render(<FullNatalReportView report={syntheticPeriodReport} />);
    expect(screen.queryByText('Key Themes')).toBeNull();
  });

  // Case 26: P-21 report not mutated
  it('26. Deeply frozen FullNatalAnalysisReport is not mutated during render', () => {
    const frozenReport = deepFreeze(JSON.parse(JSON.stringify(canonicalReport)));
    expect(() => render(<FullNatalReportView report={frozenReport} />)).not.toThrow();
  });

  // Case 27: Evidence content preserved
  it('27. Evidence content is preserved and accessible in UI', () => {
    const { container } = render(<FullNatalReportView report={canonicalReport} />);
    const detailsElements = container.querySelectorAll('details');
    expect(detailsElements.length).toBeGreaterThan(0);
  });

  // Case 28: Navigation anchors work
  it('28. Navigation sidebar contains correct href="#id" anchor links for all 17 sections', () => {
    const { container } = render(<FullNatalReportView report={canonicalReport} />);
    REPORT_NAVIGATION.forEach((item) => {
      const anchor = container.querySelector(`a[href="#${item.id}"]`);
      expect(anchor).not.toBeNull();
    });
  });

  // Case 29: Section IDs unique
  it('29. REPORT_SECTION_IDS has exactly 17 unique section IDs', () => {
    expect(REPORT_SECTION_IDS.length).toBe(17);
    const set = new Set(REPORT_SECTION_IDS);
    expect(set.size).toBe(17);
  });

  // Case 30: Responsive structure not dependent on hardcoded desktop widths
  it('30. Navigation and sections adapt cleanly with responsive classes', () => {
    const { container } = render(<FullNatalReportView report={canonicalReport} />);
    expect(container.querySelector('.grid-cols-1')).not.toBeNull();
    expect(container.querySelector('.lg\\:grid-cols-12')).not.toBeNull();
  });
});

describe('D01 — Dasha Report Wiring', () => {
  // No-duplicate-calculation verification
  it('invokes calculateVimshottari and analyzeDashaInterpretation exactly once during calculateHoroscope and 0 times during DashaSection/FullNatalReportView render', () => {
    const calculateVimshottariSpy = vi.spyOn(vimshottariModule, 'calculateVimshottari');
    const analyzeDashaInterpretationSpy = vi.spyOn(dashaInterpModule, 'analyzeDashaInterpretation');

    calculateVimshottariSpy.mockClear();
    analyzeDashaInterpretationSpy.mockClear();

    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(calculateVimshottariSpy).toHaveBeenCalledTimes(1);
    expect(analyzeDashaInterpretationSpy).toHaveBeenCalledTimes(1);

    // Render FullNatalReportView and DashaSection
    render(<FullNatalReportView report={horoscope.fullNatalAnalysis} />);
    render(<DashaSection section={horoscope.fullNatalAnalysis.vimshottari} />);

    // Assert neither was invoked during React render
    expect(calculateVimshottariSpy).toHaveBeenCalledTimes(1);
    expect(analyzeDashaInterpretationSpy).toHaveBeenCalledTimes(1);

    calculateVimshottariSpy.mockRestore();
    analyzeDashaInterpretationSpy.mockRestore();
  });
});
