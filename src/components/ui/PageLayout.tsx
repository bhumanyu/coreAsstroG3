import React from 'react';
import { motion } from 'motion/react';
import { cn } from './cn';

export interface PageLayoutProps {
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  eyebrow,
  description,
  actions,
  children,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn('w-full max-w-7xl mx-auto space-y-6', className)}
    >
      {(title || eyebrow || description || actions) && (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90">
          <div>
            {eyebrow && (
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 dark:text-indigo-400 light:text-indigo-600 block mb-1 font-mono-code">
                {eyebrow}
              </span>
            )}
            {title && (
              <h1 className="text-2xl sm:text-3xl font-bold font-serif-astro tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 text-balance">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1.5 max-w-2xl">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </header>
      )}

      {/* Centered responsive content container */}
      <div className="w-full">{children}</div>
    </motion.div>
  );
};
