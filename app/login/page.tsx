'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading, sessionStatus, sessionError, retrySession } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading && sessionStatus === 'ready') {
      const redirectPath = user.role === 'admin'
        ? '/admin'
        : user.role === 'employee'
        ? '/dashboard'
        : '/profile';
      router.push(redirectPath);
    }
  }, [user, authLoading, sessionStatus, router]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-center text-sm text-[color:var(--text-3)]">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="space-y-4 text-center">
          <p className="text-sm font-semibold text-[color:var(--text-1)]">Finalizing secure session</p>
          <p className="text-sm text-[color:var(--text-3)]">
            {sessionStatus === 'error'
              ? (sessionError || 'We could not complete your session.')
              : 'Please wait while we finish signing you in.'}
          </p>
          <div className="flex justify-center">
            <Button
              onClick={retrySession}
              size="sm"
              variant={sessionStatus === 'error' ? 'primary' : 'secondary'}
              disabled={sessionStatus === 'loading'}
            >
              {sessionStatus === 'loading' ? 'Working…' : 'Retry session'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('Email/password authentication is coming soon. Please use Google sign-in for now.');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--brand-accent)]">Welcome</p>
        <h1 className="text-3xl font-semibold text-[color:var(--text-1)]">{isSignUp ? 'Create your account' : 'Sign in to MMI'}</h1>
        <p className="text-sm text-[color:var(--text-3)]">Experience premium entertainment workflows.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="space-y-6">
        <Button onClick={handleGoogleSignIn} disabled={loading} variant="secondary" className="w-full">
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-[color:var(--text-4)]">
          <span className="h-px flex-1 bg-[color:var(--border-subtle)]"></span>
          <span>Or</span>
          <span className="h-px flex-1 bg-[color:var(--border-subtle)]"></span>
        </div>

        <div className="relative">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[color:var(--surface-2)]/85 text-center backdrop-blur">
            <span className="rounded-full bg-[color:var(--brand-primary)] px-3 py-1 text-xs font-semibold text-white">Coming soon</span>
            <p className="text-xs text-[color:var(--text-3)]">Email/password authentication will be available shortly.</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 opacity-60">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-[color:var(--text-2)]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="mt-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-[color:var(--text-2)]">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled className="w-full">
              {isSignUp ? 'Sign up' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[color:var(--text-3)]">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-semibold text-[color:var(--brand-primary)]"
            disabled={loading}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </Card>
    </div>
  );
}
