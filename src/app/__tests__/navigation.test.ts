import { describe, it, expect } from 'vitest';
import {
  PRODUCT_NAVIGATION,
  RESEARCH_NAVIGATION,
  isProductPage,
  isResearchPage,
  mapLegacyPageToAppPage,
  mapAppPageToLegacyTab
} from '../navigation/navigation';
import type { ProductPage, ResearchPage } from '../navigation/navigationTypes';
import type { AppTab } from '../../types/appTabs';

describe('Navigation Configuration', () => {
  it('defines PRODUCT_NAVIGATION in the exact specified order', () => {
    const productIds = PRODUCT_NAVIGATION.map((item) => item.id);
    const expectedOrder: ProductPage[] = [
      'overview',
      'career',
      'wealth',
      'dasha',
      'reasoning',
      'detailed'
    ];

    expect(productIds).toEqual(expectedOrder);
  });

  it('defines exact labels and descriptions for all product navigation items', () => {
    const labels = PRODUCT_NAVIGATION.map((item) => item.label);
    expect(labels).toEqual([
      'Overview',
      'Career',
      'Wealth',
      'Dasha & Timing',
      'Why This Result?',
      'Detailed Analysis'
    ]);

    PRODUCT_NAVIGATION.forEach((item) => {
      expect(item.description).toBeDefined();
      expect(item.description.length).toBeGreaterThan(0);
    });
  });

  it('excludes research and developer pages from PRODUCT_NAVIGATION', () => {
    const productIds = new Set(PRODUCT_NAVIGATION.map((item) => item.id));
    const researchIds: ResearchPage[] = [
      'horoscope',
      'planets',
      'transit',
      'divisional',
      'nakshatras',
      'relationships',
      'validator'
    ];

    researchIds.forEach((id) => {
      expect(productIds.has(id as any)).toBe(false);
    });
  });

  it('defines RESEARCH_NAVIGATION containing all classical research tools', () => {
    const researchIds = RESEARCH_NAVIGATION.map((item) => item.id);
    expect(researchIds).toEqual([
      'horoscope',
      'planets',
      'transit',
      'divisional',
      'nakshatras',
      'relationships',
      'validator'
    ]);
  });

  it('correctly classifies pages with isProductPage', () => {
    expect(isProductPage('overview')).toBe(true);
    expect(isProductPage('career')).toBe(true);
    expect(isProductPage('wealth')).toBe(true);
    expect(isProductPage('dasha')).toBe(true);
    expect(isProductPage('reasoning')).toBe(true);
    expect(isProductPage('detailed')).toBe(true);

    expect(isProductPage('horoscope')).toBe(false);
    expect(isProductPage('planets')).toBe(false);
    expect(isProductPage('unknown-page')).toBe(false);
  });

  it('correctly classifies pages with isResearchPage', () => {
    expect(isResearchPage('horoscope')).toBe(true);
    expect(isResearchPage('planets')).toBe(true);
    expect(isResearchPage('transit')).toBe(true);
    expect(isResearchPage('divisional')).toBe(true);
    expect(isResearchPage('nakshatras')).toBe(true);
    expect(isResearchPage('relationships')).toBe(true);
    expect(isResearchPage('validator')).toBe(true);

    expect(isResearchPage('overview')).toBe(false);
    expect(isResearchPage('career')).toBe(false);
    expect(isResearchPage('unknown-page')).toBe(false);
  });

  it('maps legacy page tabs to AppPage correctly', () => {
    // Legacy customer-facing aliases
    expect(mapLegacyPageToAppPage('life-analysis')).toBe('overview');
    expect(mapLegacyPageToAppPage('dasha-timing')).toBe('dasha');
    expect(mapLegacyPageToAppPage('report')).toBe('detailed');

    // Research tabs 1:1
    expect(mapLegacyPageToAppPage('horoscope')).toBe('horoscope');
    expect(mapLegacyPageToAppPage('planets')).toBe('planets');
    expect(mapLegacyPageToAppPage('transit')).toBe('transit');
    expect(mapLegacyPageToAppPage('divisional')).toBe('divisional');
    expect(mapLegacyPageToAppPage('nakshatras')).toBe('nakshatras');
    expect(mapLegacyPageToAppPage('relationships')).toBe('relationships');
    expect(mapLegacyPageToAppPage('validator')).toBe('validator');

    // Idempotent for current AppPage IDs
    expect(mapLegacyPageToAppPage('overview')).toBe('overview');
    expect(mapLegacyPageToAppPage('career')).toBe('career');
    expect(mapLegacyPageToAppPage('wealth')).toBe('wealth');

    // Fallback for unknown
    expect(mapLegacyPageToAppPage('unknown-invalid')).toBe('overview');
  });

  it('maps AppPage to legacy AppTab correctly with mapAppPageToLegacyTab', () => {
    // Product pages with legacy mappings
    expect(mapAppPageToLegacyTab('overview')).toBe('life-analysis');
    expect(mapAppPageToLegacyTab('dasha')).toBe('dasha-timing');
    expect(mapAppPageToLegacyTab('detailed')).toBe('report');

    // Research pages map 1:1
    expect(mapAppPageToLegacyTab('horoscope')).toBe('horoscope');
    expect(mapAppPageToLegacyTab('planets')).toBe('planets');
    expect(mapAppPageToLegacyTab('transit')).toBe('transit');
    expect(mapAppPageToLegacyTab('divisional')).toBe('divisional');
    expect(mapAppPageToLegacyTab('nakshatras')).toBe('nakshatras');
    expect(mapAppPageToLegacyTab('relationships')).toBe('relationships');
    expect(mapAppPageToLegacyTab('validator')).toBe('validator');

    // Product-only pages with NO legacy equivalent return undefined
    expect(mapAppPageToLegacyTab('career')).toBeUndefined();
    expect(mapAppPageToLegacyTab('wealth')).toBeUndefined();
    expect(mapAppPageToLegacyTab('reasoning')).toBeUndefined();

    // Unknown page strings return undefined
    expect(mapAppPageToLegacyTab('unknown' as any)).toBeUndefined();
  });

  it('preserves round-trip consistency between legacy tabs and AppPage', () => {
    const legacyTabs: AppTab[] = [
      'life-analysis',
      'dasha-timing',
      'report',
      'horoscope',
      'planets',
      'transit',
      'divisional',
      'nakshatras',
      'relationships',
      'validator'
    ];

    // Every legacy tab must map to an AppPage and map back to the identical legacy tab
    legacyTabs.forEach((legacyTab) => {
      const appPage = mapLegacyPageToAppPage(legacyTab);
      const backToLegacy = mapAppPageToLegacyTab(appPage);
      expect(backToLegacy).toBe(legacyTab);
    });
  });
});
