// wger REST API - free, open source exercise database
const BASE_URL = 'https://wger.de/api/v2';

export interface WgerExercise {
  id: number;
  name: string;
  description: string;
  category: { name: string };
  muscles: Array<{ name_en: string }>;
  images: Array<{ image: string }>;
}

export async function searchExercises(query: string, language = 'english'): Promise<WgerExercise[]> {
  const url = `${BASE_URL}/exercise/search/?term=${encodeURIComponent(query)}&language=${language}&format=json`;
  console.log('[wger] searching:', url);
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      console.log('[wger] search failed, status:', res.status);
      return [];
    }
    const data = await res.json();
    console.log('[wger] search result:', data.suggestions?.length ?? 0, 'suggestions');
    return data.suggestions || [];
  } catch (e) {
    console.log('[wger] search error:', e);
    return [];
  }
}

export async function getExerciseImage(exerciseId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/exerciseimage/?exercise_base=${exerciseId}&format=json`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return `https://wger.de${data.results[0].image}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getExerciseInfo(exerciseId: number): Promise<WgerExercise | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/exerciseinfo/${exerciseId}/?format=json`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
