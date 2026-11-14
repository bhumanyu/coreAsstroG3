import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleDot,
  Gem,
  Layers3,
  Orbit,
  Sparkles,
  Timer
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppPage } from '../../app/navigation/navigationTypes';

export interface FeatureTile {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly target: AppPage;
}

export const FEATURE_TILES: readonly FeatureTile[] = [
  { title: 'kundli', subtitle: 'kundliSubtitle', icon: Orbit, target: 'horoscope' },
  { title: 'planetStrengths', subtitle: 'planetStrengthsSubtitle', icon: Sparkles, target: 'planets' },
  { title: 'yogaFormation', subtitle: 'yogaFormationSubtitle', icon: CircleDot, target: 'detailed' },
  { title: 'd10Interpretation', subtitle: 'd10InterpretationSubtitle', icon: Layers3, target: 'divisional' },
  { title: 'dashaTimeline', subtitle: 'dashaTimelineSubtitle', icon: Timer, target: 'dasha' },
  { title: 'career', subtitle: 'careerSubtitle', icon: BriefcaseBusiness, target: 'career' },
  { title: 'wealth', subtitle: 'wealthSubtitle', icon: Gem, target: 'wealth' },
  { title: 'nakshatras', subtitle: 'nakshatrasSubtitle', icon: ChartNoAxesCombined, target: 'nakshatras' }
];
