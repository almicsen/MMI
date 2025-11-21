export type UserRole = 'guest' | 'employee' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
  progress?: {
    [contentId: string]: {
      progress: number; // percentage 0-100
      completed: boolean;
      lastWatched?: Date;
    };
  };
  permissions?: {
    [seriesId: string]: 'read' | 'write';
  };
  likes?: string[]; // Array of content IDs user has liked
  favorites?: string[]; // Array of content IDs user has favorited
  watchlist?: string[]; // Array of content IDs in watchlist
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived' | 'development' | 'relaunching' | 'announced';
  startDate?: string;
  endDate?: string;
  link?: string;
  externalClients?: boolean;
  isFeatured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Collaboration {
  id: string;
  name: string;
  summary: string;
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Content {
  id: string;
  type: 'series' | 'movie' | 'podcast';
  title: string;
  description: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  seriesId?: string; // for episodes
  episodeNumber?: number;
  seasonNumber?: number;
  duration?: number; // in seconds
  published: boolean;
  scheduledReleaseDate?: Date; // If set, content will be published at this date/time
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Series {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  logoUrl?: string; // Series logo
  backgroundUrl?: string; // Background image (optional)
  episodes: string[]; // array of contentIds
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  published: boolean;
  tags: string[];
  authorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Config {
  blogEnabled: boolean;
  aboutEnabled?: boolean;
  servicesEnabled?: boolean;
  contactEnabled?: boolean;
  projectsEnabled?: boolean;
  mmiPlusEnabled?: boolean;
  maintenanceMode?: boolean;
}

export interface PendingUpload {
  id: string;
  contentId: string;
  seriesId?: string;
  uploadedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface ComingSoonContent {
  id: string;
  type: 'series' | 'movie' | 'podcast';
  title: string;
  description: string;
  thumbnailUrl?: string;
  trailers?: string[]; // Array of trailer URLs (up to 4)
  releaseDate?: string; // ISO date string
  episodeCount?: number;
  upcomingEpisodes?: Array<{
    title: string;
    releaseDate: string;
    episodeNumber?: number;
    seasonNumber?: number;
  }>;
  notifySubscribers: string[]; // Array of user UIDs
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContentAnalytics {
  contentId: string;
  views: number;
  uniqueViews: number;
  watchTime: number; // Total seconds watched
  completionRate: number; // Percentage of users who completed
  viewsByPeriod: {
    [period: string]: number; // e.g., "2024-01-01": 150
  };
  // Nielsen-like detailed metrics
  averageWatchTime: number; // Average seconds per view
  peakViewingHours: { [hour: string]: number }; // Views by hour of day (0-23)
  peakViewingDays: { [day: string]: number }; // Views by day of week
  retentionCurve: { [timepoint: string]: number }; // % of viewers at each timepoint (0%, 25%, 50%, 75%, 100%)
  engagementScore: number; // Calculated engagement score (0-100)
  bounceRate: number; // % who watched < 10% of content
  rewatchRate: number; // % who watched multiple times
  demographics?: {
    ageGroups?: { [group: string]: number }; // "18-24", "25-34", etc.
    gender?: { [gender: string]: number };
    locations?: { [location: string]: number };
  };
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
    tv: number;
  };
  trafficSources?: {
    direct: number;
    search: number;
    referral: number;
    social: number;
  };
  skipIntroUsage?: number; // How many times skip intro was used
  skipRecapUsage?: number; // How many times skip recap was used
  xRayInteractions?: number; // How many times X-Ray was viewed
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ViewEvent {
  id: string;
  contentId: string;
  userId?: string; // null for anonymous
  timestamp: Date;
  duration: number; // seconds watched
  completed: boolean;
  deviceType?: string;
  location?: string;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  watchSegments?: Array<{ start: number; end: number }>; // Which parts were watched
  pauses?: number; // Number of pauses
  seeks?: number; // Number of seeks/scrubs
  playbackSpeed?: number; // Playback speed used
  quality?: string; // Video quality
  bandwidth?: number; // Estimated bandwidth
}

export interface ContentRating {
  contentId: string;
  averageRating: number; // 0-5 stars
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reviews?: Array<{
    userId: string;
    rating: number;
    review?: string;
    createdAt: Date;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomButton {
  id: string;
  label: string; // e.g., "Next Episode", "Skip Credits"
  startTime: number; // seconds
  endTime: number; // seconds
  action: 'skip' | 'next-episode' | 'custom';
  actionData?: {
    nextContentId?: string; // For next episode
    skipToTime?: number; // For skip action
  };
}

export interface ContentPlayerConfig {
  contentId: string;
  skipIntro?: {
    enabled: boolean;
    startTime: number; // seconds
    endTime: number; // seconds
  };
  skipRecap?: {
    enabled: boolean;
    startTime: number; // seconds
    endTime: number; // seconds
  };
  customButtons?: CustomButton[]; // Custom buttons like "Next Episode"
  autoPlayNext?: {
    enabled: boolean;
    countdownSeconds: number; // Default 10
  };
  xRayEnabled: boolean;
  xRayData?: XRayData[];
}

export interface XRayData {
  timestamp: number; // seconds into video
  type: 'actor' | 'song' | 'location' | 'fact';
  title: string;
  description?: string;
  imageUrl?: string;
  metadata?: {
    role?: string;
    character?: string;
    actorName?: string;
    songTitle?: string;
    artist?: string;
    locationName?: string;
    fact?: string;
  };
}

