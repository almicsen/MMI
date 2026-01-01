'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserPhotoURL } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { adminNav } from '@/lib/admin/nav';
import InstantLink from '@/components/InstantLink';
import Button from '@/components/ui/Button';

interface AdminShellProps {
  children: ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const activeLabel = useMemo(() => {
    for (const group of adminNav) {
      const match = group.items.find((item) => item.href === pathname);
      if (match) return match.label;
    }
    return 'Admin';
  }, [pathname]);

  const navLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of adminNav) {
      for (const item of group.items) {
        map.set(item.href, item.label);
      }
    }
    return map;
  }, []);

  const breadcrumbs = useMemo(() => {
    if (!pathname?.startsWith('/admin')) return [];
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`;
      const label =
        navLabelMap.get(href) ||
        segment
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      return { href, label };
    });
    return crumbs;
  }, [pathname, navLabelMap]);

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className="min-h-screen bg-[color:var(--surface-1)] text-[color:var(--text-1)]"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface-1)] text-[color:var(--text-1)]">
      <div className="mx-auto flex min-h-screen max-w-[1400px] gap-0 px-0">
        <aside className="hidden w-72 flex-col border-r border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-5 py-6 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[color:var(--brand-primary)] text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)]">
              M
            </div>
            <div>
              <p className="text-sm font-semibold">Admin Studio</p>
              <p className="text-xs text-[color:var(--text-4)]">MobileMediaInteractions</p>
            </div>
          </div>

          <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-2">
            {adminNav.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
                  {group.title}
                </p>
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <InstantLink
                        key={item.href}
                        href={item.href}
                        className={`rounded-2xl px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-[color:var(--surface-3)] text-[color:var(--text-1)]'
                            : 'text-[color:var(--text-3)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-1)]'
                        }`}
                      >
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-[color:var(--text-4)]">{item.description}</div>
                        )}
                      </InstantLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[color:var(--border-subtle)] pt-4">
            {user && (
              <div className="flex items-center gap-3">
                {getUserPhotoURL(user) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getUserPhotoURL(user)!}
                    alt={user.displayName || 'Admin'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--surface-3)] text-sm font-semibold">
                    {user.displayName?.[0] || user.email?.[0] || 'A'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{user.displayName || user.email}</p>
                  <p className="text-xs text-[color:var(--text-4)]">Administrator</p>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/90 px-4 py-4 backdrop-blur sm:px-8 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
                  Admin
                </p>
                <h1 className="text-2xl font-semibold text-[color:var(--text-1)]">{activeLabel}</h1>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setNavOpen(true)}
                >
                  Menu
                </Button>
              </div>
            </div>

            {breadcrumbs.length > 1 && (
              <nav aria-label="Breadcrumb" className="text-sm text-[color:var(--text-4)]">
                <ol className="flex flex-wrap items-center gap-2">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.href} className="flex items-center gap-2">
                      {index > 0 && <span className="text-[color:var(--text-4)]">/</span>}
                      <InstantLink
                        href={crumb.href}
                        className={`${
                          index === breadcrumbs.length - 1
                            ? 'text-[color:var(--text-2)]'
                            : 'text-[color:var(--text-4)] hover:text-[color:var(--text-2)]'
                        }`}
                      >
                        {crumb.label}
                      </InstantLink>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </header>

          <main className="flex-1 px-4 py-6 sm:px-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden">
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-[color:var(--surface-2)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Admin Navigation</p>
              <button
                onClick={() => setNavOpen(false)}
                className="rounded-full border border-[color:var(--border-subtle)] px-3 py-1 text-xs"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-6 overflow-y-auto">
              {adminNav.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">
                    {group.title}
                  </p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <InstantLink
                          key={item.href}
                          href={item.href}
                          onClick={() => setNavOpen(false)}
                          className={`rounded-2xl px-3 py-2 text-sm transition ${
                            isActive
                              ? 'bg-[color:var(--surface-3)] text-[color:var(--text-1)]'
                              : 'text-[color:var(--text-3)] hover:bg-[color:var(--surface-3)] hover:text-[color:var(--text-1)]'
                          }`}
                        >
                          <div className="font-medium">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-[color:var(--text-4)]">{item.description}</div>
                          )}
                        </InstantLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[color:var(--border-subtle)] pt-4">
              <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
