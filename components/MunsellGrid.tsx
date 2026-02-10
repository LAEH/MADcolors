import React from 'react';
import { HueStepData, HueCode, GridPosition } from '../types';
import { Lock } from 'lucide-react';
import { getContrastRatio, getTextColorForBackground } from '../services/utils';

interface MunsellGridProps {
  hue: HueCode;
  stepIndex: number;
  hueLabel: string;
  data: HueStepData;
  prevData: string[][] | null;
  isFading: boolean;
  globalMaxChroma: number;
  lockedPosition: GridPosition | null;
  contrastBaseColor: string | null;
  onColorSelect: (hex: string, position: GridPosition) => void;
}

const MunsellGrid: React.FC<MunsellGridProps> = ({ 
  hue, 
  stepIndex, 
  hueLabel,
  data, 
  prevData,
  isFading,
  globalMaxChroma,
  lockedPosition,
  contrastBaseColor,
  onColorSelect
}) => {
  
  const renderCell = (
    hex: string | undefined, 
    rowIndex: number, 
    chromaIndex: number, 
    layer: 'active' | 'onion' | 'gamut-marker'
  ) => {
    const valueLabel = 9 - rowIndex;
    const chromaLabel = (chromaIndex + 1) * 2;
    const isLockedCell = lockedPosition && 
                         lockedPosition.rowIndex === rowIndex && 
                         lockedPosition.chromaIndex === chromaIndex;
    const isOutOfGamut = layer === 'active' && isLockedCell && !hex;

    if (!hex && !isOutOfGamut) {
      return (
        <div key={`${layer}-${rowIndex}-${chromaIndex}`} className="w-8 h-10 md:w-12 md:h-16 rounded-lg md:rounded-xl opacity-0 pointer-events-none" />
      );
    }

    if (layer === 'onion') {
      return (
        <div
          key={`onion-${rowIndex}-${chromaIndex}`}
          className={`
            w-8 h-10 md:w-12 md:h-16 rounded-lg md:rounded-xl
            border border-slate-300 bg-transparent
            pointer-events-none
            transition-opacity duration-500 ease-out
            ${isFading ? 'opacity-0' : 'opacity-30'}
          `}
        />
      );
    }

    if (isOutOfGamut) {
      return (
        <div
          key={`oog-${rowIndex}-${chromaIndex}`}
          className="
            w-8 h-10 md:w-12 md:h-16 rounded-lg md:rounded-xl
            border-2 border-dotted border-slate-300 
            flex items-center justify-center
            bg-slate-50/50 cursor-not-allowed
          "
          title="Out of Gamut for this Hue"
        >
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
        </div>
      );
    }

    const contrastRatio = contrastBaseColor && hex ? getContrastRatio(hex, contrastBaseColor) : null;
    const isPass = contrastRatio && contrastRatio >= 4.5;
    const textColor = hex ? getTextColorForBackground(hex) : '#000';

    return (
      <button
        key={`${rowIndex}-${chromaIndex}`}
        onClick={() => hex && onColorSelect(hex, { rowIndex, chromaIndex })}
        className={`
          group relative w-8 h-10 md:w-12 md:h-16 
          rounded-lg md:rounded-xl
          transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
          active:scale-95
          focus:outline-none shadow-sm
          ${isLockedCell 
            ? 'ring-4 ring-blue-500/30 scale-105 z-20 shadow-lg' 
            : 'hover:scale-110 hover:z-20 hover:shadow-xl hover:shadow-black/10'}
        `}
        style={{ backgroundColor: hex }}
        title={`${hueLabel} ${valueLabel}/${chromaLabel}`}
      >
        {isLockedCell && !contrastRatio && (
          <div className="absolute inset-0 flex items-center justify-center opacity-100">
            <div className="bg-white/20 backdrop-blur-sm p-1 rounded-full">
              <Lock size={12} className="text-slate-900" />
            </div>
          </div>
        )}

        {contrastRatio && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-[10px] md:text-xs font-bold drop-shadow-md ${isPass ? '' : 'opacity-60'}`} style={{ color: textColor }}>
              {contrastRatio.toFixed(1)}
            </span>
            {!isPass && <span className="text-[8px] opacity-70 font-medium" style={{ color: textColor }}>Low</span>}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 md:p-4">
      {/* GRID CARD - Glassmorphism Light */}
      <div className="
        relative flex flex-col items-center justify-center
        bg-white/60 backdrop-blur-2xl 
        rounded-[1.5rem] md:rounded-[2.5rem] 
        border border-white/60 shadow-2xl shadow-slate-300/50
        max-w-full max-h-full
        transition-all duration-500 ease-out 
      ">
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none rounded-[2.5rem]"></div>

        {/* Labels - Updated Font - Hidden on Mobile */}
        <div className="hidden md:block absolute top-4 left-6 text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase pointer-events-none z-20 font-sans">Value</div>
        <div className="hidden md:block absolute bottom-4 right-6 text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase pointer-events-none z-20 font-sans">Chroma</div>

        <div className="
          relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar
          p-6 md:p-12
        ">
          
          {prevData && (
             <div className="absolute top-6 left-6 md:top-12 md:left-12 flex flex-col gap-2 md:gap-3 pointer-events-none z-0">
               {prevData.map((chromaRow, rowIndex) => (
                 <div key={`ghost-row-${rowIndex}`} className="flex items-center gap-2 md:gap-3 min-w-max">
                   <div className="w-6 md:w-8" />
                   <div className="flex gap-2 md:gap-3">
                     {chromaRow.map((hex, chromaIndex) => renderCell(hex, rowIndex, chromaIndex, 'onion'))}
                   </div>
                 </div>
               ))}
             </div>
          )}

          <div className="relative z-10 flex flex-col gap-2 md:gap-3">
            {data.map((chromaRow, rowIndex) => {
              const valueLabel = 9 - rowIndex; 
              const isLockedRow = lockedPosition?.rowIndex === rowIndex;
              const lockedChromaIndex = lockedPosition?.chromaIndex ?? -1;
              const rowNeedsMarker = isLockedRow && lockedChromaIndex >= chromaRow.length;

              return (
                <div key={rowIndex} className="flex items-center gap-2 md:gap-3 min-w-max">
                  {/* Y-Axis Labels: Clean tabular numbers */}
                  <div className="sticky left-0 z-30 flex items-center justify-end w-6 md:w-8">
                    <span className="
                      text-right text-[10px] md:text-xs text-slate-400 font-sans font-medium tabular-nums select-none
                      bg-white/80 backdrop-blur-md px-1.5 py-0.5 rounded
                    ">
                      {valueLabel}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 md:gap-3">
                    {chromaRow.map((hex, chromaIndex) => renderCell(hex, rowIndex, chromaIndex, 'active'))}
                    {rowNeedsMarker && renderCell(undefined, rowIndex, lockedChromaIndex, 'active')}
                  </div>
                </div>
              );
            })}
            
            {/* X-Axis Labels: Clean tabular numbers */}
            <div className="flex gap-2 md:gap-3 mt-1 pl-8 md:pl-[3.25rem] min-w-max">
               {Array.from({ length: globalMaxChroma }).map((_, i) => (
                 <div key={i} className="w-8 md:w-12 text-center text-[10px] text-slate-400 font-sans font-medium tabular-nums opacity-50 select-none">
                   {(i + 1) * 2}
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MunsellGrid;