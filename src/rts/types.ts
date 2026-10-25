/**
 * Sands of Ra: Egyptian RTS
 * Type definitions for resources, ages, units, buildings, god powers, and game state.
 */

export type Faction = 'PLAYER' | 'ENEMY';

export type Age = 'ARCHAIC_AGE' | 'OLD_KINGDOM' | 'NEW_KINGDOM' | 'MYTHIC_AGE';

export interface AgeConfig {
  name: string;
  foodCost: number;
  goldCost: number;
  unlockedUnits: UnitType[];
  unlockedBuildings: BuildingType[];
  godPower: GodPowerType;
}

export interface Resources {
  food: number;
  wood: number;
  gold: number;
  favor: number;
  population: number;
  maxPopulation: number;
}

export type UnitType =
  | 'VILLAGER'
  | 'KHOPESH_WARRIOR'
  | 'SPEAR_GUARDIAN'
  | 'CHARIOT_ARCHER'
  | 'PRIEST_OF_RA'
  | 'ANUBITE_WARRIOR'
  | 'WADJET_SERPENT'
  | 'PHOENIX_OF_HELIOPOLIS';

export interface UnitDefinition {
  type: UnitType;
  name: string;
  role: 'Worker' | 'Infantry' | 'Anti-Cavalry' | 'Ranged' | 'Support' | 'Myth';
  cost: { food: number; wood: number; gold: number; favor: number };
  trainTime: number; // seconds
  maxHp: number;
  speed: number;
  damage: number;
  range: number; // melee is ~20
  attackCooldown: number;
  popCost: number;
  description: string;
}

export type BuildingType =
  | 'TOWN_CENTER'
  | 'HOUSE'
  | 'FARM'
  | 'LUMBER_CAMP'
  | 'BARRACKS'
  | 'TEMPLE'
  | 'GUARD_TOWER'
  | 'PYRAMID_WONDER';

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  cost: { food: number; wood: number; gold: number; favor: number };
  buildTime: number;
  maxHp: number;
  size: number; // radius in world units
  providesPop?: number;
  trainableUnits: UnitType[];
  description: string;
}

export type GodPowerType = 'SOLAR_WRATH' | 'NILE_BLOOM' | 'LOCUST_SWARM' | 'ECLIPSE';

export interface GodPowerDefinition {
  type: GodPowerType;
  name: string;
  deity: 'Ra' | 'Isis' | 'Set' | 'Horus';
  favorCost: number;
  cooldown: number;
  description: string;
}

export type UnitState =
  | 'IDLE'
  | 'MOVE'
  | 'ATTACK'
  | 'GATHER'
  | 'DELIVER'
  | 'BUILD'
  | 'PRAY'
  | 'HEAL';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Unit {
  id: string;
  type: UnitType;
  faction: Faction;
  pos: Vec2;
  targetPos?: Vec2;
  targetId?: string; // unit, building, or resource node
  state: UnitState;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  range: number;
  attackCooldown: number;
  attackTimer: number;
  gatheringType?: 'food' | 'wood' | 'gold';
  carriedAmount: number;
  carryCapacity: number;
  angle: number;
  walkFrame: number;
}

export interface Building {
  id: string;
  type: BuildingType;
  faction: Faction;
  pos: Vec2;
  hp: number;
  maxHp: number;
  isConstructed: boolean;
  buildProgress: number; // 0 to 1
  size: number;
  productionQueue: { unitType: UnitType; progress: number }[];
  attackTimer: number;
}

export type ResourceNodeType = 'PALM_TREE' | 'GOLD_QUARRY' | 'BERRY_BUSH';

export interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  resourceKind: 'food' | 'wood' | 'gold';
  pos: Vec2;
  remaining: number;
  maxAmount: number;
  size: number;
}

export interface Projectile {
  id: string;
  pos: Vec2;
  targetPos: Vec2;
  speed: number;
  damage: number;
  isFire?: boolean;
  progress: number; // 0 to 1
  arcHeight: number;
}

