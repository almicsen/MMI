'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in (using useEffect to avoid render-time side effects)
  useEffect(() => {
    if (user && !authLoading) {
      const redirectPath = user.role === 'admin' 
        ? '/admin' 
        : user.role === 'employee' 
        ? '/dashboard' 
        : '/profile';
      router.push(redirectPath);
    }
  }, [user, authLoading, router]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  // Don't render login form if user is already logged in (redirect is in progress)
  if (user) {
    return null;
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
    // Email/password auth is coming soon
    setError('Email/password authentication is coming soon. Please use Google sign-in for now.');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        {isSignUp ? 'Sign Up' : 'Login'}
      </h1>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span>
          </div>
        </div>

        <div className="relative">
          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold mb-2">
                Coming Soon
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email/password authentication will be available soon
              </p>
            </div>
          </div>

          {/* Blurred Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 opacity-60 pointer-events-none">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => setIsSignUp(false)} 
                className="text-blue-600 dark:text-blue-400 hover:underline"
                disabled={loading}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button 
                onClick={() => setIsSignUp(true)} 
                className="text-blue-600 dark:text-blue-400 hover:underline"
                disabled={loading}
              >
                Sign up
              </button>
            </>
          )}
        </p>
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
          Currently, only Google sign-in is available. Email/password authentication coming soon!
        </p>
      </div>
    </div>
  );
}

