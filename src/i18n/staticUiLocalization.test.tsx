import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import i18n from './i18n';
import { AppFooter } from '../app/AppFooter';
import { ResearchChunkFallback } from '../app/ResearchChunkFallback';
import { Brand } from '../components/Header';
import { ProductAnalysisReportView } from '../components/fullNatalReport/ProductAnalysisReportView';
import { BirthFormModal } from '../components/BirthFormModal';
import { ChartProfileManager } from '../features/chart-profiles/ChartProfileManager';
import { ChartExportControl } from '../features/chart-export/ChartExportControl';
import { AyanamsaType, type Chart } from '../types';
import { RelationshipMatrix } from '../components/RelationshipMatrix';
import { NakshatraExplorer } from '../components/NakshatraExplorer';
import { EngineValidator } from '../components/EngineValidator';
import { KundaliChart } from '../components/KundaliChart';

describe('shared UI localization', () => {
  it('renders shell and report status copy in Hindi', async () => {
    await i18n.changeLanguage('hi');
    render(
      <>
        <Brand />
        <AppFooter />
        <ResearchChunkFallback />
        <ProductAnalysisReportView analysisStatus="LOADING" />
      </>
    );

    expect(screen.getByText('वैदिक ज्योतिष')).toBeInTheDocument();
    expect(screen.getByText('वैदिक खगोलीय और ज्योतिषीय गणना प्रणाली')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'करियर और धन विश्लेषण रिपोर्ट' })).toHaveTextContent(
      'मूल विश्लेषण रिपोर्ट तैयार की जा रही है'
    );
    expect(screen.getByText('अनुसंधान टूल लोड हो रहा है...')).toBeInTheDocument();
  });

  it('switches birth and chart controls without resetting the entered chart name', async () => {
    const birthDetails = {
      name: 'Initial chart',
      placeOfBirth: 'Ujjain, India',
      dateTimeStr: '2000-01-01T00:00:00.000Z',
      timeZone: 'Asia/Kolkata',
      latitude: 23.17,
      longitude: 75.78,
      ayanamsa: AyanamsaType.LAHIRI
    };
    render(
      <>
        <BirthFormModal isOpen currentDetails={birthDetails} onClose={() => undefined} onSave={() => undefined} />
        <ChartProfileManager currentBirthDetails={birthDetails} onRestoreBirthDetails={() => undefined} />
        <ChartExportControl onLoadBirthDetails={() => undefined} />
      </>
    );

    const chartName = screen.getByPlaceholderText('e.g. CoreAstro Test Vector 1');
    fireEvent.change(chartName, { target: { value: 'My saved chart' } });
    await i18n.changeLanguage('hi');

    expect(screen.getByText('कुंडली और ग्रह स्थिति की गणना करें')).toBeInTheDocument();
    expect(screen.getAllByText('सहेजी गई कुंडली प्रोफ़ाइलें')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'कुंडली और रिपोर्ट JSON निर्यात करें' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('My saved chart')).toBeInTheDocument();
  });

  it('localizes research labels while retaining canonical planetary data labels', async () => {
    await i18n.changeLanguage('hi');
    render(
      <>
        <RelationshipMatrix />
        <NakshatraExplorer />
        <EngineValidator />
        <KundaliChart chart={{ positions: {} } as Chart} />
      </>
    );

    expect(screen.getByText('प्राकृतिक ग्रह संबंध (नैसर्गिक संबंध)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'गोल्डन वेक्टर परीक्षण चलाएँ' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('नक्षत्र या देवता खोजें...')).toBeInTheDocument();
    expect(screen.getByText('उत्तर भारतीय')).toBeInTheDocument();
    expect(screen.getByText('दक्षिण भारतीय')).toBeInTheDocument();
    expect(screen.getAllByText('Sun').length).toBeGreaterThan(0);
  });
});
