'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, hasError, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cx(
        'w-full rounded-xl border bg-[color:var(--surface-2)] px-4 py-3 text-[color:var(--text-1)] shadow-sm transition-all placeholder:text-[color:var(--text-4)] focus:border-[color:var(--brand-primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)]',
        hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-400/40' : 'border-[color:var(--border-subtle)]',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
