import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from './i18n';
import { AppFooter } from '../app/AppFooter';
import { ResearchChunkFallback } from '../app/ResearchChunkFallback';
import { Brand } from '../components/Header';
import { ProductAnalysisReportView } from '../components/fullNatalReport/ProductAnalysisReportView';

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
});
