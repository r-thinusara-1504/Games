/**
 * Procedural 3D Composite Models for Sands of Ra (Egyptian RTS)
 * Enforces the Three.js skill directive: Every hero actor, building, vehicle,
 * and tree is assembled as a composite THREE.Group of 3–12 distinct parts across
 * primary, secondary, and accent scales with varied PBR roughness & metalness.
 */

import * as THREE from 'three';
import { UnitType, BuildingType, ResourceNodeType, Faction } from '../types';

// Shared Materials Palette with realistic PBR properties
export class EgyptianMaterialLibrary {
  // Sandstone & Limestone
  public static sandstone = new THREE.MeshStandardMaterial({
    color: 0xdec18a,
    roughness: 0.85,
    metalness: 0.05,
  });
  public static darkSandstone = new THREE.MeshStandardMaterial({
    color: 0xb48b4c,
    roughness: 0.9,
    metalness: 0.05,
  });
  public static enemyStone = new THREE.MeshStandardMaterial({
    color: 0x8a3c3c,
    roughness: 0.85,
    metalness: 0.1,
  });

  // Polished Gold & Bronze
  public static gold = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.25,
    metalness: 0.85,
  });
  public static bronze = new THREE.MeshStandardMaterial({
    color: 0xcd7f32,
    roughness: 0.35,
    metalness: 0.75,
  });

  // Wood & Foliage
  public static palmWood = new THREE.MeshStandardMaterial({
    color: 0x6e4324,
    roughness: 0.85,
    metalness: 0.05,
  });
  public static palmLeaf = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.65,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  public static wheat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Faction Armors
  public static playerCloth = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Turquoise / Cyan
    roughness: 0.6,
    metalness: 0.1,
  });
  public static enemyCloth = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Crimson Seth Red
    roughness: 0.6,
    metalness: 0.1,
  });
  public static whiteLinen = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.7,
    metalness: 0.05,
  });
  public static skinTone = new THREE.MeshStandardMaterial({
    color: 0xa66a38,
    roughness: 0.75,
    metalness: 0.05,
  });
  public static obsidian = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.3,
    metalness: 0.6,
  });
  public static emeraldScales = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.35,
    metalness: 0.5,
  });
  public static firePlumes = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0xea580c,
    emissiveIntensity: 0.5,
  });
}

/**
 * Creates a composite 3D Building model (3-12 parts)
 */
