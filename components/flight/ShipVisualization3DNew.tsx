import { useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useFlightStore } from '@/stores/flightStore';

/**
 * ShipVisualization3DNew - True 3D flight visualization
 *
 * Combines the rugged lofi aesthetic of geometric 3D primitives
 * with responsive flight controls (roll, pitch, yaw, throttle).
 *
 * Raw metallic look - no cartoony details.
 */

interface ShipVisualization3DNewProps {
  shipType?: 'scout' | 'fighter' | 'trader' | 'explorer';
  size?: { width: number; height: number };
}

// Ship colors - darker, grittier palette
const SHIP_COLORS = {
  scout: { primary: '#00d4ff', emissive: '#004466' },
  fighter: { primary: '#ef4444', emissive: '#661111' },
  trader: { primary: '#f59e0b', emissive: '#664400' },
  explorer: { primary: '#7c3aed', emissive: '#331166' },
};

function ShipModel({
  shipType,
  roll,
  pitch,
  yaw
}: {
  shipType: string;
  roll: number;
  pitch: number;
  yaw: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Apply flight attitude to the ship
  useFrame(() => {
    if (groupRef.current) {
      // Smooth interpolation toward target rotation
      const targetX = pitch * 0.5;  // Pitch tilts nose up/down
      const targetY = yaw * 0.3;    // Yaw rotates left/right
      const targetZ = -roll * 0.6;  // Roll banks the ship

      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.1;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.z += (targetZ - groupRef.current.rotation.z) * 0.1;
    }
  });

  const getShipGeometry = () => {
    switch (shipType) {
      case 'scout':
        return <dodecahedronGeometry args={[1, 0]} />;
      case 'fighter':
        return <octahedronGeometry args={[1.2, 0]} />;
      case 'trader':
        return <boxGeometry args={[1.8, 0.9, 2.2]} />;
      case 'explorer':
        return <coneGeometry args={[0.9, 2.2, 6]} />;
      default:
        return <dodecahedronGeometry args={[1, 0]} />;
    }
  };

  const colors = SHIP_COLORS[shipType as keyof typeof SHIP_COLORS] || SHIP_COLORS.scout;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        {getShipGeometry()}
        <meshStandardMaterial
          color={colors.primary}
          metalness={0.85}
          roughness={0.15}
          emissive={colors.emissive}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function EngineGlow({ throttle, shipType }: { throttle: number; shipType: string }) {
  const glowRef = useRef<THREE.Mesh>(null);

  // Pulsing engine glow based on throttle
  useFrame((state) => {
    if (glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 8) * 0.1 + 0.9;
      const scale = throttle * pulse * 1.5;
      glowRef.current.scale.set(scale, scale, scale * 2);
    }
  });

  if (throttle < 0.05) return null;

  // Position engine behind ship based on type
  const engineZ = shipType === 'trader' ? 1.3 : shipType === 'explorer' ? 1.2 : 0.8;

  return (
    <mesh ref={glowRef} position={[0, 0, engineZ]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial
        color="#ff6600"
        transparent
        opacity={0.4 + throttle * 0.5}
      />
    </mesh>
  );
}

function Starfield({ pitch, yaw }: { pitch: number; yaw: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return pos;
  }, []);

  // Parallax starfield based on flight attitude
  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = pitch * 0.1;
      pointsRef.current.rotation.y = yaw * 0.15;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={800}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#8899aa" transparent opacity={0.5} />
    </points>
  );
}

export function ShipVisualization3DNew({
  shipType = 'scout',
  size = { width: 300, height: 400 },
}: ShipVisualization3DNewProps) {
  const attitude = useFlightStore((s) => s.attitude);
  const throttle = useFlightStore((s) => s.throttle);

  return (
    <View style={[styles.container, { width: size.width, height: size.height }]}>
      <Canvas camera={{ position: [0, 1, 5], fov: 45 }}>
        {/* Harsh industrial lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-5, -2, -5]} intensity={0.3} color="#4466aa" />
        <pointLight position={[0, 0, -3]} intensity={0.5} color="#ff6600" />

        {/* Parallax starfield */}
        <Starfield
          pitch={attitude.pitch.smoothed}
          yaw={attitude.yaw.smoothed}
        />

        {/* Ship responds to flight controls */}
        <ShipModel
          shipType={shipType}
          roll={attitude.roll.smoothed}
          pitch={attitude.pitch.smoothed}
          yaw={attitude.yaw.smoothed}
        />

        {/* Engine glow based on throttle */}
        <EngineGlow throttle={throttle.current} shipType={shipType} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#030308',
  },
});

export default ShipVisualization3DNew;
