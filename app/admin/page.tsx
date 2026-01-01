'use client';

import InstantLink from '@/components/InstantLink';
import Card from '@/components/ui/Card';
import SectionHeading from '@/components/ui/SectionHeading';
import { adminNav } from '@/lib/admin/nav';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (!tab) return;
    const legacyMap: Record<string, string> = {
      'mmi-plus': '/admin/mmi-plus',
      pages: '/admin/pages',
      users: '/admin/users',
      content: '/admin/content',
      'coming-soon': '/admin/coming-soon',
      'projects-collaborations': '/admin/projects',
      config: '/admin/config',
      analytics: '/admin/analytics',
      'player-config': '/admin/player-config',
      recommendations: '/admin/recommendations',
      notifications: '/admin/notifications',
      'active-users': '/admin/active-users',
      cdn: '/admin/cdn',
      'site-issues': '/admin/site-issues',
      'contact-inbox': '/admin/contact-inbox',
      'api-keys': '/admin/api-keys',
      trivia: '/admin/trivia',
    };
    const target = legacyMap[tab];
    if (target) router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Admin Studio"
        title="Operate the entire MMI experience"
        subtitle="Manage live programming, content, growth, and platform operations from one polished control room."
      />

      {adminNav.map((group) => (
        <section key={group.title} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--text-1)]">{group.title}</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-4)]">
              {group.items.length} modules
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <InstantLink key={item.href} href={item.href} className="block">
                <Card className="h-full space-y-2 transition-transform duration-200 hover:-translate-y-1">
                  <p className="text-base font-semibold text-[color:var(--text-1)]">{item.label}</p>
                  <p className="text-sm text-[color:var(--text-3)]">{item.description}</p>
                </Card>
              </InstantLink>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
