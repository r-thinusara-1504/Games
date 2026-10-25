/**
 * Core RTS Simulation Engine
 * Handles pathfinding, combat physics, villager gather & drop-off state machine,
 * building construction queues, divine god powers, and opponent AI.
 */

import {
  Unit,
  Building,
  ResourceNode,
  Projectile,
  ParticleEffect,
  GodPowerEffect,
  Resources,
  Age,
  AGE_CONFIGS,
  UNIT_DEFINITIONS,
  BUILDING_DEFINITIONS,
  GOD_POWERS,
  UnitType,
  BuildingType,
  GodPowerType,
  GameStats,
  Vec2,
  Faction,
} from './types';
import { RTSMap, MAP_WIDTH, MAP_HEIGHT } from './map';
import { rtsAudio } from './audio';

export class RTSSimulation {
  public map: RTSMap;
  public units: Unit[] = [];
  public buildings: Building[] = [];
  public resourceNodes: ResourceNode[] = [];
  public projectiles: Projectile[] = [];
  public particles: ParticleEffect[] = [];
  public godPowerEffects: GodPowerEffect[] = [];

  // Player state
  public playerResources: Resources = {
    food: 200,
    wood: 250,
    gold: 150,
    favor: 15,
    population: 3,
    maxPopulation: 15,
  };
  public playerAge: Age = 'ARCHAIC_AGE';
  public ageAdvanceProgress: number | null = null; // null or 0 to 1

  // Enemy AI state
  public enemyResources: Resources = {
    food: 250,
    wood: 300,
    gold: 200,
    favor: 20,
    population: 3,
    maxPopulation: 15,
  };
  public enemyAge: Age = 'ARCHAIC_AGE';
  private enemyRaidTimer: number = 75; // First raid at 75s
  private enemyBuildTimer: number = 10;

  // Game stats
  public stats: GameStats = {
    gameTime: 0,
    unitsKilled: 0,
    unitsLost: 0,
    resourcesHarvested: { food: 0, wood: 0, gold: 0, favor: 0 },
    buildingsConstructed: 0,
  };

  // God Powers cooldown timers
  public godPowerCooldowns: Record<GodPowerType, number> = {
    SOLAR_WRATH: 0,
    NILE_BLOOM: 0,
    LOCUST_SWARM: 0,
    ECLIPSE: 0,
  };
  public eclipseTimer: number = 0; // Active eclipse buff timer

  // Wonder countdown timer
  public wonderTimer: number | null = null; // 180s when pyramid is complete

  // Match outcome
  public gameOver: 'VICTORY' | 'DEFEAT' | null = null;

  private nextId = 1;

  constructor() {
    this.map = new RTSMap();
    this.initStarterEntities();
  }

  public initStarterEntities() {
    this.units = [];
    this.buildings = [];
    this.projectiles = [];
    this.particles = [];
    this.godPowerEffects = [];

    // Reset player state
    this.playerResources = {
      food: 200,
      wood: 250,
      gold: 150,
      favor: 15,
      population: 3,
      maxPopulation: 15,
    };
    this.playerAge = 'ARCHAIC_AGE';
    this.ageAdvanceProgress = null;
    this.wonderTimer = null;
    this.gameOver = null;

    // Reset enemy state
    this.enemyResources = {
      food: 250,
      wood: 300,
      gold: 200,
      favor: 20,
      population: 3,
      maxPopulation: 15,
    };
    this.enemyAge = 'ARCHAIC_AGE';
    this.enemyRaidTimer = 75;

    // 1. Player Base (South-West near Nile banks)
    this.addBuilding('TOWN_CENTER', 'PLAYER', { x: 420, y: 1380 }, true);
    this.addUnit('VILLAGER', 'PLAYER', { x: 380, y: 1340 });
    this.addUnit('VILLAGER', 'PLAYER', { x: 450, y: 1320 });
    this.addUnit('VILLAGER', 'PLAYER', { x: 420, y: 1440 });

    // 2. Enemy Base (North-East desert plateau)
    this.addBuilding('TOWN_CENTER', 'ENEMY', { x: 1950, y: 400 }, true);
    this.addUnit('VILLAGER', 'ENEMY', { x: 1910, y: 370 });
    this.addUnit('VILLAGER', 'ENEMY', { x: 1980, y: 360 });
    this.addUnit('VILLAGER', 'ENEMY', { x: 1950, y: 460 });

    // Starter enemy defensive guard
    this.addUnit('SPEAR_GUARDIAN', 'ENEMY', { x: 1860, y: 430 });

    // Initial fog of war reveal
    this.map.updateFogOfWar(this.units, this.buildings);
  }

