import { getCachedExerciseImage, cacheExerciseImage, clearBadImageCache } from './db';
import { searchExercises, getExerciseImage } from './wger';
import { getWikipediaImage } from './wikipedia';

// In-flight deduplication: avoid parallel fetches for the same exercise
const inflight = new Map<string, Promise<string | null>>();

// Track which empty-cached exercises we've already attempted Wikipedia for
// this session, so we don't hammer Wikipedia on every render.
const triedWikipedia = new Set<string>();

export async function resolveExerciseImage(
  exerciseName: string,
  englishName?: string
): Promise<string | null> {
  const key = exerciseName.toLowerCase();

  // Check in-flight first
  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = doResolve(exerciseName, englishName);
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

async function doResolve(exerciseName: string, englishName?: string): Promise<string | null> {
  console.log('[img] resolving:', exerciseName, englishName);

  const key = exerciseName.toLowerCase();

  // 1. Check SQLite cache
  const cached = await getCachedExerciseImage(exerciseName);
  if (cached) {
    if (cached.imageUrl) {
      console.log('[img] cache hit:', exerciseName, '->', cached.imageUrl);
      return cached.imageUrl;
    }

    // Empty sentinel = wger found nothing. Try Wikipedia once per session.
    if (!triedWikipedia.has(key)) {
      triedWikipedia.add(key);
      const wikiUrl = await tryWikipedia(exerciseName, englishName);
      if (wikiUrl) {
        console.log('[img] wikipedia fallback (from cache):', exerciseName, '->', wikiUrl);
        await cacheExerciseImage(exerciseName, wikiUrl);
        return wikiUrl;
      }
    }

    console.log('[img] cache hit (no image):', exerciseName);
    return null;
  }

  // 2. Search wger API
  let imageUrl: string | null = null;
  let wgerId: number | undefined;
  let apiResponded = false;

  const searchTerms = englishName
    ? [englishName, exerciseName]
    : [exerciseName];

  for (const term of searchTerms) {
    const results = await searchExercises(term, 'english');
    if (results.length === 0) {
      apiResponded = true;
      continue;
    }

    apiResponded = true;
    const first = results[0];
    const baseId: number | undefined = (first as any).data?.base_id;
    const directImage: string | null = (first as any).data?.image ?? null;

    if (directImage) {
      imageUrl = directImage.startsWith('http') ? directImage : `https://wger.de${directImage}`;
      wgerId = baseId;
      break;
    }

    if (baseId) {
      wgerId = baseId;
      imageUrl = await getExerciseImage(baseId);
      console.log('[img] image lookup for base', baseId, '->', imageUrl);
      if (imageUrl) break;
    }
  }

  // 3. Wikipedia fallback when wger has nothing
  if (!imageUrl) {
    triedWikipedia.add(key);
    imageUrl = await tryWikipedia(exerciseName, englishName);
    if (imageUrl) {
      console.log('[img] wikipedia fallback:', exerciseName, '->', imageUrl);
    }
  }

  console.log('[img] caching:', exerciseName, '->', imageUrl ?? '(no image)');

  // 4. Cache result only if API responded
  if (apiResponded || imageUrl) {
    await cacheExerciseImage(exerciseName, imageUrl ?? '', wgerId);
  }

  return imageUrl;
}

async function tryWikipedia(exerciseName: string, englishName?: string): Promise<string | null> {
  // Prefer English name for Wikipedia (much better results)
  const query = englishName || exerciseName;
  return getWikipediaImage(query);
}
