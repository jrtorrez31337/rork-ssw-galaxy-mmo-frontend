import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * Position Store
 *
 * Manages ship position within a sector (sublight movement).
 * Bridges flight controls to actual positional changes.
 *
 * Architecture:
 * - serverPosition: Authoritative position from last server sync
 * - localPosition: Client-predicted position for smooth visuals
 * - Position updates are sent to server every 200ms
 * - Server reconciliation when response differs from prediction
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface PositionState {
  // Server-authoritative state (last confirmed by server)
  serverPosition: Vector3;
  serverVelocity: Vector3;
  serverRotation: Quaternion;
  serverTimestamp: number;

  // Client-predicted state (local interpolation)
  localPosition: Vector3;
  localVelocity: Vector3;
  localRotation: Quaternion;

  // Heading in degrees (derived from rotation, for UI)
  heading: number;
  pitch: number;
  roll: number;

  // Movement state
  isMoving: boolean;
  speed: number; // Current speed in units/sec

  // Sync state
  pendingUpdate: boolean;
  lastSyncTime: number;
  syncInterval: number; // ms between position syncs

  // Sector context
  currentSectorId: string | null;

  // Actions
  setServerPosition: (pos: Vector3, vel: Vector3, rot: Quaternion, timestamp: number) => void;
  updateLocalPosition: (deltaTime: number) => void;
  applyFlightInput: (
    throttle: number,
    pitchInput: number,
    yawInput: number,
    rollInput: number,
    deltaTime: number,
    maxSpeed: number,
    pitchSpeed: number,
    yawSpeed: number,
    rollSpeed: number
  ) => void;
  reconcileWithServer: (serverPos: Vector3, serverVel: Vector3, serverRot: Quaternion) => void;
  setCurrentSector: (sectorId: string | null) => void;
  markPendingSync: () => void;
  clearPendingSync: () => void;
  reset: () => void;
}

// Initial values
const ZERO_VEC: Vector3 = { x: 0, y: 0, z: 0 };
const IDENTITY_QUAT: Quaternion = { x: 0, y: 0, z: 0, w: 1 };

// Helper: Quaternion multiplication
function multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

// Helper: Create quaternion from euler angles (radians)
function quaternionFromEuler(pitch: number, yaw: number, roll: number): Quaternion {
  const cy = Math.cos(yaw * 0.5);
  const sy = Math.sin(yaw * 0.5);
  const cp = Math.cos(pitch * 0.5);
  const sp = Math.sin(pitch * 0.5);
  const cr = Math.cos(roll * 0.5);
  const sr = Math.sin(roll * 0.5);

  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  };
}

// Helper: Extract euler angles from quaternion (radians)
function eulerFromQuaternion(q: Quaternion): { pitch: number; yaw: number; roll: number } {
  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
  const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // Pitch (y-axis rotation)
  const sinp = 2 * (q.w * q.y - q.z * q.x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * Math.PI / 2;
  } else {
    pitch = Math.asin(sinp);
  }

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { pitch, yaw, roll };
}

// Helper: Rotate a vector by a quaternion
function rotateVector(v: Vector3, q: Quaternion): Vector3 {
  // Quaternion * Vector * Conjugate(Quaternion)
  const qv: Quaternion = { x: v.x, y: v.y, z: v.z, w: 0 };
  const qConj: Quaternion = { x: -q.x, y: -q.y, z: -q.z, w: q.w };
  const result = multiplyQuaternions(multiplyQuaternions(q, qv), qConj);
  return { x: result.x, y: result.y, z: result.z };
}

