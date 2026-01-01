'use client';

import { ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

export default function PillButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx(
        'h-10 rounded-full bg-[#55589B]/80 px-5 text-sm font-medium text-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
        className
      )}
      {...props}
    />
  );
}
