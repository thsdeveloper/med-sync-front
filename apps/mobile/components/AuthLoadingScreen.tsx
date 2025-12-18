import { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { AuthLoadingState } from '@/providers/auth-provider';

interface AuthLoadingScreenProps {
  loadingState: AuthLoadingState;
  loadingMessage: string;
  error: Error | null;
  onRetry: () => void;
}

export function AuthLoadingScreen({
  loadingState,
  loadingMessage,
  error,
  onRetry,
}: AuthLoadingScreenProps) {
  const pulseScale = useSharedValue(1);
  const spinRotation = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for the icon
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    // Spin animation for loading state
    if (loadingState === 'connecting' || loadingState === 'initializing') {
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    }
  }, [loadingState, pulseScale, spinRotation]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const isError = loadingState === 'error';
  const isLoading = loadingState === 'initializing' || loadingState === 'connecting';

  return (
    <Animated.View
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <View style={styles.content}>
        {/* Logo/Icon */}
        <Animated.View style={[styles.iconContainer, isLoading && spinStyle, pulseStyle]}>
          {isError ? (
            <Ionicons name="alert-circle" size={80} color="#EF4444" />
          ) : (
            <Ionicons name="medical" size={80} color="#3B82F6" />
          )}
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>MedSync</Text>

        {/* Loading Message */}
        <Text style={[styles.message, isError && styles.errorMessage]}>
          {loadingMessage || (isLoading ? 'Carregando...' : '')}
        </Text>

        {/* Error Details */}
        {isError && error && (
          <Text style={styles.errorDetails}>
            {error.message || 'Erro desconhecido'}
          </Text>
        )}

        {/* Retry Button */}
        {isError && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <View style={styles.loadingDot} />
            <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
            <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 998, // Below AnimatedSplash (999)
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#EF4444',
    fontWeight: '500',
  },
  errorDetails: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingIndicator: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    opacity: 0.3,
  },
  loadingDotDelay1: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});
