'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserPhotoURL } from '@/lib/firebase/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Admin Header */}
      <header className="relative bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Admin Control</h1>
                <p className="text-xs text-cyan-400/80">Web3 Dashboard</p>
              </div>
            </div>
            <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent"></div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-cyan-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-cyan-300 font-mono">mobilemediainteractions.com</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">{user.displayName || user.email}</div>
                  <div className="text-xs text-purple-300">Administrator</div>
                </div>
                {getUserPhotoURL(user) ? (
                  <img
                    src={getUserPhotoURL(user)!}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border-2 border-cyan-500/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {user.displayName?.[0] || user.email?.[0] || 'A'}
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Admin Footer */}
      <footer className="relative bg-slate-900/80 backdrop-blur-xl border-t border-cyan-500/20 px-6 py-4">
        <div className="text-center text-sm text-cyan-300/80">
          <p className="font-mono">Admin Control © {new Date().getFullYear()} MobileMediaInteractions</p>
        </div>
      </footer>
    </div>
  );
}

