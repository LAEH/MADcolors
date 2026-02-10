
import React from 'react';
import PaletteDock from './PaletteDock';
import { PaletteItem } from '../types';

interface CommandDeckProps {
  palette: PaletteItem[];
  onRemovePalette: (id: string) => void;
  onSelectContrast: (id: string | null) => void;
  contrastBaseId: string | null;
  children: React.ReactNode;
}

const CommandDeck: React.FC<CommandDeckProps> = ({
  palette,
  onRemovePalette,
  onSelectContrast,
  contrastBaseId,
  children
}) => {
  return (
    <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      
      {/* Floating Pill Container */}
      <div className="
        pointer-events-auto
        w-full max-w-4xl h-24
        bg-white/80 backdrop-blur-2xl 
        border border-white/40 shadow-2xl shadow-slate-200/50
        rounded-[2rem]
        relative
        transition-all duration-500 ease-out
        overflow-hidden
      ">
        
        {/* CENTER: Hue Slider (Full Width Background) */}
        <div className="absolute inset-0 w-full h-full">
          {children}
        </div>

        {/* RIGHT: Palette Dock (Floating on top) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50">
          <PaletteDock 
            palette={palette} 
            onRemove={onRemovePalette}
            onSelectForContrast={onSelectContrast}
            contrastBaseId={contrastBaseId}
          />
        </div>

      </div>
    </div>
  );
};

export default CommandDeck;
