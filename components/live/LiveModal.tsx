'use client';

import Button from '@/components/ui/Button';

interface LiveModalProps {
  title: string;
  description: string;
  onClose: () => void;
}

export default function LiveModal({ title, description, onClose }: LiveModalProps) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-[#1D1F4A] p-6 text-white shadow-2xl"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-white/80">{description}</p>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
