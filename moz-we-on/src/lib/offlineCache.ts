/**
 * Utility module to manage browser Cache API for offline listening in Moz We On.
 * Caches both track metadata (JSON) and album covers.
 * Fallbacks to localStorage if Cache API is unavailable or restricted.
 */

const CACHE_NAME = "moz-we-on-tracks-v2";
const OFFLINE_METADATA_PREFIX = "/api/offline-track/";

// Fallback storage key if Cache API fails
const LOCAL_STORAGE_FALLBACK_KEY = "moz_we_on_offline_fallback";

// Helper to get fallback tracks from localstorage
function getFallbackTracks(): any[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Helper to save fallback tracks to localstorage
function saveFallbackTracks(tracks: any[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(tracks));
  } catch (e) {
    console.error("localStorage fallback failed", e);
  }
}

/**
 * Saves a track to the Browser Cache API.
 * Also caches the album cover art.
 */
export async function cacheTrackOffline(track: any): Promise<boolean> {
  // Always update localStorage fallback to guarantee recovery
  const fallback = getFallbackTracks();
  if (!fallback.some((t) => t.id === track.id)) {
    saveFallbackTracks([...fallback, track]);
  }

  if (!("caches" in window)) {
    console.warn("Browser Cache API not supported. Using localStorage fallback.");
    return true;
  }

  try {
    const cache = await caches.open(CACHE_NAME);

    // 1. Cache the Cover Artwork (only if same-origin to avoid CORS preflight NetworkErrors)
    const isSameOrigin = track.coverUrl && (
      !track.coverUrl.startsWith("http") || 
      track.coverUrl.startsWith(window.location.origin)
    );

    if (isSameOrigin && track.coverUrl) {
      try {
        const response = await fetch(track.coverUrl);
        if (response.ok) {
          await cache.put(track.coverUrl, response);
        }
      } catch (e) {
        console.warn(`Could not cache local cover artwork: ${track.coverUrl}`, e);
      }
    }

    // 2. Cache the track metadata JSON
    const metadataUrl = `${window.location.origin}${OFFLINE_METADATA_PREFIX}${track.id}`;
    const metadataResponse = new Response(JSON.stringify(track), {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "application/json" }
    });
    await cache.put(metadataUrl, metadataResponse);

    console.log(`[Cache API] Track "${track.title}" successfully cached for offline use.`);
    return true;
  } catch (err) {
    console.error("Error caching track offline with Cache API:", err);
    // If it fails (e.g. in sandboxed environment), we already saved it in localStorage fallback
    return true;
  }
}

/**
 * Removes a track from the Browser Cache API.
 */
export async function removeTrackFromOfflineCache(trackId: string, coverUrl?: string): Promise<boolean> {
  // Update localStorage fallback
  const fallback = getFallbackTracks();
  saveFallbackTracks(fallback.filter((t) => t.id !== trackId));

  if (!("caches" in window)) return true;

  try {
    const cache = await caches.open(CACHE_NAME);

    // Delete track metadata
    const metadataUrl = `${window.location.origin}${OFFLINE_METADATA_PREFIX}${trackId}`;
    await cache.delete(metadataUrl);

    // Try to delete cover image if provided
    if (coverUrl) {
      await cache.delete(coverUrl);
    }

    console.log(`[Cache API] Track "${trackId}" removed from offline cache.`);
    return true;
  } catch (err) {
    console.error("Error removing track from offline cache:", err);
    return false;
  }
}

/**
 * Checks if a specific track is cached.
 */
export async function isTrackOfflineCached(trackId: string): Promise<boolean> {
  // Check localStorage fallback first
  const fallback = getFallbackTracks();
  const existsInFallback = fallback.some((t) => t.id === trackId);

  if (!("caches" in window)) {
    return existsInFallback;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const metadataUrl = `${window.location.origin}${OFFLINE_METADATA_PREFIX}${trackId}`;
    const matched = await cache.match(metadataUrl);
    return !!matched || existsInFallback;
  } catch (err) {
    return existsInFallback;
  }
}

/**
 * Retrieves all offline cached tracks.
 */
export async function getAllOfflineCachedTracks(): Promise<any[]> {
  const fallback = getFallbackTracks();

  if (!("caches" in window)) {
    return fallback;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const tracks: any[] = [];

    for (const request of requests) {
      if (request.url.includes(OFFLINE_METADATA_PREFIX)) {
        try {
          const response = await cache.match(request);
          if (response) {
            const track = await response.json();
            // Avoid duplicates
            if (!tracks.some((t) => t.id === track.id)) {
              tracks.push(track);
            }
          }
        } catch (jsonErr) {
          console.error("Error parsing offline cached JSON:", jsonErr);
        }
      }
    }

    // Merge with fallback tracks to ensure we don't lose anything
    fallback.forEach((t) => {
      if (!tracks.some((ct) => ct.id === t.id)) {
        tracks.push(t);
      }
    });

    return tracks;
  } catch (err) {
    console.error("Error listing all cached tracks from Cache API:", err);
    return fallback;
  }
}

/**
 * Clears the entire offline cache.
 */
export async function clearAllOfflineCache(): Promise<boolean> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
    if ("caches" in window) {
      await caches.delete(CACHE_NAME);
    }
    console.log("[Cache API] All offline cache cleared.");
    return true;
  } catch (err) {
    console.error("Error clearing offline cache:", err);
    return false;
  }
}
