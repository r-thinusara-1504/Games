/**
 * RTS HUD for Sands of Ra: Egyptian RTS
 * Unobtrusive top resource bar, God Powers dock, interactive minimap,
 * selected entity inspector, and context action grid.
 */

import React, { useRef, useEffect } from 'react';
import {
  Resources,
  Age,
  AGE_CONFIGS,
  Unit,
  Building,
  BuildingType,
  UnitType,
  GodPowerType,
  GOD_POWERS,
  BUILDING_DEFINITIONS,
  UNIT_DEFINITIONS,
  Vec2,
} from '../rts/types';
import { RTSMap, MAP_WIDTH, MAP_HEIGHT } from '../rts/map';
import {
  Wheat,
  Trees,
  Coins,
  Sparkles,
  Users,
  Sun,
  Shield,
  Volume2,
  VolumeX,
  Pause,
  Crown,
  Flame,
  Droplets,
  Bug,
  Eye,
} from 'lucide-react';

interface RTSHUDProps {
  resources: Resources;
  age: Age;
  ageAdvanceProgress: number | null;
  selectedUnits: Unit[];
  selectedBuilding: Building | null;
  map: RTSMap;
  camera: Vec2;
  allUnits: Unit[];
  allBuildings: Building[];
  godPowerCooldowns: Record<GodPowerType, number>;
  activeTargetingGodPower: GodPowerType | null;
  wonderTimer: number | null;
  gameTime: number;
  isMuted: boolean;
  onAdvanceAge: () => void;
  onTrainUnit: (type: UnitType) => void;
  onStartBuildingPlacement: (type: BuildingType) => void;
  onSelectGodPower: (type: GodPowerType) => void;
  onCancelGodPower: () => void;
  onMinimapClick: (worldPos: Vec2) => void;
  onToggleMute: () => void;
  onPause: () => void;
}

