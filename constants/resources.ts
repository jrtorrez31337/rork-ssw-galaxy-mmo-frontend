import { ResourceType, ResourceRarity } from '@/api/inventory';

export interface ResourceMetadata {
  name: string;
  description: string;
  color: string;
  icon: string;
  rarity: ResourceRarity;
  tier: 1 | 2 | 3;
}

export const RESOURCE_METADATA: Record<ResourceType, ResourceMetadata> = {
  // Tier 1 - Common Resources
  iron_ore: {
    name: 'Iron Ore',
    description: 'Basic hull repairs',
    color: '#B87333',
    icon: '🪨',
    rarity: 'Common',
    tier: 1,
  },
  ice_water: {
    name: 'Ice Water',
    description: 'Life support, fuel processing',
    color: '#87CEEB',
    icon: '💧',
    rarity: 'Common',
    tier: 1,
  },
  silicates: {
    name: 'Silicates',
    description: 'Electronics, sensors',
    color: '#D3D3D3',
    icon: '🔷',
    rarity: 'Common',
    tier: 1,
  },
  hydrogen: {
    name: 'Hydrogen',
    description: 'Fuel (1 unit = 10 LY jump range)',
    color: '#FFA500',
    icon: '⚡',
    rarity: 'Common',
    tier: 1,
  },
  carbon: {
    name: 'Carbon',
    description: 'Shields, advanced materials',
    color: '#2F4F4F',
    icon: '◆',
    rarity: 'Common',
    tier: 1,
  },

  // Tier 2 - Uncommon Resources
  titanium_ore: {
    name: 'Titanium Ore',
    description: 'Advanced hull plating',
    color: '#C0C0C0',
    icon: '🔩',
    rarity: 'Uncommon',
    tier: 2,
  },
  platinum: {
    name: 'Platinum',
    description: 'High-efficiency power systems',
    color: '#E5E4E2',
    icon: '💎',
    rarity: 'Uncommon',
    tier: 2,
  },
  rare_earth: {
    name: 'Rare Earth Elements',
    description: 'Sensor arrays, jump drives',
    color: '#9370DB',
    icon: '🌐',
    rarity: 'Uncommon',
    tier: 2,
  },
  xenon_gas: {
    name: 'Xenon Gas',
    description: 'Shield boosters',
    color: '#00CED1',
    icon: '💨',
    rarity: 'Uncommon',
    tier: 2,
  },

  // Tier 3 - Rare/Legendary Resources
  antimatter: {
    name: 'Antimatter',
    description: 'Weapons, experimental tech',
    color: '#FF1493',
    icon: '⚛️',
    rarity: 'Rare',
    tier: 3,
  },
  exotic_crystals: {
    name: 'Exotic Crystals',
    description: 'Legendary equipment',
    color: '#9400D3',
    icon: '💠',
    rarity: 'Rare',
    tier: 3,
  },
  ancient_artifacts: {
    name: 'Ancient Artifacts',
    description: 'Faction reputation, research',
    color: '#FFD700',
    icon: '🏺',
    rarity: 'Legendary',
    tier: 3,
  },
};

export const RARITY_COLORS: Record<ResourceRarity, string> = {
  Common: '#9CA3AF',
  Uncommon: '#3B82F6',
  Rare: '#A855F7',
  Legendary: '#F59E0B',
};
