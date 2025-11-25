'use client';

import { ReactNode } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function AdminPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminLayout>
            {children}
          </AdminLayout>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

