'use client';

import { useEffect, useState } from 'react';
import InstantLink from './InstantLink';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { user } = useAuth();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="mt-auto border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[color:var(--brand-primary)] text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)]">
                M
              </span>
              <div>
                <p className="text-base font-semibold text-[color:var(--text-1)]">MobileMediaInteractions</p>
                <p className="text-sm text-[color:var(--text-3)]">Innovating Entertainment, Building Experiences.</p>
              </div>
            </div>
            <p className="text-sm text-[color:var(--text-3)]">
              A premium studio blending storytelling, technology, and interactive experiences for modern audiences.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">Explore</p>
            <div className="flex flex-col gap-2 text-sm text-[color:var(--text-3)]">
              <InstantLink href="/about" className="hover:text-[color:var(--brand-primary)]">About</InstantLink>
              <InstantLink href="/services" className="hover:text-[color:var(--brand-primary)]">Services</InstantLink>
              <InstantLink href="/projects" className="hover:text-[color:var(--brand-primary)]">Projects</InstantLink>
              <InstantLink href="/mmi-plus" className="hover:text-[color:var(--brand-primary)]">MMI+</InstantLink>
              {user && (
                <InstantLink href="/contact" className="hover:text-[color:var(--brand-primary)]">Contact</InstantLink>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-4)]">Account</p>
            <div className="flex flex-col gap-2 text-sm text-[color:var(--text-3)]">
              <InstantLink href={user ? '/profile' : '/login'} className="hover:text-[color:var(--brand-primary)]">
                {user ? 'Profile' : 'Sign in'}
              </InstantLink>
              {user?.role === 'admin' && (
                <InstantLink href="/admin" className="hover:text-[color:var(--brand-primary)]">Admin</InstantLink>
              )}
              {user?.role === 'employee' && (
                <InstantLink href="/dashboard" className="hover:text-[color:var(--brand-primary)]">Dashboard</InstantLink>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[color:var(--border-subtle)] pt-6 text-xs text-[color:var(--text-4)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} MobileMediaInteractions. All Rights Reserved.</p>
          <p>Built with care for performance, accessibility, and security.</p>
        </div>
      </div>
    </footer>
  );
}
