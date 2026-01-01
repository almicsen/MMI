'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[color:var(--brand-primary)] text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)] hover:translate-y-[-1px] hover:shadow-[0_16px_40px_rgba(37,99,235,0.45)]',
  secondary:
    'bg-[color:var(--surface-3)] text-[color:var(--text-1)] border border-[color:var(--border-strong)] hover:border-[color:var(--brand-accent)]',
  outline:
    'border border-[color:var(--border-strong)] text-[color:var(--text-1)] hover:border-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary)]',
  ghost:
    'text-[color:var(--text-2)] hover:text-[color:var(--brand-primary)] hover:bg-[color:var(--surface-3)]',
  danger:
    'bg-red-500 text-white shadow-[0_10px_24px_rgba(239,68,68,0.35)] hover:bg-red-600',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
