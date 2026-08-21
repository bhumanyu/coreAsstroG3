import React from 'react';
import { formatEnum, getStatusBadgeClass } from './lifeAnalysisUx';

interface DomainPromiseBadgeProps {
  readonly promise: string;
  readonly className?: string;
}

/**
 * Renders a categorical astrological promise/status badge.
 * Strictly qualitative and categorical — never outputs numeric scores or percentages.
 */
export const DomainPromiseBadge: React.FC<DomainPromiseBadgeProps> = ({
  promise,
  className = ''
}) => {
  const formattedText = formatEnum(promise);
  const badgeClasses = getStatusBadgeClass(promise);

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClasses} ${className}`}
    >
      {formattedText}
    </span>
  );
};
