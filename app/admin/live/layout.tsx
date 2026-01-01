import { ReactNode } from 'react';
import InstantLink from '@/components/InstantLink';

const liveLinks = [
  { href: '/admin/live', label: 'Overview' },
  { href: '/admin/live/schedule', label: 'Schedule' },
  { href: '/admin/live/shows', label: 'Shows' },
  { href: '/admin/live/control', label: 'Control Room' },
];

export default function AdminLiveLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2">
        {liveLinks.map((link) => (
          <InstantLink
            key={link.href}
            href={link.href}
            className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-sm font-medium text-[color:var(--text-3)] transition hover:text-[color:var(--text-1)] hover:border-[color:var(--border-strong)]"
          >
            {link.label}
          </InstantLink>
        ))}
      </nav>
      {children}
    </div>
  );
}
