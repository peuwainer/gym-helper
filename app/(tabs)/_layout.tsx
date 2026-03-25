import { Tabs } from 'expo-router';
import { MessageCircle, Dumbbell, History, Settings } from 'lucide-react-native';
import { fonts } from '../../lib/theme';
import { useTheme } from '../../lib/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.bodyMedium },
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
