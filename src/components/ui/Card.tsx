import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from './cn';

export type CardVariant = 'default' | 'glass' | 'gradient' | 'subtle';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant;
  interactive?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-slate-900/80 dark:bg-slate-900/85 light:bg-white/95 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 shadow-xl shadow-slate-950/40 light:shadow-slate-200/50',
  glass:
    'glass-surface backdrop-blur-xl border border-white/10 dark:border-white/10 light:border-slate-200/80 shadow-2xl shadow-indigo-950/20 light:shadow-slate-300/40',
  gradient:
    'bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-950/90 light:from-white light:via-indigo-50/50 light:to-slate-50 border border-indigo-500/20 dark:border-indigo-500/20 light:border-indigo-200/80 shadow-xl shadow-indigo-950/25',
  subtle:
    'bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50/80 border border-slate-800/50 dark:border-slate-800/50 light:border-slate-200/60 shadow-sm'
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'glass', interactive = false, children, className, ...rest }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        whileHover={
          interactive
            ? {
                y: -3,
                boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.22)',
                borderColor: 'rgba(129, 140, 248, 0.4)'
              }
            : undefined
        }
        className={cn(
          'rounded-2xl p-5 md:p-6 transition-all duration-200 relative overflow-hidden',
          interactive && 'cursor-pointer',
          variantStyles[variant],
          className
        )}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/80', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3
    className={cn(
      'text-lg md:text-xl font-semibold tracking-tight text-slate-100 dark:text-slate-100 light:text-slate-900 font-serif-astro',
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs md:text-sm text-slate-400 dark:text-slate-400 light:text-slate-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => <div className={cn('pt-4', className)} {...props}>{children}</div>;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn(
      'flex items-center justify-between pt-4 mt-4 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/80 text-xs text-slate-400',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
