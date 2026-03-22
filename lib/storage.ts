import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ANTHROPIC_API_KEY: 'anthropic_api_key',
  ONBOARDING_DONE: 'onboarding_done',
};

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
