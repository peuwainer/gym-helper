import { useState, useEffect } from 'react';
import { resolveExerciseImage } from './exercise-images';

export function useExerciseImage(exerciseName: string, nameEn?: string): { imageUrl: string | null; loading: boolean } {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);

    resolveExerciseImage(exerciseName, nameEn)
      .then(url => {
        if (!cancelled) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [exerciseName, nameEn]);

  return { imageUrl, loading };
}
