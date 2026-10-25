/**
 * Three.js 3D RTS Scene Manager for Sands of Ra
 * Manages WebGLRenderer, isometric RTS camera, PBR lighting, 3D terrain with Nile River,
 * 3D composite unit & building synchronization, raycasting, and god powers.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Unit, Building, ResourceNode, Projectile, GodPowerEffect, Vec2, BuildingType } from '../types';
import { createUnitModel, createBuildingModel, createResourceProp, EgyptianMaterialLibrary } from './models';
import { MAP_WIDTH, MAP_HEIGHT } from '../map';

// Scaling factor from simulation map units (2400x1800) to 3D scene units (~240x180)
export const WORLD_SCALE = 0.1;

export class RTS3DScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  // 3D Objects Maps
  private unitMeshes: Map<string, THREE.Group> = new Map();
  private buildingMeshes: Map<string, THREE.Group> = new Map();
  private resourceMeshes: Map<string, THREE.Group> = new Map();
  private projectileMeshes: Map<string, THREE.Mesh> = new Map();
  private godPowerMeshes: Map<string, THREE.Group> = new Map();

  // Selection Indicators
  private selectionRings: THREE.Group;
  private waypointMesh: THREE.Mesh;

  // Terrain & Water
  private terrainMesh!: THREE.Mesh;
  private waterMesh!: THREE.Mesh;
  public terrainPlane!: THREE.Plane;

  // Raycaster for mouse interaction
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundRaycastMesh!: THREE.Mesh;

  // Camera Control Target
  public cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 48, 36);

  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // 1. Atmosphere & Fog
    this.scene.background = new THREE.Color(0xd9b375);
    this.scene.fog = new THREE.FogExp2(0xd9b375, 0.0045);

    // 2. Camera Setup (Isometric RTS Angle ~50 degrees)
    const aspect = canvas.clientWidth / canvas.clientHeight || 1.6;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
    this.camera.position.set(0, 48, 36);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer Setup (PBR & Shadows)
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.handleResize();

    // 4. Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Terrain & Flowing Nile River
    this.buildTerrain();

    // 7. Selection Rings & Waypoints
    this.selectionRings = new THREE.Group();
    this.scene.add(this.selectionRings);

    const wayGeo = new THREE.RingGeometry(0.8, 1.2, 16);
    const wayMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    this.waypointMesh = new THREE.Mesh(wayGeo, wayMat);
    this.waypointMesh.rotation.x = -Math.PI / 2;
    this.waypointMesh.position.y = 0.05;
    this.waypointMesh.visible = false;
    this.scene.add(this.waypointMesh);
  }

  public handleResize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(dpr);
  }

  private setupLighting() {
    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xfff1cf, 2.2);
    sunLight.position.set(60, 90, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 250;
    sunLight.shadow.camera.left = -90;
    sunLight.shadow.camera.right = 90;
    sunLight.shadow.camera.top = 90;
    sunLight.shadow.camera.bottom = -90;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    this.scene.add(sunLight);

    // Sky / Ground Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0xca8a04, 0.85);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);
  }

  private buildTerrain() {
    const terrainW = 300;
    const terrainH = 220;

    // 1. Procedural Sand Dune Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(terrainW, terrainH, 64, 48);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle sand dunes
      const dune = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 1.8 + Math.sin(x * 0.08 + z * 0.06) * 0.8;
      pos.setY(i, dune);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xdfc488,
      roughness: 0.9,
      metalness: 0.05,
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Invisible ground plane for raycasting
    this.groundRaycastMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(terrainW * 1.5, terrainH * 1.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.groundRaycastMesh.rotateX(-Math.PI / 2);
    this.scene.add(this.groundRaycastMesh);

    // 2. Turquoise Nile River Flowing Across the Valley
    const waterCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 0.1, -100),
      new THREE.Vector3(-5, 0.1, -50),
      new THREE.Vector3(-18, 0.1, 0),
      new THREE.Vector3(5, 0.1, 50),
      new THREE.Vector3(12, 0.1, 100),
    ]);
    const waterGeo = new THREE.TubeGeometry(waterCurve, 32, 11, 8, false);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.88,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.scale.y = 0.08;
    this.scene.add(this.waterMesh);

    // Fertile green silt banks around water
    const bankGeo = new THREE.TubeGeometry(waterCurve, 32, 18, 8, false);
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.85,
    });
    const bankMesh = new THREE.Mesh(bankGeo, bankMat);
    bankMesh.scale.y = 0.04;
    bankMesh.position.y = -0.02;
    this.scene.add(bankMesh);

    // Natural Desert Sandstone Cliffs on boundaries
    this.buildBoundaryMesas(terrainW, terrainH);
  }

  private buildBoundaryMesas(w: number, h: number) {
    const mesaMat = EgyptianMaterialLibrary.darkSandstone;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = Math.min(w, h) * 0.48 + Math.random() * 20;
      const mesaGeo = new THREE.CylinderGeometry(
        6 + Math.random() * 6,
        10 + Math.random() * 8,
        14 + Math.random() * 10,
        5
      );
      const mesa = new THREE.Mesh(mesaGeo, mesaMat);
      mesa.position.set(Math.cos(a) * r, 7, Math.sin(a) * r);
      mesa.castShadow = true;
      mesa.receiveShadow = true;
      this.scene.add(mesa);
    }
  }

  public worldSimTo3D(simPos: Vec2): THREE.Vector3 {
    return new THREE.Vector3(
      (simPos.x - MAP_WIDTH / 2) * WORLD_SCALE,
      0,
      (simPos.y - MAP_HEIGHT / 2) * WORLD_SCALE
    );
  }

  public world3DToSim(world3D: THREE.Vector3): Vec2 {
    return {
      x: world3D.x / WORLD_SCALE + MAP_WIDTH / 2,
      y: world3D.z / WORLD_SCALE + MAP_HEIGHT / 2,
    };
  }

  /**
   * Raycast from mouse screen coordinates to 3D ground plane
   */
  public raycastGround(screenX: number, screenY: number): THREE.Vector3 | null {
    const rect = this.canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.groundRaycastMesh);
    if (hits.length > 0) {
      return hits[0].point;
    }
    return null;
  }

  /**
   * Synchronize all 2D simulation entities with Three.js 3D meshes
   */
  public updateEntities(
    units: Unit[],
    buildings: Building[],
    resources: ResourceNode[],
    projectiles: Projectile[],
    godPowers: GodPowerEffect[],
    selectedUnitIds: Set<string>,
    selectedBuildingId: string | null,
    dt: number
  ) {
    this.time += dt;

    // 1. Synchronize Units
    const activeUnitIds = new Set(units.map((u) => u.id));
    // Remove dead unit meshes
    for (const [id, mesh] of this.unitMeshes.entries()) {
      if (!activeUnitIds.has(id)) {
        this.scene.remove(mesh);
        this.unitMeshes.delete(id);
      }
    }
    // Update or create unit meshes
    for (const u of units) {
      let mesh = this.unitMeshes.get(u.id);
      if (!mesh) {
        mesh = createUnitModel(u.type, u.faction);
        this.scene.add(mesh);
        this.unitMeshes.set(u.id, mesh);
      }

      const p3 = this.worldSimTo3D(u.pos);
      mesh.position.set(p3.x, 0, p3.z);
      // Rotation towards movement angle
      mesh.rotation.y = -u.angle + Math.PI / 2;

      // Walking bounce / sway
      if (u.state === 'MOVE' || u.state === 'GATHER' || u.state === 'BUILD') {
        mesh.position.y = Math.abs(Math.sin(u.walkFrame)) * 0.15;
      } else {
        mesh.position.y = 0;
      }
    }

    // 2. Synchronize Buildings
    const activeBldIds = new Set(buildings.map((b) => b.id));
    for (const [id, mesh] of this.buildingMeshes.entries()) {
      if (!activeBldIds.has(id)) {
        this.scene.remove(mesh);
        this.buildingMeshes.delete(id);
      }
    }
    for (const b of buildings) {
      let mesh = this.buildingMeshes.get(b.id);
      if (!mesh) {
        mesh = createBuildingModel(b.type, b.faction);
        this.scene.add(mesh);
        this.buildingMeshes.set(b.id, mesh);
      }

      const p3 = this.worldSimTo3D(b.pos);
      mesh.position.set(p3.x, 0, p3.z);
      // Construction progress scale
      if (!b.isConstructed) {
        mesh.scale.set(1, Math.max(0.2, b.buildProgress), 1);
      } else {
        mesh.scale.set(1, 1, 1);
      }
    }

    // 3. Synchronize Resources
    if (this.resourceMeshes.size === 0) {
      for (const res of resources) {
        const mesh = createResourceProp(res.type);
        const p3 = this.worldSimTo3D(res.pos);
        mesh.position.set(p3.x, 0, p3.z);
        mesh.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(mesh);
        this.resourceMeshes.set(res.id, mesh);
      }
    } else {
      // Remove depleted resource props
      for (const res of resources) {
        if (res.remaining <= 0) {
          const mesh = this.resourceMeshes.get(res.id);
          if (mesh) {
            this.scene.remove(mesh);
            this.resourceMeshes.delete(res.id);
          }
        }
      }
    }

    // 4. Synchronize 3D Flying Projectiles (Arrows with parabolic arc)
    const activeProjIds = new Set(projectiles.map((p) => p.id));
    for (const [id, mesh] of this.projectileMeshes.entries()) {
      if (!activeProjIds.has(id)) {
        this.scene.remove(mesh);
        this.projectileMeshes.delete(id);
      }
    }
    for (const p of projectiles) {
      let mesh = this.projectileMeshes.get(p.id);
      if (!mesh) {
        const geo = new THREE.ConeGeometry(0.12, 0.8, 4);
        const mat = new THREE.MeshBasicMaterial({ color: p.isFire ? 0xf97316 : 0xffffff });
        mesh = new THREE.Mesh(geo, mat);
        this.scene.add(mesh);
        this.projectileMeshes.set(p.id, mesh);
      }

      const curSimX = p.pos.x + (p.targetPos.x - p.pos.x) * p.progress;
      const curSimY = p.pos.y + (p.targetPos.y - p.pos.y) * p.progress;
      const arcY = Math.sin(p.progress * Math.PI) * (p.arcHeight * WORLD_SCALE * 1.5);
      const p3 = this.worldSimTo3D({ x: curSimX, y: curSimY });
      mesh.position.set(p3.x, arcY + 0.5, p3.z);
    }

    // 5. Update Selection Rings
    this.updateSelectionIndicators(units, buildings, selectedUnitIds, selectedBuildingId);

    // 6. Smooth Camera Damping
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      this.cameraTarget.x + this.cameraOffset.x,
      6,
      dt
    );
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      this.cameraTarget.y + this.cameraOffset.y,
      6,
      dt
    );
    this.camera.position.z = THREE.MathUtils.damp(
      this.camera.position.z,
      this.cameraTarget.z + this.cameraOffset.z,
      6,
      dt
    );
    this.camera.lookAt(this.cameraTarget);

    // 7. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updateSelectionIndicators(
    units: Unit[],
    buildings: Building[],
    selectedUnitIds: Set<string>,
    selectedBuildingId: string | null
  ) {
    // Clear old rings
    while (this.selectionRings.children.length > 0) {
      this.selectionRings.remove(this.selectionRings.children[0]);
    }

    // Selected Units
    for (const u of units) {
      if (selectedUnitIds.has(u.id)) {
        const p3 = this.worldSimTo3D(u.pos);
        const ringGeo = new THREE.RingGeometry(0.9, 1.15, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: u.faction === 'PLAYER' ? 0x38bdf8 : 0xef4444,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p3.x, 0.08, p3.z);
        this.selectionRings.add(ring);
      }
    }

    // Selected Building
    if (selectedBuildingId) {
      const b = buildings.find((bld) => bld.id === selectedBuildingId);
      if (b) {
        const p3 = this.worldSimTo3D(b.pos);
        const radius = b.size * WORLD_SCALE * 1.3;
        const ringGeo = new THREE.RingGeometry(radius * 0.92, radius, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: b.faction === 'PLAYER' ? 0x38bdf8 : 0xef4444,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p3.x, 0.08, p3.z);
        this.selectionRings.add(ring);
      }
    }
  }

  public showWaypoint(worldPos: THREE.Vector3) {
    this.waypointMesh.position.set(worldPos.x, 0.06, worldPos.z);
    this.waypointMesh.visible = true;
    setTimeout(() => {
      this.waypointMesh.visible = false;
    }, 600);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
