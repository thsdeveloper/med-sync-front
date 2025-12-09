import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/auth-provider';
import { NotificationProvider } from '@/providers/notification-provider';
import { RealtimeProvider } from '@/providers/realtime-provider';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NotificationProvider>
          <RealtimeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="(auth)"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="(app)"
                options={{ gestureEnabled: false }}
              />
            </Stack>
            <StatusBar style="auto" />
          </RealtimeProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
