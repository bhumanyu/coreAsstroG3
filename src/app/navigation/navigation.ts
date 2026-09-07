import type {
  AppPage,
  ProductPage,
  ResearchPage,
  ProductNavigationItem,
  ResearchNavigationItem
} from './navigationTypes';
import type { AppTab } from '../../types/appTabs';

export type LegacyPage = AppTab;

export const PRODUCT_NAVIGATION: readonly ProductNavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Unified life domain synthesis & key themes'
  },
  {
    id: 'career',
    label: 'Career',
    description: 'Professional trajectory, status & vocation'
  },
  {
    id: 'wealth',
    label: 'Wealth',
    description: 'Financial prosperity, assets & accumulation'
  },
  {
    id: 'dasha',
    label: 'Dasha & Timing',
    description: 'Vimshottari planetary periods & activation'
  },
  {
    id: 'reasoning',
    label: 'Why This Result?',
    description: 'Astrological reasoning trace & evidence rules'
  },
  {
    id: 'detailed',
    label: 'Detailed Analysis',
    description: 'Comprehensive classical natal analysis'
  }
];

export const RESEARCH_NAVIGATION: readonly ResearchNavigationItem[] = [
  {
    id: 'horoscope',
    label: 'Horoscope & Charts',
    description: 'Primary Rasi chart and fundamental facts'
  },
  {
    id: 'planets',
    label: 'Planets & Dignity',
    description: 'Planetary positions, dignities & shadbala'
  },
  {
    id: 'transit',
    label: 'Transit Analysis',
    description: 'Gochara transits against natal positions'
  },
  {
    id: 'divisional',
    label: 'Divisional Vargas',
    description: 'Harmonic divisional charts (D1, D3, D9, D10)'
  },
  {
    id: 'nakshatras',
    label: 'Nakshatra Explorer',
    description: '27 lunar mansions & planetary padas'
  },
  {
    id: 'relationships',
    label: 'Natural Relationships',
    description: 'Planetary friendship and enmity matrix'
  },
  {
    id: 'validator',
    label: 'Golden Vector Test Suite',
    description: 'Canonical astronomical calculation verification'
  }
];

const PRODUCT_PAGE_SET = new Set<string>(
  PRODUCT_NAVIGATION.map((item) => item.id)
);

const RESEARCH_PAGE_SET = new Set<string>(
  RESEARCH_NAVIGATION.map((item) => item.id)
);

export function isProductPage(page: string): page is ProductPage {
  return PRODUCT_PAGE_SET.has(page);
}

export function isResearchPage(page: string): page is ResearchPage {
  return RESEARCH_PAGE_SET.has(page);
}

export function mapLegacyPageToAppPage(legacy: LegacyPage | string): AppPage {
  switch (legacy) {
    case 'life-analysis':
      return 'overview';
    case 'dasha-timing':
      return 'dasha';
    case 'report':
      return 'detailed';
    case 'horoscope':
    case 'planets':
    case 'transit':
    case 'divisional':
    case 'nakshatras':
    case 'relationships':
    case 'validator':
      return legacy;
    case 'overview':
    case 'career':
    case 'wealth':
    case 'dasha':
    case 'reasoning':
    case 'detailed':
      return legacy;
    default:
      return 'overview';
  }
}

export function mapAppPageToLegacyTab(page: AppPage): AppTab | undefined {
  switch (page) {
    case 'overview':
      return 'life-analysis';
    case 'dasha':
      return 'dasha-timing';
    case 'detailed':
      return 'report';
    case 'horoscope':
    case 'planets':
    case 'transit':
    case 'divisional':
    case 'nakshatras':
    case 'relationships':
    case 'validator':
      return page;
    case 'career':
    case 'wealth':
    case 'reasoning':
    default:
      return undefined;
  }
}