  public addUnit(type: UnitType, faction: Faction, pos: Vec2): Unit {
    const def = UNIT_DEFINITIONS[type];
    const unit: Unit = {
      id: `unit_${this.nextId++}`,
      type,
      faction,
      pos: { ...pos },
      state: 'IDLE',
      hp: def.maxHp,
      maxHp: def.maxHp,
      speed: def.speed,
      damage: def.damage,
      range: def.range,
      attackCooldown: def.attackCooldown,
      attackTimer: 0,
      carriedAmount: 0,
      carryCapacity: 15,
      angle: faction === 'PLAYER' ? -Math.PI / 4 : (3 * Math.PI) / 4,
      walkFrame: 0,
    };
    this.units.push(unit);
    this.recalcPopulation(faction);
    return unit;
  }

  public addBuilding(type: BuildingType, faction: Faction, pos: Vec2, instant: boolean = false): Building {
    const def = BUILDING_DEFINITIONS[type];
    const b: Building = {
      id: `bld_${this.nextId++}`,
      type,
      faction,
      pos: { ...pos },
      hp: instant ? def.maxHp : 10,
      maxHp: def.maxHp,
      isConstructed: instant,
      buildProgress: instant ? 1 : 0.01,
      size: def.size,
      productionQueue: [],
      attackTimer: 0,
    };
    this.buildings.push(b);
    this.recalcPopulation(faction);
    return b;
  }

  private recalcPopulation(faction: Faction) {
    const res = faction === 'PLAYER' ? this.playerResources : this.enemyResources;
    let pop = 0;
    for (const u of this.units) {
      if (u.faction === faction) {
        pop += UNIT_DEFINITIONS[u.type].popCost;
      }
    }
    let maxPop = 0;
    for (const b of this.buildings) {
      if (b.faction === faction && b.isConstructed) {
        maxPop += BUILDING_DEFINITIONS[b.type].providesPop || 0;
      }
    }
    res.population = pop;
    res.maxPopulation = Math.min(60, maxPop);
  }

  /**
   * Main 60fps simulation update step
   */
  public update(dt: number) {
    this.stats.gameTime += dt;

    // Cooldown timers
    for (const key of Object.keys(this.godPowerCooldowns)) {
      const gp = key as GodPowerType;
      if (this.godPowerCooldowns[gp] > 0) {
        this.godPowerCooldowns[gp] = Math.max(0, this.godPowerCooldowns[gp] - dt);
      }
    }

    if (this.eclipseTimer > 0) {
      this.eclipseTimer -= dt;
    }

    // 1. Advance Age Research
    this.updateAgeResearch(dt);

    // 2. Units Simulation (movement, gathering, combat)
    this.updateUnits(dt);

    // 3. Buildings Simulation (construction, unit training, tower defense)
    this.updateBuildings(dt);

    // 4. Projectiles
    this.updateProjectiles(dt);

    // 5. Particles & God Power Effects
    this.updateVFX(dt);

    // 6. Enemy AI Logic
    this.updateEnemyAI(dt);

    // 7. Wonder Victory Countdown
    this.updateWonderTimer(dt);

    // 8. Line of Sight / Fog of War
    this.map.updateFogOfWar(this.units, this.buildings);

    // 9. Check Victory / Defeat
    this.checkWinLoss();
  }

  private updateAgeResearch(dt: number) {
    if (this.ageAdvanceProgress !== null) {
      this.ageAdvanceProgress += dt / 25; // 25 seconds research time
      if (this.ageAdvanceProgress >= 1) {
        this.ageAdvanceProgress = null;
        if (this.playerAge === 'ARCHAIC_AGE') this.playerAge = 'OLD_KINGDOM';
        else if (this.playerAge === 'OLD_KINGDOM') this.playerAge = 'NEW_KINGDOM';
        else if (this.playerAge === 'NEW_KINGDOM') this.playerAge = 'MYTHIC_AGE';

        rtsAudio.playAgeAdvance();
        const pTown = this.buildings.find((b) => b.faction === 'PLAYER' && b.type === 'TOWN_CENTER');
        if (pTown) {
          this.addBurstParticles(pTown.pos, '#f59e0b', 30);
        }
      }
    }
  }

