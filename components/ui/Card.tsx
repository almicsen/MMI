import { HTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cx('surface-card p-6 transition-shadow duration-200 hover:shadow-[var(--shadow-2)]', className)}
      {...props}
    />
  );
}
