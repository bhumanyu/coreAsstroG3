export type ProductPage =
  | 'overview'
  | 'career'
  | 'wealth'
  | 'dasha'
  | 'reasoning'
  | 'detailed';

export type ResearchPage =
  | 'horoscope'
  | 'planets'
  | 'transit'
  | 'divisional'
  | 'nakshatras'
  | 'relationships'
  | 'validator';

export type AppPage = ProductPage | ResearchPage;

export interface ProductNavigationItem {
  readonly id: ProductPage;
  readonly label: string;
  readonly description: string;
}

export interface ResearchNavigationItem {
  readonly id: ResearchPage;
  readonly label: string;
  readonly description?: string;
}
