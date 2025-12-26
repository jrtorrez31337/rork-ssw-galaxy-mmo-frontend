import Decimal from 'decimal.js';
import {
  RepairCostBreakdown,
  RefuelCostBreakdown,
  StationServicePricing,
} from '@/types/station-services';
import { Ship } from '@/types/api';

/**
 * Calculate the cost of refueling a ship with reputation discount
 *
 * Formula:
 * total_cost = base_price + (price_per_unit × amount)
 * discount = (player_reputation / 1000) × max_discount_percent
 * final_cost = total_cost × (1 - discount)
 */
export function calculateRefuelCost(
  amount: number,
  pricing: StationServicePricing,
  playerReputation: number = 0
): RefuelCostBreakdown {
  const basePrice = new Decimal(pricing.base_price);
  const pricePerUnit = new Decimal(pricing.price_per_unit);
  const fuelCost = pricePerUnit.times(amount);
  const subtotal = basePrice.plus(fuelCost);

  let discountPercent = new Decimal(0);
  let discountAmount = new Decimal(0);

  if (pricing.reputation_discount_enabled && playerReputation > 0) {
    const maxDiscount = new Decimal(pricing.max_discount_percent);
    // discount = (reputation / 1000) × max_discount_percent
    discountPercent = new Decimal(playerReputation)
      .div(1000)
      .times(maxDiscount);
    // Ensure discount doesn't exceed max
    if (discountPercent.greaterThan(maxDiscount)) {
      discountPercent = maxDiscount;
    }
    // discount_amount = subtotal × (discount_percent / 100)
    discountAmount = subtotal.times(discountPercent.div(100));
  }

  const finalCost = subtotal.minus(discountAmount);

  return {
    amount,
    base_price: basePrice.toFixed(2),
    fuel_cost: fuelCost.toFixed(2),
    subtotal: subtotal.toFixed(2),
    discount_percent: discountPercent.toFixed(2),
    discount_amount: discountAmount.toFixed(2),
    final_cost: finalCost.toFixed(2),
  };
}

/**
 * Calculate the cost of repairing a ship with reputation discount
 *
 * Formula:
 * total_damage = hull_damage + shield_damage
 * total_cost = base_price + (price_per_unit × total_damage)
 * discount = (player_reputation / 1000) × max_discount_percent
 * final_cost = total_cost × (1 - discount)
 */
export function calculateRepairCost(
  ship: Ship,
  repairHull: boolean,
  repairShield: boolean,
  pricing: StationServicePricing,
  playerReputation: number = 0
): RepairCostBreakdown {
  let hullDamage = 0;
  let shieldDamage = 0;

  if (repairHull) {
    hullDamage = ship.hull_max - ship.hull_points;
  }

  if (repairShield) {
    shieldDamage = ship.shield_max - ship.shield_points;
  }

  const totalDamage = hullDamage + shieldDamage;
  const basePrice = new Decimal(pricing.base_price);
  const pricePerUnit = new Decimal(pricing.price_per_unit);
  const damageCost = pricePerUnit.times(totalDamage);
  const subtotal = basePrice.plus(damageCost);

  let discountPercent = new Decimal(0);
  let discountAmount = new Decimal(0);

  if (pricing.reputation_discount_enabled && playerReputation > 0) {
    const maxDiscount = new Decimal(pricing.max_discount_percent);
    discountPercent = new Decimal(playerReputation)
      .div(1000)
      .times(maxDiscount);
    if (discountPercent.greaterThan(maxDiscount)) {
      discountPercent = maxDiscount;
    }
    discountAmount = subtotal.times(discountPercent.div(100));
  }

  const finalCost = subtotal.minus(discountAmount);

  return {
    hull_damage: hullDamage,
    shield_damage: shieldDamage,
    total_damage: totalDamage,
    base_price: basePrice.toFixed(2),
    damage_cost: damageCost.toFixed(2),
    subtotal: subtotal.toFixed(2),
    discount_percent: discountPercent.toFixed(2),
    discount_amount: discountAmount.toFixed(2),
    final_cost: finalCost.toFixed(2),
  };
}

/**
 * Calculate maximum fuel that can be purchased with available credits
 */
export function calculateMaxFuelAffordable(
  availableCredits: string,
  pricing: StationServicePricing,
  currentFuel: number,
  maxFuel: number,
  playerReputation: number = 0
): number {
  const credits = new Decimal(availableCredits);
  const basePrice = new Decimal(pricing.base_price);
  const pricePerUnit = new Decimal(pricing.price_per_unit);

  // Calculate discount multiplier
  let discountMultiplier = new Decimal(1);
  if (pricing.reputation_discount_enabled && playerReputation > 0) {
    const maxDiscount = new Decimal(pricing.max_discount_percent);
    const discountPercent = new Decimal(playerReputation)
      .div(1000)
      .times(maxDiscount);
    discountMultiplier = new Decimal(1).minus(discountPercent.div(100));
  }

  // credits = (base_price + (price_per_unit × amount)) × discount_multiplier
  // Solve for amount:
  // amount = (credits / discount_multiplier - base_price) / price_per_unit

  const creditsAfterDiscount = credits.div(discountMultiplier);
  const creditsForFuel = creditsAfterDiscount.minus(basePrice);

  if (creditsForFuel.lessThanOrEqualTo(0)) {
    return 0; // Can't afford even base price
  }

  const maxAffordable = creditsForFuel.div(pricePerUnit).floor().toNumber();
  const maxNeeded = maxFuel - currentFuel;

  return Math.min(maxAffordable, maxNeeded);
}

/**
 * Check if player has sufficient credits for a transaction
 */
export function hasSufficientCredits(
  availableCredits: string,
  cost: string
): boolean {
  const credits = new Decimal(availableCredits);
  const requiredCost = new Decimal(cost);
  return credits.greaterThanOrEqualTo(requiredCost);
}
