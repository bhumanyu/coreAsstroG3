import React from 'react';

export interface PageHeadingProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description?: string;
  readonly children?: React.ReactNode;
}

export const PageHeading: React.FC<PageHeadingProps> = ({
  eyebrow,
  title,
  description,
  children
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 mb-6">
      <div>
        {eyebrow && (
          <span className="text-xs uppercase font-mono-code font-bold tracking-wider text-indigo-400 dark:text-indigo-400 light:text-indigo-600 block mb-1">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold font-serif-astro text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1 max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};