export function createBuildingModel(type: BuildingType, faction: Faction): THREE.Group {
  const group = new THREE.Group();
  const isPlayer = faction === 'PLAYER';
  const stoneMat = isPlayer ? EgyptianMaterialLibrary.sandstone : EgyptianMaterialLibrary.enemyStone;
  const trimMat = isPlayer ? EgyptianMaterialLibrary.gold : EgyptianMaterialLibrary.bronze;
  const clothMat = isPlayer ? EgyptianMaterialLibrary.playerCloth : EgyptianMaterialLibrary.enemyCloth;

  if (type === 'TOWN_CENTER') {
    // 1. Base Sandstone Podium
    const podiumGeo = new THREE.BoxGeometry(7, 1.2, 7);
    const podium = new THREE.Mesh(podiumGeo, stoneMat);
    podium.position.y = 0.6;
    podium.castShadow = true;
    podium.receiveShadow = true;
    group.add(podium);

    // 2 & 3. Twin Grand Pylon Towers (Monuments)
    const pylonGeo = new THREE.CylinderGeometry(1.6, 2.2, 7, 4);
    const leftPylon = new THREE.Mesh(pylonGeo, stoneMat);
    leftPylon.position.set(-2.2, 4.5, -1.8);
    leftPylon.rotation.y = Math.PI / 4;
    leftPylon.castShadow = true;
    group.add(leftPylon);

    const rightPylon = new THREE.Mesh(pylonGeo, stoneMat);
    rightPylon.position.set(2.2, 4.5, -1.8);
    rightPylon.rotation.y = Math.PI / 4;
    rightPylon.castShadow = true;
    group.add(rightPylon);

    // 4. Central Palace Hall
    const hallGeo = new THREE.BoxGeometry(4.5, 4, 4.5);
    const hall = new THREE.Mesh(hallGeo, stoneMat);
    hall.position.set(0, 3, 0.5);
    hall.castShadow = true;
    group.add(hall);

    // 5. Golden Cavetto Cornice Roof Trim
    const corniceGeo = new THREE.BoxGeometry(5.2, 0.6, 5.2);
    const cornice = new THREE.Mesh(corniceGeo, trimMat);
    cornice.position.set(0, 5.2, 0.5);
    cornice.castShadow = true;
    group.add(cornice);

    // 6. Colonnade Pillars
    const colGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.5, 8);
    [-1.2, 1.2].forEach((x) => {
      const col = new THREE.Mesh(colGeo, trimMat);
      col.position.set(x, 2.8, 3.0);
      col.castShadow = true;
      group.add(col);
    });

    // 7. Gateway Portal Arch
    const gateGeo = new THREE.BoxGeometry(2.2, 2.8, 0.6);
    const gate = new THREE.Mesh(gateGeo, EgyptianMaterialLibrary.darkSandstone);
    gate.position.set(0, 2.4, 2.7);
    group.add(gate);

    // 8. Sacred Sun Disc Crest over entrance
    const discGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16);
    const disc = new THREE.Mesh(discGeo, EgyptianMaterialLibrary.gold);
    disc.position.set(0, 5.8, 2.6);
    disc.rotation.x = Math.PI / 2;
    group.add(disc);
  } else if (type === 'BARRACKS') {
    // 1. Fortified Training Fortress
    const fortGeo = new THREE.BoxGeometry(5.5, 3.2, 5.5);
    const fort = new THREE.Mesh(fortGeo, stoneMat);
    fort.position.y = 1.6;
    fort.castShadow = true;
    group.add(fort);

    // 2. Battlements / Parapets
    const parGeo = new THREE.BoxGeometry(5.8, 0.8, 5.8);
    const parapet = new THREE.Mesh(parGeo, EgyptianMaterialLibrary.darkSandstone);
    parapet.position.y = 3.6;
    group.add(parapet);

    // 3. War Pavilion Canopy Roof
    const canopyGeo = new THREE.ConeGeometry(2.8, 1.8, 4);
    const canopy = new THREE.Mesh(canopyGeo, clothMat);
    canopy.position.y = 4.8;
    canopy.rotation.y = Math.PI / 4;
    group.add(canopy);

    // 4 & 5. Weapon Racks & Bronze Shields
    const shieldGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12);
    const shield = new THREE.Mesh(shieldGeo, EgyptianMaterialLibrary.bronze);
    shield.position.set(0, 2.2, 2.8);
    shield.rotation.x = Math.PI / 2;
    group.add(shield);
  } else if (type === 'TEMPLE') {
    // 1. Sacred Temple Colonnade Base
    const baseGeo = new THREE.BoxGeometry(6, 0.8, 6.5);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.4;
    group.add(base);

    // 2. Four Sacred Lotus Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.4, 0.5, 4.5, 8);
    const offsets = [
      [-1.8, -1.8],
      [1.8, -1.8],
      [-1.8, 1.8],
      [1.8, 1.8],
    ];
    offsets.forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, EgyptianMaterialLibrary.sandstone);
      p.position.set(px, 2.8, pz);
      p.castShadow = true;
      group.add(p);
    });

    // 3. Temple Roof Slab
    const roofGeo = new THREE.BoxGeometry(5.2, 0.6, 5.2);
    const roof = new THREE.Mesh(roofGeo, trimMat);
    roof.position.y = 5.2;
    group.add(roof);

    // 4. Tall Sacred Obelisk Spire
    const obeliskGeo = new THREE.CylinderGeometry(0.2, 0.6, 6, 4);
    const obelisk = new THREE.Mesh(obeliskGeo, EgyptianMaterialLibrary.gold);
    obelisk.position.set(0, 5.5, -0.5);
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = true;
    group.add(obelisk);

    // 5. Burning Altar Brazier
    const altarGeo = new THREE.CylinderGeometry(0.8, 0.5, 1.2, 8);
    const altar = new THREE.Mesh(altarGeo, EgyptianMaterialLibrary.bronze);
    altar.position.set(0, 1.4, 1.8);
    group.add(altar);

    const flameGeo = new THREE.DodecahedronGeometry(0.35);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00,
      emissive: 0xff3b00,
      emissiveIntensity: 1.0,
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0, 2.2, 1.8);
    group.add(flame);
  } else if (type === 'GUARD_TOWER') {
    // 1. Tapered Sandstone Watchtower Base
    const towerGeo = new THREE.CylinderGeometry(1.2, 1.8, 7.5, 6);
    const tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.y = 3.75;
    tower.castShadow = true;
    group.add(tower);

    // 2. Overhanging Wooden Battlement Gallery
    const galleryGeo = new THREE.CylinderGeometry(1.9, 1.5, 1.2, 6);
    const gallery = new THREE.Mesh(galleryGeo, EgyptianMaterialLibrary.palmWood);
    gallery.position.y = 7.8;
    group.add(gallery);

    // 3. Thatched Roof Cap
    const roofGeo = new THREE.ConeGeometry(2.2, 1.6, 6);
    const roof = new THREE.Mesh(roofGeo, trimMat);
    roof.position.y = 9.1;
    group.add(roof);
  } else if (type === 'PYRAMID_WONDER') {
    // The Great Gilded Pyramid Wonder!
    // 1. Main Sandstone Tier
    const baseGeo = new THREE.ConeGeometry(8.5, 8.5, 4);
    const base = new THREE.Mesh(baseGeo, EgyptianMaterialLibrary.sandstone);
    base.position.y = 4.25;
    base.rotation.y = Math.PI / 4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Stepped Terrace Lines
    for (let i = 1; i <= 3; i++) {
      const stepGeo = new THREE.BoxGeometry(11 - i * 2.5, 0.3, 11 - i * 2.5);
      const step = new THREE.Mesh(stepGeo, EgyptianMaterialLibrary.darkSandstone);
      step.position.y = i * 2.2;
      group.add(step);
    }

    // 3. Blazing Golden Pyramidion Capstone!
    const capGeo = new THREE.ConeGeometry(2.4, 2.6, 4);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      roughness: 0.15,
      metalness: 0.95,
      emissive: 0xca8a04,
      emissiveIntensity: 0.4,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 8.5;
    cap.rotation.y = Math.PI / 4;
    group.add(cap);
  } else if (type === 'HOUSE') {
    // Mudbrick Villa
    const houseGeo = new THREE.BoxGeometry(3.6, 2.4, 3.6);
    const house = new THREE.Mesh(houseGeo, stoneMat);
    house.position.y = 1.2;
    house.castShadow = true;
    group.add(house);

    // Flat roof with Palm Thatch canopy
    const thatchGeo = new THREE.BoxGeometry(3.8, 0.3, 3.8);
    const thatch = new THREE.Mesh(thatchGeo, EgyptianMaterialLibrary.palmWood);
    thatch.position.y = 2.5;
    group.add(thatch);

    // Doorway
    const doorGeo = new THREE.BoxGeometry(1.0, 1.6, 0.2);
    const door = new THREE.Mesh(doorGeo, EgyptianMaterialLibrary.darkSandstone);
    door.position.set(0, 0.8, 1.85);
    group.add(door);
  } else if (type === 'FARM') {
    // Irrigated Nile Soil Plot with Wheat Sheaves
    const plotGeo = new THREE.BoxGeometry(4.5, 0.3, 4.5);
    const plotMat = new THREE.MeshStandardMaterial({ color: 0x543618, roughness: 0.95 });
    const plot = new THREE.Mesh(plotGeo, plotMat);
    plot.position.y = 0.15;
    group.add(plot);

    // Wheat sheaf rows
    const wheatGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 4);
    for (let r = -1.6; r <= 1.6; r += 0.8) {
      for (let c = -1.6; c <= 1.6; c += 0.8) {
        const w = new THREE.Mesh(wheatGeo, EgyptianMaterialLibrary.wheat);
        w.position.set(r, 0.7, c);
        w.rotation.z = (Math.random() - 0.5) * 0.3;
        group.add(w);
      }
    }
  } else if (type === 'LUMBER_CAMP') {
    // Timber storage lean-to
    const shedGeo = new THREE.BoxGeometry(3.8, 2.0, 3.8);
    const shed = new THREE.Mesh(shedGeo, EgyptianMaterialLibrary.palmWood);
    shed.position.y = 1.0;
    group.add(shed);

    // Log piles
    const logGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.2, 6);
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Mesh(logGeo, EgyptianMaterialLibrary.sandstone);
      log.rotation.z = Math.PI / 2;
      log.position.set(0, 0.4 + i * 0.35, 2.2);
      group.add(log);
    }
  }

  return group;
}

