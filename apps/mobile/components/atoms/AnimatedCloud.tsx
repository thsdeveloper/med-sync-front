import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface AnimatedCloudProps {
  size?: number;
  scrollOffset?: SharedValue<number>;
}

export function AnimatedCloud({ size = 100, scrollOffset }: AnimatedCloudProps) {
  const translateX = useSharedValue(0);
  const scaleX = useSharedValue(1);
  const opacity = useSharedValue(0.95);

  useEffect(() => {
    // Drift animation - gentle horizontal movement
    translateX.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-12, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Breathing animation - subtle scale
    scaleX.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle opacity pulsing
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.9, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scaleX: scaleX.value },
    ],
    opacity: opacity.value,
  }));

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollOffset) return {};
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, 100],
            [0, 50],
            Extrapolation.CLAMP
          ),
        },
        {
          translateX: interpolate(
            scrollOffset.value,
            [0, 100],
            [0, 20],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        scrollOffset.value,
        [0, 60],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View style={[styles.container, parallaxStyle]}>
      <Animated.View style={[styles.cloudGroup, cloudStyle]}>
        {/* Shadow layer */}
        <View style={[styles.shadow, { width: size * 0.9, height: size * 0.15 }]} />

        {/* Cloud puffs - creating a fluffy cloud shape */}
        <View style={styles.cloudBody}>
          {/* Left puff */}
          <View
            style={[
              styles.cloudPart,
              {
                width: size * 0.4,
                height: size * 0.35,
                left: 0,
                bottom: size * 0.08,
              },
            ]}
          />
          {/* Center-left puff */}
          <View
            style={[
              styles.cloudPart,
              {
                width: size * 0.45,
                height: size * 0.45,
                left: size * 0.2,
                bottom: size * 0.15,
              },
            ]}
          />
          {/* Main center puff (tallest) */}
          <View
            style={[
              styles.cloudPart,
              styles.mainPuff,
              {
                width: size * 0.5,
                height: size * 0.55,
                left: size * 0.35,
                bottom: size * 0.1,
              },
            ]}
          />
          {/* Center-right puff */}
          <View
            style={[
              styles.cloudPart,
              {
                width: size * 0.4,
                height: size * 0.4,
                right: size * 0.15,
                bottom: size * 0.12,
              },
            ]}
          />
          {/* Right puff */}
          <View
            style={[
              styles.cloudPart,
              {
                width: size * 0.35,
                height: size * 0.3,
                right: 0,
                bottom: size * 0.05,
              },
            ]}
          />
          {/* Base connecting layer */}
          <View
            style={[
              styles.cloudBase,
              {
                width: size * 1.1,
                height: size * 0.25,
                left: -size * 0.05,
              },
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudGroup: {
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    bottom: -8,
    left: '5%',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 100,
    transform: [{ scaleX: 1.1 }],
  },
  cloudBody: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  cloudPart: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  mainPuff: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    elevation: 2,
  },
});
