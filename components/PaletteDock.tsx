import React from 'react';
import { PaletteItem } from '../types';
import { Trash2, Download, Eye } from 'lucide-react';
import { getTextColorForBackground } from '../services/utils';

interface PaletteDockProps {
  palette: PaletteItem[];
  onRemove: (id: string) => void;
  onSelectForContrast: (id: string | null) => void;
  contrastBaseId: string | null;
}

const PaletteDock: React.FC<PaletteDockProps> = ({ 
  palette, 
  onRemove, 
  onSelectForContrast,
  contrastBaseId 
}) => {
  
  const handleExport = () => {
    const cssVars = palette.map(p => 
      `--munsell-${p.hueLabel.replace('.','')}-${p.valueLabel}-${p.chromaLabel}: ${p.hex};`
    ).join('\n');
    
    navigator.clipboard.writeText(`:root {\n${cssVars}\n}`);
    alert('CSS Variables copied to clipboard!');
  };

  if (palette.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 md:gap-4 pl-4 bg-white/50 backdrop-blur-md rounded-2xl py-2 pr-2 border border-white/40 shadow-sm">
      
      {/* Dock Container */}
      <div className="flex items-center -space-x-2 md:space-x-1">
        {palette.map((item, index) => {
          const isContrastSource = contrastBaseId === item.id;
          const textColor = getTextColorForBackground(item.hex);

          return (
            <div 
              key={item.id} 
              className="group relative transition-transform hover:-translate-y-2 hover:z-10"
              style={{ zIndex: palette.length - index }}
            >
              <button
                onClick={() => onSelectForContrast(isContrastSource ? null : item.id)}
                className={`
                  relative w-7 h-7 md:w-10 md:h-10 rounded-full md:rounded-xl border-2 shadow-sm transition-all duration-300
                  ${isContrastSource ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-500/20' : 'border-white hover:border-slate-200'}
                `}
                style={{ backgroundColor: item.hex }}
                title={`${item.hueLabel} ${item.valueLabel}/${item.chromaLabel}`}
              >
                {isContrastSource && (
                  <Eye size={14} className="absolute inset-0 m-auto drop-shadow-md" style={{ color: textColor }} />
                )}
              </button>
              
              {/* Delete Button (Hover) */}
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                className="
                  absolute -top-1 -right-1 w-4 h-4 bg-white text-rose-500 border border-rose-100 rounded-full 
                  items-center justify-center hidden group-hover:flex
                  hover:bg-rose-50 transition-colors shadow-sm z-20
                "
              >
                <Trash2 size={8} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="w-px h-8 bg-slate-200 mx-1"></div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        className="
          p-2 md:p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900
          transition-colors shadow-sm
        "
        title="Export CSS Variables"
      >
        <Download size={16} />
      </button>
    </div>
  );
};

export default PaletteDock;