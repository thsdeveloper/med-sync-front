import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { ShiftPeriod } from './PeriodBadge';
import { getSkyTheme } from './SkyTheme';

interface SkyBackgroundProps {
  period: ShiftPeriod;
  scrollOffset?: SharedValue<number>;
  style?: ViewStyle;
}

export function SkyBackground({ period, scrollOffset, style }: SkyBackgroundProps) {
  const theme = getSkyTheme(period);

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollOffset) return {};
    return {
      opacity: interpolate(
        scrollOffset.value,
        [0, 60, 100],
        [1, 0.85, 0.7],
        Extrapolation.CLAMP
      ),
    };
  });

  // Cast colors to the expected tuple type
  const gradientColors = theme.gradient.colors as [string, string, ...string[]];

  return (
    <Animated.View style={[styles.background, style, animatedStyle]}>
      <LinearGradient
        colors={gradientColors}
        start={theme.gradient.start}
        end={theme.gradient.end}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
});