  private updateUnits(dt: number) {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];

      if (u.attackTimer > 0) {
        u.attackTimer -= dt;
      }

      // Unit state machine
      switch (u.state) {
        case 'MOVE':
          this.handleUnitMove(u, dt);
          break;
        case 'GATHER':
          this.handleUnitGather(u, dt);
          break;
        case 'DELIVER':
          this.handleUnitDeliver(u, dt);
          break;
        case 'BUILD':
          this.handleUnitBuild(u, dt);
          break;
        case 'ATTACK':
          this.handleUnitAttack(u, dt);
          break;
        case 'PRAY':
          this.handleUnitPray(u, dt);
          break;
        case 'IDLE':
          this.handleUnitIdle(u, dt);
          break;
      }

      // Check death
      if (u.hp <= 0) {
        if (u.faction === 'PLAYER') this.stats.unitsLost++;
        else this.stats.unitsKilled++;

        this.addBurstParticles(u.pos, u.faction === 'PLAYER' ? '#06b6d4' : '#ef4444', 12);
        this.units.splice(i, 1);
        this.recalcPopulation(u.faction);
      }
    }

    // Soft separation physics between units
    this.applyUnitSeparation();
  }

  private handleUnitMove(u: Unit, dt: number) {
    if (!u.targetPos) {
      u.state = 'IDLE';
      return;
    }

    const dx = u.targetPos.x - u.pos.x;
    const dy = u.targetPos.y - u.pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 6) {
      u.state = 'IDLE';
      u.targetPos = undefined;
      return;
    }

    const speed = u.speed * (this.eclipseTimer > 0 && u.faction === 'PLAYER' ? 1.3 : 1.0);
    const step = Math.min(dist, speed * dt);
    u.angle = Math.atan2(dy, dx);
    u.pos.x += (dx / dist) * step;
    u.pos.y += (dy / dist) * step;
    u.walkFrame += dt * 8;
  }

  private handleUnitGather(u: Unit, dt: number) {
    const resNode = this.resourceNodes.find((n) => n.id === u.targetId);
    if (!resNode || resNode.remaining <= 0) {
      // Find nearest resource node of same kind
      const nextNode = this.findNearestResource(u.pos, u.gatheringType || 'wood');
      if (nextNode) {
        u.targetId = nextNode.id;
        u.targetPos = nextNode.pos;
      } else {
        u.state = 'IDLE';
      }
      return;
    }

    const d = Math.hypot(resNode.pos.x - u.pos.x, resNode.pos.y - u.pos.y);
    if (d > resNode.size + 15) {
      // Walk towards node
      const dx = resNode.pos.x - u.pos.x;
      const dy = resNode.pos.y - u.pos.y;
      const step = u.speed * dt;
      u.angle = Math.atan2(dy, dx);
      u.pos.x += (dx / d) * step;
      u.pos.y += (dy / d) * step;
      u.walkFrame += dt * 8;
    } else {
      // Harvest
      u.walkFrame += dt * 4;
      const gatherRate = 3.5; // units per sec
      const harvested = gatherRate * dt;
      resNode.remaining -= harvested;
      u.carriedAmount += harvested;

      if (u.faction === 'PLAYER' && Math.random() < 0.015) {
        rtsAudio.playChop();
      }

      if (u.carriedAmount >= u.carryCapacity) {
        // Full! Deliver to nearest Town Center or Lumber Camp
        u.state = 'DELIVER';
        const depot = this.findNearestDepot(u.pos, u.faction);
        if (depot) {
          u.targetPos = depot.pos;
        }
      }
    }
  }

  private handleUnitDeliver(u: Unit, dt: number) {
    const depot = this.findNearestDepot(u.pos, u.faction);
    if (!depot) {
      u.state = 'IDLE';
      return;
    }

    const d = Math.hypot(depot.pos.x - u.pos.x, depot.pos.y - u.pos.y);
    if (d > depot.size + 15) {
      const dx = depot.pos.x - u.pos.x;
      const dy = depot.pos.y - u.pos.y;
      const step = u.speed * dt;
      u.angle = Math.atan2(dy, dx);
      u.pos.x += (dx / d) * step;
      u.pos.y += (dy / d) * step;
      u.walkFrame += dt * 8;
    } else {
      // Deposit resources
      const amount = Math.round(u.carriedAmount);
      const res = u.faction === 'PLAYER' ? this.playerResources : this.enemyResources;

      if (u.gatheringType === 'food') res.food += amount;
      else if (u.gatheringType === 'wood') res.wood += amount;
      else if (u.gatheringType === 'gold') res.gold += amount;

      if (u.faction === 'PLAYER' && u.gatheringType) {
        this.stats.resourcesHarvested[u.gatheringType] += amount;
      }

      u.carriedAmount = 0;

      // Resume gathering at original target if still available
      const node = this.resourceNodes.find((n) => n.id === u.targetId && n.remaining > 0);
      if (node) {
        u.state = 'GATHER';
        u.targetPos = node.pos;
      } else {
        u.state = 'IDLE';
      }
    }
  }

  private handleUnitBuild(u: Unit, dt: number) {
    const b = this.buildings.find((bld) => bld.id === u.targetId);
    if (!b || b.isConstructed) {
      u.state = 'IDLE';
      return;
    }

    const d = Math.hypot(b.pos.x - u.pos.x, b.pos.y - u.pos.y);
    if (d > b.size + 15) {
      const dx = b.pos.x - u.pos.x;
      const dy = b.pos.y - u.pos.y;
      const step = u.speed * dt;
      u.angle = Math.atan2(dy, dx);
      u.pos.x += (dx / d) * step;
      u.pos.y += (dy / d) * step;
      u.walkFrame += dt * 8;
    } else {
      // Build hammer
      const buildRate = 1 / BUILDING_DEFINITIONS[b.type].buildTime;
      b.buildProgress += buildRate * dt;
      b.hp = Math.min(b.maxHp, b.buildProgress * b.maxHp);
      u.walkFrame += dt * 6;

      if (u.faction === 'PLAYER' && Math.random() < 0.015) {
        rtsAudio.playBuildHammer();
      }

      if (b.buildProgress >= 1) {
        b.isConstructed = true;
        b.hp = b.maxHp;
        u.state = 'IDLE';
        this.recalcPopulation(b.faction);
        if (b.faction === 'PLAYER') {
          this.stats.buildingsConstructed++;
          rtsAudio.playAgeAdvance();
          this.addBurstParticles(b.pos, '#f59e0b', 20);
        }
      }
    }
  }

  private handleUnitAttack(u: Unit, dt: number) {
    // Target can be enemy unit or building
    const targetUnit = this.units.find((t) => t.id === u.targetId);
    const targetBuilding = !targetUnit ? this.buildings.find((b) => b.id === u.targetId) : undefined;

    if (!targetUnit && !targetBuilding) {
      u.state = 'IDLE';
      return;
    }

    const targetPos = targetUnit ? targetUnit.pos : targetBuilding!.pos;
    const targetRadius = targetUnit ? 12 : targetBuilding!.size;
    const d = Math.hypot(targetPos.x - u.pos.x, targetPos.y - u.pos.y);

    if (d > u.range + targetRadius) {
      // Move within attack range
      const dx = targetPos.x - u.pos.x;
      const dy = targetPos.y - u.pos.y;
      const step = u.speed * dt;
      u.angle = Math.atan2(dy, dx);
      u.pos.x += (dx / d) * step;
      u.pos.y += (dy / d) * step;
      u.walkFrame += dt * 8;
    } else {
      // In range: perform attack
      u.angle = Math.atan2(targetPos.y - u.pos.y, targetPos.x - u.pos.x);
      if (u.attackTimer <= 0) {
        u.attackTimer = u.attackCooldown;
        const damageMult = this.eclipseTimer > 0 && u.faction === 'PLAYER' ? 1.5 : 1.0;
        const totalDamage = u.damage * damageMult;

        if (u.range > 40) {
          // Ranged arrow or fire projectile
          rtsAudio.playBowShoot();
          this.projectiles.push({
            id: `proj_${this.nextId++}`,
            pos: { ...u.pos },
            targetPos: { ...targetPos },
            speed: 380,
            damage: totalDamage,
            progress: 0,
            arcHeight: 25,
            isFire: u.type === 'PHOENIX_OF_HELIOPOLIS',
          });
        } else {
          // Melee strike
          rtsAudio.playSwordClash();
          if (targetUnit) {
            targetUnit.hp -= totalDamage;
          } else if (targetBuilding) {
            targetBuilding.hp -= totalDamage;
          }
          this.addBurstParticles(targetPos, '#ffffff', 5);
        }
      }
    }
  }

  private handleUnitPray(u: Unit, dt: number) {
    const temple = this.buildings.find((b) => b.id === u.targetId && b.type === 'TEMPLE' && b.isConstructed);
    if (!temple) {
      u.state = 'IDLE';
      return;
    }

    const d = Math.hypot(temple.pos.x - u.pos.x, temple.pos.y - u.pos.y);
    if (d > temple.size + 15) {
      const dx = temple.pos.x - u.pos.x;
      const dy = temple.pos.y - u.pos.y;
      const step = u.speed * dt;
      u.pos.x += (dx / d) * step;
      u.pos.y += (dy / d) * step;
    } else {
      // Praying generates Favor steadily
      const res = u.faction === 'PLAYER' ? this.playerResources : this.enemyResources;
      const favorGen = 1.4 * dt;
      res.favor = Math.min(100, res.favor + favorGen);
      if (u.faction === 'PLAYER') {
        this.stats.resourcesHarvested.favor += favorGen;
      }
    }
  }

  private handleUnitIdle(u: Unit, _dt: number) {
    // If military unit is idle, scan for nearby enemies within aggro radius
    if (u.type !== 'VILLAGER' && u.type !== 'PRIEST_OF_RA') {
      const enemy = this.findNearestHostileUnit(u.pos, u.faction, 200);
      if (enemy) {
        u.state = 'ATTACK';
        u.targetId = enemy.id;
      }
    }
  }

  private applyUnitSeparation() {
    for (let i = 0; i < this.units.length; i++) {
      const u1 = this.units[i];
      for (let j = i + 1; j < this.units.length; j++) {
        const u2 = this.units[j];
        const dx = u2.pos.x - u1.pos.x;
        const dy = u2.pos.y - u1.pos.y;
        const d = Math.hypot(dx, dy);
        const minDist = 18;
        if (d < minDist && d > 0.01) {
          const overlap = (minDist - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          u1.pos.x -= nx * overlap;
          u1.pos.y -= ny * overlap;
          u2.pos.x += nx * overlap;
          u2.pos.y += ny * overlap;
        }
      }
    }
  }

  private updateBuildings(dt: number) {
    for (let i = this.buildings.length - 1; i >= 0; i--) {
      const b = this.buildings[i];

      // Guard Tower / Town Center defense attack
      if (b.isConstructed && (b.type === 'GUARD_TOWER' || b.type === 'TOWN_CENTER')) {
        b.attackTimer -= dt;
        if (b.attackTimer <= 0) {
          const enemy = this.findNearestHostileUnit(b.pos, b.faction, 260);
          if (enemy) {
            b.attackTimer = 1.6;
            rtsAudio.playBowShoot();
            this.projectiles.push({
              id: `tower_arrow_${this.nextId++}`,
              pos: { ...b.pos },
              targetPos: { ...enemy.pos },
              speed: 400,
              damage: b.type === 'GUARD_TOWER' ? 22 : 16,
              progress: 0,
              arcHeight: 35,
              isFire: true,
            });
          }
        }
      }

      // Unit Training Queue
      if (b.isConstructed && b.productionQueue.length > 0) {
        const item = b.productionQueue[0];
        const trainTime = UNIT_DEFINITIONS[item.unitType].trainTime;
        item.progress += dt / trainTime;

        if (item.progress >= 1) {
          b.productionQueue.shift();
          const spawnOffset = {
            x: b.pos.x + Math.cos(Math.PI * 0.6) * (b.size + 24),
            y: b.pos.y + Math.sin(Math.PI * 0.6) * (b.size + 24),
          };
          this.addUnit(item.unitType, b.faction, spawnOffset);
          if (b.faction === 'PLAYER') {
            rtsAudio.playUnitSelect();
          }
        }
      }

      // Check building destruction
      if (b.hp <= 0) {
        this.addBurstParticles(b.pos, '#f59e0b', 35);
        this.buildings.splice(i, 1);
        this.recalcPopulation(b.faction);
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const totalDist = Math.hypot(p.targetPos.x - p.pos.x, p.targetPos.y - p.pos.y);
      p.progress += (p.speed * dt) / Math.max(1, totalDist);

      if (p.progress >= 1) {
        // Impact
        const hitUnit = this.findUnitAt(p.targetPos, 22);
        if (hitUnit) {
          hitUnit.hp -= p.damage;
          this.addBurstParticles(p.targetPos, p.isFire ? '#f97316' : '#ffffff', 6);
        }
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateVFX(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.pos.x += pt.vel.x * dt;
      pt.pos.y += pt.vel.y * dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.godPowerEffects.length - 1; i >= 0; i--) {
      const gp = this.godPowerEffects[i];
      gp.life -= dt;
      if (gp.life <= 0) this.godPowerEffects.splice(i, 1);
    }
  }

  private updateEnemyAI(dt: number) {
    // 1. Enemy villager auto-gather
    const enemyVillagers = this.units.filter((u) => u.faction === 'ENEMY' && u.type === 'VILLAGER' && u.state === 'IDLE');
    for (const v of enemyVillagers) {
      const kinds: ('food' | 'wood' | 'gold')[] = ['food', 'wood', 'gold'];
      const targetKind = kinds[Math.floor(Math.random() * kinds.length)];
      const node = this.findNearestResource(v.pos, targetKind);
      if (node) {
        v.state = 'GATHER';
        v.gatheringType = targetKind;
        v.targetId = node.id;
        v.targetPos = node.pos;
      }
    }

    // 2. Enemy build & train logic
    this.enemyBuildTimer -= dt;
    if (this.enemyBuildTimer <= 0) {
      this.enemyBuildTimer = 15;

      const tc = this.buildings.find((b) => b.faction === 'ENEMY' && b.type === 'TOWN_CENTER');
      if (tc && this.enemyResources.food >= 50 && this.enemyResources.population < this.enemyResources.maxPopulation) {
        if (tc.productionQueue.length < 2) {
          this.enemyResources.food -= 50;
          tc.productionQueue.push({ unitType: 'VILLAGER', progress: 0 });
        }
      }

      // Build Barracks if wood permits
      const hasBarracks = this.buildings.some((b) => b.faction === 'ENEMY' && b.type === 'BARRACKS');
      if (!hasBarracks && this.enemyResources.wood >= 150) {
        this.enemyResources.wood -= 150;
        this.addBuilding('BARRACKS', 'ENEMY', { x: 1820, y: 490 }, true);
      }

      // Train military units from Barracks
      const barracks = this.buildings.find((b) => b.faction === 'ENEMY' && b.type === 'BARRACKS' && b.isConstructed);
      if (barracks && barracks.productionQueue.length < 2) {
        if (this.enemyResources.food >= 60 && this.enemyResources.gold >= 30) {
          this.enemyResources.food -= 60;
          this.enemyResources.gold -= 30;
          barracks.productionQueue.push({ unitType: 'KHOPESH_WARRIOR', progress: 0 });
        }
      }
    }

    // 3. Enemy raid waves
    this.enemyRaidTimer -= dt;
    if (this.enemyRaidTimer <= 0) {
      this.enemyRaidTimer = 85; // Next raid in 85s
      const army = this.units.filter((u) => u.faction === 'ENEMY' && u.type !== 'VILLAGER');
      const playerTC = this.buildings.find((b) => b.faction === 'PLAYER' && b.type === 'TOWN_CENTER');
      const targetPos = playerTC ? playerTC.pos : { x: 420, y: 1380 };

      if (army.length > 0) {
        rtsAudio.playWarHorn();
        for (const soldier of army) {
          soldier.state = 'MOVE';
          soldier.targetPos = {
            x: targetPos.x + (Math.random() - 0.5) * 80,
            y: targetPos.y + (Math.random() - 0.5) * 80,
          };
        }
      }
    }
  }

  private updateWonderTimer(dt: number) {
    const wonder = this.buildings.find((b) => b.faction === 'PLAYER' && b.type === 'PYRAMID_WONDER' && b.isConstructed);
    if (wonder) {
      if (this.wonderTimer === null) {
        this.wonderTimer = 180; // 3 minutes to victory!
      } else {
        this.wonderTimer = Math.max(0, this.wonderTimer - dt);
        if (this.wonderTimer <= 0) {
          this.gameOver = 'VICTORY';
          rtsAudio.playVictory();
        }
      }
    } else {
      this.wonderTimer = null;
    }
  }

  private checkWinLoss() {
    if (this.gameOver) return;

    // Victory: Enemy Town Center and Barracks destroyed
    const enemyBlds = this.buildings.filter((b) => b.faction === 'ENEMY');
    if (enemyBlds.length === 0) {
      this.gameOver = 'VICTORY';
      rtsAudio.playVictory();
    }

    // Defeat: Player Town Center destroyed and all villagers dead
    const playerTC = this.buildings.some((b) => b.faction === 'PLAYER' && b.type === 'TOWN_CENTER');
    const playerVillagers = this.units.some((u) => u.faction === 'PLAYER' && u.type === 'VILLAGER');
    if (!playerTC && !playerVillagers) {
      this.gameOver = 'DEFEAT';
      rtsAudio.playDefeat();
    }
  }

  // --- Player Action Methods ---

  public orderMove(units: Unit[], target: Vec2) {
    rtsAudio.playCommandAck();
    units.forEach((u, idx) => {
      u.state = 'MOVE';
      const angle = (idx / Math.max(1, units.length)) * Math.PI * 2;
      const spread = idx === 0 ? 0 : 25;
      u.targetPos = {
        x: target.x + Math.cos(angle) * spread,
        y: target.y + Math.sin(angle) * spread,
      };
      u.targetId = undefined;
    });
  }

  public orderAttack(units: Unit[], targetId: string) {
    rtsAudio.playCommandAck();
    units.forEach((u) => {
      u.state = 'ATTACK';
      u.targetId = targetId;
      u.targetPos = undefined;
    });
  }

  public orderGather(units: Unit[], node: ResourceNode) {
    rtsAudio.playCommandAck();
    units.forEach((u) => {
      if (u.type === 'VILLAGER') {
        u.state = 'GATHER';
        u.gatheringType = node.resourceKind;
        u.targetId = node.id;
        u.targetPos = node.pos;
      }
    });
  }

  public orderBuild(units: Unit[], building: Building) {
    rtsAudio.playCommandAck();
    units.forEach((u) => {
      if (u.type === 'VILLAGER') {
        u.state = 'BUILD';
        u.targetId = building.id;
        u.targetPos = building.pos;
      }
    });
  }

  public orderPray(units: Unit[], temple: Building) {
    rtsAudio.playCommandAck();
    units.forEach((u) => {
      if (u.type === 'PRIEST_OF_RA') {
        u.state = 'PRAY';
        u.targetId = temple.id;
        u.targetPos = temple.pos;
      }
    });
  }

  public trainUnit(building: Building, unitType: UnitType): boolean {
    const def = UNIT_DEFINITIONS[unitType];
    const cost = def.cost;

    if (
      this.playerResources.food >= cost.food &&
      this.playerResources.wood >= cost.wood &&
      this.playerResources.gold >= cost.gold &&
      this.playerResources.favor >= cost.favor &&
      this.playerResources.population + def.popCost <= this.playerResources.maxPopulation &&
      building.productionQueue.length < 5
    ) {
      this.playerResources.food -= cost.food;
      this.playerResources.wood -= cost.wood;
      this.playerResources.gold -= cost.gold;
      this.playerResources.favor -= cost.favor;
      building.productionQueue.push({ unitType, progress: 0 });
      rtsAudio.playUnitSelect();
      return true;
    }
    return false;
  }

  public constructBuilding(type: BuildingType, pos: Vec2, builders: Unit[] = []): Building | null {
    const def = BUILDING_DEFINITIONS[type];
    const cost = def.cost;

    if (
      this.playerResources.food >= cost.food &&
      this.playerResources.wood >= cost.wood &&
      this.playerResources.gold >= cost.gold &&
      this.playerResources.favor >= cost.favor
    ) {
      this.playerResources.food -= cost.food;
      this.playerResources.wood -= cost.wood;
      this.playerResources.gold -= cost.gold;
      this.playerResources.favor -= cost.favor;

      const b = this.addBuilding(type, 'PLAYER', pos, false);
      if (builders.length > 0) {
        this.orderBuild(builders, b);
      }
      return b;
    }
    return null;
  }

  public advanceAge(): boolean {
    if (this.ageAdvanceProgress !== null) return false;
    let nextAge: Age | null = null;
    if (this.playerAge === 'ARCHAIC_AGE') nextAge = 'OLD_KINGDOM';
    else if (this.playerAge === 'OLD_KINGDOM') nextAge = 'NEW_KINGDOM';
    else if (this.playerAge === 'NEW_KINGDOM') nextAge = 'MYTHIC_AGE';

    if (!nextAge) return false;
    const cfg = AGE_CONFIGS[nextAge];

    if (this.playerResources.food >= cfg.foodCost && this.playerResources.gold >= cfg.goldCost) {
      this.playerResources.food -= cfg.foodCost;
      this.playerResources.gold -= cfg.goldCost;
      this.ageAdvanceProgress = 0.01;
      rtsAudio.playUnitSelect();
      return true;
    }
    return false;
  }

  public invokeGodPower(type: GodPowerType, targetPos: Vec2): boolean {
    const gp = GOD_POWERS[type];
    if (this.playerResources.favor >= gp.favorCost && this.godPowerCooldowns[type] <= 0) {
      this.playerResources.favor -= gp.favorCost;
      this.godPowerCooldowns[type] = gp.cooldown;

      if (type === 'SOLAR_WRATH') {
        rtsAudio.playGodPowerSolar();
        this.godPowerEffects.push({
          type,
          pos: { ...targetPos },
          life: 2.2,
          maxLife: 2.2,
          radius: 110,
        });

        // Damage all enemy units in radius
        for (const u of this.units) {
          if (u.faction === 'ENEMY' && Math.hypot(u.pos.x - targetPos.x, u.pos.y - targetPos.y) < 110) {
            u.hp -= 220;
          }
        }
      } else if (type === 'NILE_BLOOM') {
        rtsAudio.playGodPowerNile();
        this.playerResources.food += 300;
        this.playerResources.wood += 150;
        // Heal all friendly units
        for (const u of this.units) {
          if (u.faction === 'PLAYER') {
            u.hp = u.maxHp;
            this.addBurstParticles(u.pos, '#22c55e', 8);
          }
        }
      } else if (type === 'ECLIPSE') {
        rtsAudio.playWarHorn();
        this.eclipseTimer = 20; // 20 seconds buff
      } else if (type === 'LOCUST_SWARM') {
        rtsAudio.playGodPowerSolar();
        this.godPowerEffects.push({
          type,
          pos: { ...targetPos },
          life: 4.0,
          maxLife: 4.0,
          radius: 130,
        });
        for (const u of this.units) {
          if (u.faction === 'ENEMY' && Math.hypot(u.pos.x - targetPos.x, u.pos.y - targetPos.y) < 130) {
            u.hp -= 120;
          }
        }
      }

      return true;
    }
    return false;
  }

  // --- Helper Queries ---

  private findNearestResource(pos: Vec2, kind: 'food' | 'wood' | 'gold'): ResourceNode | null {
    let nearest: ResourceNode | null = null;
    let minDist = Infinity;
    for (const n of this.resourceNodes) {
      if (n.resourceKind === kind && n.remaining > 0) {
        const d = Math.hypot(n.pos.x - pos.x, n.pos.y - pos.y);
        if (d < minDist) {
          minDist = d;
          nearest = n;
        }
      }
    }
    return nearest;
  }

  private findNearestDepot(pos: Vec2, faction: Faction): Building | null {
    let nearest: Building | null = null;
    let minDist = Infinity;
    for (const b of this.buildings) {
      if (
        b.faction === faction &&
        b.isConstructed &&
        (b.type === 'TOWN_CENTER' || b.type === 'LUMBER_CAMP')
      ) {
        const d = Math.hypot(b.pos.x - pos.x, b.pos.y - pos.y);
        if (d < minDist) {
          minDist = d;
          nearest = b;
        }
      }
    }
    return nearest;
  }

  private findNearestHostileUnit(pos: Vec2, myFaction: Faction, maxRange: number): Unit | null {
    let nearest: Unit | null = null;
    let minDist = maxRange;
    for (const u of this.units) {
      if (u.faction !== myFaction) {
        const d = Math.hypot(u.pos.x - pos.x, u.pos.y - pos.y);
        if (d < minDist) {
          minDist = d;
          nearest = u;
        }
      }
    }
    return nearest;
  }

  private findUnitAt(pos: Vec2, radius: number): Unit | null {
    for (const u of this.units) {
      if (Math.hypot(u.pos.x - pos.x, u.pos.y - pos.y) <= radius) {
        return u;
      }
    }
    return null;
  }

  private addBurstParticles(pos: Vec2, color: string, count: number) {
    for (let k = 0; k < count; k++) {
      this.particles.push({
        pos: { ...pos },
        vel: {
          x: (Math.random() - 0.5) * 160,
          y: (Math.random() - 0.5) * 160,
        },
        color,
        life: 0.6,
        maxLife: 0.6,
        radius: Math.random() * 2.5 + 1.5,
      });
    }
  }
}
