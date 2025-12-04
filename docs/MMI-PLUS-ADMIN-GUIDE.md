# MMI+ Admin Guide - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Accessing the Admin Dashboard](#accessing-the-admin-dashboard)
3. [Analytics Dashboard](#analytics-dashboard)
4. [AI Recommendations](#ai-recommendations)
5. [Content Management](#content-management)
6. [Player Configuration](#player-configuration)
7. [Timeline Editor](#timeline-editor)
8. [Rating System](#rating-system)
9. [Coming Soon Content](#coming-soon-content)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The MMI+ Admin Dashboard provides comprehensive tools for managing content, viewing detailed analytics (Nielsen-like metrics), configuring player features, and managing user engagement. This guide covers every aspect of the admin interface.

---

## Accessing the Admin Dashboard

### Prerequisites

1. **Admin Account**: You must have an account with the `admin` role
2. **Login**: Sign in to your account at `/login`

### Steps to Access

1. Navigate to the website
2. Click "Login" in the header (or go to `/login`)
3. Sign in with Google or email/password
4. If you have admin role, you'll see "Admin" in the header
5. Click "Admin" to access the dashboard

**Note**: If you don't see "Admin", your account may not have admin privileges. Contact another admin to update your role in Firestore.

---

## Analytics Dashboard

### Overview

The Analytics Dashboard provides Nielsen-like detailed metrics for all MMI+ content, including viewer engagement, retention, demographics, and viewing patterns.

### Accessing Analytics

1. Go to Admin Dashboard
2. Click the "Analytics" tab
3. Select a time period from the dropdown:
   - **Last 24 Hours**: Views from the past day
   - **Last 7 Days**: Views from the past week
   - **Last 30 Days**: Views from the past month
   - **All Time**: Complete historical data

### Summary Cards

The dashboard displays six key metrics at the top:

1. **Total Views**: Total number of content views
2. **Unique Views**: Number of unique viewers
3. **Watch Time**: Total time spent watching (formatted as hours/minutes)
4. **Avg. Completion**: Average percentage of content completed
5. **Engagement Score**: Calculated engagement (0-100 scale)
6. **Bounce Rate**: Percentage who watched less than 10% of content

### Content Analytics Table

The main table shows analytics for each content item:

| Column | Description |
|--------|-------------|
| Content ID | Unique identifier for the content |
| Views | Total number of views |
| Unique | Number of unique viewers |
| Watch Time | Total seconds watched |
| Completion | Percentage who completed (95%+) |
| Engagement | Engagement score (0-100) |
| Bounce Rate | % who watched <10% |

### Viewing Detailed Analytics

1. Click "View Details" on any content row
2. A modal opens showing:
   - **Total Views & Unique Views**
   - **Total Watch Time & Completion Rate**
   - **Average Watch Time**: Average duration per view
   - **Engagement Score**: Calculated engagement metric
   - **Device Breakdown**: Views by device type (mobile, tablet, desktop, TV)
   - **Peak Viewing Hours**: 24-hour chart showing when content is most watched
   - **Retention Curve**: Percentage of viewers at key milestones (0%, 25%, 50%, 75%, 100%)
   - **Views Over Time**: Daily view breakdown

### Understanding Metrics

#### Engagement Score (0-100)

Calculated based on:
- Completion status (50% weight)
- Watch duration (50% weight)
- Higher scores indicate better engagement

**Interpretation**:
- 80-100: Excellent engagement
- 60-79: Good engagement
- 40-59: Moderate engagement
- Below 40: Low engagement (consider content improvements)

#### Bounce Rate

Percentage of viewers who watched less than 10% of content.

**Interpretation**:
- Below 20%: Excellent retention
- 20-40%: Good retention
- 40-60%: Moderate retention
- Above 60%: Poor retention (content may not match expectations)

#### Retention Curve

Shows how many viewers remain at key milestones:
- **0%**: All viewers (100%)
- **25%**: Viewers who watched at least 25%
- **50%**: Viewers who watched at least 50%
- **75%**: Viewers who watched at least 75%
- **100%**: Viewers who completed the content

**Healthy Curve**: Gradual decline (e.g., 100% → 80% → 60% → 40% → 20%)
**Problematic Curve**: Sharp drop early (e.g., 100% → 30% → 15% → 10% → 5%)

#### Peak Viewing Hours

Shows when content is most watched throughout the day (0-23 hours).

**Use Cases**:
- Schedule new releases during peak hours
- Understand audience viewing patterns
- Optimize content promotion timing

#### Device Breakdown

Shows distribution across:
- **Mobile**: Phones
- **Tablet**: Tablets
- **Desktop**: Desktop computers
- **TV**: Smart TVs (if applicable)

**Use Cases**:
- Optimize content for most-used devices
- Understand audience preferences
- Plan device-specific features

---

## Content Management

### Creating Content

1. Go to Admin Dashboard > **Content** tab
2. Fill in the form:
   - **Type**: Select Series, Movie, or Podcast
   - **Title**: Content title
   - **Description**: Brief description
   - **Media File**: Upload video/audio file OR enter URL
   - **Thumbnail** (optional): Upload thumbnail image
   - **Published**: Check to make content visible immediately
3. Click "Create Content"

### Editing Content

Currently, content editing is done directly in Firestore. Future updates will include an edit interface.

### Content Status

- **Published**: Content is visible to all users
- **Unpublished**: Content is hidden from public view

---

## AI Recommendations

### Overview

The AI Recommendations system analyzes all content using advanced algorithms to provide actionable insights:
- **Highest rated episodes/series**: Identifies top-performing content
- **Cancellation candidates**: Shows that should be cancelled with detailed reasons
- **Series analysis**: Comprehensive breakdown of series performance
- **Performance scores**: 0-100 score for each content item

### Accessing Recommendations

1. Go to Admin Dashboard
2. Click **Recommendations** tab
3. View four different views:
   - **Overview**: Summary statistics
   - **Cancellations**: Shows recommended for cancellation
   - **Top Rated**: Highest performing content
   - **Series**: Series-level analysis

### Understanding Recommendations

#### Recommendation Types

- **Continue**: Strong performance - keep producing
- **Cancel**: Poor performance - consider discontinuing
- **Improve**: Moderate performance - needs improvement
- **Promote**: New content - needs promotion

#### Score Calculation (0-100)

The algorithm calculates scores based on:
- **30%**: Average rating (0-5 stars)
- **30%**: Engagement score (0-100)
- **20%**: Completion rate (0-100%)
- **10%**: Bounce rate (inverse - lower is better)
- **10%**: View count (capped at 100 views)

#### Cancellation Criteria

Content is recommended for cancellation if:
- Score below 30/100
- Bounce rate above 70% with 10+ views
- Average rating below 2.0 with 20+ views
- Very low engagement (<40) with poor completion

#### Series Analysis

For series, the system:
- Calculates average rating across all episodes
- Identifies top 3 episodes (highest rated)
- Identifies bottom 3 episodes (lowest rated or no views)
- Provides series-level recommendation
- Shows total views and engagement

### Using Recommendations

1. **Review Cancellation Candidates**: Check why shows are recommended for cancellation
2. **Identify Top Performers**: See what content works best
3. **Series Insights**: Understand which episodes drive series success
4. **Data-Driven Decisions**: Use scores and metrics to make content decisions

---

## Player Configuration

### Overview

Configure advanced player features including Skip Intro, Skip Recap, and X-Ray insights for each content item.

### Accessing Player Config

1. Go to Admin Dashboard
2. Click **Player Config** tab
3. Select content from dropdown

### Skip Intro Configuration

**Purpose**: Allow viewers to skip the intro sequence.

**Two Methods**:

#### Method 1: Timeline Editor (Recommended)

**Frame-precise selection using video timeline**:

1. Select the content in Player Config
2. Click **"Open Timeline Editor"** under Skip Intro
3. Video player opens with timeline scrubber
4. **Scrub through video** to find exact intro start
5. Click **"Set Start"** when intro begins
6. **Scrub forward** to find intro end
7. Click **"Set End"** when intro ends
8. Times are automatically saved
9. Click "Save Configuration" to finalize

**Timeline Editor Features**:
- **Frame-by-frame navigation**: Use -1f/+1f buttons for frame precision (30fps)
- **Second-by-second navigation**: Use -1s/+1s buttons
- **Visual markers**: Green line for start, red line for end
- **Selected range highlight**: Yellow highlight shows selected range
- **Time display**: Shows time in MM:SS:FF format (minutes:seconds:frames)
- **Click timeline**: Click anywhere on timeline to jump to that time
- **Play/Pause**: Control video playback

#### Method 2: Manual Entry

**For quick adjustments**:

1. Select the content in Player Config
2. Toggle "Skip Intro" to enable
3. Enter **Start Time** (seconds) - when intro begins (usually 0)
4. Enter **End Time** (seconds) - when intro ends
5. Use decimal precision (e.g., 90.033 for frame precision)
6. Click "Save Configuration"

**Example**:
- Intro starts at 0:00 and ends at 1:30
- Start Time: `0`
- End Time: `90` (1:30 = 90 seconds)
- For frame precision: `90.033` (1 frame at 30fps)

**How It Works**:
- When video reaches the start time, a "Skip Intro" button appears
- Button disappears after end time
- Clicking button jumps to end time

### Skip Recap Configuration

**Purpose**: Allow viewers to skip recap sequences.

**Two Methods**:

#### Method 1: Timeline Editor (Recommended)

**Frame-precise selection using video timeline**:

1. Select the content in Player Config
2. Click **"Open Timeline Editor"** under Skip Recap
3. Video player opens with timeline scrubber
4. **Scrub through video** to find exact recap start
5. Click **"Set Start"** when recap begins
6. **Scrub forward** to find recap end
7. Click **"Set End"** when recap ends
8. Times are automatically saved
9. Click "Save Configuration" to finalize

**Timeline Editor Features**: Same as Skip Intro (see above)

#### Method 2: Manual Entry

**For quick adjustments**:

1. Select the content in Player Config
2. Toggle "Skip Recap" to enable
3. Enter **Start Time** (seconds)
4. Enter **End Time** (seconds)
5. Use decimal precision for frame accuracy
6. Click "Save Configuration"

**Example**:
- Recap starts at 20:00 and ends at 21:30
- Start Time: `1200` (20:00 = 1200 seconds)
- End Time: `1290` (21:30 = 1290 seconds)
- For frame precision: `1290.033`

### X-Ray Insights Configuration

**Purpose**: Show actor information, songs, locations, and facts during playback (like Apple TV/Amazon Prime).

#### Enabling X-Ray

1. Select content in Player Config
2. Toggle "X-Ray Insights" to enable
3. Click "Add X-Ray Item" for each insight

#### Adding X-Ray Items

For each X-Ray item, configure:

1. **Timestamp** (seconds): When to show the insight
   - Example: `120` = show at 2 minutes
   - Example: `3600` = show at 1 hour

2. **Type**: Select from:
   - **Actor**: Show actor information
   - **Song**: Show song information
   - **Location**: Show location information
   - **Fact**: Show interesting fact

3. **Title**: Main title to display
   - Actor: Actor name (e.g., "John Doe")
   - Song: Song title (e.g., "Theme Song")
   - Location: Location name (e.g., "New York City")
   - Fact: Fact title (e.g., "Did You Know?")

4. **Description** (optional): Additional details

5. **Image URL** (optional): Image to display (actor photo, location photo, etc.)

6. **Metadata** (for Actor type):
   - **Actor Name**: Full name
   - **Character**: Character name
   - **Role**: Role description

#### X-Ray Examples

**Actor Example**:
```
Timestamp: 120
Type: Actor
Title: John Doe
Description: Lead actor in the series
Image URL: https://example.com/john-doe.jpg
Actor Name: John Doe
Character: Detective Smith
Role: Main character, detective
```

**Song Example**:
```
Timestamp: 300
Type: Song
Title: Opening Theme
Description: Composed by Jane Smith
Song Title: "MMI Theme"
Artist: Jane Smith
```

**Location Example**:
```
Timestamp: 600
Type: Location
Title: New York City
Description: Filmed on location in Manhattan
Location Name: Times Square
```

**Fact Example**:
```
Timestamp: 1800
Type: Fact
Title: Behind the Scenes
Description: This scene took 3 days to film
Fact: The director wanted 50 takes for this scene
```

#### Best Practices for X-Ray

1. **Timing**: Add X-Ray items when actors first appear or songs start
2. **Frequency**: Don't overload - 3-5 items per 10 minutes is ideal
3. **Accuracy**: Ensure timestamps are precise (watch the video)
4. **Images**: Use high-quality images (at least 200x200px)
5. **Descriptions**: Keep descriptions concise (1-2 sentences)

#### Managing X-Ray Items

- **Add**: Click "Add X-Ray Item"
- **Edit**: Modify fields directly
- **Remove**: Click "Remove" button on any item
- **Order**: Items are shown in timestamp order

---

## Timeline Editor

### Overview

The Timeline Editor provides frame-precise video editing capabilities for setting skip intro/recap times. It's like a professional video editor built into the admin panel.

### Features

- **Video Preview**: Full video player with playback controls
- **Timeline Scrubber**: Visual timeline with markers
- **Frame Precision**: Navigate frame-by-frame (30fps)
- **Visual Markers**: Green line (start), red line (end)
- **Range Highlight**: Yellow highlight shows selected range
- **Time Display**: Shows time in MM:SS:FF format
- **Click to Seek**: Click timeline to jump to any time

### Controls

| Button | Function |
|--------|----------|
| ▶ Play / ⏸ Pause | Play/pause video |
| ⏪ -1s | Go back 1 second |
| +1s ⏩ | Go forward 1 second |
| ⏪ -1f | Go back 1 frame (0.033s at 30fps) |
| +1f ⏩ | Go forward 1 frame (0.033s at 30fps) |
| Set Start | Set start marker at current time |
| Set End | Set end marker at current time |

### Workflow

1. **Open Timeline Editor**: Click "Open Timeline Editor" for Skip Intro or Skip Recap
2. **Play Video**: Click play to start watching
3. **Find Start Point**: Scrub to where intro/recap begins
4. **Set Start**: Click "Set Start" button (green marker appears)
5. **Find End Point**: Scrub forward to where intro/recap ends
6. **Set End**: Click "Set End" button (red marker appears)
7. **Verify Range**: Yellow highlight shows selected range
8. **Fine-Tune**: Use frame buttons (-1f/+1f) for precision
9. **Save**: Click "Save Configuration" in main panel

### Tips

- **Use Frame Buttons**: For frame-perfect timing, use -1f/+1f buttons
- **Watch Video**: Play through the section to verify timing
- **Check Markers**: Green and red lines show exact positions
- **Time Display**: Current time shows in MM:SS:FF format
- **Manual Override**: Can still manually enter times in number fields

---

## Rating System

### Overview

Users can rate content from 1-5 stars. Ratings are displayed on content pages and in the content grid.

### Viewing Ratings

Ratings appear:
- On individual content pages (below title)
- In content grid cards (on MMI+ page)
- In admin analytics (future feature)

### Rating Display

Shows:
- **Star Rating**: Visual 1-5 star display
- **Average Rating**: Numerical average (e.g., 4.5)
- **Total Ratings**: Number of ratings (e.g., "42 ratings")
- **Rating Distribution**: Bar chart showing distribution of 1-5 star ratings

### User Rating

Users can:
- Click stars to rate content (must be logged in)
- See their own rating highlighted
- Update their rating anytime

### Admin Notes

- Ratings are automatically calculated
- No admin action needed for ratings to work
- Ratings help identify popular content
- Use ratings in content decisions

---

## Coming Soon Content

### Overview

Manage upcoming content that hasn't been released yet. Users can subscribe to be notified when it's available.

### Creating Coming Soon Content

1. Go to Admin Dashboard > **Content** tab
2. Create content as normal
3. Instead of publishing, add to `comingSoon` collection in Firestore:

```javascript
{
  id: "content-id",
  type: "series",
  title: "Upcoming Series",
  description: "Description here",
  thumbnailUrl: "https://...",
  releaseDate: "2024-12-25", // ISO date
  episodeCount: 10,
  upcomingEpisodes: [
    {
      title: "Episode 1",
      releaseDate: "2024-12-25",
      episodeNumber: 1,
      seasonNumber: 1
    }
  ],
  notifySubscribers: [], // Array of user UIDs
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Coming Soon Features

- **Release Date**: When content will be available
- **Episode Count**: Total number of episodes
- **Upcoming Episodes**: List of episodes with release dates
- **Notification Bell**: Users can subscribe to be notified

### Managing Subscriptions

Subscriptions are managed automatically when users click the notification bell. No admin action needed.

---

## Best Practices

### Analytics

1. **Regular Monitoring**: Check analytics weekly
2. **Compare Periods**: Compare current period to previous
3. **Identify Trends**: Look for patterns in viewing
4. **Content Performance**: Use metrics to identify top/bottom performers
5. **Engagement Focus**: Prioritize engagement score over raw views

### Player Configuration

1. **Test Timing**: Always watch content to verify skip times
2. **Multiple Views**: Test skip buttons from different points
3. **X-Ray Accuracy**: Verify X-Ray timestamps are correct
4. **Image Quality**: Use high-quality images for X-Ray
5. **Descriptions**: Keep X-Ray descriptions brief and informative

### Content Management

1. **Consistent Naming**: Use consistent naming conventions
2. **Quality Thumbnails**: Always add thumbnails for better UX
3. **Descriptions**: Write compelling descriptions
4. **Publishing**: Test content before publishing
5. **Organization**: Keep content organized by type

### Ratings

1. **Encourage Ratings**: Prompt users to rate content
2. **Monitor Ratings**: Check ratings regularly
3. **Respond to Feedback**: Use low ratings to improve content
4. **Highlight Top Rated**: Feature highly-rated content

---

## Troubleshooting

### Analytics Not Showing

**Problem**: Analytics dashboard shows no data

**Solutions**:
1. Check if content has been viewed (analytics only appear after views)
2. Verify time period selection
3. Check Firestore `contentAnalytics` collection
4. Ensure `viewEvents` collection has data

### Skip Buttons Not Appearing

**Problem**: Skip Intro/Recap buttons don't show

**Solutions**:
1. Verify configuration is saved
2. Check that times are correct (watch the video)
3. Ensure button is enabled in Player Config
4. Refresh the page
5. Check browser console for errors

### X-Ray Not Showing

**Problem**: X-Ray insights don't appear

**Solutions**:
1. Verify X-Ray is enabled for content
2. Check timestamps are correct
3. Ensure video reaches the timestamp
4. Check that X-Ray data is saved
5. Verify image URLs are accessible

### Ratings Not Displaying

**Problem**: Ratings don't show on content

**Solutions**:
1. Check if any ratings exist (may be no ratings yet)
2. Verify `contentRatings` collection in Firestore
3. Check browser console for errors
4. Ensure user is logged in to rate

### Performance Issues

**Problem**: Dashboard loads slowly

**Solutions**:
1. Reduce time period (use 7d instead of all time)
2. Check Firestore query limits
3. Clear browser cache
4. Check network connection

---

## Advanced Features

### Exporting Analytics

Currently, analytics can be viewed in the dashboard. Future updates will include CSV export functionality.

### Custom Time Periods

Currently supports: 24h, 7d, 30d, all time. Custom date ranges coming in future updates.

### Real-Time Analytics

Analytics update when new views occur. Refresh the page to see latest data.

---

## Support

For issues or questions:
1. Check this guide first
2. Review Firestore data directly
3. Check browser console for errors
4. Contact development team

---

## Quick Reference

### Admin Dashboard Tabs

- **Pages**: Edit About, Services pages
- **Users**: Manage user roles
- **Content**: Create/edit content
- **Config**: Site configuration (blog toggle, etc.)
- **Analytics**: View detailed metrics
- **Player Config**: Configure skip buttons and X-Ray
- **Recommendations**: AI-powered content recommendations

### Key Metrics

- **Views**: Total number of plays
- **Unique Views**: Number of unique viewers
- **Watch Time**: Total time watched
- **Completion Rate**: % who finished
- **Engagement Score**: 0-100 engagement metric
- **Bounce Rate**: % who watched <10%

### Player Features

- **Skip Intro**: Jump past intro sequence
- **Skip Recap**: Jump past recap
- **X-Ray**: Show actor/song/location info
- **Ratings**: 1-5 star user ratings

---

*Last Updated: 2024*

