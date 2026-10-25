/**
 * Canvas 2.5D Renderer for Sands of Ra RTS
 * Renders the flowing Nile river, golden dunes, palm groves, Egyptian monuments,
 * animated soldiers, chariots, myth units, projectiles, and fog of war.
 */

import {
  Unit,
  Building,
  ResourceNode,
  Projectile,
  ParticleEffect,
  GodPowerEffect,
  Vec2,
} from './types';
import { RTSMap, MAP_WIDTH, MAP_HEIGHT, CELL_WIDTH, CELL_HEIGHT, FOG_COLS, FOG_ROWS } from './map';

export class RTSRenderer {
  public camera: Vec2 = { x: 300, y: 1200 };
  public viewportWidth: number = 1200;
  public viewportHeight: number = 800;
  private time: number = 0;

  public resize(w: number, h: number) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  public worldToScreen(world: Vec2): Vec2 {
    return {
      x: world.x - this.camera.x,
      y: world.y - this.camera.y,
    };
  }

  public screenToWorld(screen: Vec2): Vec2 {
    return {
      x: screen.x + this.camera.x,
      y: screen.y + this.camera.y,
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    map: RTSMap,
    units: Unit[],
    buildings: Building[],
    resources: ResourceNode[],
    projectiles: Projectile[],
    particles: ParticleEffect[],
    godPowers: GodPowerEffect[],
    selectedUnitIds: Set<string>,
    selectedBuildingId: string | null,
    dragBox: { start: Vec2; current: Vec2 } | null,
    dt: number
  ) {
    this.time += dt;

    ctx.save();
    ctx.fillStyle = '#dfc488'; // Base golden desert sand
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Apply Camera Translation
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Terrain: Desert Dunes & Nile River
    this.renderTerrain(ctx, map);

    // 2. Resource Nodes (Palm Trees, Gold Quarries, Berry Bushes)
    this.renderResourceNodes(ctx, resources, map);

    // 3. Buildings (Town Centers, Barracks, Temples, Pyramids)
    this.renderBuildings(ctx, buildings, selectedBuildingId, map);

    // 4. Units (Workers, Khopesh, Chariots, Priests, Myth Beasts)
    this.renderUnits(ctx, units, selectedUnitIds, map);

    // 5. Projectiles (Arrows, Fireballs)
    this.renderProjectiles(ctx, projectiles);

    // 6. Particles & God Power Effects
    this.renderVFX(ctx, particles, godPowers);

    // 7. Fog of War Shroud
    this.renderFogOfWar(ctx, map);

    // 8. Drag Selection Marquee Box
    if (dragBox) {
      this.renderDragBox(ctx, dragBox);
    }

    ctx.restore();
  }

  private renderTerrain(ctx: CanvasRenderingContext2D, map: RTSMap) {
    // Nile River
    ctx.save();
    ctx.lineWidth = 150;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fertile green silt riverbanks
    ctx.strokeStyle = '#2d6a4f';
    ctx.beginPath();
    map.riverPoints.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Turquoise Nile Water
    ctx.lineWidth = 95;
    ctx.strokeStyle = '#0284c7';
    ctx.beginPath();
    map.riverPoints.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Water Shimmer Highlights
    ctx.lineWidth = 45;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();

    // Desert Dune Ripples
    ctx.strokeStyle = 'rgba(180, 130, 60, 0.15)';
    ctx.lineWidth = 2;
    for (let y = 0; y < MAP_HEIGHT; y += 120) {
      ctx.beginPath();
      for (let x = 0; x <= MAP_WIDTH; x += 100) {
        const offset = Math.sin(x * 0.01 + y * 0.02 + this.time * 0.5) * 12;
        if (x === 0) ctx.moveTo(x, y + offset);
        else ctx.lineTo(x, y + offset);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderResourceNodes(ctx: CanvasRenderingContext2D, resources: ResourceNode[], map: RTSMap) {
    for (const res of resources) {
      const fog = map.getFogAt(res.pos.x, res.pos.y);
      if (fog === 0) continue; // Unexplored: don't render

      ctx.save();
      ctx.translate(res.pos.x, res.pos.y);
      if (fog === 1) ctx.globalAlpha = 0.5;

      if (res.type === 'PALM_TREE') {
        // Date Palm Trunk & Fronds
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Green Palm Fronds
        ctx.fillStyle = '#15803d';
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.sin(this.time * 2 + res.pos.x) * 0.08;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 14, 5, a, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (res.type === 'GOLD_QUARRY') {
        // Sparkling Golden Limestone Quarry
        ctx.fillStyle = '#ca8a04';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 10);
        ctx.lineTo(-6, -14);
        ctx.lineTo(14, -10);
        ctx.lineTo(18, 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shimmer glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (res.type === 'BERRY_BUSH') {
        // Lush Date/Berry Bush
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Red/Purple Dates
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.arc(4, 3, 3, 0, Math.PI * 2);
        ctx.arc(-2, 5, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderBuildings(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    selectedBuildingId: string | null,
    map: RTSMap
  ) {
    for (const b of buildings) {
      const fog = map.getFogAt(b.pos.x, b.pos.y);
      if (fog === 0) continue; // Unexplored

      ctx.save();
      ctx.translate(b.pos.x, b.pos.y);
      if (fog === 1) ctx.globalAlpha = 0.55;

      const isPlayer = b.faction === 'PLAYER';
      const isSelected = selectedBuildingId === b.id;

      // Selection Ring
      if (isSelected) {
        ctx.strokeStyle = isPlayer ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, b.size + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Drop Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(8, 12, b.size * 1.1, b.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Building Construction Scaffolding State
      if (!b.isConstructed) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-b.size * 0.7, -b.size * 0.7, b.size * 1.4, b.size * 1.4);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-b.size * 0.7, -b.size * 0.7, b.size * 1.4, b.size * 1.4);

        // Progress bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-b.size * 0.8, -b.size - 10, b.size * 1.6, 6);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-b.size * 0.8, -b.size - 10, b.size * 1.6 * b.buildProgress, 6);
        ctx.restore();
        continue;
      }

      // Render Distinct Egyptian Architecture
      if (b.type === 'TOWN_CENTER') {
        // Grand Sandstone Palace Pylon with Hieroglyph Facade
        ctx.fillStyle = isPlayer ? '#fef3c7' : '#fee2e2';
        ctx.strokeStyle = isPlayer ? '#b45309' : '#b91c1c';
        ctx.lineWidth = 3;

        // Main Pylon Gate
        ctx.fillRect(-35, -30, 70, 60);
        ctx.strokeRect(-35, -30, 70, 60);

        // Golden Cornice
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-38, -35, 76, 8);

        // Inner Courtyard Gateway
        ctx.fillStyle = '#1e1b18';
        ctx.beginPath();
        ctx.arc(0, 10, 14, Math.PI, 0);
        ctx.lineTo(14, 30);
        ctx.lineTo(-14, 30);
        ctx.closePath();
        ctx.fill();
      } else if (b.type === 'BARRACKS') {
        // War Academy with Crossed Banners
        ctx.fillStyle = isPlayer ? '#fed7aa' : '#fca5a5';
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-26, -24, 52, 48);
        ctx.strokeRect(-26, -24, 52, 48);

        // Bronze Shield Crest
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, -6, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'TEMPLE') {
        // Temple of the Gods with Obelisk Spire & Altar
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2.5;

        // Base colonnade
        ctx.fillRect(-30, -26, 60, 52);
        ctx.strokeRect(-30, -26, 60, 52);

        // Central Altar Flame
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, -2, 8, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Favor Aura
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -2, 16 + Math.sin(this.time * 4) * 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (b.type === 'GUARD_TOWER') {
        // Sandstone Watchtower
        ctx.fillStyle = '#fde68a';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.fillRect(-16, -16, 32, 32);
        ctx.strokeRect(-16, -16, 32, 32);

        // Parapet Arrow Slits
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -22, 24, 6);
      } else if (b.type === 'PYRAMID_WONDER') {
        // The Great Gilded Pyramid Wonder!
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4;

        // Multi-tiered square steps
        for (let s = 3; s >= 1; s--) {
          const sz = s * 18;
          ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
          ctx.strokeRect(-sz, -sz, sz * 2, sz * 2);
        }

        // Golden Blazing Capstone (Pyramidion)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (b.type === 'HOUSE') {
        // Mudbrick Villa
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.fillRect(-15, -15, 30, 30);
        ctx.strokeRect(-15, -15, 30, 30);
      } else if (b.type === 'FARM') {
        // Ploughed Farm Plot
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-22, -22, 44, 44);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        for (let row = -14; row <= 14; row += 7) {
          ctx.beginPath();
          ctx.moveTo(-18, row);
          ctx.lineTo(18, row);
          ctx.stroke();
        }
      } else if (b.type === 'LUMBER_CAMP') {
        // Palm Lumber Camp
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-18, -18, 36, 36);
        ctx.strokeStyle = '#b45309';
        ctx.strokeRect(-18, -18, 36, 36);
      }

      // Health Bar
      const hpRatio = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-b.size, -b.size - 12, b.size * 2, 5);
      ctx.fillStyle = hpRatio > 0.4 ? '#10b981' : '#ef4444';
      ctx.fillRect(-b.size, -b.size - 12, b.size * 2 * hpRatio, 5);

      ctx.restore();
    }
  }

  private renderUnits(
    ctx: CanvasRenderingContext2D,
    units: Unit[],
    selectedUnitIds: Set<string>,
    map: RTSMap
  ) {
    for (const u of units) {
      const fog = map.getFogAt(u.pos.x, u.pos.y);
      if (fog < 2 && u.faction === 'ENEMY') continue; // Hidden in fog of war

      ctx.save();
      ctx.translate(u.pos.x, u.pos.y);

      const isSelected = selectedUnitIds.has(u.id);
      const isPlayer = u.faction === 'PLAYER';

      // Selection Decal Ring
      if (isSelected) {
        ctx.strokeStyle = isPlayer ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Drop Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(2, 6, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Unit Body Rendering
      ctx.rotate(u.angle);

      if (u.type === 'VILLAGER') {
        // Laborer with linen tunic
        ctx.fillStyle = isPlayer ? '#0284c7' : '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Tool (Sickle / Pickaxe)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(12, 4);
        ctx.stroke();
      } else if (u.type === 'KHOPESH_WARRIOR') {
        // Curved sword infantry with bronze shield
        ctx.fillStyle = isPlayer ? '#0284c7' : '#b91c1c';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Khopesh curved blade
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.quadraticCurveTo(14, -8, 16, 2);
        ctx.stroke();

        // Bronze shield
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-6, -10, 4, 12);
      } else if (u.type === 'SPEAR_GUARDIAN') {
        // Spear Guardian with long polearm
        ctx.fillStyle = isPlayer ? '#0284c7' : '#991b1b';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Long Spear
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.lineTo(24, 4);
        ctx.stroke();
      } else if (u.type === 'CHARIOT_ARCHER') {
        // War Chariot with 2 wheels
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-12, -8, 20, 16);

        // Wheels
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(-6, -12, 10, 3);
        ctx.fillRect(-6, 9, 10, 3);

        // Archer
        ctx.fillStyle = isPlayer ? '#0284c7' : '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (u.type === 'PRIEST_OF_RA') {
        // Priest in white robes with glowing Ankh
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Golden Ankh Staff
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(4, -4);
        ctx.lineTo(14, -4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(16, -4, 3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (u.type === 'ANUBITE_WARRIOR') {
        // Jackal Mythic Warrior
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Twin scythes
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(10, -6, 8, 0, Math.PI);
        ctx.stroke();
      } else if (u.type === 'WADJET_SERPENT') {
        // Winged Emerald Cobra
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (u.type === 'PHOENIX_OF_HELIOPOLIS') {
        // Flying Solar Firebird
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        // Fiery Wings
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, -14, 18, 6, 0.3, 0, Math.PI * 2);
        ctx.ellipse(0, 14, 18, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.rotate(-u.angle);

      // Health Bar
      const hpRatio = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-12, -18, 24, 3);
      ctx.fillStyle = hpRatio > 0.4 ? '#10b981' : '#ef4444';
      ctx.fillRect(-12, -18, 24 * hpRatio, 3);

      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    for (const p of projectiles) {
      const curX = p.pos.x + (p.targetPos.x - p.pos.x) * p.progress;
      const curY = p.pos.y + (p.targetPos.y - p.pos.y) * p.progress;
      const arc = Math.sin(p.progress * Math.PI) * p.arcHeight;

      ctx.save();
      ctx.translate(curX, curY - arc);

      ctx.fillStyle = p.isFire ? '#f97316' : '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, 0, p.isFire ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderVFX(
    ctx: CanvasRenderingContext2D,
    particles: ParticleEffect[],
    godPowers: GodPowerEffect[]
  ) {
    // God Power Visual Effects
    for (const gp of godPowers) {
      ctx.save();
      ctx.translate(gp.pos.x, gp.pos.y);

      if (gp.type === 'SOLAR_WRATH') {
        // Blinding Celestial Solar Beam
        const progress = gp.life / gp.maxLife;
        ctx.fillStyle = `rgba(253, 224, 71, ${progress * 0.7})`;
        ctx.beginPath();
        ctx.arc(0, 0, gp.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();
      } else if (gp.type === 'LOCUST_SWARM') {
        // Dark Swirling Plague Cloud
        ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, gp.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Particles
    for (const pt of particles) {
      ctx.save();
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.beginPath();
      ctx.arc(pt.pos.x, pt.pos.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFogOfWar(ctx: CanvasRenderingContext2D, map: RTSMap) {
    ctx.save();
    for (let r = 0; r < FOG_ROWS; r++) {
      for (let c = 0; c < FOG_COLS; c++) {
        const state = map.fogGrid[r * FOG_COLS + c];
        if (state === 2) continue; // Visible: no shroud

        const x = c * CELL_WIDTH;
        const y = r * CELL_HEIGHT;

        if (state === 0) {
          // Unexplored: opaque pitch darkness
          ctx.fillStyle = '#0f0c08';
          ctx.fillRect(x, y, CELL_WIDTH + 1, CELL_HEIGHT + 1);
        } else if (state === 1) {
          // Explored: soft dusky fog
          ctx.fillStyle = 'rgba(18, 14, 10, 0.55)';
          ctx.fillRect(x, y, CELL_WIDTH + 1, CELL_HEIGHT + 1);
        }
      }
    }
    ctx.restore();
  }

  private renderDragBox(ctx: CanvasRenderingContext2D, dragBox: { start: Vec2; current: Vec2 }) {
    const x = Math.min(dragBox.start.x, dragBox.current.x);
    const y = Math.min(dragBox.start.y, dragBox.current.y);
    const w = Math.abs(dragBox.current.x - dragBox.start.x);
    const h = Math.abs(dragBox.current.y - dragBox.start.y);

    ctx.save();
    ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }
}
