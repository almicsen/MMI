'use client';

import { LiveShow } from '@/lib/firebase/types';
import CarouselCard from './CarouselCard';

interface CarouselProps {
  shows: LiveShow[];
  onSelect: (show: LiveShow) => void;
  formatTime: (show: LiveShow) => string;
}

export default function Carousel({ shows, onSelect, formatTime }: CarouselProps) {
  const nextShows = shows.length ? shows : [];

  return (
    <div className="relative mt-6">
      <div
        className="live-carousel flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6 md:px-10"
        style={{ scrollSnapType: 'x mandatory' }}
        aria-roledescription="carousel"
      >
        {nextShows.map((show, index) => (
          <div key={show.id} style={{ scrollSnapAlign: 'start' }}>
            <CarouselCard show={show} onSelect={() => onSelect(show)} timeLabel={formatTime(show)} />
          </div>
        ))}
        <div
          className="flex-shrink-0 rounded-[18px] bg-[#5BC796] shadow-[0_16px_30px_rgba(16,18,40,0.25)]"
          style={{ width: 'clamp(120px, 36vw, 180px)', height: 'clamp(340px, 92vw, 440px)' }}
          aria-hidden
        />
      </div>
    </div>
  );
}
