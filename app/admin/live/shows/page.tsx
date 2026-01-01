'use client';

import InstantLink from '@/components/InstantLink';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import LiveScheduleManager from '@/components/admin/live/LiveScheduleManager';

export default function AdminLiveShowsIndexPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Live Shows"
        title="Schedule and manage live shows"
        subtitle="Create, launch, and wrap up live game shows with confidence."
      />

      <div className="flex flex-wrap gap-2">
        <InstantLink
          href="/admin/live/control"
          className="rounded-full border border-[color:var(--border-subtle)] px-4 py-2 text-sm font-medium text-[color:var(--text-3)] transition hover:text-[color:var(--text-1)] hover:border-[color:var(--border-strong)]"
        >
          Control Room
        </InstantLink>
        <InstantLink
          href="/admin/live/shows"
          className="rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-medium text-[color:var(--text-1)]"
        >
          Schedule
        </InstantLink>
      </div>

      <Card className="p-0">
        <LiveScheduleManager />
      </Card>
    </div>
  );
}
