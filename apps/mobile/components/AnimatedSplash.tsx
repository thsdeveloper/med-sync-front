import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

interface AnimatedSplashProps {
  onAnimationFinish: () => void;
}

export function AnimatedSplash({ onAnimationFinish }: AnimatedSplashProps) {
  const animationRef = useRef<LottieView>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Iniciar animação automaticamente
    animationRef.current?.play();
  }, []);

  const handleAnimationFinish = () => {
    setIsFinished(true);
    // Pequeno delay para o fade out completar
    setTimeout(onAnimationFinish, 300);
  };

  if (isFinished) {
    return null;
  }

  return (
    <Animated.View
      style={styles.container}
      exiting={FadeOut.duration(300)}
    >
      <LottieView
        ref={animationRef}
        source={require('@/assets/MedicalAppSplash.json')}
        style={styles.animation}
        autoPlay={false}
        loop={false}
        onAnimationFinish={handleAnimationFinish}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  animation: {
    width: 300,
    height: 300,
  },
});
