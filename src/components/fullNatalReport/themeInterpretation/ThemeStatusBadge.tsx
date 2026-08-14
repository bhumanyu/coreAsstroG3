import React from 'react';
import { formatThemeStatus, getThemeStatusStyle } from './themeUiUtils';

interface ThemeStatusBadgeProps {
  readonly status: string;
  readonly className?: string;
  readonly id?: string;
}

export const ThemeStatusBadge: React.FC<ThemeStatusBadgeProps> = ({
  status,
  className = '',
  id
}) => {
  const label = formatThemeStatus(status);
  const styles = getThemeStatusStyle(status);

  return (
    <span
      id={id}
      aria-label={`Conclusion Status: ${label}`}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono-code font-bold uppercase tracking-wider border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {label}
    </span>
  );
};
