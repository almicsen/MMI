export type UserRole = 'guest' | 'employee' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string; // Google profile photo
  customPhotoURL?: string; // Custom uploaded photo (overrides photoURL if set)
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
  themePreference?: 'light' | 'dark' | null;
  // Activity tracking
  lastSeen?: Date;
  isOnline?: boolean;
  currentPage?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContactMessageStatus = 'new' | 'open' | 'closed';

export interface ContactMessageMetadata {
  userAgent?: string;
  appVersion?: string;
  pageUrl?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

export interface ContactMessage {
  id: string;
  userId: string;
  name?: string;
  email?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  tags?: string[];
  internalNotes?: string;
  assignedTo?: string | null;
  metadata?: ContactMessageMetadata;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: 'contact-message';
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
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
  type: 'series' | 'movie' | 'podcast' | 'audiobook';
  title: string;
  description: string;
  mediaUrl: string;
  // MMI+ Original flag for intro injection
  isMMIOriginal?: boolean;
  // Trailer support (video for movies/series, audio for podcasts/audiobooks)
  trailerUrl?: string; // Video trailer URL (for movies/series) or audio sample (for podcasts/audiobooks)
  trailerType?: 'video' | 'audio'; // Type of trailer
  // Audiobook specific fields
  bookFileUrl?: string; // EPUB file URL for synced reading
  chapters?: AudiobookChapter[];
  // Paid content
  isPaid?: boolean; // If true, requires payment to access
  price?: number; // Price in USD (if isPaid is true)
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

export interface AudiobookChapter {
  id: string;
  title: string;
  startTime: number; // Start time in seconds
  endTime?: number; // End time in seconds (optional, defaults to next chapter start)
  pageNumber?: number; // Corresponding page in the book (for EPUB sync)
  description?: string;
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
  messagesEnabled?: boolean; // Enable/disable messages page
  maintenanceMode?: boolean;
  // Profile photo settings
  allowProfilePhotoUpload?: boolean;
  allowProfilePhotoOverride?: boolean; // Allow overriding Google profile photo
  allowCameraForProfilePhoto?: boolean; // Allow using device camera
  liveEnabled?: boolean;
}

export type LiveShowStatus = 'scheduled' | 'live' | 'ended';

export interface LiveShow {
  id: string;
  title: string;
  prize: number;
  startTime: Date;
  status: LiveShowStatus;
}

export interface LiveStats {
  balance: number;
  hearts: number;
  weeklyRank: number;
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
  // Intro injection settings
  videoIntroUrl?: string; // MMI+ video intro URL (for video content)
  audioIntroUrl?: string; // MMI+ audio intro URL (for audio/podcast content)
  introDuration?: number; // Duration of intro in seconds
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

export interface SiteNotification {
  id: string;
  userId: string; // Target user UID
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string; // Optional link to navigate to
  openInAppBrowser?: boolean; // If true, opens link in in-app browser instead of full navigation
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  sentBy?: string; // Admin UID who sent it
}

export interface UserActivity {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: Date;
  currentPage?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
  sessionStart?: Date;
}

export type APITier = 'free' | 'starter' | 'business' | 'enterprise';

export interface APIKey {
  id?: string;
  key: string; // Hashed API key
  userId: string; // User who owns the key
  name: string; // User-friendly name for the key
  allowedUrls: string[]; // URLs that are exempt from origin checking
  scopes: string[]; // Permissions: ['read', 'write', 'notifications', 'content']
  tier: APITier; // Pricing tier
  rateLimit?: {
    requests: number; // Requests per period
    period: number; // Period in seconds
  };
  monthlyQuota?: number; // Monthly request limit
  monthlyQuotaUsed?: number; // Current month's usage
  quotaResetDate?: Date; // When monthly quota resets
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
  active: boolean;
  description?: string;
  // Billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // Manual overrides
  manualOverrides?: {
    additionalRequests?: number; // Temporary request boost
    overrideExpiresAt?: Date;
    customRateLimit?: {
      requests: number;
      period: number;
    };
    overrideExpiresAtRateLimit?: Date;
  };
}

export interface APIKeyRequest {
  id?: string;
  name: string;
  email: string;
  company?: string;
  useCase: string; // Required detailed use case
  expectedMonthlyVolume: number;
  deploymentPreference: 'saas' | 'self-hosted';
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin UID
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  // Auto-generated on approval
  apiKeyId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface APIUsage {
  id?: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number; // milliseconds
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  tier?: APITier; // Track which tier made the request
}

export interface AuditLog {
  id?: string;
  action: 'key_created' | 'key_approved' | 'key_rejected' | 'key_suspended' | 'key_activated' | 'limit_override' | 'tier_changed';
  apiKeyId?: string;
  requestId?: string;
  adminUserId: string;
  adminEmail: string;
  details: Record<string, any>; // Flexible details object
  timestamp: Date;
}

export interface SelfHostLicense {
  id?: string;
  licenseKey: string; // Hashed license key
  customerId: string; // Stripe customer ID or internal customer ID
  domain?: string; // Allowed domain
  hardwareFingerprint?: string; // Hardware fingerprint
  lastValidated?: Date;
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
}

export interface ContentPurchase { // For paid content purchases
  id?: string;
  userId: string;
  contentId: string;
  price: number;
  purchasedAt: Date;
  paymentMethod?: 'stripe' | 'tokens'; // Payment method
  transactionId?: string;
  tokensUsed?: number; // If paid with tokens
}

export interface MMIToken { // MMI Token system
  id?: string;
  userId: string;
  balance: number; // Current token balance
  totalEarned: number; // Total tokens ever earned
  totalSpent: number; // Total tokens ever spent
  lastUpdated: Date;
}

export interface TokenTransaction { // Token transaction history
  id?: string;
  userId: string;
  type: 'earned' | 'spent' | 'purchase' | 'reward';
  amount: number; // Positive for earned, negative for spent
  description: string;
  source?: string; // e.g., 'trivia', 'content_purchase', 'admin_grant'
  createdAt: Date;
}

export interface TriviaChallenge { // Trivia challenge configuration
  id?: string;
  name: string;
  questionsCount: number; // Total questions (will be divided: 1/3 easy, 1/3 medium, 1/3 hard)
  timePerQuestion: number; // Seconds per question
  tokenReward: number; // Tokens per correct answer
  bonusQuestions?: { [questionNumber: number]: number }; // Question number -> multiplier (e.g., { 5: 2, 10: 3 } means Q5 has 2x bonus, Q10 has 3x bonus)
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriviaQuestion { // From Open Trivia DB
  category: string;
  type: 'multiple';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface TriviaSession { // User's trivia session
  id?: string;
  userId: string;
  challengeId: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    userAnswer?: string;
    isCorrect?: boolean;
    timeSpent: number; // seconds
    questionNumber: number; // Question number (1-indexed)
    bonusMultiplier?: number; // Bonus multiplier for this question
  }>;
  score: number; // Correct answers
  totalQuestions: number;
  tokensEarned: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
  lastAttemptDate?: string; // YYYY-MM-DD format for daily limit tracking
  currentQuestionIndex?: number; // For state saving
}

// Messaging System (Slack-like)
export interface Conversation { // 1:1 conversation between two users
  id?: string;
  participants: string[]; // Array of user UIDs [user1, user2] (sorted for consistency)
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  lastActivity: Date;
  unreadCount?: { [userId: string]: number }; // Unread count per user
  createdAt: Date;
  updatedAt: Date;
}

export interface Message { // Individual message in a conversation
  id?: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderPhotoURL?: string;
  text: string;
  timestamp: Date;
  readBy?: string[]; // Array of user UIDs who have read this message
  edited?: boolean;
  editedAt?: Date;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'image' | 'file' | 'link';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}
