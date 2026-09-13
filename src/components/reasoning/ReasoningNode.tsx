import React from 'react';
import type { ReasoningChainNodeViewModel } from '../../product/analysis/reasoningViewModel';
import {
  formatDirection,
  getDirectionBadgeClass,
  formatPromiseStrength,
  getPromiseStrengthBadgeClass,
  formatVargaRelationship,
  getVargaRelationshipBadgeClass,
  formatTransitEffect,
  formatAvailability,
  getAvailabilityBadgeClass
} from './reasoningFormat';
import { GitCommit, Star, Layers, Clock, Compass, BrainCircuit } from 'lucide-react';

export interface ReasoningNodeProps {
  readonly node: ReasoningChainNodeViewModel;
  readonly stepNumber?: number;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'PROMISE':
      return <Star className="w-4 h-4 text-amber-400" aria-hidden="true" />;
    case 'VARGA':
      return <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />;
    case 'ACTIVATION':
      return <Clock className="w-4 h-4 text-sky-400" aria-hidden="true" />;
    case 'TRANSIT':
      return <Compass className="w-4 h-4 text-teal-400" aria-hidden="true" />;
    case 'SYNTHESIS':
      return <BrainCircuit className="w-4 h-4 text-purple-400" aria-hidden="true" />;
    default:
      return <GitCommit className="w-4 h-4 text-indigo-300" aria-hidden="true" />;
  }
};

function getTransitBadgeClass(effect?: string): string {
  const upper = effect?.toUpperCase();
  switch (upper) {
    case 'TRIGGER':
    case 'SUPPORT':
    case 'SUPPORTS':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'CHALLENGE':
    case 'CHALLENGES':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MODIFIER':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}

interface BadgeData {
  text: string;
  badgeClass: string;
}

function resolveNodeBadge(node: ReasoningChainNodeViewModel): BadgeData | null {
  if (node.type === 'PROMISE' && node.promiseStrength) {
    return {
      text: formatPromiseStrength(node.promiseStrength),
      badgeClass: getPromiseStrengthBadgeClass(node.promiseStrength)
    };
  }

  if (node.type === 'VARGA' && node.vargaRelationship) {
    return {
      text: formatVargaRelationship(node.vargaRelationship),
      badgeClass: getVargaRelationshipBadgeClass(node.vargaRelationship)
    };
  }

  if (node.type === 'ACTIVATION') {
    const dir = node.dashaDirection ?? node.direction;
    if (dir) {
      return {
        text: formatDirection(dir),
        badgeClass: getDirectionBadgeClass(dir)
      };
    }
    if (node.availability && node.availability !== 'AVAILABLE') {
      return {
        text: formatAvailability(node.availability),
        badgeClass: getAvailabilityBadgeClass(node.availability)
      };
    }
  }

  if (node.type === 'TRANSIT' && node.transitEffect) {
    return {
      text: formatTransitEffect(node.transitEffect),
      badgeClass: getTransitBadgeClass(node.transitEffect)
    };
  }

  if (node.type === 'SYNTHESIS') {
    if (node.direction) {
      return {
        text: formatDirection(node.direction),
        badgeClass: getDirectionBadgeClass(node.direction)
      };
    }
    return null;
  }

  if (node.direction) {
    return {
      text: formatDirection(node.direction),
      badgeClass: getDirectionBadgeClass(node.direction)
    };
  }

  return null;
}

export const ReasoningNode: React.FC<ReasoningNodeProps> = ({ node, stepNumber }) => {
  const badge = resolveNodeBadge(node);

  return (
    <div className="relative flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-xs font-mono-code font-bold text-indigo-300">
          {stepNumber !== undefined ? String(stepNumber).padStart(2, '0') : getNodeIcon(node.type)}
        </div>
      </div>

      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{node.label}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code uppercase bg-slate-800/80 text-slate-400 border border-slate-700/60">
              {node.type}
            </span>
          </div>

          {badge && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.badgeClass}`}>
              {badge.text}
            </span>
          )}
        </div>

        {node.statement ? (
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {node.statement}
          </p>
        ) : null}
      </div>
    </div>
  );
};
