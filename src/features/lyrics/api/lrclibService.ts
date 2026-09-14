export interface LrclibLyricsResponse {
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

const lyricsCache = new Map<string, string | null>();

/**
 * Strips common metadata noise from track titles (YouTube markers, remixes, remasters, features)
 */
export function cleanTrackTitle(rawTitle: string, rawArtist?: string): string {
  if (!rawTitle) return "";
  let title = rawTitle;

  // Remove bracketed suffixes like [Official Video], [Lyric Video], (Audio), (Lyrics), etc.
  title = title.replace(
    /\[\s*(?:official\s*)?(?:music\s*video|lyric\s*video|video|audio|lyrics?|visualizer|hd|4k|official)\s*\]/gi,
    ""
  );
  title = title.replace(
    /\(\s*(?:official\s*)?(?:music\s*video|lyric\s*video|video|audio|lyrics?|visualizer|hd|4k|official)\s*\)/gi,
    ""
  );

  // Remove remaster / bonus track noise
  title = title.replace(/\([^)]*(?:remastered|remaster|anniversary|deluxe)[^)]*\)/gi, "");
  title = title.replace(/\[[^\]]*(?:remastered|remaster|anniversary|deluxe)[^\]]*\]/gi, "");

  // Remove (feat. ...) or [feat. ...]
  title = title.replace(/\((?:feat|ft)\.?\s+[^)]+\)/gi, "");
  title = title.replace(/\[(?:feat|ft)\.?\s+[^\]]+\]/gi, "");

  // Remove leading track numbers like "01. "
  title = title.replace(/^\d+[\s.-]+/, "");

  // Remove Artist prefix/suffix if present in format "Artist - Title" or "Title - Artist"
  if (rawArtist) {
    const cleanArt = cleanArtistName(rawArtist).toLowerCase();
    if (cleanArt) {
      if (title.toLowerCase().startsWith(cleanArt + " -")) {
        title = title.slice(cleanArt.length + 2);
      } else if (title.toLowerCase().startsWith(cleanArt + "-")) {
        title = title.slice(cleanArt.length + 1);
      } else if (title.toLowerCase().endsWith("- " + cleanArt)) {
        title = title.slice(0, -(cleanArt.length + 2));
      } else if (title.toLowerCase().endsWith("-" + cleanArt)) {
        title = title.slice(0, -(cleanArt.length + 1));
      }
    }
  }

  // If there's still a hyphen separator e.g. "Artist - Title" and one part is the artist
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    if (parts.length === 2 && rawArtist) {
      const cleanArt = cleanArtistName(rawArtist).toLowerCase();
      if (parts[0].trim().toLowerCase() === cleanArt) {
        title = parts[1];
      } else if (parts[1].trim().toLowerCase() === cleanArt) {
        title = parts[0];
      }
    }
  }

  return title.trim();
}

export function cleanArtistName(rawArtist: string): string {
  if (!rawArtist) return "";
  let artist = rawArtist;
  // Remove " - Topic" from YouTube generated channels
  artist = artist.replace(/\s*-\s*Topic$/i, "");
  // Remove VEVO
  artist = artist.replace(/VEVO$/i, "");
  // Split multiple artists and take the primary one
  artist = artist.split(/[,&/]|(?:\s+feat\.?\s+)|(?:\s+ft\.?\s+)/i)[0];
  return artist.trim();
}

/**
 * Fetches synchronized lyrics from LRCLIB API with automatic cleaning and fallback search.
 */
export async function fetchLrclibLyrics(
  title: string,
  artist: string,
  album?: string,
  durationSeconds?: number
): Promise<string | null> {
  const cacheKey = `${artist.toLowerCase()} - ${title.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  const cleanedTitle = cleanTrackTitle(title, artist);
  const cleanedArtist = cleanArtistName(artist);

  // 1. Exact match attempt via /api/get
  try {
    const params = new URLSearchParams();
    params.set("track_name", cleanedTitle);
    params.set("artist_name", cleanedArtist);
    if (album) params.set("album_name", album);
    if (durationSeconds && durationSeconds > 0) {
      params.set("duration", Math.round(durationSeconds).toString());
    }

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: {
        "User-Agent": "Sonara-Stream/4.0 (https://github.com/rayyanbobs-art/sonara-stream)",
      },
    });

    if (res.ok) {
      const data: LrclibLyricsResponse = await res.json();
      if (data.syncedLyrics) {
        lyricsCache.set(cacheKey, data.syncedLyrics);
        return data.syncedLyrics;
      }
      if (data.plainLyrics) {
        lyricsCache.set(cacheKey, data.plainLyrics);
        return data.plainLyrics;
      }
    }
  } catch (err) {
    console.warn("LRCLIB /api/get failed, trying fallback search:", err);
  }

  // 2. Fallback search attempt via /api/search
  try {
    const query = `${cleanedTitle} ${cleanedArtist}`;
    const searchParams = new URLSearchParams({ q: query });
    const searchRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, {
      headers: {
        "User-Agent": "Sonara-Stream/4.0 (https://github.com/rayyanbobs-art/sonara-stream)",
      },
    });

    if (searchRes.ok) {
      const results: LrclibLyricsResponse[] = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        // Pick best match preferring synced lyrics and duration proximity
        let bestMatch = results.find((r) => !!r.syncedLyrics);
        if (!bestMatch) {
          bestMatch = results[0];
        }

        const resolved = bestMatch?.syncedLyrics || bestMatch?.plainLyrics || null;
        lyricsCache.set(cacheKey, resolved);
        return resolved;
      }
    }
  } catch (err) {
    console.warn("LRCLIB /api/search failed:", err);
  }

  lyricsCache.set(cacheKey, null);
  return null;
}
