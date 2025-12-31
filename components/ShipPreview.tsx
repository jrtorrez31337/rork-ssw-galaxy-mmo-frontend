import { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Defs,
  G,
  Path,
  Polygon,
  Ellipse,
  Circle,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { ShipType } from '@/types/api';

// Original ship colors - the "3D-like" metallic palette
const SHIP_COLORS = {
  scout: {
    primary: '#00d4ff',    // Cyan
    dark: '#006688',
    highlight: '#88ffff',
    glow: '#00d4ff',
  },
  fighter: {
    primary: '#ef4444',    // Red
    dark: '#991b1b',
    highlight: '#ff8888',
    glow: '#ef4444',
  },
  trader: {
    primary: '#f59e0b',    // Amber
    dark: '#b45309',
    highlight: '#ffd066',
    glow: '#f59e0b',
  },
  explorer: {
    primary: '#7c3aed',    // Purple
    dark: '#4c1d95',
    highlight: '#b794f4',
    glow: '#7c3aed',
  },
};

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

const STAR_COUNT = 80;

function Starfield({ width, height }: { width: number; height: number }) {
  const stars = useMemo(() => {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      layer: Math.floor(Math.random() * 3),
    }));
  }, [width, height]);

  return (
    <G>
      {stars.map((star) => (
        <Circle
          key={star.id}
          cx={star.x}
          cy={star.y}
          r={star.size}
          fill="#ffffff"
          opacity={star.opacity}
        />
      ))}
    </G>
  );
}

function ScoutShip({ colors }: { colors: typeof SHIP_COLORS.scout }) {
  return (
    <G>
      {/* Main hull - elongated sleek shape */}
      <Defs>
        <LinearGradient id="scoutHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.highlight} />
          <Stop offset="40%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.dark} />
        </LinearGradient>
        <RadialGradient id="scoutGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.glow} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="cockpitGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#aaddff" />
          <Stop offset="50%" stopColor="#4488aa" />
          <Stop offset="100%" stopColor="#224455" />
        </LinearGradient>
      </Defs>

      {/* Glow effect */}
      <Ellipse cx="75" cy="60" rx="50" ry="35" fill="url(#scoutGlow)" />

      {/* Wings */}
      <Path
        d="M30 55 L55 50 L55 70 L30 65 Z"
        fill="url(#scoutHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />
      <Path
        d="M120 55 L95 50 L95 70 L120 65 Z"
        fill="url(#scoutHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />

      {/* Main body */}
      <Path
        d="M50 40 L100 40 L110 60 L100 80 L50 80 L40 60 Z"
        fill="url(#scoutHull)"
        stroke={colors.dark}
        strokeWidth="1.5"
      />

      {/* Nose */}
      <Path
        d="M100 45 L130 60 L100 75 Z"
        fill="url(#scoutHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />

      {/* Cockpit */}
      <Ellipse
        cx="85"
        cy="60"
        rx="12"
        ry="10"
        fill="url(#cockpitGlass)"
        stroke={colors.highlight}
        strokeWidth="1"
      />

      {/* Engine glow */}
      <Ellipse cx="38" cy="60" rx="8" ry="6" fill={colors.glow} opacity="0.8" />
      <Ellipse cx="38" cy="60" rx="4" ry="3" fill="#ffffff" opacity="0.6" />
    </G>
  );
}

