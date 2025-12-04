import { NextRequest, NextResponse } from 'next/server';

/**
 * Fetches podcast metadata from Spotify
 * Supports both show/episode URLs
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const spotifyUrl = searchParams.get('url');

  if (!spotifyUrl) {
    return NextResponse.json({ error: 'Spotify URL is required' }, { status: 400 });
  }

  try {
    // Extract Spotify ID from URL
    // Formats: https://open.spotify.com/show/... or https://open.spotify.com/episode/...
    const urlPattern = /spotify\.com\/(show|episode)\/([a-zA-Z0-9]+)/;
    const match = spotifyUrl.match(urlPattern);

    if (!match) {
      return NextResponse.json({ error: 'Invalid Spotify URL format' }, { status: 400 });
    }

    const [, type, id] = match;

    // Use Spotify oEmbed API (public, no auth required)
    const oEmbedUrl = `https://embed.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;
    const oEmbedResponse = await fetch(oEmbedUrl);
    
    if (!oEmbedResponse.ok) {
      throw new Error('Failed to fetch from Spotify oEmbed');
    }

    const oEmbedData = await oEmbedResponse.json();

    // Extract metadata
    const metadata = {
      title: oEmbedData.title || '',
      description: oEmbedData.description || '',
      thumbnail: oEmbedData.thumbnail_url || '',
      html: oEmbedData.html || '',
      provider: 'Spotify',
      type: type, // 'show' or 'episode'
      spotifyId: id,
      spotifyUrl: spotifyUrl,
    };

    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error('Error fetching Spotify metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Spotify metadata' },
      { status: 500 }
    );
  }
}

