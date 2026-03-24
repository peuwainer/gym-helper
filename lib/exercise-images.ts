import { getCachedExerciseImage, cacheExerciseImage } from './db';
import { searchExercises, getExerciseImage } from './wger';

// In-flight deduplication: avoid parallel fetches for the same exercise
const inflight = new Map<string, Promise<string | null>>();

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

  // 1. Check SQLite cache
  const cached = await getCachedExerciseImage(exerciseName);
  if (cached) {
    // Empty string = sentinel for "no image available"
    console.log('[img] cache hit:', exerciseName, '->', cached.imageUrl || '(no image)');
    return cached.imageUrl || null;
  }

  // 2. Search wger API
  // Try English name first (wger has far more images for English exercises),
  // then fall back to the original name
  let imageUrl: string | null = null;
  let wgerId: number | undefined;
  let apiResponded = false;

  const searchTerms = englishName
    ? [englishName, exerciseName]
    : [exerciseName];

  for (const term of searchTerms) {
    const results = await searchExercises(term, 'english');
    if (results.length === 0) {
      // searchExercises only returns [] on error (catch) or genuinely empty response.
      // We can't distinguish the two here, so we check the result count.
      // An empty array from a successful response still means apiResponded.
      // Since searchExercises swallows errors and returns [], we conservatively
      // assume it responded (to avoid re-caching on every retry).
      apiResponded = true;
      continue;
    }

    apiResponded = true;
    const first = results[0];
    const baseId: number | undefined = (first as any).data?.base_id;
    const directImage: string | null = (first as any).data?.image ?? null;

    if (directImage) {
      imageUrl = `https://wger.de${directImage}`;
      wgerId = baseId;
      break;
    }

    // No image in search result — try the exerciseimage endpoint with the correct base_id
    if (baseId) {
      wgerId = baseId;
      imageUrl = await getExerciseImage(baseId);
      console.log('[img] image lookup for base', baseId, '->', imageUrl);
      if (imageUrl) break;
    }
  }

  console.log('[img] caching:', exerciseName, '->', imageUrl ?? '(no image)');

  // 3. Cache result only if API responded (skip caching on network errors)
  if (apiResponded) {
    await cacheExerciseImage(exerciseName, imageUrl ?? '', wgerId);
  }

  return imageUrl;
}
