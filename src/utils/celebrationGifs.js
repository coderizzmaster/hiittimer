import { Image } from 'expo-image';

// ── Config ─────────────────────────────────────────────────────────────────────
// 1. Get a free API key at https://developers.giphy.com → create an app
// 2. Replace the placeholder below with your key
// 3. Replace the GIF IDs with any celebration GIFs you like from giphy.com
//    (the ID is the last part of the GIF's URL, e.g. giphy.com/gifs/title-xT9IgG50...)
const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY;

const GIF_IDS = [
  'd5YttuybhUQt1BeGPh', // replace with your chosen GIF IDs
  'l0amJzVHIAfl7jMDos',
  'W6Lwg2xvTr6tJpuSTd',
];

// ── Internal state ─────────────────────────────────────────────────────────────
// Seeded immediately with direct CDN URLs so a GIF is always available
// even before the API call completes or if it fails.
let _gifUrls = GIF_IDS.map(id => `https://i.giphy.com/media/${id}/giphy.gif`);

// ── Public API ─────────────────────────────────────────────────────────────────
export async function preloadCelebrationGifs() {
  // Preload the CDN URLs we already have
  Image.prefetch(_gifUrls.map(url => url));

  // Try the API to get higher-quality URLs; silently keep CDN fallbacks on failure
  try {
    const ids = GIF_IDS.join(',');
    const res = await fetch(
      `https://api.giphy.com/v1/gifs?api_key=${GIPHY_API_KEY}&ids=${ids}`
    );
    const json = await res.json();
    if (json.data?.length > 0) {
      _gifUrls = json.data.map(g => g.images.original.url);
      await Promise.all(_gifUrls.map(url => Image.prefetch(url)));
    }
  } catch (e) {
    console.warn('[celebrationGifs] API fetch failed, using CDN fallback:', e);
  }
}

export function getRandomCelebrationGif() {
  if (_gifUrls.length === 0) return null;
  return _gifUrls[Math.floor(Math.random() * _gifUrls.length)];
}
