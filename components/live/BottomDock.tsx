'use client';

import PillButton from './PillButton';
import IconButton from './IconButton';

interface BottomDockProps {
  onLeaderboard: () => void;
  onInvite: () => void;
  onOverflow: () => void;
  photoUrl?: string | null;
  initials?: string;
}

export default function BottomDock({ onLeaderboard, onInvite, onOverflow, photoUrl, initials = 'ME' }: BottomDockProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4"
      style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-3 rounded-[24px] bg-[#232782]/85 px-4 py-3 shadow-[0_-12px_30px_rgba(10,12,40,0.45)] backdrop-blur">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/10 text-sm font-semibold text-white">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex flex-1 items-center justify-center gap-2">
          <PillButton onClick={onLeaderboard}>Leaderboard</PillButton>
          <PillButton onClick={onInvite}>Invite</PillButton>
        </div>
        <IconButton onClick={onOverflow} className="h-10 w-10 rounded-full bg-[#55589B]/80 text-white">
          <span className="text-lg">...</span>
        </IconButton>
      </div>
    </div>
  );
}
