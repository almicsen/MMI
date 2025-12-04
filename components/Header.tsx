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
    
    // Load config to determine which pages are enabled
    // Default to all enabled initially so guests see navigation immediately
    const defaultConfig: Config = {
      blogEnabled: true,
      aboutEnabled: true,
      servicesEnabled: true,
      contactEnabled: true,
      projectsEnabled: true,
      mmiPlusEnabled: true,
    };
    
    // Set default config immediately so nav shows for guests
    setConfig(defaultConfig);
    
    const loadConfig = async () => {
      try {
        const configData = await getConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Error loading config:', error);
        // Keep default config if load fails (so guests always see nav)
        // Don't reset to null - keep the default
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!config) return;
    
    // Prefetch enabled nav links for instant navigation
    const enabledLinks: string[] = ['/']; // Home is always enabled
    if (config.aboutEnabled !== false) enabledLinks.push('/about');
    if (config.servicesEnabled !== false) enabledLinks.push('/services');
    if (config.projectsEnabled !== false) enabledLinks.push('/projects');
    if (config.blogEnabled) enabledLinks.push('/blog');
    if (config.mmiPlusEnabled !== false) enabledLinks.push('/mmi-plus');
    if (config.contactEnabled !== false) enabledLinks.push('/contact');
    
    enabledLinks.forEach((href) => {
      router.prefetch(href);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Build nav links based on config (default to enabled if config not loaded yet)
  const allNavLinks = [
    { href: '/', label: 'Home', enabled: true }, // Home is always enabled
    { href: '/about', label: 'About', enabled: config?.aboutEnabled !== false },
    { href: '/services', label: 'Services', enabled: config?.servicesEnabled !== false },
    { href: '/projects', label: 'Projects', enabled: config?.projectsEnabled !== false },
    { href: '/blog', label: 'Blog', enabled: config?.blogEnabled === true },
    { href: '/mmi-plus', label: 'MMI+', enabled: config?.mmiPlusEnabled !== false },
    { href: '/contact', label: 'Contact', enabled: config?.contactEnabled !== false },
  ];

  // Filter to only show enabled links (always show links if config exists, default to all if not)
  const navLinks = config 
    ? allNavLinks.filter(link => link.enabled)
    : allNavLinks;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-gray-900/85 border-b border-gray-200 dark:border-gray-800">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <InstantLink href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            MMI
          </InstantLink>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <InstantLink
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {link.label}
              </InstantLink>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            )}

            {/* Token Balance, Messaging & Notification Center - Only show for logged-in users */}
            {!loading && user && (
              <>
                <TokenBalance />
                <MessagingButton />
                <NotificationCenter />
              </>
            )}
            
            {!loading && (
              user ? (
                <InstantLink
                  href={user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/dashboard' : '/profile'}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {user.role === 'admin' ? 'Admin' : user.role === 'employee' ? 'Dashboard' : 'Profile'}
                </InstantLink>
              ) : (
                <InstantLink
                  href="/login"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </InstantLink>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <InstantLink
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors py-2 ${
                    pathname === link.href
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {link.label}
                </InstantLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

