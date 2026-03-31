import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseLog } from '../types';

const KEYS = {
  ANTHROPIC_API_KEY: 'anthropic_api_key',
  ONBOARDING_DONE: 'onboarding_done',
  THEME_MODE: 'theme_mode',
  WORKOUT_DRAFT_PREFIX: 'workout_draft',
};

export interface WorkoutDraft {
  startedAt: number;
  logs: ExerciseLog[];
}

function getWorkoutDraftKey(templateId: number): string {
  return `${KEYS.WORKOUT_DRAFT_PREFIX}:${templateId}`;
}

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ANTHROPIC_API_KEY);
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ANTHROPIC_API_KEY, key.trim());
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ANTHROPIC_API_KEY);
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export async function getThemeMode(): Promise<'light' | 'dark'> {
  const val = await AsyncStorage.getItem(KEYS.THEME_MODE);
  return val === 'light' ? 'light' : 'dark'; // default: dark
}

export async function setThemeMode(mode: 'light' | 'dark'): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
}

export async function saveWorkoutDraft(
  templateId: number,
  startedAt: number,
  logs: ExerciseLog[]
): Promise<void> {
  const key = getWorkoutDraftKey(templateId);
  const value: WorkoutDraft = { startedAt, logs };
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getWorkoutDraft(templateId: number): Promise<WorkoutDraft | null> {
  const raw = await AsyncStorage.getItem(getWorkoutDraftKey(templateId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as WorkoutDraft;
    if (!parsed || !Array.isArray(parsed.logs) || typeof parsed.startedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearWorkoutDraft(templateId: number): Promise<void> {
  await AsyncStorage.removeItem(getWorkoutDraftKey(templateId));
}
