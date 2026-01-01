'use client';

import InstantLink from '@/components/InstantLink';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { adminNav } from '@/lib/admin/nav';

export default function AdminRouteMapPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin Map"
        title="Every admin route in one place"
        subtitle="Use this index to jump directly to nested admin modules."
      />

      {adminNav.map((group) => (
        <section key={group.title} className="space-y-4">
          <h2 className="text-lg font-semibold text-[color:var(--text-1)]">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <InstantLink key={item.href} href={item.href} className="block">
                <Card className="h-full space-y-2">
                  <p className="text-base font-semibold text-[color:var(--text-1)]">{item.label}</p>
                  <p className="text-sm text-[color:var(--text-3)]">{item.description}</p>
                  <p className="text-xs text-[color:var(--text-4)]">{item.href}</p>
                </Card>
              </InstantLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
