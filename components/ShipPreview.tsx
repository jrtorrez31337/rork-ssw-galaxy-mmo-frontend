import { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { ShipType } from '@/types/api';
import Colors from '@/constants/colors';

interface ShipPreviewProps {
  shipType: ShipType;
  stats?: {
    hull_strength: number;
    shield_capacity: number;
    speed: number;
    cargo_space: number;
    sensors: number;
  };
}

const STAR_COUNT = 40;

function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      duration: Math.random() * 2000 + 1500,
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
    </View>
  );
}

function Star({ left, top, size, opacity, duration }: { 
  left: number; 
  top: number; 
  size: number; 
  opacity: number;
  duration: number;
}) {
  const pulseAnim = useRef(new Animated.Value(opacity)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: opacity * 0.3,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: opacity,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim, opacity, duration]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${left}%`,
          top: `${top}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: pulseAnim,
        },
      ]}
    />
  );
}

function ShipSilhouette({ shipType }: { shipType: ShipType }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatAnimation.start();
    glowAnimation.start();

    return () => {
      floatAnimation.stop();
      glowAnimation.stop();
    };
  }, [floatAnim, glowAnim]);

  const getShipConfig = () => {
    switch (shipType) {
      case 'scout':
        return {
          color: Colors.primary,
          shape: 'scout',
          width: 100,
          height: 60,
        };
      case 'fighter':
        return {
          color: '#ef4444',
          shape: 'fighter',
          width: 90,
          height: 80,
        };
      case 'trader':
        return {
          color: Colors.accent,
          shape: 'trader',
          width: 120,
          height: 70,
        };
      case 'explorer':
        return {
          color: Colors.secondary,
          shape: 'explorer',
          width: 110,
          height: 65,
        };
      default:
        return {
          color: Colors.primary,
          shape: 'scout',
          width: 100,
          height: 60,
        };
    }
  };

  const config = getShipConfig();

  const renderShipShape = () => {
    switch (config.shape) {
      case 'scout':
        return (
          <View style={styles.shipContainer}>
            <View style={[styles.scoutBody, { backgroundColor: config.color }]} />
            <View style={[styles.scoutWingLeft, { backgroundColor: config.color }]} />
            <View style={[styles.scoutWingRight, { backgroundColor: config.color }]} />
            <View style={[styles.scoutNose, { borderBottomColor: config.color }]} />
            <View style={[styles.engineGlow, { backgroundColor: Colors.primary }]} />
          </View>
        );
      case 'fighter':
        return (
          <View style={styles.shipContainer}>
            <View style={[styles.fighterBody, { backgroundColor: config.color }]} />
            <View style={[styles.fighterWingLeft, { backgroundColor: config.color }]} />
            <View style={[styles.fighterWingRight, { backgroundColor: config.color }]} />
            <View style={[styles.fighterCockpit, { backgroundColor: Colors.primary }]} />
            <View style={[styles.engineGlow, styles.engineGlowLarge, { backgroundColor: '#ef4444' }]} />
          </View>
        );
      case 'trader':
        return (
          <View style={styles.shipContainer}>
            <View style={[styles.traderBody, { backgroundColor: config.color }]} />
            <View style={[styles.traderCargo, { backgroundColor: config.color }]} />
            <View style={[styles.traderBridge, { backgroundColor: Colors.text }]} />
            <View style={[styles.engineGlow, styles.engineGlowWide, { backgroundColor: Colors.accent }]} />
          </View>
        );
      case 'explorer':
        return (
          <View style={styles.shipContainer}>
            <View style={[styles.explorerBody, { backgroundColor: config.color }]} />
            <View style={[styles.explorerDish, { borderColor: config.color }]} />
            <View style={[styles.explorerWingLeft, { backgroundColor: config.color }]} />
            <View style={[styles.explorerWingRight, { backgroundColor: config.color }]} />
            <View style={[styles.engineGlow, { backgroundColor: Colors.secondary }]} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.shipWrapper,
        {
          transform: [{ translateY: floatAnim }],
          opacity: glowAnim,
        },
      ]}
    >
      {renderShipShape()}
    </Animated.View>
  );
}

export default function ShipPreview({ shipType, stats }: ShipPreviewProps) {
  return (
    <View style={styles.container}>
      <Starfield />
      <View style={styles.previewArea}>
        <ShipSilhouette shipType={shipType} />
      </View>
      {stats && (
        <View style={styles.statsOverlay}>
          <StatBar label="Hull" value={stats.hull_strength} max={15} color="#ef4444" />
          <StatBar label="Shield" value={stats.shield_capacity} max={15} color={Colors.primary} />
          <StatBar label="Speed" value={stats.speed} max={15} color={Colors.success} />
        </View>
      )}
    </View>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: (value / max) * 100,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, max, widthAnim]);

  return (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarTrack}>
        <Animated.View
          style={[
            styles.statBarFill,
            {
              backgroundColor: color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: '#050810',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipContainer: {
    width: 120,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutBody: {
    width: 60,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
  },
  scoutWingLeft: {
    width: 40,
    height: 8,
    position: 'absolute',
    left: 10,
    top: 10,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  scoutWingRight: {
    width: 40,
    height: 8,
    position: 'absolute',
    right: 10,
    top: 10,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  scoutNose: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
    top: -18,
    transform: [{ rotate: '0deg' }],
  },
  fighterBody: {
    width: 50,
    height: 50,
    borderRadius: 8,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  fighterWingLeft: {
    width: 50,
    height: 10,
    position: 'absolute',
    left: 0,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 6,
    transform: [{ rotate: '-25deg' }],
  },
  fighterWingRight: {
    width: 50,
    height: 10,
    position: 'absolute',
    right: 0,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 6,
    transform: [{ rotate: '25deg' }],
  },
  fighterCockpit: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 5,
  },
  traderBody: {
    width: 80,
    height: 35,
    borderRadius: 6,
    position: 'absolute',
  },
  traderCargo: {
    width: 50,
    height: 20,
    borderRadius: 4,
    position: 'absolute',
    top: 20,
    opacity: 0.7,
  },
  traderBridge: {
    width: 20,
    height: 12,
    borderRadius: 3,
    position: 'absolute',
    top: -8,
  },
  explorerBody: {
    width: 70,
    height: 28,
    borderRadius: 14,
    position: 'absolute',
  },
  explorerDish: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 4,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: -20,
    left: 45,
  },
  explorerWingLeft: {
    width: 35,
    height: 6,
    position: 'absolute',
    left: 15,
    top: 15,
    borderTopLeftRadius: 3,
    transform: [{ rotate: '-10deg' }],
  },
  explorerWingRight: {
    width: 35,
    height: 6,
    position: 'absolute',
    right: 15,
    top: 15,
    borderTopRightRadius: 3,
    transform: [{ rotate: '10deg' }],
  },
  engineGlow: {
    width: 20,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    bottom: 20,
    opacity: 0.8,
  },
  engineGlowLarge: {
    width: 24,
    height: 10,
  },
  engineGlowWide: {
    width: 40,
    height: 6,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  statBarContainer: {
    flex: 1,
  },
  statBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
