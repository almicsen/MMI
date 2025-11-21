import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:episode', 'episodeNumber'],
      ['itunes:season', 'seasonNumber'],
      ['itunes:duration', 'duration'],
      ['itunes:image', 'image'],
      ['enclosure', 'enclosure'],
    ],
  },
});

interface RSSFeedData {
  title: string;
  description: string;
  image?: string;
  link?: string;
  episodes: Array<{
    title: string;
    description: string;
    pubDate?: string;
    link?: string;
    enclosure?: {
      url: string;
      type?: string;
      length?: string;
    };
    episodeNumber?: string;
    seasonNumber?: string;
    duration?: string;
    image?: string;
    itunes?: {
      image?: string;
      duration?: string;
      episode?: string;
      season?: string;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { rssUrl } = await request.json();

    if (!rssUrl) {
      return NextResponse.json({ error: 'RSS URL is required' }, { status: 400 });
    }

    // Parse RSS feed
    const feed = await parser.parseURL(rssUrl);

    // Extract podcast/show metadata
    const itunesImage = feed.itunes?.image as any;
    const feedImage = typeof itunesImage === 'string' 
      ? itunesImage 
      : (itunesImage && typeof itunesImage === 'object' && 'href' in itunesImage) 
        ? itunesImage.href 
        : '';
    const imageUrl = feedImage || (feed.image as any)?.url || '';

    const feedData: RSSFeedData = {
      title: feed.title || 'Untitled Podcast',
      description: feed.description || feed.itunes?.summary || '',
      image: imageUrl,
      link: feed.link || '',
      episodes: [],
    };

    // Extract all episodes
    if (feed.items && feed.items.length > 0) {
      feedData.episodes = feed.items.map((item: any) => {
        // Get episode image (prefer itunes:image, then enclosure image, then feed image)
        const itemItunesImage = (item.itunes as any)?.image;
        const itemImageUrl = typeof itemItunesImage === 'string' 
          ? itemItunesImage 
          : (itemItunesImage && typeof itemItunesImage === 'object' && 'href' in itemItunesImage)
            ? itemItunesImage.href
            : '';
        let episodeImage = itemImageUrl || 
                          (item.image as any)?.url || 
                          feedData.image || '';

        // Get media URL from enclosure
        const enclosure = item.enclosure || (Array.isArray(item.enclosures) ? item.enclosures[0] : null);
        const mediaUrl = enclosure?.url || item.link || '';

        // Parse episode/season numbers
        const episodeNum = item.itunes?.episode || item.episodeNumber || null;
        const seasonNum = item.itunes?.season || item.seasonNumber || null;

        // Get duration
        const duration = item.itunes?.duration || item.duration || '';

        return {
          title: item.title || 'Untitled Episode',
          description: item.contentSnippet || item.content || item.description || '',
          pubDate: item.pubDate || item.isoDate || '',
          link: item.link || '',
          enclosure: enclosure ? {
            url: enclosure.url,
            type: enclosure.type,
            length: enclosure.length,
          } : undefined,
          episodeNumber: episodeNum ? String(episodeNum) : undefined,
          seasonNumber: seasonNum ? String(seasonNum) : undefined,
          duration: duration,
          image: episodeImage,
        };
      });
    }

    return NextResponse.json(feedData);
  } catch (error: any) {
    console.error('Error parsing RSS feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse RSS feed' },
      { status: 500 }
    );
  }
}

