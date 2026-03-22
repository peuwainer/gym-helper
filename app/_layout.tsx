import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
