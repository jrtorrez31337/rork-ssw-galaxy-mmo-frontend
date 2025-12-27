import { Tabs } from 'expo-router';
import { MapPin, Target, Ship, ScrollText, User } from 'lucide-react-native';
import { tokens } from '@/ui/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PerformanceOverlay } from '@/components/PerformanceOverlay';

export default function TabLayout() {
  return (
    <ErrorBoundary fallbackTitle="Tab Navigation Error">
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tokens.layout.tabBar.height,
          backgroundColor: tokens.colors.surface.base,
          borderTopColor: tokens.colors.border.default,
          borderTopWidth: 1,
          paddingBottom: tokens.spacing[2],
          paddingTop: tokens.spacing[2],
        },
        tabBarActiveTintColor: tokens.colors.primary.main,
        tabBarInactiveTintColor: tokens.colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: tokens.typography.fontSize.xs,
          fontWeight: tokens.typography.fontWeight.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ops"
        options={{
          title: 'Ops',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fleet"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color, size }) => <Ship size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <ScrollText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
    <PerformanceOverlay />
    </ErrorBoundary>
  );
}