export interface ParticleEffect {
  pos: Vec2;
  vel: Vec2;
  color: string;
  life: number;
  maxLife: number;
  radius: number;
}

export interface GodPowerEffect {
  type: GodPowerType;
  pos: Vec2;
  life: number;
  maxLife: number;
  radius: number;
}

export interface GameStats {
  gameTime: number;
  unitsKilled: number;
  unitsLost: number;
  resourcesHarvested: { food: number; wood: number; gold: number; favor: number };
  buildingsConstructed: number;
  wonderCountdown?: number; // 180s down to 0
}

export const UNIT_DEFINITIONS: Record<UnitType, UnitDefinition> = {
  VILLAGER: {
    type: 'VILLAGER',
    name: 'Laborer',
    role: 'Worker',
    cost: { food: 50, wood: 0, gold: 0, favor: 0 },
    trainTime: 8,
    maxHp: 75,
    speed: 65,
    damage: 6,
    range: 16,
    attackCooldown: 1.2,
    popCost: 1,
    description: 'Constructs buildings and gathers food, wood, and gold along the Nile.',
  },
  KHOPESH_WARRIOR: {
    type: 'KHOPESH_WARRIOR',
    name: 'Khopesh Warrior',
    role: 'Infantry',
    cost: { food: 60, wood: 0, gold: 30, favor: 0 },
    trainTime: 12,
    maxHp: 150,
    speed: 75,
    damage: 18,
    range: 18,
    attackCooldown: 1.0,
    popCost: 1,
    description: 'Egyptian curved-sword infantry. Excels against archers and structures.',
  },
  SPEAR_GUARDIAN: {
    type: 'SPEAR_GUARDIAN',
    name: 'Spear Guardian',
    role: 'Anti-Cavalry',
    cost: { food: 50, wood: 40, gold: 0, favor: 0 },
    trainTime: 10,
    maxHp: 130,
    speed: 70,
    damage: 14,
    range: 24,
    attackCooldown: 1.1,
    popCost: 1,
    description: 'Long-reach spear infantry with bonus damage against mounted chariots and monsters.',
  },
  CHARIOT_ARCHER: {
    type: 'CHARIOT_ARCHER',
    name: 'Pharaoh Chariot',
    role: 'Ranged',
    cost: { food: 80, wood: 70, gold: 40, favor: 0 },
    trainTime: 16,
    maxHp: 180,
    speed: 105,
    damage: 16,
    range: 160,
    attackCooldown: 1.4,
    popCost: 2,
    description: 'Fast mobile archery chariot. Can kite enemy melee units across desert dunes.',
  },
  PRIEST_OF_RA: {
    type: 'PRIEST_OF_RA',
    name: 'Priest of Ra',
    role: 'Support',
    cost: { food: 60, wood: 0, gold: 50, favor: 0 },
    trainTime: 14,
    maxHp: 90,
    speed: 55,
    damage: 8,
    range: 120,
    attackCooldown: 1.5,
    popCost: 1,
    description: 'Prays at Temples and Monuments to generate Divine Favor. Heals wounded allies.',
  },
  ANUBITE_WARRIOR: {
    type: 'ANUBITE_WARRIOR',
    name: 'Anubite Jackal',
    role: 'Myth',
    cost: { food: 120, wood: 0, gold: 80, favor: 25 },
    trainTime: 20,
    maxHp: 320,
    speed: 95,
    damage: 32,
    range: 22,
    attackCooldown: 0.9,
    popCost: 3,
    description: 'Fierce jackal mythic warrior of the underworld. Devastating attack and terrifying speed.',
  },
  WADJET_SERPENT: {
    type: 'WADJET_SERPENT',
    name: 'Wadjet Cobra',
    role: 'Myth',
    cost: { food: 100, wood: 60, gold: 0, favor: 30 },
    trainTime: 22,
    maxHp: 280,
    speed: 70,
    damage: 26,
    range: 140,
    attackCooldown: 1.6,
    popCost: 3,
    description: 'Divine winged cobra. Spits venomous corrosive acid that weakens armor.',
  },
  PHOENIX_OF_HELIOPOLIS: {
    type: 'PHOENIX_OF_HELIOPOLIS',
    name: 'Solar Phoenix (Bennu)',
    role: 'Myth',
    cost: { food: 200, wood: 0, gold: 150, favor: 50 },
    trainTime: 30,
    maxHp: 500,
    speed: 85,
    damage: 48,
    range: 150,
    attackCooldown: 2.0,
    popCost: 4,
    description: 'Sacred celestial firebird of Heliopolis. Rains solar firebombs upon enemy bases.',
  },
};

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  TOWN_CENTER: {
    type: 'TOWN_CENTER',
    name: 'Town Center',
    cost: { food: 0, wood: 350, gold: 200, favor: 0 },
    buildTime: 45,
    maxHp: 2400,
    size: 42,
    providesPop: 15,
    trainableUnits: ['VILLAGER'],
    description: 'Heart of your settlement. Delivers all resources, trains laborers, and advances Ages.',
  },
  HOUSE: {
    type: 'HOUSE',
    name: 'Mudbrick Villa',
    cost: { food: 0, wood: 50, gold: 0, favor: 0 },
    buildTime: 12,
    maxHp: 450,
    size: 20,
    providesPop: 5,
    trainableUnits: [],
    description: 'Increases settlement population capacity by +5.',
  },
  FARM: {
    type: 'FARM',
    name: 'Nile Irrigation Farm',
    cost: { food: 0, wood: 60, gold: 0, favor: 0 },
    buildTime: 14,
    maxHp: 350,
    size: 24,
    trainableUnits: [],
    description: 'Provides a continuous food plot for laborers to harvest.',
  },
  LUMBER_CAMP: {
    type: 'LUMBER_CAMP',
    name: 'Palm Lumber Depot',
    cost: { food: 0, wood: 100, gold: 0, favor: 0 },
    buildTime: 18,
    maxHp: 650,
    size: 24,
    trainableUnits: [],
    description: 'Drop-off station for wood harvested from palm groves.',
  },
  BARRACKS: {
    type: 'BARRACKS',
    name: 'War Academy',
    cost: { food: 0, wood: 150, gold: 50, favor: 0 },
    buildTime: 25,
    maxHp: 1200,
    size: 32,
    trainableUnits: ['KHOPESH_WARRIOR', 'SPEAR_GUARDIAN', 'CHARIOT_ARCHER'],
    description: 'Military garrison to train Egyptian infantry and war chariots.',
  },
  TEMPLE: {
    type: 'TEMPLE',
    name: 'Temple of the Gods',
    cost: { food: 0, wood: 100, gold: 150, favor: 0 },
    buildTime: 30,
    maxHp: 1400,
    size: 36,
    trainableUnits: ['PRIEST_OF_RA', 'ANUBITE_WARRIOR', 'WADJET_SERPENT', 'PHOENIX_OF_HELIOPOLIS'],
    description: 'Sacred monument where priests generate Favor and summon divine myth units.',
  },
  GUARD_TOWER: {
    type: 'GUARD_TOWER',
    name: 'Sandstone Watchtower',
    cost: { food: 0, wood: 70, gold: 100, favor: 0 },
    buildTime: 22,
    maxHp: 900,
    size: 22,
    trainableUnits: [],
    description: 'Defensive bastion that fires flaming arrows at incoming raiders.',
  },
  PYRAMID_WONDER: {
    type: 'PYRAMID_WONDER',
    name: 'Great Gilded Pyramid (Wonder)',
    cost: { food: 800, wood: 800, gold: 800, favor: 100 },
    buildTime: 90,
    maxHp: 5000,
    size: 60,
    trainableUnits: [],
    description: 'Monument to eternal dominion. Defend it for 3 minutes to achieve absolute victory!',
  },
};

