import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/providers/auth-provider';
import { NotificationProvider } from '@/providers/notification-provider';
import { QueryProvider } from '@/providers/query-provider';
import { RealtimeProvider } from '@/providers/realtime-provider';

// Prevenir auto-hide da splash screen
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Aqui podem ser adicionadas outras inicializações (fontes, etc)
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleSplashAnimationFinish = useCallback(() => {
    setSplashAnimationFinished(true);
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryProvider>
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
      </QueryProvider>

      {/* Splash animada por cima de tudo */}
      {!splashAnimationFinished && (
        <AnimatedSplash onAnimationFinish={handleSplashAnimationFinish} />
      )}
    </View>
  );
}
