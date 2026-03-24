import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#0f0f0f');
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#1a1a1a');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#0f0f0f' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout/[id]"
          options={{ title: 'Treino', presentation: 'modal', headerStyle: { backgroundColor: '#1a1a1a' } }}
        />
        <Stack.Screen
          name="exercise/[id]"
          options={{ title: 'Exercício', presentation: 'card' }}
        />
        <Stack.Screen
          name="session/[id]"
          options={{ title: 'Sessão', presentation: 'card' }}
        />
        <Stack.Screen
          name="template/edit"
          options={{ title: 'Treino', presentation: 'card' }}
        />
        <Stack.Screen
          name="debrief/[id]"
          options={{ title: 'Debrief', presentation: 'card' }}
        />
      </Stack>
    </>
  );
}
