import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

// Configure how notifications are handled when app is in foreground
// Wrapped in try-catch for web/simulator compatibility
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('[Notifications] Handler setup skipped (not supported on this platform)');
}

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<string | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { staff, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Register for push notifications and get the token
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    // Skip on web or non-device
    if (Platform.OS === 'web') {
      console.log('[Notifications] Push notifications not supported on web');
      return null;
    }

    if (!Device.isDevice) {
      console.log('[Notifications] Must use physical device for push notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('[Notifications] Token obtained:', tokenResponse.data);
      return tokenResponse.data;
    } catch (error) {
      console.error('[Notifications] Error getting push token:', error);
      return null;
    }
  }, []);

  // Save token to database
  const saveTokenToDatabase = useCallback(async (token: string) => {
    if (!staff?.id) return;

    try {
      const { error } = await supabase
        .from('medical_staff')
        .update({ expo_push_token: token })
        .eq('id', staff.id);

      if (error) {
        console.error('[Notifications] Error saving token:', error);
      } else {
        console.log('[Notifications] Token saved for staff:', staff.id);
      }
    } catch (error) {
      console.error('[Notifications] Error saving token:', error);
    }
  }, [staff?.id]);

  // Handle notification tap - navigate to relevant screen
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Use setTimeout to ensure navigation happens after layout is mounted
    setTimeout(() => {
      try {
        if (data?.type === 'fixed_schedule') {
          router.push('/(app)/(tabs)/schedule');
        } else if (data?.shiftId) {
          router.push(`/(app)/shift/${data.shiftId}` as const);
        }
      } catch (error) {
        console.log('[Notifications] Navigation error (layout may not be ready):', error);
      }
    }, 100);
  }, []);

  // Setup on authentication
  useEffect(() => {
    if (!isAuthenticated || !staff?.id) return;

    // Skip setup on web
    if (Platform.OS === 'web') return;

    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        saveTokenToDatabase(token);
      }
    });

    // Listen for notifications when app is in foreground
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
        console.log('[Notifications] Received:', notif);
        setNotification(notif);
      });

      // Listen for notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    } catch (error) {
      console.log('[Notifications] Listener setup failed:', error);
    }

    return () => {
      // Use .remove() method on the subscription object instead of removeNotificationSubscription
      try {
        notificationListener.current?.remove();
        responseListener.current?.remove();
      } catch (error) {
        console.log('[Notifications] Cleanup error:', error);
      }
    };
  }, [isAuthenticated, staff?.id, registerForPushNotifications, saveTokenToDatabase, handleNotificationResponse]);

  // Android notification channel setup
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        Notifications.setNotificationChannelAsync('default', {
          name: 'MedSync Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0066CC',
        });
      } catch (error) {
        console.log('[Notifications] Channel setup error:', error);
      }
    }
  }, []);

  // Clear token on logout
  useEffect(() => {
    if (!isAuthenticated && expoPushToken) {
      setExpoPushToken(null);
    }
  }, [isAuthenticated, expoPushToken]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, registerForPushNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
