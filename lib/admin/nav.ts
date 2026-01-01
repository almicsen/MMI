export interface AdminNavItem {
  label: string;
  href: string;
  description?: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNav: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', description: 'High-level system status and quick actions.' },
      { label: 'Site Preview', href: '/admin/site-preview', description: 'Preview the public experience.' },
      { label: 'Route Map', href: '/admin/route-map', description: 'Admin route index and deep links.' },
    ],
  },
  {
    title: 'Live',
    items: [
      { label: 'Schedule', href: '/admin/live/schedule', description: 'Plan upcoming live shows.' },
      { label: 'Control Room', href: '/admin/live/control', description: 'Run live games in real time.' },
      { label: 'Shows', href: '/admin/live/shows', description: 'Detailed show scheduling and status.' },
      { label: 'Trivia', href: '/admin/trivia', description: 'Manage question sets and challenges.' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'MMI+', href: '/admin/mmi-plus', description: 'Streaming library and originals.' },
      { label: 'Content', href: '/admin/content', description: 'Media, metadata, and scheduling.' },
      { label: 'Pages', href: '/admin/pages', description: 'Marketing pages and layout.' },
      { label: 'Projects', href: '/admin/projects', description: 'Projects and collaborations.' },
      { label: 'Coming Soon', href: '/admin/coming-soon', description: 'Upcoming launches and trailers.' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Users', href: '/admin/users', description: 'Roles, access, and profiles.' },
      { label: 'Active Users', href: '/admin/active-users', description: 'Realtime audience activity.' },
      { label: 'Notifications', href: '/admin/notifications', description: 'Broadcast messaging and alerts.' },
      { label: 'Contact Inbox', href: '/admin/contact-inbox', description: 'Authenticated support messages.' },
      { label: 'API Keys', href: '/admin/api-keys', description: 'Key issuance and scopes.' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Analytics', href: '/admin/analytics', description: 'Performance and engagement metrics.' },
      { label: 'Recommendations', href: '/admin/recommendations', description: 'Curated discovery controls.' },
      { label: 'Player Config', href: '/admin/player-config', description: 'Player feature flags.' },
      { label: 'CDN', href: '/admin/cdn', description: 'Delivery and cache settings.' },
      { label: 'Site Issues', href: '/admin/site-issues', description: 'Operational incidents and fixes.' },
      { label: 'Config', href: '/admin/config', description: 'Feature flags and global toggles.' },
    ],
  },
];
