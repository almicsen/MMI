'use client';

import { ReactNode, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminClientLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? (
    <AdminShell>{children}</AdminShell>
  ) : (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[color:var(--surface-1)]"
    />
  );
}
