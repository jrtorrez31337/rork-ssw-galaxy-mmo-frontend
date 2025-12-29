/**
 * Deterministic Pseudo-Random Number Generator
 *
 * Uses Mulberry32 algorithm for cross-platform deterministic generation.
 * This MUST produce identical results on iOS, Android, and Web.
 *
 * CRITICAL: This implementation must match the Go server exactly.
 * Any divergence will cause validation failures.
 */

/**
 * SplitMix32 - Seed quality improver
 * Ensures poor seeds still produce good random sequences
 */
function splitmix32(seed: number): number {
  seed = (seed + 0x9e3779b9) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 16), 0x85ebca6b) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 13), 0xc2b2ae35) >>> 0;
  return (seed ^ (seed >>> 16)) >>> 0;
}

/**
 * Mulberry32 PRNG
 *
 * Fast, simple, and produces high-quality random numbers.
 * State is a single 32-bit unsigned integer.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is 32-bit unsigned
    const normalizedSeed = seed >>> 0;
    // Improve seed quality with SplitMix32
    this.state = splitmix32(normalizedSeed);
  }

  /**
   * Generate next random value in [0, 1)
   * Core Mulberry32 algorithm
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer in [min, max)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Generate random float in [min, max)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Generate boolean with given probability of true
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Shuffle array in place using Fisher-Yates
   * Returns the same array reference for chaining
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate Gaussian (normal) distributed value
   * Uses Box-Muller transform
   */
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Get current state for debugging/validation
   */
  getState(): number {
    return this.state;
  }

  /**
   * Create a child RNG with a derived seed
   * Useful for sub-generation that should be independent but reproducible
   */
  fork(modifier: number = 0): SeededRNG {
    const childSeed = (this.state ^ (modifier * 2654435761)) >>> 0;
    return new SeededRNG(childSeed);
  }
}

/**
 * Create a seeded RNG from coordinate hash
 * This is a convenience function for sector generation
 */
export function createRNGFromCoords(
  baseSeed: number,
  x: number,
  y: number,
  z: number
): SeededRNG {
  const PRIME_X = 73856093;
  const PRIME_Y = 19349663;
  const PRIME_Z = 83492791;

  const xHash = Math.imul(x, PRIME_X) >>> 0;
  const yHash = Math.imul(y, PRIME_Y) >>> 0;
  const zHash = Math.imul(z, PRIME_Z) >>> 0;

  const seed = ((baseSeed ^ xHash ^ yHash ^ zHash) >>> 0);
  return new SeededRNG(seed);
}
