'use client';

import InstantLink from '@/components/InstantLink';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';

const liveAdminModules = [
  {
    title: 'Schedule',
    description: 'Plan upcoming live shows, prizes, and timings.',
    href: '/admin/live/schedule',
  },
  {
    title: 'Control Room',
    description: 'Start, end, and monitor live gameplay.',
    href: '/admin/live/control',
  },
];

export default function AdminLiveIndexPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Live Operations"
        title="MMI + Live control center"
        subtitle="Schedule upcoming shows or run them in real time."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {liveAdminModules.map((item) => (
          <InstantLink key={item.href} href={item.href}>
            <Card className="h-full space-y-2 transition-transform duration-200 hover:-translate-y-1">
              <p className="text-base font-semibold text-[color:var(--text-1)]">{item.title}</p>
              <p className="text-sm text-[color:var(--text-3)]">{item.description}</p>
            </Card>
          </InstantLink>
        ))}
      </div>
    </div>
  );
}
