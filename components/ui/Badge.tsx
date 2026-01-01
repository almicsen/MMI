import { HTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'info';
}

const toneStyles: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-[color:var(--surface-3)] text-[color:var(--text-2)]',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  warning: 'bg-amber-500/20 text-amber-600 dark:text-amber-300',
  info: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
};

export default function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        toneStyles[tone],
        className
      )}
      {...props}
    />
  );
}
