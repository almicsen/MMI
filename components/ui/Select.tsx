'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, hasError, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cx(
        'w-full rounded-xl border bg-[color:var(--surface-2)] px-4 py-3 text-[color:var(--text-1)] shadow-sm transition-all focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)]',
        hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-400/40' : 'border-[color:var(--border-subtle)]',
        className
      )}
      {...props}
    />
  );
});

Select.displayName = 'Select';

export default Select;