function FighterShip({ colors }: { colors: typeof SHIP_COLORS.fighter }) {
  return (
    <G>
      <Defs>
        <LinearGradient id="fighterHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.highlight} />
          <Stop offset="40%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.dark} />
        </LinearGradient>
        <RadialGradient id="fighterGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.glow} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="fighterCockpit" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#aaddff" />
          <Stop offset="50%" stopColor="#4488aa" />
          <Stop offset="100%" stopColor="#224455" />
        </LinearGradient>
      </Defs>

      {/* Glow */}
      <Ellipse cx="75" cy="60" rx="45" ry="40" fill="url(#fighterGlow)" />

      {/* Wings - aggressive angles */}
      <Path
        d="M20 50 L50 55 L50 65 L20 70 L15 60 Z"
        fill="url(#fighterHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />
      <Path
        d="M130 50 L100 55 L100 65 L130 70 L135 60 Z"
        fill="url(#fighterHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />

      {/* Main body - angular */}
      <Polygon
        points="55,35 95,35 110,60 95,85 55,85 40,60"
        fill="url(#fighterHull)"
        stroke={colors.dark}
        strokeWidth="1.5"
      />

      {/* Nose - pointed */}
      <Path
        d="M95 40 L125 60 L95 80 Z"
        fill="url(#fighterHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />

      {/* Cockpit */}
      <Ellipse
        cx="80"
        cy="60"
        rx="10"
        ry="12"
        fill="url(#fighterCockpit)"
        stroke={colors.highlight}
        strokeWidth="1"
      />

      {/* Weapon mounts */}
      <Rect x="25" y="48" width="8" height="4" fill={colors.dark} />
      <Rect x="25" y="68" width="8" height="4" fill={colors.dark} />
      <Rect x="117" y="48" width="8" height="4" fill={colors.dark} />
      <Rect x="117" y="68" width="8" height="4" fill={colors.dark} />

      {/* Twin engines */}
      <Ellipse cx="38" cy="52" rx="6" ry="5" fill={colors.glow} opacity="0.9" />
      <Ellipse cx="38" cy="52" rx="3" ry="2" fill="#ffffff" opacity="0.7" />
      <Ellipse cx="38" cy="68" rx="6" ry="5" fill={colors.glow} opacity="0.9" />
      <Ellipse cx="38" cy="68" rx="3" ry="2" fill="#ffffff" opacity="0.7" />
    </G>
  );
}

function TraderShip({ colors }: { colors: typeof SHIP_COLORS.trader }) {
  return (
    <G>
      <Defs>
        <LinearGradient id="traderHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.highlight} />
          <Stop offset="40%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.dark} />
        </LinearGradient>
        <RadialGradient id="traderGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.glow} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="cargoHull" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.dark} />
        </LinearGradient>
      </Defs>

      {/* Glow */}
      <Ellipse cx="75" cy="60" rx="55" ry="35" fill="url(#traderGlow)" />

      {/* Cargo pods */}
      <Rect x="35" y="35" width="80" height="20" rx="4" fill="url(#cargoHull)" stroke={colors.dark} strokeWidth="1" />
      <Rect x="35" y="65" width="80" height="20" rx="4" fill="url(#cargoHull)" stroke={colors.dark} strokeWidth="1" />

      {/* Main hull */}
      <Path
        d="M40 45 L110 45 L120 60 L110 75 L40 75 L30 60 Z"
        fill="url(#traderHull)"
        stroke={colors.dark}
        strokeWidth="1.5"
      />

      {/* Bridge */}
      <Path
        d="M100 50 L125 55 L125 65 L100 70 Z"
        fill="url(#traderHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />
      <Ellipse cx="115" cy="60" rx="6" ry="5" fill="#4488aa" stroke="#aaddff" strokeWidth="0.5" />

      {/* Cargo bay doors */}
      <Rect x="50" y="48" width="15" height="4" fill={colors.dark} opacity="0.6" />
      <Rect x="70" y="48" width="15" height="4" fill={colors.dark} opacity="0.6" />
      <Rect x="50" y="68" width="15" height="4" fill={colors.dark} opacity="0.6" />
      <Rect x="70" y="68" width="15" height="4" fill={colors.dark} opacity="0.6" />

      {/* Engines */}
      <Ellipse cx="28" cy="55" rx="6" ry="4" fill={colors.glow} opacity="0.8" />
      <Ellipse cx="28" cy="55" rx="3" ry="2" fill="#ffffff" opacity="0.5" />
      <Ellipse cx="28" cy="65" rx="6" ry="4" fill={colors.glow} opacity="0.8" />
      <Ellipse cx="28" cy="65" rx="3" ry="2" fill="#ffffff" opacity="0.5" />
    </G>
  );
}