export const RTSHUD: React.FC<RTSHUDProps> = ({
  resources,
  age,
  ageAdvanceProgress,
  selectedUnits,
  selectedBuilding,
  map,
  camera,
  allUnits,
  allBuildings,
  godPowerCooldowns,
  activeTargetingGodPower,
  wonderTimer,
  gameTime,
  isMuted,
  onAdvanceAge,
  onTrainUnit,
  onStartBuildingPlacement,
  onSelectGodPower,
  onCancelGodPower,
  onMinimapClick,
  onToggleMute,
  onPause,
}) => {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const ageConfig = AGE_CONFIGS[age];

  // Draw interactive minimap
  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mw = canvas.width;
    const mh = canvas.height;
    const scaleX = mw / MAP_WIDTH;
    const scaleY = mh / MAP_HEIGHT;

    // Background Desert
    ctx.fillStyle = '#b48a48';
    ctx.fillRect(0, 0, mw, mh);

    // Nile River
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 7;
    ctx.beginPath();
    map.riverPoints.forEach((pt, i) => {
      const mx = pt.x * scaleX;
      const my = pt.y * scaleY;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    });
    ctx.stroke();

    // Friendly buildings
    for (const b of allBuildings) {
      ctx.fillStyle = b.faction === 'PLAYER' ? '#06b6d4' : '#ef4444';
      ctx.fillRect(b.pos.x * scaleX - 2, b.pos.y * scaleY - 2, 5, 5);
    }

    // Units
    for (const u of allUnits) {
      const fog = map.getFogAt(u.pos.x, u.pos.y);
      if (u.faction === 'ENEMY' && fog < 2) continue; // Fog of war

      ctx.fillStyle = u.faction === 'PLAYER' ? '#38bdf8' : '#f87171';
      ctx.beginPath();
      ctx.arc(u.pos.x * scaleX, u.pos.y * scaleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Camera Frustum Box
    const camW = 1200 * scaleX;
    const camH = 800 * scaleY;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(camera.x * scaleX, camera.y * scaleY, camW, camH);
  }, [allUnits, allBuildings, camera, map]);

  const handleMinimapInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;

    onMinimapClick({
      x: clickX * scaleX - 600,
      y: clickY * scaleY - 400,
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Next age check
  let nextAge: Age | null = null;
  if (age === 'ARCHAIC_AGE') nextAge = 'OLD_KINGDOM';
  else if (age === 'OLD_KINGDOM') nextAge = 'NEW_KINGDOM';
  else if (age === 'NEW_KINGDOM') nextAge = 'MYTHIC_AGE';
  const nextAgeConfig = nextAge ? AGE_CONFIGS[nextAge] : null;

  const canAdvanceAge =
    nextAgeConfig &&
    resources.food >= nextAgeConfig.foodCost &&
    resources.gold >= nextAgeConfig.goldCost &&
    ageAdvanceProgress === null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 md:p-4 z-10">
      {/* Top Bar: Resources, Age & God Powers Dock */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Resource Clusters */}
        <div className="flex items-center gap-2 bg-[#1b150f]/95 border border-[#855928] px-3.5 py-1.5 rounded-xl shadow-2xl pointer-events-auto">
          {/* Food */}
          <div className="flex items-center gap-1.5 text-xs text-amber-200">
            <Wheat className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono tabular-nums font-bold">{Math.floor(resources.food)}</span>
          </div>

          <span className="text-amber-700/60 font-serif">·</span>

          {/* Wood */}
          <div className="flex items-center gap-1.5 text-xs text-amber-200">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono tabular-nums font-bold">{Math.floor(resources.wood)}</span>
          </div>

          <span className="text-amber-700/60 font-serif">·</span>

          {/* Gold */}
          <div className="flex items-center gap-1.5 text-xs text-amber-200">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-mono tabular-nums font-bold">{Math.floor(resources.gold)}</span>
          </div>

          <span className="text-amber-700/60 font-serif">·</span>

          {/* Divine Favor */}
          <div className="flex items-center gap-1.5 text-xs text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono tabular-nums font-bold">{Math.floor(resources.favor)}</span>
          </div>

          <span className="text-amber-700/60 font-serif">·</span>

          {/* Population */}
          <div className="flex items-center gap-1.5 text-xs text-amber-200">
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-mono tabular-nums font-bold">
              {resources.population}/{resources.maxPopulation}
            </span>
          </div>
        </div>

        {/* Center: God Powers Dock & Wonder Timer */}
        <div className="flex flex-col items-center gap-1.5">
          {/* Wonder Countdown Banner if Pyramid Wonder is built */}
          {wonderTimer !== null && (
            <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border border-yellow-300 text-slate-950 px-4 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse pointer-events-auto">
              <Crown className="w-4 h-4 fill-current" />
              <span className="font-display font-bold text-xs uppercase tracking-wider">
                WONDER VICTORY IN: <strong className="font-mono tabular-nums">{formatTime(wonderTimer)}</strong>
              </span>
            </div>
          )}

          {/* God Powers Toolbar */}
          <div className="flex items-center gap-2 bg-[#1b150f]/95 border border-[#855928] p-1.5 rounded-2xl shadow-2xl pointer-events-auto">
            {(['SOLAR_WRATH', 'NILE_BLOOM', 'LOCUST_SWARM', 'ECLIPSE'] as GodPowerType[]).map((gpKey) => {
              const def = GOD_POWERS[gpKey];
              const cooldown = godPowerCooldowns[gpKey];
              const hasFavor = resources.favor >= def.favorCost;
              const isSelected = activeTargetingGodPower === gpKey;

              const icons = {
                SOLAR_WRATH: <Flame className="w-4 h-4 text-amber-400" />,
                NILE_BLOOM: <Droplets className="w-4 h-4 text-cyan-400" />,
                LOCUST_SWARM: <Bug className="w-4 h-4 text-emerald-400" />,
                ECLIPSE: <Eye className="w-4 h-4 text-fuchsia-400" />,
              };

              return (
                <button
                  key={gpKey}
                  onClick={() => {
                    if (isSelected) onCancelGodPower();
                    else if (cooldown <= 0 && hasFavor) onSelectGodPower(gpKey);
                  }}
                  disabled={cooldown > 0 || !hasFavor}
                  title={`${def.name} (${def.deity}) - ${def.description} [${def.favorCost} Favor]`}
                  className={`relative p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-yellow-300 scale-105'
                      : cooldown > 0 || !hasFavor
                      ? 'bg-slate-900/60 opacity-40 cursor-not-allowed'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-amber-100 hover:scale-105'
                  }`}
                >
                  {icons[gpKey]}
                  <span className="text-[9px] font-mono mt-0.5">{def.favorCost}★</span>
                  {cooldown > 0 && (
                    <div className="absolute inset-0 bg-black/75 rounded-xl flex items-center justify-center font-mono text-[10px] text-white font-bold">
                      {Math.ceil(cooldown)}s
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {activeTargetingGodPower && (
            <div className="bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full text-[11px] font-bold font-display uppercase tracking-wide animate-bounce pointer-events-auto">
              CLICK GROUND TO UNLEASH {GOD_POWERS[activeTargetingGodPower].name}! (Right click to cancel)
            </div>
          )}
        </div>

        {/* Right: Age Indicator, Sound & Pause Buttons */}
        <div className="flex items-center gap-2">
          {/* Current Era / Age */}
          <div className="flex items-center gap-2 bg-[#1b150f]/95 border border-[#855928] px-3.5 py-1.5 rounded-xl shadow-2xl pointer-events-auto">
            <Sun className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-amber-400/80 uppercase font-semibold">Era</span>
              <span className="text-xs font-display font-bold text-amber-100 whitespace-nowrap">
                {ageConfig.name}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 ml-1">
              {formatTime(gameTime)}
            </span>
          </div>

          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className="w-9 h-9 rounded-xl bg-[#1b150f]/95 border border-[#855928] flex items-center justify-center text-amber-200 hover:text-white hover:bg-slate-900 transition-colors pointer-events-auto shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="w-9 h-9 rounded-xl bg-[#1b150f]/95 border border-[#855928] flex items-center justify-center text-amber-200 hover:text-white hover:bg-slate-900 transition-colors pointer-events-auto shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Minimap, Selected Entity Inspector, and Command/Build Grid */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom-Left: Interactive Minimap */}
        <div className="bg-[#1b150f]/95 border border-[#855928] p-1.5 rounded-2xl shadow-2xl pointer-events-auto">
          <canvas
            ref={minimapRef}
            width={180}
            height={135}
            onClick={handleMinimapInteraction}
            className="rounded-xl block cursor-pointer border border-[#63441f]"
          />
        </div>

        {/* Bottom-Center: Selected Unit / Building Inspector */}
        <div className="flex-1 max-w-md bg-[#1b150f]/95 border border-[#855928] p-3 rounded-2xl shadow-2xl pointer-events-auto min-h-[145px] flex flex-col justify-between">
          {selectedUnits.length > 0 ? (
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#523719] mb-2">
                <span className="font-display font-bold text-sm text-amber-200">
                  {selectedUnits.length === 1
                    ? UNIT_DEFINITIONS[selectedUnits[0].type].name
                    : `${selectedUnits.length} UNITS SELECTED`}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {selectedUnits[0].faction === 'PLAYER' ? 'LOYAL TO PHARAOH' : 'ENEMY WARLORD'}
                </span>
              </div>

              {selectedUnits.length === 1 ? (
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center text-amber-300 font-display font-bold text-lg">
                    {UNIT_DEFINITIONS[selectedUnits[0].type].name.charAt(0)}
                  </div>
                  <div className="flex-1 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health:</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-400">
                        {Math.ceil(selectedUnits[0].hp)} / {selectedUnits[0].maxHp}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Damage / Range:</span>
                      <span className="font-mono tabular-nums text-amber-200">
                        {selectedUnits[0].damage} dmg · {selectedUnits[0].range > 30 ? 'Ranged' : 'Melee'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">State:</span>
                      <span className="font-mono text-cyan-400 uppercase text-[10px]">
                        {selectedUnits[0].state}
                        {selectedUnits[0].carriedAmount > 0 && ` (${Math.round(selectedUnits[0].carriedAmount)} res)`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {selectedUnits.map((u) => (
                    <div
                      key={u.id}
                      className="px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40 text-[10px] font-mono text-amber-200"
                    >
                      {UNIT_DEFINITIONS[u.type].name.split(' ')[0]} ({Math.ceil(u.hp)})
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedBuilding ? (
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#523719] mb-2">
                <span className="font-display font-bold text-sm text-amber-200">
                  {BUILDING_DEFINITIONS[selectedBuilding.type].name}
                </span>
                <span className="font-mono text-xs text-emerald-400 tabular-nums">
                  {Math.ceil(selectedBuilding.hp)} / {selectedBuilding.maxHp} HP
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 mb-2">
                {BUILDING_DEFINITIONS[selectedBuilding.type].description}
              </p>

              {/* Building Training Queue Progress */}
              {selectedBuilding.productionQueue.length > 0 && (
                <div className="mt-2 bg-slate-900/80 p-2 rounded-xl border border-amber-900/40">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-amber-200">
                      Training: {UNIT_DEFINITIONS[selectedBuilding.productionQueue[0].unitType].name}
                    </span>
                    <span className="font-mono text-yellow-400">
                      {Math.round(selectedBuilding.productionQueue[0].progress * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${selectedBuilding.productionQueue[0].progress * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center my-auto">
              <span className="text-xs text-amber-400/80 font-display block mb-1">
                EGYPTIAN EXPEDITION COMMAND
              </span>
              <p className="text-[11px] text-slate-400">
                Drag a box or click to command troops. Select Laborers to construct temples and monuments.
              </p>
            </div>
          )}
        </div>

        {/* Bottom-Right: Command & Build Grid */}
        <div className="bg-[#1b150f]/95 border border-[#855928] p-2 rounded-2xl shadow-2xl pointer-events-auto min-w-[220px]">
          {/* If Villager is selected: Show Building Grid */}
          {selectedUnits.some((u) => u.type === 'VILLAGER' && u.faction === 'PLAYER') && (
            <div>
              <span className="text-[10px] font-display font-bold text-amber-400 block mb-1.5">
                CONSTRUCT EGYPTIAN STRUCTURES
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {ageConfig.unlockedBuildings.map((bType) => {
                  const bDef = BUILDING_DEFINITIONS[bType];
                  const canAfford =
                    resources.food >= bDef.cost.food &&
                    resources.wood >= bDef.cost.wood &&
                    resources.gold >= bDef.cost.gold;

                  return (
                    <button
                      key={bType}
                      onClick={() => onStartBuildingPlacement(bType)}
                      disabled={!canAfford}
                      className={`p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        canAfford
                          ? 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-700/80 text-amber-100 hover:scale-[1.02]'
                          : 'bg-slate-900/60 opacity-40 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xs font-semibold block truncate">{bDef.name}</span>
                      <span className="text-[9px] text-amber-300/80 font-mono">
                        {bDef.cost.wood > 0 && `${bDef.cost.wood}W `}
                        {bDef.cost.gold > 0 && `${bDef.cost.gold}G `}
                        {bDef.cost.food > 0 && `${bDef.cost.food}F`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If Town Center selected: Train Villager & Advance Age */}
          {selectedBuilding && selectedBuilding.type === 'TOWN_CENTER' && selectedBuilding.faction === 'PLAYER' && (
            <div className="space-y-2">
              <span className="text-[10px] font-display font-bold text-amber-400 block">
                TOWN CENTER DISPATCH
              </span>
              <button
                onClick={() => onTrainUnit('VILLAGER')}
                disabled={resources.food < 50 || resources.population >= resources.maxPopulation}
                className="w-full py-2 px-3 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-left text-xs text-amber-100 flex items-center justify-between"
              >
                <span>Train Laborer</span>
                <span className="font-mono text-[10px] text-amber-300">50 Food</span>
              </button>

              {nextAgeConfig && (
                <button
                  onClick={onAdvanceAge}
                  disabled={!canAdvanceAge}
                  className={`w-full py-2 px-3 rounded-xl border text-left text-xs flex items-center justify-between ${
                    canAdvanceAge
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold border-yellow-300 animate-pulse'
                      : 'bg-slate-900/60 opacity-40 border-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Advance to {nextAgeConfig.name}</span>
                  <span className="font-mono text-[10px]">
                    {nextAgeConfig.foodCost}F · {nextAgeConfig.goldCost}G
                  </span>
                </button>
              )}
            </div>
          )}

          {/* If Barracks or Temple selected: Train Military & Myth Units */}
          {selectedBuilding &&
            (selectedBuilding.type === 'BARRACKS' || selectedBuilding.type === 'TEMPLE') &&
            selectedBuilding.faction === 'PLAYER' && (
              <div>
                <span className="text-[10px] font-display font-bold text-amber-400 block mb-1.5">
                  RECRUIT WARRIORS & MYTH BEASTS
                </span>
                <div className="space-y-1.5">
                  {BUILDING_DEFINITIONS[selectedBuilding.type].trainableUnits
                    .filter((uType) => ageConfig.unlockedUnits.includes(uType))
                    .map((uType) => {
                      const uDef = UNIT_DEFINITIONS[uType];
                      const canAfford =
                        resources.food >= uDef.cost.food &&
                        resources.wood >= uDef.cost.wood &&
                        resources.gold >= uDef.cost.gold &&
                        resources.favor >= uDef.cost.favor &&
                        resources.population + uDef.popCost <= resources.maxPopulation;

                      return (
                        <button
                          key={uType}
                          onClick={() => onTrainUnit(uType)}
                          disabled={!canAfford}
                          className={`w-full py-1.5 px-2.5 rounded-xl border text-left text-xs flex items-center justify-between ${
                            canAfford
                              ? 'bg-amber-950/70 hover:bg-amber-900 border-amber-700/80 text-amber-100'
                              : 'bg-slate-900/60 opacity-40 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          <span className="font-medium truncate">{uDef.name}</span>
                          <span className="text-[9px] font-mono text-amber-300/80">
                            {uDef.cost.food > 0 && `${uDef.cost.food}F `}
                            {uDef.cost.gold > 0 && `${uDef.cost.gold}G `}
                            {uDef.cost.favor > 0 && `${uDef.cost.favor}★`}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
