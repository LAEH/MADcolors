import React, { useState } from 'react';
import { DialItem, PaletteItem } from '../types';
import { Plus, XCircle } from 'lucide-react';

interface HarmonyDrawerProps {
  activeColor: PaletteItem | null;
  allHues: DialItem[];
  getHexAt: (hueIndex: number, row: number, chroma: number) => string | null;
  onAddPalette: (item: PaletteItem) => void;
}

type HarmonyType = 'Complementary' | 'Split' | 'Triadic' | 'Analogous';

const HarmonyDrawer: React.FC<HarmonyDrawerProps> = ({ 
  activeColor, 
  allHues, 
  getHexAt,
  onAddPalette 
}) => {
  const [hoveredType, setHoveredType] = useState<HarmonyType | null>(null);

  if (!activeColor) return null;

  const { hueIndex, position, valueLabel, chromaLabel } = activeColor;
  const { rowIndex, chromaIndex } = position;
  const totalSteps = 40;

  const harmonyConfigs: { type: HarmonyType; label: string; offsets: { label: string; delta: number }[] }[] = [
    { type: 'Complementary', label: 'Comp', offsets: [{ label: 'Comp', delta: 20 }] },
    { type: 'Split', label: 'Split', offsets: [{ label: 'Split 1', delta: 19 }, { label: 'Split 2', delta: 21 }] },
    { type: 'Triadic', label: 'Triad', offsets: [{ label: 'Triad 1', delta: 13 }, { label: 'Triad 2', delta: 26 }] },
  ];

  // Helper to generate a palette item from an offset
  const getHarmonyItem = (offsetDelta: number, labelPrefix: string): { item: PaletteItem, isOOG: boolean } | null => {
    let targetIndex = (hueIndex + offsetDelta) % totalSteps;
    if (targetIndex < 0) targetIndex += totalSteps;

    const targetHue = allHues[targetIndex];
    const hex = getHexAt(targetIndex, rowIndex, chromaIndex);
    
    // Create item even if hex is missing (to show Out of Gamut)
    const item: PaletteItem = {
      id: `${targetHue.label}-${valueLabel}-${chromaLabel}-harmony`,
      hex: hex || '#000000', // Fallback for OOG
      hueLabel: targetHue.label,
      valueLabel,
      chromaLabel,
      position,
      hueIndex: targetIndex
    };

    return { item, isOOG: !hex };
  };

  return (
    <>
      {/* 1. Sidebar Triggers */}
      <div className="
        absolute top-28 left-4 md:left-8 z-40
        flex flex-col gap-2 
        animate-in slide-in-from-left-10 fade-in duration-500
      ">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 pl-1">
          Harmonies
        </div>
        
        {harmonyConfigs.map((config) => (
          <button
            key={config.type}
            onMouseEnter={() => setHoveredType(config.type)}
            onClick={() => setHoveredType(config.type === hoveredType ? null : config.type)}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg border backdrop-blur-md transition-all w-28
              ${hoveredType === config.type 
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                : 'bg-zinc-900/60 text-white/60 border-white/10 hover:bg-white/10'}
            `}
          >
            {/* Visual indicator (dots) */}
            <div className="flex gap-0.5">
               {config.offsets.map((_, i) => (
                 <div key={i} className={`w-1.5 h-1.5 rounded-full ${hoveredType === config.type ? 'bg-black' : 'bg-white/40'}`} />
               ))}
            </div>
            <span className="text-xs font-medium">{config.label}</span>
          </button>
        ))}
      </div>

      {/* 2. Floating Harmony HUD (Heads Up Display) */}
      {hoveredType && (
        <div className="
          absolute bottom-48 left-1/2 -translate-x-1/2 z-50
          animate-in slide-in-from-bottom-5 fade-in duration-300
        ">
          <div className="
            flex items-center gap-4 p-4 
            bg-zinc-900/90 backdrop-blur-2xl border border-white/20 
            rounded-2xl shadow-2xl
          ">
            {/* HUD Label */}
            <div className="text-xs font-bold text-white/80 uppercase tracking-wider border-r border-white/10 pr-4">
              {hoveredType}
            </div>

            <div className="flex gap-3">
              {harmonyConfigs.find(h => h.type === hoveredType)?.offsets.map((offset) => {
                const result = getHarmonyItem(offset.delta, offset.label);
                if (!result) return null;
                const { item, isOOG } = result;

                return (
                  <button
                    key={offset.label}
                    disabled={isOOG}
                    onClick={() => !isOOG && onAddPalette(item)}
                    className={`
                      group relative flex flex-col items-center
                      transition-all duration-200
                      ${isOOG ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:brightness-110'}
                    `}
                  >
                    {/* Color Card */}
                    <div 
                      className="w-12 h-16 rounded-lg shadow-lg border border-white/10 relative overflow-hidden flex items-center justify-center bg-black/50"
                      style={{ backgroundColor: isOOG ? 'transparent' : item.hex }}
                    >
                      {isOOG ? (
                        <div className="w-full h-full border-2 border-dotted border-white/30 flex items-center justify-center">
                          <XCircle size={14} className="text-white/30" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                          <Plus size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Metadata */}
                    <div className="mt-2 text-center">
                       <div className="text-[10px] font-bold text-white">
                         {item.hueLabel}
                       </div>
                       <div className="text-[8px] text-white/50 uppercase">
                         {offset.label}
                       </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Close / Dismiss Area (Invisible overlay to close would be better, but simple X for now) */}
            <button 
              onClick={() => setHoveredType(null)} 
              className="ml-2 p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white"
            >
              <XCircle size={16} />
            </button>
          </div>
          
          {/* Connector Arrow */}
          <div className="w-4 h-4 bg-zinc-900/90 border-r border-b border-white/20 rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </>
  );
};

export default HarmonyDrawer;