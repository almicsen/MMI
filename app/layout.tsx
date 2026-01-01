import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import OSThemeProvider from "@/components/OSThemeProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import PreviewModeHandler from "@/components/PreviewModeHandler";
import ThemeSync from "@/components/ThemeSync";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ChromeRouteSync from "@/components/layout/ChromeRouteSync";

// Optimize fonts with display swap for faster rendering
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only load when needed
  fallback: ["monospace"],
});

// Lazy load heavy components
const LazyHeader = dynamic(() => import("@/components/Header"), {
  ssr: true,
  loading: () => <div className="h-16 bg-white dark:bg-gray-900" />,
});

const LazyFooter = dynamic(() => import("@/components/Footer"), {
  ssr: true,
  loading: () => <div className="h-32 bg-white dark:bg-gray-900" />,
});

export const metadata: Metadata = {
  title: "MobileMediaInteractions - Innovating Entertainment, Building Experiences",
  description: "MobileMediaInteractions — Innovating Entertainment, Building Experiences.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased app-shell`}
      >
        <GoogleAnalytics />
        <GlobalErrorHandler />
        <Suspense fallback={null}>
          <PreviewModeHandler />
        </Suspense>
        <OSThemeProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[color:var(--surface-2)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--text-1)] focus:shadow-lg"
              >
                Skip to content
              </a>
              <ThemeSync />
              <ChromeRouteSync />
              <script
                dangerouslySetInnerHTML={{
                  __html: `(function(){var p=location.pathname||'';var hide=p.startsWith('/admin')||p.startsWith('/live');document.documentElement.dataset.hideChrome=hide?'true':'false';})();`,
                }}
              />
              <div className="site-chrome">
                <LazyHeader />
              </div>
              <main id="main-content" className="app-main">
                {children}
              </main>
              <div className="site-chrome">
                <LazyFooter />
              </div>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
        </OSThemeProvider>
      </body>
    </html>
  );
}