// Helper: Normalize quaternion
function normalizeQuaternion(q: Quaternion): Quaternion {
  const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
  if (len === 0) return IDENTITY_QUAT;
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

// Helper: Radians to degrees
function toDegrees(rad: number): number {
  return rad * (180 / Math.PI);
}

export const usePositionStore = create<PositionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    serverPosition: { ...ZERO_VEC },
    serverVelocity: { ...ZERO_VEC },
    serverRotation: { ...IDENTITY_QUAT },
    serverTimestamp: 0,

    localPosition: { ...ZERO_VEC },
    localVelocity: { ...ZERO_VEC },
    localRotation: { ...IDENTITY_QUAT },

    heading: 0,
    pitch: 0,
    roll: 0,

    isMoving: false,
    speed: 0,

    pendingUpdate: false,
    lastSyncTime: 0,
    syncInterval: 200, // 5 updates per second

    currentSectorId: null,

    // Set authoritative position from server
    setServerPosition: (pos, vel, rot, timestamp) => {
      const euler = eulerFromQuaternion(rot);
      set({
        serverPosition: pos,
        serverVelocity: vel,
        serverRotation: rot,
        serverTimestamp: timestamp,
        // Also update local if no pending changes
        localPosition: pos,
        localVelocity: vel,
        localRotation: rot,
        heading: toDegrees(euler.yaw),
        pitch: toDegrees(euler.pitch),
        roll: toDegrees(euler.roll),
      });
    },

    // Update local position based on current velocity (called every frame)
    updateLocalPosition: (deltaTime) => {
      const state = get();
      if (!state.isMoving) return;

      const newPosition = {
        x: state.localPosition.x + state.localVelocity.x * deltaTime,
        y: state.localPosition.y + state.localVelocity.y * deltaTime,
        z: state.localPosition.z + state.localVelocity.z * deltaTime,
      };

      set({ localPosition: newPosition });
    },

    // Apply flight input to update rotation and velocity
    applyFlightInput: (
      throttle,
      pitchInput,
      yawInput,
      rollInput,
      deltaTime,
      maxSpeed,
      pitchSpeed,
      yawSpeed,
      rollSpeed
    ) => {
      const state = get();

      // Convert input speeds to radians per second
      const pitchRad = pitchInput * pitchSpeed * (Math.PI / 180) * deltaTime;
      const yawRad = yawInput * yawSpeed * (Math.PI / 180) * deltaTime;
      const rollRad = rollInput * rollSpeed * (Math.PI / 180) * deltaTime;

      // Create rotation delta
      const rotationDelta = quaternionFromEuler(pitchRad, yawRad, rollRad);

      // Apply rotation to current orientation
      let newRotation = multiplyQuaternions(state.localRotation, rotationDelta);
      newRotation = normalizeQuaternion(newRotation);

      // Calculate forward vector from rotation
      const forward: Vector3 = { x: 0, y: 0, z: -1 }; // Forward is -Z
      const direction = rotateVector(forward, newRotation);

      // Calculate velocity based on throttle and direction
      const currentSpeed = throttle * maxSpeed;
      const newVelocity: Vector3 = {
        x: direction.x * currentSpeed,
        y: direction.y * currentSpeed,
        z: direction.z * currentSpeed,
      };

      // Update position based on new velocity
      const newPosition = {
        x: state.localPosition.x + newVelocity.x * deltaTime,
        y: state.localPosition.y + newVelocity.y * deltaTime,
        z: state.localPosition.z + newVelocity.z * deltaTime,
      };

      // Extract euler angles for UI display
      const euler = eulerFromQuaternion(newRotation);

      set({
        localPosition: newPosition,
        localVelocity: newVelocity,
        localRotation: newRotation,
        heading: toDegrees(euler.yaw),
        pitch: toDegrees(euler.pitch),
        roll: toDegrees(euler.roll),
        speed: currentSpeed,
        isMoving: throttle > 0.01,
        pendingUpdate: true,
      });
    },

    // Reconcile local prediction with server state
    reconcileWithServer: (serverPos, serverVel, serverRot) => {
      const state = get();

      // Calculate position error
      const errorX = serverPos.x - state.localPosition.x;
      const errorY = serverPos.y - state.localPosition.y;
      const errorZ = serverPos.z - state.localPosition.z;
      const errorMagnitude = Math.sqrt(errorX * errorX + errorY * errorY + errorZ * errorZ);

      // If error is small, smoothly interpolate (reduces jitter)
      // If error is large, snap to server position
      const SNAP_THRESHOLD = 50; // Units
      const INTERP_FACTOR = 0.3;

      if (errorMagnitude > SNAP_THRESHOLD) {
        // Snap to server
        const euler = eulerFromQuaternion(serverRot);
        set({
          localPosition: serverPos,
          localVelocity: serverVel,
          localRotation: serverRot,
          serverPosition: serverPos,
          serverVelocity: serverVel,
          serverRotation: serverRot,
          heading: toDegrees(euler.yaw),
          pitch: toDegrees(euler.pitch),
          roll: toDegrees(euler.roll),
        });
      } else if (errorMagnitude > 0.1) {
        // Smooth interpolation
        const newPos = {
          x: state.localPosition.x + errorX * INTERP_FACTOR,
          y: state.localPosition.y + errorY * INTERP_FACTOR,
          z: state.localPosition.z + errorZ * INTERP_FACTOR,
        };
        set({
          localPosition: newPos,
          serverPosition: serverPos,
          serverVelocity: serverVel,
          serverRotation: serverRot,
        });
      } else {
        // Update server reference only
        set({
          serverPosition: serverPos,
          serverVelocity: serverVel,
          serverRotation: serverRot,
        });
      }
    },

    setCurrentSector: (sectorId) => set({ currentSectorId: sectorId }),

    markPendingSync: () => set({ pendingUpdate: true }),

    clearPendingSync: () => set({
      pendingUpdate: false,
      lastSyncTime: Date.now(),
    }),

    reset: () => set({
      serverPosition: { ...ZERO_VEC },
      serverVelocity: { ...ZERO_VEC },
      serverRotation: { ...IDENTITY_QUAT },
      serverTimestamp: 0,
      localPosition: { ...ZERO_VEC },
      localVelocity: { ...ZERO_VEC },
      localRotation: { ...IDENTITY_QUAT },
      heading: 0,
      pitch: 0,
      roll: 0,
      isMoving: false,
      speed: 0,
      pendingUpdate: false,
      lastSyncTime: 0,
      currentSectorId: null,
    }),
  }))
);

// Selectors
export const selectLocalPosition = (state: PositionState) => state.localPosition;
export const selectLocalVelocity = (state: PositionState) => state.localVelocity;
export const selectHeading = (state: PositionState) => state.heading;
export const selectIsMoving = (state: PositionState) => state.isMoving;
export const selectSpeed = (state: PositionState) => state.speed;
export const selectPendingUpdate = (state: PositionState) => state.pendingUpdate;
