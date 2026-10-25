/**
 * Title Screen for Sands of Ra: Egyptian RTS
 * Styled in the authentic tradition of Age of Mythology: Retold
 * Features cinematic hero art, Age of Mythology Retold thumbnail showcase,
 * bottom-left Start button, subtle How-To-Play trigger, and zero thumping sound.
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Swords, Sparkles, MapPin } from 'lucide-react';

interface RTSTitleScreenProps {
  isMuted: boolean;
  onStartGame: () => void;
  onOpenCompendium: () => void;
  onToggleMute: () => void;
}

export const RTSTitleScreen: React.FC<RTSTitleScreenProps> = ({
  isMuted,
  onStartGame,
  onOpenCompendium,
  onToggleMute,
}) => {
  const [selectedCampaign, setSelectedCampaign] = useState<'MEMPHIS' | 'DELTA' | 'MYTHIC'>('MEMPHIS');

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 z-20 pointer-events-none select-none overflow-hidden">
      {/* Cinematic Age of Mythology: Retold Hero Background */}
      <div className="absolute inset-0 -z-10 bg-[#0c0906]">
        <img
          src="/src/assets/images/aom_retold_egypt_keyart_1792914204300.jpg"
          alt="Age of Mythology Retold Egyptian Key Art"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08]"
        />
        {/* Measured Contrast Scrims */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0906] via-black/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/30 to-black/80 pointer-events-none" />
      </div>

      {/* Top Bar: Title & Mute */}
      <div className="flex items-start justify-between gap-8 pointer-events-auto">
        <div className="flex flex-col">
          {/* Main Title Lockup */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fff6d6] via-[#f7d070] to-[#b8860b] font-cinzel drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            SANDS OF RA
          </h1>
          <span className="text-xs tracking-[0.25em] text-amber-200/90 font-cinzel font-semibold uppercase -mt-1 drop-shadow-md">
            AGE OF THE PHARAOHS
          </span>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="w-10 h-10 rounded-lg bg-black/60 border border-amber-800/80 hover:border-amber-500 flex items-center justify-center text-amber-200 hover:text-white transition-colors shadow-xl backdrop-blur-none"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
        </button>
      </div>

      {/* Center-Right: Age of Mythology Retold Style Campaign Thumbnail Card */}
      <div className="my-auto self-end max-w-sm md:max-w-md w-full bg-[#140f0a]/90 border-2 border-[#b8860b]/80 rounded-xl p-3 md:p-4 shadow-[0_12px_36px_rgba(0,0,0,0.85)] pointer-events-auto">
        {/* Thumbnail Image Header */}
        <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-amber-700/60 shadow-inner mb-3">
          <img
            src="/src/assets/images/aom_egypt_thumbnail_1792914204354.jpg"
            alt="Tale of the Nile: Egyptian Campaign Thumbnail"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top filter contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

          {/* Badge over thumbnail */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
            <span className="font-cinzel font-bold text-amber-200 text-sm drop-shadow-md">
              CAMPAIGN: TALE OF THE NILE
            </span>
            <span className="bg-amber-500/20 border border-amber-400/60 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              SKIRMISH
            </span>
          </div>
        </div>

        {/* Campaign Selection Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          <button
            onClick={() => setSelectedCampaign('MEMPHIS')}
            className={`py-1.5 px-2 rounded text-[11px] font-cinzel font-bold transition-all border ${
              selectedCampaign === 'MEMPHIS'
                ? 'bg-amber-600/30 text-amber-200 border-amber-400'
                : 'bg-black/40 text-amber-400/60 border-amber-900/40 hover:text-amber-200'
            }`}
          >
            Memphis
          </button>
          <button
            onClick={() => setSelectedCampaign('DELTA')}
            className={`py-1.5 px-2 rounded text-[11px] font-cinzel font-bold transition-all border ${
              selectedCampaign === 'DELTA'
                ? 'bg-amber-600/30 text-amber-200 border-amber-400'
                : 'bg-black/40 text-amber-400/60 border-amber-900/40 hover:text-amber-200'
            }`}
          >
            Nile Delta
          </button>
          <button
            onClick={() => setSelectedCampaign('MYTHIC')}
            className={`py-1.5 px-2 rounded text-[11px] font-cinzel font-bold transition-all border ${
              selectedCampaign === 'MYTHIC'
                ? 'bg-amber-600/30 text-amber-200 border-amber-400'
                : 'bg-black/40 text-amber-400/60 border-amber-900/40 hover:text-amber-200'
            }`}
          >
            Valley of Gods
          </button>
        </div>

        <p className="text-[11px] text-amber-200/80 leading-relaxed mb-3">
          {selectedCampaign === 'MEMPHIS' &&
            'The seat of the Old Kingdom. Establish your settlement along the turquoise riverbanks, gather palm timber, and repel Seth’s raiders.'}
          {selectedCampaign === 'DELTA' &&
            'Vast fertile wetlands rich in wild dates and Nile fish. Construct farms, advance through the Ages, and summon the Wadjet Cobras.'}
          {selectedCampaign === 'MYTHIC' &&
            'Sacred necropolis of the Sun God Ra. Build the Great Gilded Pyramid Wonder and defend it against escalating enemy siege forces.'}
        </p>

        <div className="flex items-center justify-between text-[10px] text-amber-400/80 pt-2 border-t border-amber-900/50 font-mono">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-amber-400" /> Map Size: 2400 × 1800
          </span>
          <span className="flex items-center gap-1">
            <Swords className="w-3 h-3 text-amber-400" /> Rival: Cult of Seth
          </span>
        </div>
      </div>

      {/* Bottom Row: Bottom-Left Start Button & How-To-Play Text Link */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 mt-auto pt-4 pointer-events-auto">
        {/* Bottom-Left Controls: Start Button & How-To-Play text */}
        <div className="flex items-center gap-4">
          {/* Start Button (No Play Icon, Clean Egyptian Bronze Bevel) */}
          <button
            onClick={onStartGame}
            className="px-10 py-3.5 rounded-lg font-cinzel font-bold text-base tracking-widest text-[#1a1208] bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#b45309] hover:from-[#fffbeb] hover:to-[#ca8a04] border-2 border-[#fef08a]/80 shadow-[0_6px_20px_rgba(234,179,8,0.4)] active:translate-y-0.5 transition-all text-center"
          >
            START
          </button>

          {/* Small How-To-Play Text Link */}
          <button
            onClick={onOpenCompendium}
            className="text-xs font-cinzel tracking-wider text-amber-300/80 hover:text-amber-100 hover:underline transition-colors py-2 px-1 cursor-pointer"
          >
            How-To-Play
          </button>
        </div>

        {/* Flat Control Hints */}
        <div className="text-[11px] text-amber-200/60 font-mono text-right hidden md:block">
          Left Drag Select · Right Click Order · WASD Pan · 1-4 God Powers · Esc Pause
        </div>
      </div>
    </div>
  );
};
