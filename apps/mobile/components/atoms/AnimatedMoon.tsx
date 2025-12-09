import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

interface StarProps {
  delay: number;
  x: number;
  y: number;
  size: number;
}

function Star({ delay, x, y, size }: StarProps) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const duration = 1000 + Math.random() * 1000;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3, { duration }),
          withTiming(0.7, { duration })
        ),
        -1,
        false
      )
    );
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        starStyle,
      ]}
    />
  );
}

interface AnimatedMoonProps {
  size?: number;
  scrollOffset?: SharedValue<number>;
}

export function AnimatedMoon({ size = 70, scrollOffset }: AnimatedMoonProps) {
  const glowOpacity = useSharedValue(0.3);
  const glowScale = useSharedValue(1);
  const moonRotation = useSharedValue(0);

  // Generate star positions spread across the header area
  // Stars are positioned relative to the container, spreading around and to the right of the moon
  const stars = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 100 + Math.random() * 230, // Spread stars to the right of the moon
        y: 10 + Math.random() * 120, // Vertical spread within visible area
        delay: Math.random() * 2000,
        size: 2 + Math.random() * 2,
      })),
    []
  );

  useEffect(() => {
    // Moon glow pulsing
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Very subtle moon rotation
    moonRotation.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${moonRotation.value}deg` }],
  }));

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollOffset) return {};
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, 100],
            [0, 35],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        scrollOffset.value,
        [0, 80],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <Animated.View style={[styles.container, parallaxStyle]}>
      {/* Stars spread across the header */}
      {stars.map((star) => (
        <Star
          key={star.id}
          x={star.x}
          y={star.y}
          delay={star.delay}
          size={star.size}
        />
      ))}

      {/* Moon wrapper - positioned top-left */}
      <View style={styles.moonWrapper}>
        {/* Outer glow ring */}
        <Animated.View
          style={[
            styles.outerGlow,
            {
              width: size * 1.8,
              height: size * 1.8,
              borderRadius: size * 0.9,
            },
            glowStyle,
          ]}
        />

        {/* Inner glow */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: size * 0.7,
            },
            glowStyle,
          ]}
        />

        {/* Moon body */}
        <Animated.View
          style={[
            styles.moon,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            moonStyle,
          ]}
        >
          {/* Crater details for realistic moon look */}
          <View
            style={[
              styles.crater,
              {
                width: size * 0.2,
                height: size * 0.2,
                borderRadius: size * 0.1,
                top: size * 0.15,
                left: size * 0.25,
              },
            ]}
          />
          <View
            style={[
              styles.crater,
              styles.craterDark,
              {
                width: size * 0.15,
                height: size * 0.15,
                borderRadius: size * 0.075,
                top: size * 0.45,
                right: size * 0.2,
              },
            ]}
          />
          <View
            style={[
              styles.crater,
              {
                width: size * 0.12,
                height: size * 0.12,
                borderRadius: size * 0.06,
                bottom: size * 0.2,
                left: size * 0.2,
              },
            ]}
          />
          <View
            style={[
              styles.crater,
              styles.craterLight,
              {
                width: size * 0.08,
                height: size * 0.08,
                borderRadius: size * 0.04,
                top: size * 0.35,
                left: size * 0.45,
              },
            ]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 350,
    height: 160,
  },
  moonWrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  moon: {
    backgroundColor: '#F1F5F9',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  crater: {
    position: 'absolute',
    backgroundColor: 'rgba(100, 116, 139, 0.25)',
  },
  craterDark: {
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
  },
  craterLight: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FBBF24',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
});
