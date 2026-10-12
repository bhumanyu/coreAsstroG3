import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium shadow-md shadow-indigo-500/25 border border-indigo-400/30 dark:border-indigo-500/30 active:shadow-sm',
  secondary:
    'bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700/80 hover:border-slate-600 shadow-sm dark:bg-slate-800/90 dark:text-slate-100 dark:border-slate-700 light:bg-slate-100 light:text-slate-900 light:border-slate-300 light:hover:bg-slate-200',
  ghost:
    'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900 border border-transparent',
  outline:
    'bg-transparent border border-slate-700 hover:border-indigo-500/60 text-slate-200 hover:text-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:text-indigo-300 light:border-slate-300 light:text-slate-700 light:hover:text-indigo-600 light:hover:border-indigo-400',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md shadow-rose-600/20 border border-rose-500/30'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 min-h-[36px] rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2 min-h-[40px] rounded-xl gap-2',
  lg: 'text-base px-5 py-2.5 min-h-[46px] rounded-xl gap-2.5 font-semibold'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled = false,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 dark:focus-visible:ring-offset-slate-950 light:focus-visible:ring-offset-white',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && (
            <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
