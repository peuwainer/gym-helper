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
  try {
    const res = await fetch(
      `${BASE_URL}/exercise/search/?term=${encodeURIComponent(query)}&language=${language}&format=json`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions || [];
  } catch {
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
