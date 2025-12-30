import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { useFlightStore } from '@/stores/flightStore';
import { tokens } from '@/ui/theme';

/**
 * ShipVisualization3D - Three.js powered ship visualization
 *
 * Per Cinematic Arcade Flight Model Doctrine:
 * - 3D ship model responds to attitude controls (pitch/roll/yaw)
 * - Engine glow intensity based on throttle
 * - Starfield background with parallax
 */

interface ShipVisualization3DProps {
  shipType?: 'scout' | 'fighter' | 'trader' | 'explorer';
  size?: { width: number; height: number };
}

// Ship color palette matching original design
const SHIP_COLORS = {
  scout: { primary: 0x4a90e2, emissive: 0x2a5082 },
  fighter: { primary: 0xe74c3c, emissive: 0x872a22 },
  trader: { primary: 0xf39c12, emissive: 0x936008 },
  explorer: { primary: 0x2ecc71, emissive: 0x1a7a42 },
};

// Engine glow color
const ENGINE_COLOR = 0xff6600;

export function ShipVisualization3D({
  shipType = 'scout',
  size = { width: 300, height: 400 },
}: ShipVisualization3DProps) {
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const shipRef = useRef<THREE.Group | null>(null);
  const engineGlowRef = useRef<THREE.PointLight | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number | null>(null);

  // Subscribe to flight state
  const attitude = useFlightStore((s) => s.attitude);
  const throttle = useFlightStore((s) => s.throttle);
  const profile = useFlightStore((s) => s.profile);

  // Create ship geometry based on type
  const createShipGeometry = useCallback((type: string): THREE.BufferGeometry => {
    switch (type) {
      case 'scout':
        // Scout: Fast and sleek - elongated dodecahedron
        return new THREE.DodecahedronGeometry(1, 0);
      case 'fighter':
        // Fighter: Angular and aggressive - octahedron
        return new THREE.OctahedronGeometry(1, 0);
      case 'trader':
        // Trader: Bulky cargo vessel - box
        return new THREE.BoxGeometry(1.5, 0.8, 2);
      case 'explorer':
        // Explorer: Pointed long-range vessel - cone
        return new THREE.ConeGeometry(0.8, 2, 8);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, []);

  // Create starfield
  const createStarfield = useCallback((): THREE.Points => {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions: number[] = [];
    const starColors: number[] = [];

    for (let i = 0; i < 2000; i++) {
      // Distribute stars in a sphere around the camera
      const radius = 50 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Vary star colors slightly (white to blue-white)
      const brightness = 0.5 + Math.random() * 0.5;
      starColors.push(brightness, brightness, brightness + Math.random() * 0.2);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starPositions, 3)
    );
    starsGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(starColors, 3)
    );

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    return new THREE.Points(starsGeometry, starsMaterial);
  }, []);

  // Create ship model
  const createShip = useCallback((type: string): THREE.Group => {
    const group = new THREE.Group();
    const colors = SHIP_COLORS[type as keyof typeof SHIP_COLORS] || SHIP_COLORS.scout;

    // Main ship body
    const geometry = createShipGeometry(type);
    const material = new THREE.MeshStandardMaterial({
      color: colors.primary,
      metalness: 0.8,
      roughness: 0.2,
      emissive: colors.emissive,
      emissiveIntensity: 0.3,
    });

    const shipMesh = new THREE.Mesh(geometry, material);

    // Rotate to face forward (toward camera initially)
    if (type === 'explorer') {
      shipMesh.rotation.x = Math.PI / 2; // Point cone forward
    }

    group.add(shipMesh);

    // Add engine housing (back of ship)
    const engineGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.4, 8);
    const engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.3,
    });

    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.position.set(-0.5, 0, 0.8);
    leftEngine.rotation.x = Math.PI / 2;
    group.add(leftEngine);

    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.position.set(0.5, 0, 0.8);
    rightEngine.rotation.x = Math.PI / 2;
    group.add(rightEngine);

    // Add engine glow (will be updated based on throttle)
    const engineGlow = new THREE.PointLight(ENGINE_COLOR, 0, 5);
    engineGlow.position.set(0, 0, 1.2);
    group.add(engineGlow);
    engineGlowRef.current = engineGlow;

    return group;
  }, [createShipGeometry]);

  // Initialize Three.js scene
  const onContextCreate = useCallback(async (gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;

    // Create renderer with options
    const renderer = new Renderer({
      gl,
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      clearColor: 0x000510, // Deep space blue-black
    });
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      50,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x667eea, 0.4);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    // Add rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.3);
    rimLight.position.set(0, 0, -10);
    scene.add(rimLight);

    // Add starfield
    const stars = createStarfield();
    scene.add(stars);
    starsRef.current = stars;

    // Create and add ship
    const ship = createShip(shipType);
    scene.add(ship);
    shipRef.current = ship;

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      if (!shipRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        return;
      }

      // Update ship rotation based on attitude (from store)
      const currentAttitude = useFlightStore.getState().attitude;
      const currentThrottle = useFlightStore.getState().throttle;

      // Apply attitude to ship rotation
      // Roll: rotate around Z axis (banking)
      // Pitch: rotate around X axis (nose up/down)
      // Yaw: rotate around Y axis (turning)
      shipRef.current.rotation.z = -currentAttitude.roll.smoothed * Math.PI / 4; // ±45 degrees
      shipRef.current.rotation.x = currentAttitude.pitch.smoothed * Math.PI / 6;  // ±30 degrees
      shipRef.current.rotation.y = currentAttitude.yaw.smoothed * Math.PI / 6;    // ±30 degrees

      // Update engine glow based on throttle
      if (engineGlowRef.current) {
        engineGlowRef.current.intensity = currentThrottle.current * 3;
        // Shift color from orange to white at high throttle
        const r = 1;
        const g = 0.4 + currentThrottle.current * 0.4;
        const b = currentThrottle.current * 0.5;
        engineGlowRef.current.color.setRGB(r, g, b);
      }

      // Subtle starfield parallax based on attitude
      if (starsRef.current) {
        starsRef.current.rotation.y = currentAttitude.yaw.smoothed * 0.1;
        starsRef.current.rotation.x = currentAttitude.pitch.smoothed * 0.1;
      }

      // Render
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      gl.endFrameEXP();
    };

    animate();
  }, [shipType, createShip, createStarfield]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      // Dispose of Three.js resources
      if (sceneRef.current) {
        sceneRef.current.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            }
          }
        });
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update ship type if it changes
  useEffect(() => {
    if (sceneRef.current && shipRef.current) {
      sceneRef.current.remove(shipRef.current);
      const newShip = createShip(shipType);
      sceneRef.current.add(newShip);
      shipRef.current = newShip;
    }
  }, [shipType, createShip]);

  return (
    <View style={[styles.container, { width: size.width, height: size.height }]}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  glView: {
    flex: 1,
  },
});
