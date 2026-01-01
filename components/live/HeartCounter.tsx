'use client';

export default function HeartCounter({ value }: { value: number }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        className="h-11 w-11"
        fill="#E53877"
        aria-hidden="true"
      >
        <path d="M12 21s-6.7-4.35-9.33-8.19C.45 9.18 2.2 5 6 5c2.08 0 3.36 1.07 4 2.04C10.64 6.07 11.92 5 14 5c3.8 0 5.55 4.18 3.33 7.81C18.7 16.65 12 21 12 21z" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}
