/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RTSSimulation } from './rts/simulation';
import { RTS3DScene } from './rts/three/scene';
import { rtsAudio } from './rts/audio';
import {
  Unit,
  Building,
  BuildingType,
  UnitType,
  GodPowerType,
  Vec2,
  Resources,
  Age,
} from './rts/types';
import { MAP_WIDTH, MAP_HEIGHT, generateResourceNodes } from './rts/map';
import { RTSHUD } from './components/RTSHUD';
import { RTSTitleScreen } from './components/RTSTitleScreen';
import { PauseModal, VictoryModal, DefeatModal, CompendiumModal } from './rts/RTSModals';

type GameScreen = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'DEFEAT';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<RTSSimulation | null>(null);
  const scene3DRef = useRef<RTS3DScene | null>(null);

  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [isMuted, setIsMuted] = useState<boolean>(rtsAudio.getMuted());
  const [showCompendium, setShowCompendium] = useState<boolean>(false);

  // Selected Entities
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Active Modes
  const [activeGodPower, setActiveGodPower] = useState<GodPowerType | null>(null);
  const [placingBuildingType, setPlacingBuildingType] = useState<BuildingType | null>(null);

  // Drag selection box state (Screen pixel coordinates)
  const dragStartRef = useRef<Vec2 | null>(null);
  const dragCurrentRef = useRef<Vec2 | null>(null);
  const [dragBox, setDragBox] = useState<{ start: Vec2; current: Vec2 } | null>(null);

  // Camera panning keys
  const keysHeld = useRef<Record<string, boolean>>({});

  // Reactive UI state for HUD
  const [resources, setResources] = useState<Resources>({
    food: 200,
    wood: 250,
    gold: 150,
    favor: 15,
    population: 3,
    maxPopulation: 15,
  });
  const [age, setAge] = useState<Age>('ARCHAIC_AGE');
  const [ageAdvanceProgress, setAgeAdvanceProgress] = useState<number | null>(null);
  const [wonderTimer, setWonderTimer] = useState<number | null>(null);
  const [gameTime, setGameTime] = useState<number>(0);
  const [godPowerCooldowns, setGodPowerCooldowns] = useState<Record<GodPowerType, number>>({
    SOLAR_WRATH: 0,
    NILE_BLOOM: 0,
    LOCUST_SWARM: 0,
    ECLIPSE: 0,
  });
  const [cameraPos, setCameraPos] = useState<Vec2>({ x: 300, y: 1200 });

  // Initialize Simulation & 3D Three.js Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = new RTSSimulation();
    sim.resourceNodes = generateResourceNodes(sim.map);
    simRef.current = sim;

    const scene3D = new RTS3DScene(canvas);
    scene3DRef.current = scene3D;

    // Focus camera on Player Town Center in South-West
    const startSimPos = { x: 420, y: 1380 };
    const start3D = scene3D.worldSimTo3D(startSimPos);
    scene3D.cameraTarget.copy(start3D);
    scene3D.camera.position.set(start3D.x, start3D.y + 48, start3D.z + 36);
    setCameraPos(startSimPos);

    const handleResize = () => {
      scene3D.handleResize();
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Smooth camera pan with WASD or Arrow Keys
      const panSpeed = 65;
      let panX = 0;
      let panZ = 0;
      if (keysHeld.current['KeyA'] || keysHeld.current['ArrowLeft']) panX -= 1;
      if (keysHeld.current['KeyD'] || keysHeld.current['ArrowRight']) panX += 1;
      if (keysHeld.current['KeyW'] || keysHeld.current['ArrowUp']) panZ -= 1;
      if (keysHeld.current['KeyS'] || keysHeld.current['ArrowDown']) panZ += 1;

      if (panX !== 0 || panZ !== 0) {
        const d = Math.hypot(panX, panZ);
        scene3D.cameraTarget.x = Math.max(-110, Math.min(110, scene3D.cameraTarget.x + (panX / d) * panSpeed * dt));
        scene3D.cameraTarget.z = Math.max(-80, Math.min(80, scene3D.cameraTarget.z + (panZ / d) * panSpeed * dt));
        setCameraPos(scene3D.world3DToSim(scene3D.cameraTarget));
      }

      // Check game over
      if (sim.gameOver) {
        setScreen(sim.gameOver === 'VICTORY' ? 'VICTORY' : 'DEFEAT');
      }

      // Update simulation physics
      sim.update(dt);

      // Synchronize 3D Scene Entities and Render 3D WebGL frame
      scene3D.updateEntities(
        sim.units,
        sim.buildings,
        sim.resourceNodes,
        sim.projectiles,
        sim.godPowerEffects,
        selectedUnitIds,
        selectedBuildingId,
        dt
      );

      // Sync state to HUD
      setResources({ ...sim.playerResources });
      setAge(sim.playerAge);
      setAgeAdvanceProgress(sim.ageAdvanceProgress);
      setWonderTimer(sim.wonderTimer);
      setGameTime(sim.stats.gameTime);
      setGodPowerCooldowns({ ...sim.godPowerCooldowns });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      scene3D.dispose();
    };
  }, [selectedUnitIds, selectedBuildingId]);

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysHeld.current[e.code] = true;

      // Space / Enter starts game from Title
      if (screen === 'TITLE' && !showCompendium) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          handleStartGame();
          return;
        }
      }

      if (screen === 'PLAYING') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          setScreen('PAUSED');
        } else if (e.code === 'Digit1') {
          setActiveGodPower('SOLAR_WRATH');
        } else if (e.code === 'Digit2') {
          setActiveGodPower('NILE_BLOOM');
        } else if (e.code === 'Digit3') {
          setActiveGodPower('LOCUST_SWARM');
        } else if (e.code === 'Digit4') {
          setActiveGodPower('ECLIPSE');
        } else if (e.code === 'KeyH') {
          // Home on Town Center
          const tc = simRef.current?.buildings.find((b) => b.faction === 'PLAYER' && b.type === 'TOWN_CENTER');
          if (tc && scene3DRef.current) {
            const p3 = scene3DRef.current.worldSimTo3D(tc.pos);
            scene3DRef.current.cameraTarget.copy(p3);
            setCameraPos(tc.pos);
          }
        }
      } else if (screen === 'PAUSED') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          setScreen('PLAYING');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeld.current[e.code] = false;
    };

    const handleBlur = () => {
      keysHeld.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [screen, showCompendium]);

  // Pointer Events: 3D Raycasting, Selection, Move/Attack orders
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screen !== 'PLAYING' || !simRef.current || !scene3DRef.current) return;
    const sim = simRef.current;
    const scene3D = scene3DRef.current;

    const hit3D = scene3D.raycastGround(e.clientX, e.clientY);
    if (!hit3D) return;
    const worldPt = scene3D.world3DToSim(hit3D);

    // Left Click (button === 0)
    if (e.button === 0) {
      // 1. If currently targeting a God Power: Cast it!
      if (activeGodPower) {
        sim.invokeGodPower(activeGodPower, worldPt);
        setActiveGodPower(null);
        scene3D.showWaypoint(hit3D);
        return;
      }

      // 2. If placing a building: Construct it!
      if (placingBuildingType) {
        const builders = sim.units.filter((u) => selectedUnitIds.has(u.id) && u.type === 'VILLAGER');
        sim.constructBuilding(placingBuildingType, worldPt, builders);
        setPlacingBuildingType(null);
        scene3D.showWaypoint(hit3D);
        return;
      }

      // 3. Otherwise: Start Screen Drag Selection Box
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      dragCurrentRef.current = { x: e.clientX, y: e.clientY };
      setDragBox({ start: dragStartRef.current, current: dragCurrentRef.current });
    }

    // Right Click (button === 2): Issue Orders to selected units!
    if (e.button === 2) {
      e.preventDefault();

      if (activeGodPower) {
        setActiveGodPower(null);
        return;
      }
      if (placingBuildingType) {
        setPlacingBuildingType(null);
        return;
      }

      const selectedUnits = sim.units.filter((u) => selectedUnitIds.has(u.id) && u.faction === 'PLAYER');
      if (selectedUnits.length === 0) return;

      scene3D.showWaypoint(hit3D);

      // Check if clicked on a Resource Node
      const clickedRes = sim.resourceNodes.find((n) => Math.hypot(n.pos.x - worldPt.x, n.pos.y - worldPt.y) <= n.size + 15);
      if (clickedRes) {
        sim.orderGather(selectedUnits, clickedRes);
        return;
      }

      // Check if clicked on a Building
      const clickedBld = sim.buildings.find((b) => Math.hypot(b.pos.x - worldPt.x, b.pos.y - worldPt.y) <= b.size + 18);
      if (clickedBld) {
        if (clickedBld.faction === 'ENEMY') {
          sim.orderAttack(selectedUnits, clickedBld.id);
        } else if (!clickedBld.isConstructed || clickedBld.hp < clickedBld.maxHp) {
          sim.orderBuild(selectedUnits, clickedBld);
        } else if (clickedBld.type === 'TEMPLE') {
          sim.orderPray(selectedUnits, clickedBld);
        }
        return;
      }

      // Check if clicked on an Enemy Unit
      const clickedEnemy = sim.units.find((u) => u.faction === 'ENEMY' && Math.hypot(u.pos.x - worldPt.x, u.pos.y - worldPt.y) <= 24);
      if (clickedEnemy) {
        sim.orderAttack(selectedUnits, clickedEnemy.id);
        return;
      }

      // Otherwise: Order Move to location
      sim.orderMove(selectedUnits, worldPt);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragStartRef.current) {
      dragCurrentRef.current = { x: e.clientX, y: e.clientY };
      setDragBox({ start: dragStartRef.current, current: dragCurrentRef.current });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 0 && dragStartRef.current && simRef.current && scene3DRef.current) {
      const sim = simRef.current;
      const scene3D = scene3DRef.current;
      const start = dragStartRef.current;
      const end = dragCurrentRef.current || start;

      const isDrag = Math.hypot(end.x - start.x, end.y - start.y) > 10;
      const newSelectedUnitIds = new Set<string>();

      if (isDrag) {
        // Multi-selection: Test screen projection of all friendly units
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);

        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();

        for (const u of sim.units) {
          if (u.faction === 'PLAYER') {
            const p3 = scene3D.worldSimTo3D(u.pos);
            const screenVec = p3.clone().project(scene3D.camera);
            const sx = ((screenVec.x + 1) / 2) * rect.width + rect.left;
            const sy = ((-screenVec.y + 1) / 2) * rect.height + rect.top;

            if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
              newSelectedUnitIds.add(u.id);
            }
          }
        }
        setSelectedBuildingId(null);
      } else {
        // Single Click: Raycast to find closest unit or building
        const hit3D = scene3D.raycastGround(start.x, start.y);
        if (hit3D) {
          const worldPt = scene3D.world3DToSim(hit3D);
          const clickedUnit = sim.units.find((u) => Math.hypot(u.pos.x - worldPt.x, u.pos.y - worldPt.y) <= 24);
          if (clickedUnit) {
            newSelectedUnitIds.add(clickedUnit.id);
            setSelectedBuildingId(null);
            if (clickedUnit.faction === 'PLAYER') {
              rtsAudio.playUnitSelect();
            }
          } else {
            const clickedBld = sim.buildings.find((b) => Math.hypot(b.pos.x - worldPt.x, b.pos.y - worldPt.y) <= b.size);
            if (clickedBld) {
              setSelectedBuildingId(clickedBld.id);
              if (clickedBld.faction === 'PLAYER') {
                rtsAudio.playUnitSelect();
              }
            } else {
              setSelectedBuildingId(null);
            }
          }
        }
      }

      setSelectedUnitIds(newSelectedUnitIds);
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      setDragBox(null);
    }
  };

  const handleStartGame = useCallback(() => {
    if (simRef.current) {
      simRef.current.initStarterEntities();
      simRef.current.resourceNodes = generateResourceNodes(simRef.current.map);
    }
    if (scene3DRef.current) {
      const startSimPos = { x: 420, y: 1380 };
      const start3D = scene3DRef.current.worldSimTo3D(startSimPos);
      scene3DRef.current.cameraTarget.copy(start3D);
      scene3DRef.current.camera.position.set(start3D.x, start3D.y + 48, start3D.z + 36);
      setCameraPos(startSimPos);
    }
    rtsAudio.playWarHorn();
    setScreen('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleMinimapJump = useCallback((worldPos: Vec2) => {
    if (scene3DRef.current) {
      const p3 = scene3DRef.current.worldSimTo3D(worldPos);
      scene3DRef.current.cameraTarget.set(p3.x, 0, p3.z);
      setCameraPos(worldPos);
    }
  }, []);

  const handleTrainUnit = useCallback((unitType: UnitType) => {
    if (!simRef.current || !selectedBuildingId) return;
    const bld = simRef.current.buildings.find((b) => b.id === selectedBuildingId);
    if (bld) {
      simRef.current.trainUnit(bld, unitType);
    }
  }, [selectedBuildingId]);

  const handleAdvanceAge = useCallback(() => {
    if (simRef.current) {
      simRef.current.advanceAge();
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = rtsAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  const activeSelectedUnits = simRef.current
    ? simRef.current.units.filter((u) => selectedUnitIds.has(u.id))
    : [];
  const activeSelectedBuilding = simRef.current && selectedBuildingId
    ? simRef.current.buildings.find((b) => b.id === selectedBuildingId) || null
    : null;

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#120d09] select-none touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D WebGL Three.js Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full block cursor-default"
      />

      {/* Screen Selection Drag Marquee Box Overlay */}
      {dragBox && (
        <div
          className="absolute border border-yellow-400 bg-yellow-400/15 pointer-events-none z-15"
          style={{
            left: Math.min(dragBox.start.x, dragBox.current.x),
            top: Math.min(dragBox.start.y, dragBox.current.y),
            width: Math.abs(dragBox.current.x - dragBox.start.x),
            height: Math.abs(dragBox.current.y - dragBox.start.y),
          }}
        />
      )}

      {/* RTS HUD (Playing State) */}
      {screen === 'PLAYING' && simRef.current && (
        <RTSHUD
          resources={resources}
          age={age}
          ageAdvanceProgress={ageAdvanceProgress}
          selectedUnits={activeSelectedUnits}
          selectedBuilding={activeSelectedBuilding}
          map={simRef.current.map}
          camera={cameraPos}
          allUnits={simRef.current.units}
          allBuildings={simRef.current.buildings}
          godPowerCooldowns={godPowerCooldowns}
          activeTargetingGodPower={activeGodPower}
          wonderTimer={wonderTimer}
          gameTime={gameTime}
          isMuted={isMuted}
          onAdvanceAge={handleAdvanceAge}
          onTrainUnit={handleTrainUnit}
          onStartBuildingPlacement={(bType) => setPlacingBuildingType(bType)}
          onSelectGodPower={(gp) => setActiveGodPower(gp)}
          onCancelGodPower={() => setActiveGodPower(null)}
          onMinimapClick={handleMinimapJump}
          onToggleMute={handleToggleMute}
          onPause={() => setScreen('PAUSED')}
        />
      )}

      {/* Age of Mythology Retold Title Screen */}
      {screen === 'TITLE' && (
        <RTSTitleScreen
          isMuted={isMuted}
          onStartGame={handleStartGame}
          onOpenCompendium={() => setShowCompendium(true)}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Pause Modal */}
      {screen === 'PAUSED' && simRef.current && (
        <PauseModal
          stats={simRef.current.stats}
          isMuted={isMuted}
          onResume={() => setScreen('PLAYING')}
          onRestart={handleRestart}
          onExitTitle={() => setScreen('TITLE')}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Victory Modal */}
      {screen === 'VICTORY' && simRef.current && (
        <VictoryModal
          stats={simRef.current.stats}
          onRestart={handleRestart}
          onExitTitle={() => setScreen('TITLE')}
        />
      )}

      {/* Defeat Modal */}
      {screen === 'DEFEAT' && simRef.current && (
        <DefeatModal
          stats={simRef.current.stats}
          onRestart={handleRestart}
          onExitTitle={() => setScreen('TITLE')}
        />
      )}

      {/* Egyptian Pantheon & Unit Manual */}
      {showCompendium && (
        <CompendiumModal
          onClose={() => setShowCompendium(false)}
          onStartGame={() => {
            setShowCompendium(false);
            handleStartGame();
          }}
        />
      )}
    </main>
  );
}
