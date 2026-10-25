/**
 * Modals for Sands of Ra: Egyptian RTS
 * Pause, Victory, Defeat, and Egyptian Pantheon / Units Compendium.
 */

import React from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  Play,
  Volume2,
  VolumeX,
  X,
  Sun,
  Shield,
  Coins,
  Wheat,
  Trees,
  Sparkles,
} from 'lucide-react';
import { GameStats, UNIT_DEFINITIONS, GOD_POWERS, AGE_CONFIGS } from './types';

// --- Pause Modal ---
export const PauseModal: React.FC<{
  stats: GameStats;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onExitTitle: () => void;
  onToggleMute: () => void;
}> = ({ stats, isMuted, onResume, onRestart, onExitTitle, onToggleMute }) => {
  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30 select-none">
      <div className="bg-[#1b150f] border border-[#855928] rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
        <Sun className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h2 className="text-2xl font-bold font-cinzel text-amber-100 tracking-tight mb-1">
          EXPEDITION PAUSED
        </h2>
        <p className="text-xs text-amber-300/70 mb-6">
          The sun stands still over the sacred Nile.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl font-bold font-display text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME CAMPAIGN</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/60 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTART BATTLE</span>
          </button>

          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={onToggleMute}
              className="flex-1 py-2 px-3 rounded-xl text-xs text-amber-300/80 bg-black/60 border border-amber-900/60 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
            </button>

            <button
              onClick={onExitTitle}
              className="py-2 px-3 rounded-xl text-xs text-amber-300/80 bg-black/60 border border-amber-900/60 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Victory Modal ---
export const VictoryModal: React.FC<{
  stats: GameStats;
  onRestart: () => void;
  onExitTitle: () => void;
}> = ({ stats, onRestart, onExitTitle }) => {
  const m = Math.floor(stats.gameTime / 60);
  const s = Math.floor(stats.gameTime % 60);

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-30 select-none animate-fadeIn">
      <div className="bg-[#1b150f] border-2 border-yellow-500/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
        <div className="inline-block p-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-3">
          <Trophy className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold font-cinzel text-amber-100 tracking-tight mb-1">
          PHARAOH'S TRIUMPH
        </h2>
        <p className="text-xs text-amber-300/80 mb-5">
          By divine decree of Ra, Egypt is united under your eternal reign!
        </p>

        {/* Battle Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-left">
          <div className="bg-black/60 border border-amber-900/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-amber-400/80 uppercase font-semibold block">Battle Duration</span>
            <span className="font-mono text-base font-bold text-amber-100">{m}m {s}s</span>
          </div>

          <div className="bg-black/60 border border-amber-900/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-amber-400/80 uppercase font-semibold block">Enemies Slain</span>
            <span className="font-mono text-base font-bold text-emerald-400">{stats.unitsKilled}</span>
          </div>

          <div className="bg-black/60 border border-amber-900/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-amber-400/80 uppercase font-semibold block">Buildings Raised</span>
            <span className="font-mono text-base font-bold text-amber-200">{stats.buildingsConstructed}</span>
          </div>

          <div className="bg-black/60 border border-amber-900/60 p-2.5 rounded-xl">
            <span className="text-[10px] text-amber-400/80 uppercase font-semibold block">Divine Favor</span>
            <span className="font-mono text-base font-bold text-cyan-400">
              {Math.floor(stats.resourcesHarvested.favor)}★
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl font-bold font-display text-sm bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY ANOTHER SKIRMISH</span>
          </button>

          <button
            onClick={onExitTitle}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-amber-300/80 bg-black/60 border border-amber-900/60 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>RETURN TO TITLE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Defeat Modal ---
export const DefeatModal: React.FC<{
  stats: GameStats;
  onRestart: () => void;
  onExitTitle: () => void;
}> = ({ stats, onRestart, onExitTitle }) => {
  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-30 select-none animate-fadeIn">
      <div className="bg-[#1b150f] border border-rose-900/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
        <h2 className="text-3xl font-extrabold font-cinzel text-rose-300 tracking-tight mb-1">
          SANDS OF OBLIVION
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Your settlement has fallen to the warlords of Seth.
        </p>

        <div className="bg-black/60 border border-amber-950 p-4 rounded-xl mb-6">
          <span className="text-[11px] text-slate-400 uppercase font-semibold block mb-1">
            Soldiers Sacrificed in Battle
          </span>
          <span className="font-mono text-3xl font-extrabold text-rose-400">
            {stats.unitsLost}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl font-bold font-display text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onExitTitle}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-amber-300/80 bg-black/60 border border-amber-900/60 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Egyptian Pantheon & Units Compendium ---
export const CompendiumModal: React.FC<{
  onClose: () => void;
  onStartGame: () => void;
}> = ({ onClose, onStartGame }) => {
  return (
    <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-4 z-40 select-none overflow-y-auto">
      <div className="bg-[#1b150f] border border-[#855928] rounded-2xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#855928]/40 mb-6">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold font-cinzel text-amber-100">
              MANUAL OF THE PHARAOH · GODS & UNITS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/60 hover:bg-slate-800 text-amber-300/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Dynastic Ages */}
        <div className="mb-6">
          <h3 className="text-xs font-display font-bold text-amber-400 uppercase tracking-wider mb-2.5">
            01. THE FOUR DYNASTIC AGES
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(AGE_CONFIGS).map(([k, cfg]) => (
              <div key={k} className="p-2.5 rounded-xl bg-black/50 border border-amber-900/40">
                <span className="font-bold text-amber-200 block mb-0.5">{cfg.name}</span>
                <span className="text-[10px] text-slate-400 block mb-1">
                  {cfg.foodCost > 0 ? `${cfg.foodCost}F · ${cfg.goldCost}G` : 'Starting Era'}
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono">
                  Power: {GOD_POWERS[cfg.godPower].name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divine God Powers */}
        <div className="mb-6">
          <h3 className="text-xs font-display font-bold text-amber-400 uppercase tracking-wider mb-2.5">
            02. PRAYER & DIVINE GOD POWERS
          </h3>
          <p className="text-xs text-amber-200/80 mb-3">
            Train Priests of Ra and send them to pray at your Temples to steadily generate Divine Favor (★). Use Favor to cast celestial interventions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {Object.values(GOD_POWERS).map((gp) => (
              <div key={gp.type} className="p-2.5 rounded-xl bg-black/50 border border-amber-900/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-amber-200">{gp.name} ({gp.deity})</span>
                  <span className="text-[10px] font-mono text-cyan-400">{gp.favorCost}★</span>
                </div>
                <p className="text-[11px] text-slate-400">{gp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Military & Myth Units */}
        <div className="mb-6">
          <h3 className="text-xs font-display font-bold text-amber-400 uppercase tracking-wider mb-2.5">
            03. ARMY OF THE NILE
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.values(UNIT_DEFINITIONS).map((u) => (
              <div key={u.type} className="p-2 rounded-xl bg-black/50 border border-amber-900/40">
                <span className="font-bold text-amber-200 block text-[11px]">{u.name}</span>
                <span className="text-[10px] text-amber-400/80 font-mono block mb-1">{u.role}</span>
                <p className="text-[10px] text-slate-400 line-clamp-2">{u.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#855928]/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-300/80 hover:text-white transition-colors"
          >
            CLOSE
          </button>
          <button
            onClick={() => {
              onClose();
              onStartGame();
            }}
            className="px-6 py-2.5 rounded-xl text-xs font-bold font-display bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 transition-colors shadow-lg shadow-amber-500/25"
          >
            START EXPEDITION
          </button>
        </div>
      </div>
    </div>
  );
};