export const GOD_POWERS: Record<GodPowerType, GodPowerDefinition> = {
  SOLAR_WRATH: {
    type: 'SOLAR_WRATH',
    name: 'Wrath of Ra',
    deity: 'Ra',
    favorCost: 40,
    cooldown: 60,
    description: 'Calls down a blinding pillar of celestial solar fire that incinerates enemy forces in the target zone.',
  },
  NILE_BLOOM: {
    type: 'NILE_BLOOM',
    name: 'Inundation of Isis',
    deity: 'Isis',
    favorCost: 35,
    cooldown: 50,
    description: 'Brings bountiful floodwaters: immediately grants +300 Food, +150 Wood, and completely heals all friendly units.',
  },
  LOCUST_SWARM: {
    type: 'LOCUST_SWARM',
    name: 'Plague of Locusts',
    deity: 'Set',
    favorCost: 45,
    cooldown: 75,
    description: 'Summons a ravaging swarm of locusts that blinds and damages enemy watchtowers and infantry.',
  },
  ECLIPSE: {
    type: 'ECLIPSE',
    name: 'Eclipse of Horus',
    deity: 'Horus',
    favorCost: 50,
    cooldown: 80,
    description: 'Shrouds the battlefield in solar eclipse, empowering all friendly troops with +50% attack power and speed for 20 seconds.',
  },
};