function ExplorerShip({ colors }: { colors: typeof SHIP_COLORS.explorer }) {
  return (
    <G>
      <Defs>
        <LinearGradient id="explorerHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={colors.highlight} />
          <Stop offset="40%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.dark} />
        </LinearGradient>
        <RadialGradient id="explorerGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.glow} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={colors.glow} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="sensorDish" cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <Stop offset="50%" stopColor={colors.primary} />
          <Stop offset="100%" stopColor={colors.dark} />
        </RadialGradient>
      </Defs>

      {/* Glow */}
      <Ellipse cx="75" cy="60" rx="50" ry="40" fill="url(#explorerGlow)" />

      {/* Sensor dish */}
      <Circle cx="110" cy="40" r="15" fill="url(#sensorDish)" stroke={colors.primary} strokeWidth="1" />
      <Circle cx="108" cy="38" r="4" fill="#ffffff" opacity="0.6" />

      {/* Wings */}
      <Path
        d="M25 55 L50 50 L50 70 L25 65 Z"
        fill="url(#explorerHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />
      <Path
        d="M125 70 L100 65 L100 85 L125 80 Z"
        fill="url(#explorerHull)"
        stroke={colors.dark}
        strokeWidth="1"
      />

      {/* Main body - sleek science vessel */}
      <Path
        d="M45 45 L105 45 L115 60 L105 75 L45 75 L35 60 Z"
        fill="url(#explorerHull)"
        stroke={colors.dark}
        strokeWidth="1.5"
      />

      {/* Science module */}
      <Rect x="85" y="50" width="25" height="20" rx="3" fill="url(#explorerHull)" stroke={colors.dark} strokeWidth="1" />

      {/* Cockpit */}
      <Ellipse cx="65" cy="60" rx="10" ry="8" fill="#4488aa" stroke="#aaddff" strokeWidth="1" />

      {/* Sensor arrays */}
      <Rect x="48" y="43" width="3" height="6" fill={colors.highlight} />
      <Rect x="55" y="43" width="3" height="6" fill={colors.highlight} />
      <Rect x="48" y="71" width="3" height="6" fill={colors.highlight} />
      <Rect x="55" y="71" width="3" height="6" fill={colors.highlight} />

      {/* Engine */}
      <Ellipse cx="33" cy="60" rx="7" ry="5" fill={colors.glow} opacity="0.8" />
      <Ellipse cx="33" cy="60" rx="3" ry="2" fill="#ffffff" opacity="0.6" />
    </G>
  );
}

function ShipSVG({ shipType }: { shipType: ShipType }) {
  const colors = SHIP_COLORS[shipType] || SHIP_COLORS.scout;

  switch (shipType) {
    case 'scout':
      return <ScoutShip colors={colors} />;
    case 'fighter':
      return <FighterShip colors={colors} />;
    case 'trader':
      return <TraderShip colors={colors} />;
    case 'explorer':
      return <ExplorerShip colors={colors} />;
    default:
      return <ScoutShip colors={colors} />;
  }
}

export default function ShipPreview({ shipType, stats }: ShipPreviewProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
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
          toValue: 0.85,
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

  return (
    <View style={styles.container}>
      {/* Background with stars */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="100%" height="100%" fill="#050810" />
        <Starfield width={400} height={200} />
      </Svg>

      {/* Animated ship */}
      <Animated.View
        style={[
          styles.shipWrapper,
          {
            transform: [{ translateY: floatAnim }],
            opacity: glowAnim,
          },
        ]}
      >
        <Svg width={150} height={120} viewBox="0 0 150 120">
          <ShipSVG shipType={shipType} />
        </Svg>
      </Animated.View>

      {/* Stats overlay */}
      {stats && (
        <View style={styles.statsOverlay}>
          <StatBar label="Hull" value={stats.hull_strength} max={15} color="#ef4444" />
          <StatBar label="Shield" value={stats.shield_capacity} max={15} color="#00d4ff" />
          <StatBar label="Speed" value={stats.speed} max={15} color="#10b981" />
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
    borderColor: '#1e293b',
  },
  shipWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