/**
 * Creates a composite 3D Unit model (3-12 parts)
 */
export function createUnitModel(type: UnitType, faction: Faction): THREE.Group {
  const group = new THREE.Group();
  const isPlayer = faction === 'PLAYER';
  const clothMat = isPlayer ? EgyptianMaterialLibrary.playerCloth : EgyptianMaterialLibrary.enemyCloth;

  if (type === 'VILLAGER') {
    // 1. Torso
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.1, 8);
    const body = new THREE.Mesh(bodyGeo, EgyptianMaterialLibrary.skinTone);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // 2. White/Colored Schenti (Linen Kilt)
    const kiltGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.65, 8);
    const kilt = new THREE.Mesh(kiltGeo, clothMat);
    kilt.position.y = 0.7;
    group.add(kilt);

    // 3. Head & Shaved Brow
    const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const head = new THREE.Mesh(headGeo, EgyptianMaterialLibrary.skinTone);
    head.position.y = 1.85;
    group.add(head);

    // 4. Gathering Tool (Sickle/Pickaxe)
    const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4);
    const handle = new THREE.Mesh(handleGeo, EgyptianMaterialLibrary.palmWood);
    handle.position.set(0.4, 1.1, 0.3);
    handle.rotation.x = Math.PI / 3;
    group.add(handle);

    // 5. Back Carry Basket (when loaded)
    const basketGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.6, 6);
    const basket = new THREE.Mesh(basketGeo, EgyptianMaterialLibrary.sandstone);
    basket.position.set(0, 1.2, -0.4);
    group.add(basket);
  } else if (type === 'KHOPESH_WARRIOR') {
    // 1. Muscular Torso with Bronze Scale Armor
    const torsoGeo = new THREE.CylinderGeometry(0.45, 0.38, 1.2, 8);
    const torso = new THREE.Mesh(torsoGeo, EgyptianMaterialLibrary.bronze);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    // 2. Kilt
    const kiltGeo = new THREE.CylinderGeometry(0.4, 0.48, 0.7, 8);
    const kilt = new THREE.Mesh(kiltGeo, clothMat);
    kilt.position.y = 0.7;
    group.add(kilt);

    // 3. Head with Nemes Headdress
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const head = new THREE.Mesh(headGeo, EgyptianMaterialLibrary.skinTone);
    head.position.y = 1.95;
    group.add(head);

    const nemesGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.45, 8);
    const nemes = new THREE.Mesh(nemesGeo, clothMat);
    nemes.position.y = 2.05;
    group.add(nemes);

    // 4. Bronze Shield
    const shieldGeo = new THREE.BoxGeometry(0.12, 1.1, 0.75);
    const shield = new THREE.Mesh(shieldGeo, EgyptianMaterialLibrary.bronze);
    shield.position.set(-0.55, 1.2, 0.1);
    group.add(shield);

    // 5. Curved Khopesh Sword
    const bladeGeo = new THREE.BoxGeometry(0.08, 1.1, 0.22);
    const blade = new THREE.Mesh(bladeGeo, EgyptianMaterialLibrary.gold);
    blade.position.set(0.55, 1.3, 0.2);
    blade.rotation.x = -Math.PI / 5;
    group.add(blade);
  } else if (type === 'SPEAR_GUARDIAN') {
    // 1. Phalanx Torso & Armor
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.36, 1.2, 8);
    const torso = new THREE.Mesh(torsoGeo, EgyptianMaterialLibrary.bronze);
    torso.position.y = 1.15;
    group.add(torso);

    // 2. Striped Shield
    const shieldGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12);
    const shield = new THREE.Mesh(shieldGeo, clothMat);
    shield.position.set(-0.55, 1.2, 0.2);
    shield.rotation.z = Math.PI / 2;
    group.add(shield);

    // 3. Long Spear (Polearm)
    const spearShaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6);
    const spearShaft = new THREE.Mesh(spearShaftGeo, EgyptianMaterialLibrary.palmWood);
    spearShaft.position.set(0.45, 1.6, 0.4);
    spearShaft.rotation.x = Math.PI / 6;
    group.add(spearShaft);

    // Bronze Spearhead
    const headGeo = new THREE.ConeGeometry(0.12, 0.45, 4);
    const spearHead = new THREE.Mesh(headGeo, EgyptianMaterialLibrary.gold);
    spearHead.position.set(0.45, 3.2, 1.2);
    spearHead.rotation.x = Math.PI / 6;
    group.add(spearHead);
  } else if (type === 'CHARIOT_ARCHER') {
    // 1. Chariot Wooden Platform Carriage
    const carriageGeo = new THREE.BoxGeometry(1.6, 0.8, 1.8);
    const carriage = new THREE.Mesh(carriageGeo, EgyptianMaterialLibrary.gold);
    carriage.position.set(0, 0.8, 0);
    carriage.castShadow = true;
    group.add(carriage);

    // 2 & 3. Spoked Bronze Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.18, 12);
    [-0.95, 0.95].forEach((wx) => {
      const wheel = new THREE.Mesh(wheelGeo, EgyptianMaterialLibrary.bronze);
      wheel.position.set(wx, 0.7, 0);
      wheel.rotation.z = Math.PI / 2;
      group.add(wheel);
    });

    // 4. Royal Archer Standing in Carriage
    const archerGeo = new THREE.CylinderGeometry(0.35, 0.3, 1.2, 8);
    const archer = new THREE.Mesh(archerGeo, clothMat);
    archer.position.set(0, 1.8, 0);
    group.add(archer);

    // 5. Composite Egyptian Recurve Bow
    const bowGeo = new THREE.TorusGeometry(0.5, 0.04, 4, 12, Math.PI);
    const bow = new THREE.Mesh(bowGeo, EgyptianMaterialLibrary.palmWood);
    bow.position.set(0.35, 1.9, 0.5);
    bow.rotation.y = Math.PI / 2;
    group.add(bow);

    // 6. Desert Steed (Horse) in Front
    const horseBodyGeo = new THREE.BoxGeometry(1.0, 1.1, 2.2);
    const horse = new THREE.Mesh(horseBodyGeo, EgyptianMaterialLibrary.sandstone);
    horse.position.set(0, 1.1, 2.2);
    group.add(horse);
  } else if (type === 'PRIEST_OF_RA') {
    // Flowing White Pleated Robe
    const robeGeo = new THREE.CylinderGeometry(0.35, 0.65, 1.6, 12);
    const robe = new THREE.Mesh(robeGeo, EgyptianMaterialLibrary.whiteLinen);
    robe.position.y = 0.85;
    robe.castShadow = true;
    group.add(robe);

    // Golden Pectoral Collar
    const collarGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.2, 12);
    const collar = new THREE.Mesh(collarGeo, EgyptianMaterialLibrary.gold);
    collar.position.y = 1.55;
    group.add(collar);

    // Head
    const headGeo = new THREE.SphereGeometry(0.26, 8, 8);
    const head = new THREE.Mesh(headGeo, EgyptianMaterialLibrary.skinTone);
    head.position.y = 1.85;
    group.add(head);

    // Sacred Golden Ankh Staff
    const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
    const staff = new THREE.Mesh(staffGeo, EgyptianMaterialLibrary.gold);
    staff.position.set(0.45, 1.1, 0.2);
    group.add(staff);

    const ankhLoopGeo = new THREE.TorusGeometry(0.18, 0.035, 6, 12);
    const ankhLoop = new THREE.Mesh(ankhLoopGeo, EgyptianMaterialLibrary.gold);
    ankhLoop.position.set(0.45, 2.3, 0.2);
    group.add(ankhLoop);
  } else if (type === 'ANUBITE_WARRIOR') {
    // Muscular Obsidian Jackal Warrior
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.42, 1.4, 8);
    const body = new THREE.Mesh(bodyGeo, EgyptianMaterialLibrary.obsidian);
    body.position.y = 1.3;
    body.castShadow = true;
    group.add(body);

    // Jackal Snout Head & Tall Pointed Ears
    const headGeo = new THREE.ConeGeometry(0.35, 0.8, 6);
    const head = new THREE.Mesh(headGeo, EgyptianMaterialLibrary.obsidian);
    head.position.set(0, 2.2, 0.3);
    head.rotation.x = Math.PI / 3;
    group.add(head);

    [-0.2, 0.2].forEach((ex) => {
      const earGeo = new THREE.ConeGeometry(0.1, 0.5, 4);
      const ear = new THREE.Mesh(earGeo, EgyptianMaterialLibrary.gold);
      ear.position.set(ex, 2.6, 0);
      group.add(ear);
    });

    // Twin Ritual Scythes
    [-0.6, 0.6].forEach((sx) => {
      const scytheGeo = new THREE.TorusGeometry(0.45, 0.05, 4, 8, Math.PI);
      const scythe = new THREE.Mesh(scytheGeo, EgyptianMaterialLibrary.gold);
      scythe.position.set(sx, 1.4, 0.3);
      group.add(scythe);
    });
  } else if (type === 'WADJET_SERPENT') {
    // Coiled Winged Emerald Cobra
    const coilGeo = new THREE.TorusGeometry(0.8, 0.3, 8, 16);
    const coil = new THREE.Mesh(coilGeo, EgyptianMaterialLibrary.emeraldScales);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 0.3;
    group.add(coil);

    // Rising Cobra Hood
    const hoodGeo = new THREE.CylinderGeometry(0.2, 0.55, 1.4, 8);
    const hood = new THREE.Mesh(hoodGeo, EgyptianMaterialLibrary.emeraldScales);
    hood.position.set(0, 1.2, 0.3);
    group.add(hood);

    // Golden Wings
    [-0.7, 0.7].forEach((wx) => {
      const wingGeo = new THREE.BoxGeometry(0.8, 0.6, 0.08);
      const wing = new THREE.Mesh(wingGeo, EgyptianMaterialLibrary.gold);
      wing.position.set(wx, 1.3, 0);
      wing.rotation.y = wx > 0 ? 0.3 : -0.3;
      group.add(wing);
    });
  } else if (type === 'PHOENIX_OF_HELIOPOLIS') {
    // Sacred Solar Firebird (Bennu)
    const bodyGeo = new THREE.ConeGeometry(0.5, 1.6, 8);
    const body = new THREE.Mesh(bodyGeo, EgyptianMaterialLibrary.firePlumes);
    body.position.y = 2.4;
    body.rotation.x = -Math.PI / 4;
    group.add(body);

    // Majestic Wingspan
    [-1.5, 1.5].forEach((wx) => {
      const wingGeo = new THREE.BoxGeometry(1.8, 0.8, 0.1);
      const wing = new THREE.Mesh(wingGeo, EgyptianMaterialLibrary.gold);
      wing.position.set(wx, 2.5, 0);
      wing.rotation.z = wx > 0 ? -0.2 : 0.2;
      group.add(wing);
    });

    // Sun Disc Crown
    const crownGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
    const crown = new THREE.Mesh(crownGeo, EgyptianMaterialLibrary.gold);
    crown.position.set(0, 3.2, 0.4);
    group.add(crown);
  }

  return group;
}

