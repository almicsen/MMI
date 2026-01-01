'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logout, changeEmail, resetPassword } from '@/lib/firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getConfig } from '@/lib/firebase/firestore';
import LoadingState from '@/components/LoadingState';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
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

  if (authLoading || !user) {
    return <LoadingState />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await changeEmail(newEmail);
      setSuccess('Verification email sent. Please check your inbox.');
      setNewEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to change email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user.email) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await resetPassword(user.email);
      setSuccess('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePhotoUpload = async (photoUrl: string) => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await updateDoc(doc(db, 'users', user.uid), {
        customPhotoURL: photoUrl,
        updatedAt: new Date(),
      });
      setSuccess('Profile photo updated successfully!');
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Account"
          title="Profile & security"
          subtitle="Manage your identity, access, and notification preferences."
        />
      </section>

      <section className="section-tight space-y-6">
        {(error || success) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || success}
          </div>
        )}

        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-1)]">Account information</h2>
            <p className="text-sm text-[color:var(--text-3)]">Keep your profile up to date for personalized access.</p>
          </div>

          {config?.allowProfilePhotoUpload !== false && (
            <div className="border-t border-[color:var(--border-subtle)] pt-6">
              <ProfilePhotoUpload
                currentPhotoUrl={user.photoURL}
                onUploadComplete={handleProfilePhotoUpload}
                allowCamera={config?.allowCameraForProfilePhoto !== false}
                allowOverride={config?.allowProfilePhotoOverride !== false}
                userId={user.uid}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-4)]">Email</p>
              <p className="text-sm font-medium text-[color:var(--text-1)]">{user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-4)]">Role</p>
              <p className="text-sm font-medium text-[color:var(--text-1)]">{user.role}</p>
            </div>
            {user.displayName && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-4)]">Name</p>
                <p className="text-sm font-medium text-[color:var(--text-1)]">{user.displayName}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-1)]">Change email</h2>
            <p className="text-sm text-[color:var(--text-3)]">A verification email will be sent to your new address.</p>
          </div>
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email address"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Change email'}
            </Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-1)]">Password</h2>
            <p className="text-sm text-[color:var(--text-3)]">Reset your password with a secure email link.</p>
          </div>
          <Button variant="secondary" onClick={handleResetPassword} disabled={loading}>
            {loading ? 'Sending...' : 'Send password reset email'}
          </Button>
        </Card>

        <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text-1)]">Sign out</h2>
            <p className="text-sm text-[color:var(--text-3)]">End your session on this device.</p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Card>
      </section>
    </div>
  );
}
