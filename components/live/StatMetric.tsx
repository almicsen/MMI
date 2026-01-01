'use client';

import { cx } from '@/lib/utils/cx';

interface StatMetricProps {
  label: string;
  value: string;
  align?: 'left' | 'right';
}

export default function StatMetric({ label, value, align = 'left' }: StatMetricProps) {
  return (
    <div className={cx('flex flex-col gap-1', align === 'right' ? 'items-end text-right' : 'items-start')}> 
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/65">
        {label}
      </span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}
