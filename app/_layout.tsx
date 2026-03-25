import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useFonts } from 'expo-font';
import { Syne_600SemiBold, Syne_700Bold } from '@expo-google-fonts/syne';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { clearBadImageCache } from '../lib/db';

function ThemedStack() {
  const { colors, mode } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg);
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.surface);
      NavigationBar.setButtonStyleAsync(mode === 'dark' ? 'light' : 'dark');
    }
  }, [colors.bg, mode]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/[id]"
          options={{ title: 'Treino', presentation: 'modal', headerStyle: { backgroundColor: colors.surface } }}
        />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Exercício', presentation: 'card' }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Sessão', presentation: 'card' }} />
        <Stack.Screen name="template/edit" options={{ title: 'Treino', presentation: 'card' }} />
        <Stack.Screen name="debrief/[id]" options={{ title: 'Debrief', presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Syne_600SemiBold, Syne_700Bold,
    DMSans_400Regular, DMSans_500Medium, DMSans_700Bold,
  });

  useEffect(() => {
    clearBadImageCache();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
