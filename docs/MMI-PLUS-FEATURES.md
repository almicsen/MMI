# MMI+ Advanced Features

## Overview

MMI+ now includes comprehensive analytics, a custom video/audio player framework, and X-Ray insights similar to Apple TV and Amazon Prime Video.

## Features Implemented

### 1. Analytics Dashboard

**Location**: Admin Dashboard > Analytics Tab

**Features**:
- View metrics for all content
- Filter by time period: 24 hours, 7 days, 30 days, or all time
- Metrics tracked:
  - Total views
  - Unique views
  - Total watch time
  - Average completion rate
  - Views over time (daily breakdown)

**Usage**:
1. Go to Admin Dashboard
2. Click "Analytics" tab
3. Select time period from dropdown
4. View summary cards and detailed table
5. Click "View Details" on any content for detailed analytics

**Data Collection**:
- Automatically tracks views when content is played
- Tracks watch duration
- Tracks completion status
- Stores daily view counts
- Tracks unique vs. total views

### 2. Custom Video Player Framework

**Components**:
- `MMIVideoPlayer` - Custom video player with advanced features
- `MMIAudioPlayer` - Custom audio player for podcasts

**Features**:
- Custom controls with auto-hide
- Progress tracking
- Skip Intro button (admin configurable)
- Skip Recap button (admin configurable)
- X-Ray insights overlay
- Click to play/pause
- Seekable progress bar
- Time display

**Usage**:
The player automatically loads when viewing content in MMI+. No configuration needed for basic playback.

### 3. Skip Intro/Recap Configuration

**Location**: Admin Dashboard > Player Config Tab

**Features**:
- Enable/disable skip intro for each content
- Set start and end times for intro
- Enable/disable skip recap
- Set start and end times for recap
- Per-content configuration

**How to Configure**:
1. Go to Admin Dashboard > Player Config
2. Select content from dropdown
3. Toggle "Skip Intro" or "Skip Recap"
4. Enter start time (seconds) and end time (seconds)
5. Click "Save Configuration"

**Example**:
- Intro: Start at 0s, End at 90s
- Recap: Start at 1200s, End at 1350s

### 4. X-Ray Insights Feature

**Location**: Admin Dashboard > Player Config Tab

**Features**:
- Show actor information when they appear on screen
- Show song information
- Show location information
- Show interesting facts
- Timestamp-based triggers
- Rich metadata display

**How to Configure**:
1. Go to Admin Dashboard > Player Config
2. Select content
3. Enable "X-Ray Insights"
4. Click "Add X-Ray Item"
5. Configure:
   - Timestamp (when to show)
   - Type (actor, song, location, fact)
   - Title
   - Description
   - Image URL
   - Metadata (actor name, character, etc.)
6. Save configuration

**X-Ray Types**:

1. **Actor**:
   - Actor name
   - Character name
   - Role description
   - Photo

2. **Song**:
   - Song title
   - Artist
   - Description

3. **Location**:
   - Location name
   - Description

4. **Fact**:
   - Fact title
   - Fact description

**How It Works**:
- X-Ray items appear automatically when video reaches the configured timestamp
- Overlay shows for 3 seconds or until next X-Ray item
- Displays at bottom-left of video player
- Shows image, title, and metadata

### 5. Analytics Tracking

**Automatic Tracking**:
- Every view is tracked
- Watch duration is recorded
- Completion status (95%+ watched = completed)
- Device type (mobile/desktop)
- Timestamp of view
- User ID (if logged in)

**Data Storage**:
- `viewEvents` collection - Individual view events
- `contentAnalytics` collection - Aggregated analytics per content

**Privacy**:
- Anonymous views are tracked (no user ID)
- Logged-in users have views associated with their account
- No personal information is stored beyond user ID

## Database Collections

### contentAnalytics
```typescript
{
  contentId: string;
  views: number;
  uniqueViews: number;
  watchTime: number; // seconds
  completionRate: number; // percentage
  viewsByPeriod: { [date: string]: number };
  createdAt: Date;
  updatedAt: Date;
}
```

### viewEvents
```typescript
{
  contentId: string;
  userId?: string; // null for anonymous
  timestamp: Date;
  duration: number; // seconds watched
  completed: boolean;
  deviceType: string;
}
```

### playerConfigs
```typescript
{
  contentId: string;
  skipIntro?: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  };
  skipRecap?: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  };
  xRayEnabled: boolean;
  xRayData?: Array<{
    timestamp: number;
    type: 'actor' | 'song' | 'location' | 'fact';
    title: string;
    description?: string;
    imageUrl?: string;
    metadata?: object;
  }>;
}
```

## Usage Examples

### Setting Up Skip Intro

1. Play the video and note the intro start/end times
2. Go to Admin > Player Config
3. Select the content
4. Enable "Skip Intro"
5. Enter times (e.g., Start: 0, End: 90)
6. Save

### Adding X-Ray Actor Info

1. Go to Admin > Player Config
2. Select content
3. Enable X-Ray
4. Add X-Ray Item
5. Set timestamp (e.g., 120 for 2 minutes)
6. Type: Actor
7. Title: "John Doe"
8. Actor Name: "John Doe"
9. Character: "Detective Smith"
10. Add photo URL
11. Save

### Viewing Analytics

1. Go to Admin > Analytics
2. Select time period
3. View summary cards
4. Click "View Details" on any content for:
   - Daily view breakdown
   - Completion rates
   - Watch time trends

## Best Practices

1. **Skip Intro/Recap**: Test timing carefully - watch the video and note exact timestamps
2. **X-Ray**: Add X-Ray items for key moments (actor entrances, important locations, etc.)
3. **Analytics**: Check analytics regularly to understand viewer engagement
4. **Performance**: Analytics tracking is lightweight and won't impact playback

## Future Enhancements

- [ ] Export analytics to CSV
- [ ] Charts and graphs for analytics
- [ ] Real-time analytics
- [ ] A/B testing for content
- [ ] Viewer retention graphs
- [ ] Heat maps for video engagement

