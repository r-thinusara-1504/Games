/**
 * Egyptian Map Generation & Fog of War System
 * Generates the winding Nile River, fertile silt banks, golden sand dunes,
 * date palm groves, limestone quarries, and calculates line of sight.
 */

import { ResourceNode, Vec2, Building, Unit } from './types';

export const MAP_WIDTH = 2400;
export const MAP_HEIGHT = 1800;

export const FOG_COLS = 80;
export const FOG_ROWS = 60;
export const CELL_WIDTH = MAP_WIDTH / FOG_COLS;
export const CELL_HEIGHT = MAP_HEIGHT / FOG_ROWS;

export type FogState = 0 | 1 | 2; // 0: Unexplored, 1: Explored (fog), 2: Visible

export class RTSMap {
  public width = MAP_WIDTH;
  public height = MAP_HEIGHT;

  // Fog of war array: FOG_COLS * FOG_ROWS
  public fogGrid: Uint8Array = new Uint8Array(FOG_COLS * FOG_ROWS);

  // Nile River spline points
  public riverPoints: Vec2[] = [];

  constructor() {
    this.initRiver();
  }

  private initRiver() {
    // Nile river flows from South-Center to North-NorthWest
    this.riverPoints = [
      { x: 950, y: 0 },
      { x: 1020, y: 350 },
      { x: 920, y: 700 },
      { x: 1100, y: 1150 },
      { x: 1050, y: 1500 },
      { x: 1150, y: 1800 },
    ];
  }

  /**
   * Distance from a world point to the Nile River centerline
   */
  public distToRiver(x: number, y: number): number {
    let minDist = Infinity;
    for (let i = 0; i < this.riverPoints.length - 1; i++) {
      const p1 = this.riverPoints[i];
      const p2 = this.riverPoints[i + 1];
      const d = this.distToSegment({ x, y }, p1, p2);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  private distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  /**
   * Check if a position is inside the deep water of the Nile
   */
  public isWater(x: number, y: number): boolean {
    return this.distToRiver(x, y) < 85;
  }

  /**
   * Check if a position is on the fertile green Nile floodplains
   */
  public isFertile(x: number, y: number): boolean {
    const d = this.distToRiver(x, y);
    return d >= 85 && d < 220;
  }

  /**
   * Update line of sight fog of war from player units and buildings
   */
  public updateFogOfWar(units: Unit[], buildings: Building[]) {
    // Step 1: Degrade currently visible (2) to explored (1)
    for (let i = 0; i < this.fogGrid.length; i++) {
      if (this.fogGrid[i] === 2) {
        this.fogGrid[i] = 1;
      }
    }

    // Step 2: Reveal vision circles around player units & buildings
    const reveal = (worldX: number, worldY: number, radius: number) => {
      const minCol = Math.max(0, Math.floor((worldX - radius) / CELL_WIDTH));
      const maxCol = Math.min(FOG_COLS - 1, Math.ceil((worldX + radius) / CELL_WIDTH));
      const minRow = Math.max(0, Math.floor((worldY - radius) / CELL_HEIGHT));
      const maxRow = Math.min(FOG_ROWS - 1, Math.ceil((worldY + radius) / CELL_HEIGHT));

      const rSq = radius * radius;
      for (let r = minRow; r <= maxRow; r++) {
        const cy = r * CELL_HEIGHT + CELL_HEIGHT * 0.5;
        for (let c = minCol; c <= maxCol; c++) {
          const cx = c * CELL_WIDTH + CELL_WIDTH * 0.5;
          const dx = cx - worldX;
          const dy = cy - worldY;
          if (dx * dx + dy * dy <= rSq) {
            this.fogGrid[r * FOG_COLS + c] = 2; // Fully visible
          }
        }
      }
    };

    // Player units vision
    for (const u of units) {
      if (u.faction === 'PLAYER') {
        const los = u.type === 'CHARIOT_ARCHER' ? 260 : u.type === 'VILLAGER' ? 190 : 220;
        reveal(u.pos.x, u.pos.y, los);
      }
    }

    // Player buildings vision
    for (const b of buildings) {
      if (b.faction === 'PLAYER') {
        const los = b.type === 'GUARD_TOWER' ? 340 : b.type === 'TOWN_CENTER' ? 300 : 210;
        reveal(b.pos.x, b.pos.y, los);
      }
    }
  }

  public getFogAt(worldX: number, worldY: number): FogState {
    const col = Math.floor(worldX / CELL_WIDTH);
    const row = Math.floor(worldY / CELL_HEIGHT);
    if (col < 0 || col >= FOG_COLS || row < 0 || row >= FOG_ROWS) return 0;
    return this.fogGrid[row * FOG_COLS + col] as FogState;
  }
}

/**
 * Generate starter resource nodes for both settlements and the wild desert
 */
export function generateResourceNodes(map: RTSMap): ResourceNode[] {
  const nodes: ResourceNode[] = [];
  let idCounter = 1;

  // Helper to add nodes
  const addCluster = (
    type: 'PALM_TREE' | 'GOLD_QUARRY' | 'BERRY_BUSH',
    centerX: number,
    centerY: number,
    count: number,
    spread: number
  ) => {
    const resourceKind = type === 'PALM_TREE' ? 'wood' : type === 'GOLD_QUARRY' ? 'gold' : 'food';
    const maxAmount = type === 'PALM_TREE' ? 300 : type === 'GOLD_QUARRY' ? 900 : 450;
    const size = type === 'PALM_TREE' ? 16 : type === 'GOLD_QUARRY' ? 24 : 14;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const r = Math.random() * spread;
      const x = Math.max(60, Math.min(MAP_WIDTH - 60, centerX + Math.cos(angle) * r));
      const y = Math.max(60, Math.min(MAP_HEIGHT - 60, centerY + Math.sin(angle) * r));

      // Don't spawn inside Nile water
      if (!map.isWater(x, y)) {
        nodes.push({
          id: `res_${idCounter++}`,
          type,
          resourceKind,
          pos: { x, y },
          remaining: maxAmount,
          maxAmount,
          size,
        });
      }
    }
  };

  // 1. Player Starting Base Resources (Around x: 420, y: 1380)
  addCluster('BERRY_BUSH', 340, 1310, 5, 45); // Nile dates/berries
  addCluster('PALM_TREE', 520, 1420, 8, 60); // Palm grove
  addCluster('GOLD_QUARRY', 290, 1470, 2, 40); // Gold quarry

  // 2. Enemy Starting Base Resources (Around x: 1950, y: 400)
  addCluster('BERRY_BUSH', 1870, 340, 5, 45);
  addCluster('PALM_TREE', 2050, 480, 8, 60);
  addCluster('GOLD_QUARRY', 2080, 310, 2, 40);

  // 3. Neutral Desert Oasis & Limestone Quarries across the map
  addCluster('PALM_TREE', 1250, 600, 10, 80); // Nile east bank oasis
  addCluster('BERRY_BUSH', 1220, 640, 4, 40);
  addCluster('GOLD_QUARRY', 1420, 750, 3, 50);

  addCluster('PALM_TREE', 750, 950, 12, 90); // Nile west bank oasis
  addCluster('BERRY_BUSH', 790, 990, 5, 50);
  addCluster('GOLD_QUARRY', 620, 900, 3, 50);

  addCluster('GOLD_QUARRY', 1600, 1350, 4, 60); // South-east sandstone mesa
  addCluster('PALM_TREE', 1680, 1420, 7, 70);

  addCluster('GOLD_QUARRY', 750, 280, 4, 60); // North-west desert cliffs
  addCluster('PALM_TREE', 680, 220, 6, 60);

  return nodes;
}
