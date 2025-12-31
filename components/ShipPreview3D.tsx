import { useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { ShipType } from '@/types/api';

interface ShipModel3DProps {
  shipType: ShipType;
}

function ShipModel3D({ shipType }: ShipModel3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Auto-rotate the ship
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const getShipGeometry = () => {
    switch (shipType) {
      case 'scout':
        // Scout: Fast and sleek - dodecahedron shape
        return <dodecahedronGeometry args={[1, 0]} />;
      case 'fighter':
        // Fighter: Angular and aggressive - octahedron shape
        return <octahedronGeometry args={[1, 0]} />;
      case 'trader':
        // Trader: Bulky cargo vessel - box shape
        return <boxGeometry args={[1.5, 0.8, 2]} />;
      case 'explorer':
        // Explorer: Pointed long-range vessel - cone shape
        return <coneGeometry args={[0.8, 2, 8]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const getShipColor = () => {
    switch (shipType) {
      case 'scout':
        return '#00d4ff'; // Cyan
      case 'fighter':
        return '#ef4444'; // Red
      case 'trader':
        return '#f59e0b'; // Amber
      case 'explorer':
        return '#7c3aed'; // Purple
      default:
        return '#4a90e2';
    }
  };

  const color = getShipColor();

  return (
    <mesh ref={meshRef} rotation={[0.3, 0, 0]}>
      {getShipGeometry()}
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function Starfield() {
  const points = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.5} color="#ffffff" transparent opacity={0.6} />
    </points>
  );
}

interface ShipPreview3DProps {
  shipType: ShipType;
  height?: number;
}

export function ShipPreview3D({ shipType, height = 300 }: ShipPreview3DProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#667eea" />

        {/* Starfield background */}
        <Starfield />

        {/* Ship model */}
        <ShipModel3D shipType={shipType} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f0c29',
  },
});

export default ShipPreview3D;
