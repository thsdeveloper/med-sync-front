import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
import Svg, { Path } from 'react-native-svg';

// Import SVG as component
import MedicalIllustration from '@/assets/images/undraw_medicine_hqqg.svg';

const HEADER_HEIGHT = 200;

interface ShiftDetailHeaderProps {
  startTime: string;
  endTime: string;
  children: React.ReactNode;
  color?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  title?: string;
}

export function ShiftDetailHeader({
  startTime,
  endTime,
  children,
  color = '#0066CC',
  iconName = 'calendar',
  title = 'Plantão',
}: ShiftDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollOffset = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollOffset.value,
      [0, 100],
      [HEADER_HEIGHT, HEADER_HEIGHT - 50],
      Extrapolation.CLAMP
    )
  }));

  const contentOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    )
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
      <StatusBar style="light" />

      {/* Fixed Header Background */}
      <Animated.View style={[styles.header, { backgroundColor: color }, headerAnimatedStyle]}>

        {/* SVG Illustration Background */}
        <View style={StyleSheet.absoluteFill}>
          <MedicalIllustration width="100%" height="100%" opacity={0.3} preserveAspectRatio="xMidYMid slice" />
        </View>

        <View style={styles.overlay} />

        {/* Close Button */}
        <View style={[styles.closeButtonContainer, { top: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.headerContent, { paddingTop: insets.top + 5 }, contentOpacityStyle]}>
          {/* Left: Icon Box */}
          <View style={styles.iconBox}>
            <Ionicons name={iconName} size={32} color={color} />
          </View>

          {/* Right: Info */}
          <View style={styles.headerInfo}>
            {/* Turno Label */}
            <View style={styles.turnoContainer}>
              <Text style={styles.turnoLabel}>{title}</Text>
            </View>

            {/* Date/Time Info */}
            <Text style={styles.timeText}>{formattedTime}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </Animated.View>

        {/* Wavy Curve Bottom */}
        <View style={styles.waveContainer}>
          <Svg
            height="100%"
            width="100%"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <Path
              fill="#F9FAFB"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </Svg>
        </View>

      </Animated.View>


      {/* Scrollable Content */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: HEADER_HEIGHT + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
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
    zIndex: 10,
    overflow: 'hidden',
    justifyContent: 'flex-start'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Slight dark overlay for text contrast
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  turnoContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  turnoLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  dateText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  waveContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});

