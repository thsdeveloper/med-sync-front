import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import type { ShiftPeriod } from '../atoms/PeriodBadge';
import { SkyBackground } from '../atoms/SkyBackground';
import { AnimatedSun } from '../atoms/AnimatedSun';
import { AnimatedCloud } from '../atoms/AnimatedCloud';
import { AnimatedMoon } from '../atoms/AnimatedMoon';

interface SkySceneProps {
  period: ShiftPeriod;
  scrollOffset?: SharedValue<number>;
  style?: ViewStyle;
}

export function SkyScene({ period, scrollOffset, style }: SkySceneProps) {
  const renderScene = () => {
    switch (period) {
      case 'morning':
        return (
          <View style={styles.iconContainer}>
            <AnimatedSun size={70} scrollOffset={scrollOffset} />
          </View>
        );

      case 'afternoon':
        return (
          <View style={styles.iconContainer}>
            <View style={styles.afternoonGroup}>
              {/* Sun positioned behind */}
              <View style={styles.sunBehind}>
                <AnimatedSun size={55} scrollOffset={scrollOffset} />
              </View>
              {/* Cloud in front, partially covering */}
              <View style={styles.cloudFront}>
                <AnimatedCloud size={75} scrollOffset={scrollOffset} />
              </View>
            </View>
          </View>
        );

      case 'night':
        return (
          <View style={styles.nightContainer}>
            <AnimatedMoon size={65} scrollOffset={scrollOffset} />
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, style]}>
      <SkyBackground period={period} scrollOffset={scrollOffset} />
      {renderScene()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    overflow: 'hidden',
  },
  iconContainer: {
    position: 'absolute',
    top: 45,
    left: 24,
  },
  nightContainer: {
    position: 'absolute',
    top: 25,
    left: 4,
  },
  afternoonGroup: {
    position: 'relative',
    width: 120,
    height: 100,
  },
  sunBehind: {
    position: 'absolute',
    top: 0,
    left: 10,
    zIndex: 1,
  },
  cloudFront: {
    position: 'absolute',
    top: 25,
    left: -5,
    zIndex: 2,
  },
});