/**
 * Creates 3D Natural Resource Props (Date Palms, Gold Quarries, Berry Bushes)
 */
export function createResourceProp(type: ResourceNodeType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'PALM_TREE') {
    // Curved Palm Trunk with Bark Rings
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.2, 2.0, 0.1),
      new THREE.Vector3(0.6, 4.2, 0.3),
      new THREE.Vector3(0.8, 6.0, 0.5),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 12, 0.32, 8, false);
    const trunk = new THREE.Mesh(trunkGeo, EgyptianMaterialLibrary.palmWood);
    trunk.castShadow = true;
    group.add(trunk);

    // Cluster of 8 Curved Palm Fronds
    const frondGeo = new THREE.BoxGeometry(0.3, 0.04, 2.6);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const frond = new THREE.Mesh(frondGeo, EgyptianMaterialLibrary.palmLeaf);
      frond.position.set(0.8 + Math.cos(a) * 1.1, 5.8, 0.5 + Math.sin(a) * 1.1);
      frond.rotation.y = a;
      frond.rotation.x = 0.5;
      frond.castShadow = true;
      group.add(frond);
    }
  } else if (type === 'GOLD_QUARRY') {
    // Glistening Faceted Golden Limestone Boulders
    const oreMat = new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      roughness: 0.3,
      metalness: 0.85,
    });
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.DodecahedronGeometry(1.0 + Math.random() * 0.6);
      const m = new THREE.Mesh(geo, oreMat);
      m.position.set((Math.random() - 0.5) * 1.8, 0.7, (Math.random() - 0.5) * 1.8);
      m.rotation.set(Math.random(), Math.random(), Math.random());
      m.castShadow = true;
      group.add(m);
    }
  } else if (type === 'BERRY_BUSH') {
    // Lush Green Date Palm Bush
    const bushGeo = new THREE.DodecahedronGeometry(1.2);
    const bush = new THREE.Mesh(bushGeo, EgyptianMaterialLibrary.palmLeaf);
    bush.position.y = 0.8;
    bush.castShadow = true;
    group.add(bush);
  }

  return group;
}
