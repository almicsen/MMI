'use client';

import { ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline';
}

export default function IconButton({ className, variant = 'solid', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        'flex h-11 w-11 items-center justify-center rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
        variant === 'outline'
          ? 'border border-white/40 text-white/90'
          : 'text-white',
        className
      )}
      {...props}
    />
  );
}
