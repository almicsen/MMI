import { HTMLAttributes } from 'react';
import { cx } from '@/lib/utils/cx';

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeading({ eyebrow, title, subtitle, className, ...props }: SectionHeadingProps) {
  return (
    <div className={cx('space-y-3', className)} {...props}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--brand-accent)]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl font-semibold text-[color:var(--text-1)]">
        {title}
      </h2>
      {subtitle && <p className="text-base sm:text-lg text-[color:var(--text-3)]">{subtitle}</p>}
    </div>
  );
}
