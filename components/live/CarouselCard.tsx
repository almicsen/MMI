'use client';

import { LiveShow } from '@/lib/firebase/types';

interface CarouselCardProps {
  show: LiveShow;
  onSelect: () => void;
  timeLabel: string;
}

export default function CarouselCard({ show, onSelect, timeLabel }: CarouselCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative flex flex-shrink-0 flex-col items-center justify-between overflow-hidden rounded-[18px] bg-[#5456CF] px-4 py-6 text-white shadow-[0_20px_40px_rgba(16,18,40,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
      style={{ width: 'clamp(280px, 82vw, 360px)', height: 'clamp(340px, 92vw, 440px)' }}
    >
      {show.status === 'live' && (
        <span className="absolute right-4 top-4 rounded-full bg-[#E53877] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white shadow-[0_8px_16px_rgba(16,18,40,0.35)]">
          Live
        </span>
      )}
      <div className="absolute -top-10 h-32 w-40 rounded-full bg-[#5B63DA]/70 blur-[0px]" />
      <div className="absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-[#77DBDB]" />
      <div className="absolute -bottom-10 -right-12 h-32 w-32 rounded-full bg-[#FDD245]" />

      <div className="z-10 flex flex-col items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/90">
          NEXT SHOW
        </span>
        <span className="text-2xl font-bold">{show.title}</span>
      </div>

      <div className="z-10 flex flex-col items-center gap-4">
        <span className="text-4xl font-bold">${show.prize.toLocaleString()}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/90">
          {timeLabel}
        </span>
      </div>
    </button>
  );
}
