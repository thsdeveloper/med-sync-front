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

interface AnimatedSunProps {
  size?: number;
  scrollOffset?: SharedValue<number>;
}

export function AnimatedSun({ size = 80, scrollOffset }: AnimatedSunProps) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const rayRotation = useSharedValue(0);

  useEffect(() => {
    // Pulsing animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Slow ray rotation
    rayRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value * 1.2 }],
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rayRotation.value}deg` }],
    opacity: glowOpacity.value * 0.6,
  }));

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollOffset) return {};
    return {
      transform: [
        {
          scale: interpolate(
            scrollOffset.value,
            [-50, 0, 100],
            [1.2, 1, 0.7],
            Extrapolation.CLAMP
          ),
        },
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, 100],
            [0, 30],
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

  const rayCount = 8;
  const rays = Array.from({ length: rayCount }, (_, i) => ({
    id: i,
    rotation: (360 / rayCount) * i,
  }));

  return (
    <Animated.View style={[styles.container, parallaxStyle]}>
      {/* Sun rays */}
      <Animated.View style={[styles.raysContainer, raysStyle]}>
        {rays.map((ray) => (
          <View
            key={ray.id}
            style={[
              styles.ray,
              {
                width: size * 0.08,
                height: size * 0.4,
                transform: [
                  { rotate: `${ray.rotation}deg` },
                  { translateY: -size * 0.7 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
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
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: size * 0.65,
          },
          glowStyle,
        ]}
      />

      {/* Sun body */}
      <Animated.View
        style={[
          styles.sun,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          sunStyle,
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  raysContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    backgroundColor: '#FCD34D',
    borderRadius: 4,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(252, 211, 77, 0.25)',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(252, 211, 77, 0.35)',
  },
  sun: {
    backgroundColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
});
