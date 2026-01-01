import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminClientLayout from '@/components/admin/AdminClientLayout';
import { SESSION_COOKIE, touchSession } from '@/lib/auth/session';
import { adminDb } from '@/lib/firebase/admin';

export default async function AdminPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  const session = await touchSession(token);
  if (!session) {
    redirect('/login');
  }

  const userDoc = await adminDb.collection('users').doc(session.userId).get();
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    redirect('/');
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
