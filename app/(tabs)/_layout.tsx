import { Tabs } from 'expo-router';
import { MessageCircle, Dumbbell, History, Settings } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: '#0f0f0f' }}
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Treinador',
          tabBarIcon: ({ color }) => <MessageCircle size={22} stroke={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="templates"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ color }) => <Dumbbell size={22} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <History size={22} stroke={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ color }) => <Settings size={22} stroke={color} />,
        }}
      />
    </Tabs>
  );
}