export const AGE_CONFIGS: Record<Age, AgeConfig> = {
  ARCHAIC_AGE: {
    name: 'Archaic Era',
    foodCost: 0,
    goldCost: 0,
    unlockedUnits: ['VILLAGER'],
    unlockedBuildings: ['TOWN_CENTER', 'HOUSE', 'FARM', 'LUMBER_CAMP'],
    godPower: 'NILE_BLOOM',
  },
  OLD_KINGDOM: {
    name: 'Old Kingdom',
    foodCost: 400,
    goldCost: 200,
    unlockedUnits: ['VILLAGER', 'KHOPESH_WARRIOR', 'SPEAR_GUARDIAN', 'PRIEST_OF_RA'],
    unlockedBuildings: ['TOWN_CENTER', 'HOUSE', 'FARM', 'LUMBER_CAMP', 'BARRACKS', 'TEMPLE'],
    godPower: 'SOLAR_WRATH',
  },
  NEW_KINGDOM: {
    name: 'New Kingdom',
    foodCost: 700,
    goldCost: 400,
    unlockedUnits: ['VILLAGER', 'KHOPESH_WARRIOR', 'SPEAR_GUARDIAN', 'CHARIOT_ARCHER', 'PRIEST_OF_RA', 'ANUBITE_WARRIOR', 'WADJET_SERPENT'],
    unlockedBuildings: ['TOWN_CENTER', 'HOUSE', 'FARM', 'LUMBER_CAMP', 'BARRACKS', 'TEMPLE', 'GUARD_TOWER'],
    godPower: 'LOCUST_SWARM',
  },
  MYTHIC_AGE: {
    name: 'Mythic Age of Ra',
    foodCost: 1000,
    goldCost: 700,
    unlockedUnits: ['VILLAGER', 'KHOPESH_WARRIOR', 'SPEAR_GUARDIAN', 'CHARIOT_ARCHER', 'PRIEST_OF_RA', 'ANUBITE_WARRIOR', 'WADJET_SERPENT', 'PHOENIX_OF_HELIOPOLIS'],
    unlockedBuildings: ['TOWN_CENTER', 'HOUSE', 'FARM', 'LUMBER_CAMP', 'BARRACKS', 'TEMPLE', 'GUARD_TOWER', 'PYRAMID_WONDER'],
    godPower: 'ECLIPSE',
  },
};
