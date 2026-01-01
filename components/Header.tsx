'use client';

import InstantLink from './InstantLink';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getConfig } from '@/lib/firebase/firestore';
import { Config } from '@/lib/firebase/types';
import NotificationCenter from './NotificationCenter';
import TokenBalance from './TokenBalance';
import MessagingButton from './messaging/MessagingButton';
import Button from './ui/Button';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const defaultConfig: Config = {
      blogEnabled: true,
      aboutEnabled: true,
      servicesEnabled: true,
      contactEnabled: true,
      projectsEnabled: true,
      mmiPlusEnabled: true,
      liveEnabled: false,
    };

    setConfig(defaultConfig);

    const loadConfig = async () => {
      try {
        const configData = await getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!config) return;

    const enabledLinks: string[] = ['/'];
    if (config.aboutEnabled !== false) enabledLinks.push('/about');
    if (config.servicesEnabled !== false) enabledLinks.push('/services');
    if (config.projectsEnabled !== false) enabledLinks.push('/projects');
    if (config.blogEnabled) enabledLinks.push('/blog');
    if (config.mmiPlusEnabled !== false) enabledLinks.push('/mmi-plus');
    if (config.liveEnabled === true && user) enabledLinks.push('/live');
    if (config.contactEnabled !== false && user) enabledLinks.push('/contact');

    enabledLinks.forEach((href) => {
      router.prefetch(href);
    });
  }, [config, router, user]);

  const allNavLinks = [
    { href: '/', label: 'Home', enabled: true },
    { href: '/about', label: 'About', enabled: config?.aboutEnabled !== false },
    { href: '/services', label: 'Services', enabled: config?.servicesEnabled !== false },
    { href: '/projects', label: 'Projects', enabled: config?.projectsEnabled !== false },
    { href: '/blog', label: 'Insights', enabled: config?.blogEnabled === true },
    { href: '/mmi-plus', label: 'MMI+', enabled: config?.mmiPlusEnabled !== false },
    { href: '/live', label: 'Live', enabled: config?.liveEnabled === true && !!user },
    { href: '/contact', label: 'Contact', enabled: config?.contactEnabled !== false && !!user },
  ];

  const navLinks = config ? allNavLinks.filter((link) => link.enabled) : allNavLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <InstantLink href="/" className="flex items-center gap-3 text-lg font-semibold text-[color:var(--text-1)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[color:var(--brand-primary)] text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)]">
              M
            </span>
            <span className="hidden sm:inline tracking-tight">MobileMediaInteractions</span>
            <span className="sm:hidden tracking-tight">MMI</span>
          </InstantLink>

          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => (
              <InstantLink
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[color:var(--text-1)]'
                    : 'text-[color:var(--text-3)] hover:text-[color:var(--text-1)]'
                }`}
              >
                {link.label}
              </InstantLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] text-[color:var(--text-2)] transition-colors hover:border-[color:var(--brand-accent)] hover:text-[color:var(--brand-accent)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <span aria-hidden>☀️</span>
              ) : (
                <span aria-hidden>🌙</span>
              )}
            </button>
          )}

          {!loading && user && (
            <div className="hidden md:flex items-center gap-2">
              <TokenBalance />
              <MessagingButton />
              <NotificationCenter />
            </div>
          )}

          {!loading && (
            user ? (
              <InstantLink
                href={user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/dashboard' : '/profile'}
                className="hidden sm:inline-flex"
              >
                <Button variant="outline" size="sm">
                  {user.role === 'admin' ? 'Admin' : user.role === 'employee' ? 'Dashboard' : 'Profile'}
                </Button>
              </InstantLink>
            ) : (
              <InstantLink href="/login" className="hidden sm:inline-flex">
                <Button size="sm">Sign in</Button>
              </InstantLink>
            )
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-subtle)] text-[color:var(--text-2)] lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <InstantLink
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[color:var(--brand-primary)]'
                    : 'text-[color:var(--text-3)] hover:text-[color:var(--brand-primary)]'
                }`}
              >
                {link.label}
              </InstantLink>
            ))}

            {!loading && (
              user ? (
                <InstantLink
                  href={user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/dashboard' : '/profile'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant="outline" size="sm" className="w-full">
                    {user.role === 'admin' ? 'Admin' : user.role === 'employee' ? 'Dashboard' : 'Profile'}
                  </Button>
                </InstantLink>
              ) : (
                <InstantLink href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">Sign in</Button>
                </InstantLink>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
