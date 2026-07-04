import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  maxOpacity: number;
}

function makeParticles(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 2 + Math.random() * 3.5,
    duration: 2500 + Math.random() * 4000,
    delay: Math.random() * 3000,
    drift: 20 + Math.random() * 50,
    maxOpacity: 0.35 + Math.random() * 0.45,
  }));
}

function Dot({ particle, color }: { particle: Particle; color: string }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: particle.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: particle.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [particle, progress]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: particle.x,
        top: particle.y,
        width: particle.size,
        height: particle.size,
        borderRadius: particle.size / 2,
        backgroundColor: color,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.05, particle.maxOpacity],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -particle.drift],
            }),
          },
        ],
      }}
    />
  );
}

/** Softly twinkling, drifting particles. Renders behind content; ignores touches. */
export default function ParticleField({ color, count = 22 }: { color: string; count?: number }) {
  const { width, height } = useWindowDimensions();
  const particles = useMemo(() => makeParticles(count, width, height), [count, width, height]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, i) => (
        <Dot key={i} particle={particle} color={color} />
      ))}
    </View>
  );
}
