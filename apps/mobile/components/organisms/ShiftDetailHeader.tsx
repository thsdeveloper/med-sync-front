import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getShiftPeriod, getShiftPeriodConfig } from '../atoms/PeriodBadge';
import { getSkyTheme } from '../atoms/SkyTheme';
import { SkyScene } from '../molecules/SkyScene';

const HEADER_HEIGHT = 220;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShiftDetailHeaderProps {
  startTime: string;
  endTime: string;
  children: React.ReactNode;
}

export function ShiftDetailHeader({ startTime, endTime, children }: ShiftDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollOffset = useSharedValue(0);

  const period = getShiftPeriod(startTime);
  const periodConfig = getShiftPeriodConfig(startTime);
  const skyTheme = getSkyTheme(period);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-100, 0, HEADER_HEIGHT],
          [-50, 0, HEADER_HEIGHT * 0.4],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-100, 0],
          [1.3, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const timeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [0, 60],
          [0, -20],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const closeButtonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.value,
      [0, 40],
      [1, 0.7],
      Extrapolation.CLAMP
    ),
  }));

  const formattedDate = format(parseISO(startTime), "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const formattedTime = `${format(parseISO(startTime), 'HH:mm')} - ${format(
    parseISO(endTime),
    'HH:mm'
  )}`;

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar style={skyTheme.statusBarStyle} />

      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <SkyScene
          period={period}
          scrollOffset={scrollOffset}
          style={styles.skyScene}
        />

        {/* Close button */}
        <Animated.View
          style={[
            styles.closeButtonContainer,
            { top: insets.top + 8 },
            closeButtonStyle,
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Time overlay on header */}
        <Animated.View style={[styles.timeOverlay, timeOverlayStyle]}>
          <View style={styles.periodBadge}>
            <Ionicons name={periodConfig.icon} size={16} color="#FFFFFF" />
            <Text style={styles.periodLabel}>{periodConfig.label}</Text>
          </View>
          <Text
            style={[
              styles.timeText,
              {
                color: skyTheme.textColor,
                textShadowColor: skyTheme.textShadow,
              },
            ]}
          >
            {formattedTime}
          </Text>
          <Text
            style={[
              styles.dateText,
              {
                color: skyTheme.textColor,
                textShadowColor: skyTheme.textShadow,
              },
            ]}
          >
            {formattedDate}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Curved transition */}
        <View style={styles.curveContainer}>
          <View style={styles.curve} />
        </View>

        {/* Content */}
        <View style={styles.content}>{children}</View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 10,
  },
  skyScene: {
    height: HEADER_HEIGHT,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  periodLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginTop: 4,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  curveContainer: {
    height: 28,
    marginTop: -28,
    overflow: 'hidden',
  },
  curve: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
