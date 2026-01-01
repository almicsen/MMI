'use client';

import IconButton from './IconButton';

interface LiveHeaderProps {
  onInvite: () => void;
  onHelp: () => void;
}

export default function LiveHeader({ onInvite, onHelp }: LiveHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pb-3 pt-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <IconButton aria-label="Add friend" onClick={onInvite}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 19.5v-1.5c0-1.66-1.79-3-4-3s-4 1.34-4 3v1.5" />
          <circle cx="12.5" cy="9" r="3" />
          <path d="M20 8v4" />
          <path d="M18 10h4" />
        </svg>
      </IconButton>

      <div className="text-center">
        <span className="text-3xl font-bold tracking-tight text-white">HQ</span>
      </div>

      <IconButton aria-label="Help" variant="outline" onClick={onHelp} className="border-white/50">
        <span className="text-lg font-semibold">?</span>
      </IconButton>
    </div>
  );
}
