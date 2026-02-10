import React, { useMemo, useState } from 'react';
import { PaletteItem, DialItem } from '../types';
import { X, Check, Copy, Shuffle } from 'lucide-react';
import { 
  getTextColorForBackground, 
  generateMonochromatic, 
  generateBoldComplement, 
  generateHarmonicRange,
  generateSplitComplementary,
  generateTriadic,
  generatePastelVibes,
  generateChromaScale,
  generateValueScale
} from '../services/utils';

interface ColorPopoverProps {
  selectedTile: PaletteItem;
  onClose: () => void;
  onAnchorClick: (item: PaletteItem) => void;
  onShuffle: () => void;
  allHues: DialItem[];
  getHexAt: (hueIndex: number, row: number, chroma: number) => string | null;
}

const ColorPopover: React.FC<ColorPopoverProps> = ({
  selectedTile,
  onClose,
  onAnchorClick,
  onShuffle,
  allHues,
  getHexAt
}) => {
  const [copiedRowIndex, setCopiedRowIndex] = useState<number | null>(null);

  // Pre-compute 8 palette variations
  const palettes = useMemo(() => {
    return [
      {
        title: "Chroma Scale",
        desc: "Full saturation progression for this Value.",
        items: generateChromaScale(selectedTile, allHues, getHexAt)
      },
      {
        title: "Value Scale",
        desc: "Full lightness scale for this Chroma.",
        items: generateValueScale(selectedTile, allHues, getHexAt)
      },
      {
        title: "Monochromatic",
        desc: "Safe tone-on-tone progression.",
        items: generateMonochromatic(selectedTile, allHues, getHexAt)
      },
      {
        title: "Bold Complement",
        desc: "High contrast visual opposites.",
        items: generateBoldComplement(selectedTile, allHues, getHexAt)
      },
      {
        title: "Split Complementary",
        desc: "Vibrant contrast without harshness.",
        items: generateSplitComplementary(selectedTile, allHues, getHexAt)
      },
      {
        title: "Triadic Harmony",
        desc: "Rich, balanced, and colorful.",
        items: generateTriadic(selectedTile, allHues, getHexAt)
      },
      {
        title: "Harmonic Range",
        desc: "Analogous neighbor hues.",
        items: generateHarmonicRange(selectedTile, allHues, getHexAt)
      },
      {
        title: "Pastel Vibes",
        desc: "Soft, airy, high-value variants.",
        items: generatePastelVibes(selectedTile, allHues, getHexAt)
      }
    ];
  }, [selectedTile, allHues, getHexAt]);

  const handleCopyPalette = (items: PaletteItem[], index: number) => {
    const hexList = items.map(i => i.hex).join(', ');
    navigator.clipboard.writeText(hexList);
    setCopiedRowIndex(index);
    setTimeout(() => setCopiedRowIndex(null), 2000);
  };

  const renderPaletteRow = (title: string, description: string, palette: PaletteItem[], index: number) => {
    if (palette.length < 2) return null; // Skip empty results

    return (
      <div key={index} className="mb-10 last:mb-0 group">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-tight font-sans">{title}</h3>
            <p className="text-xs text-slate-500 font-medium font-sans">{description}</p>
          </div>
          
          <button
            onClick={() => handleCopyPalette(palette, index)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-full
              bg-white/50 hover:bg-white text-slate-600 font-semibold text-[10px] uppercase tracking-wider
              transition-all border border-slate-200 shadow-sm hover:shadow-md
            "
          >
            {copiedRowIndex === index ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
            {copiedRowIndex === index ? 'COPIED' : 'COPY HEX'}
          </button>
        </div>
        
        <div className="flex w-full h-16 rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
          {palette.map((item, i) => (
            <button 
              key={i} 
              onClick={() => onAnchorClick(item)}
              className="flex-1 h-full relative group/swatch focus:outline-none transition-all hover:flex-[1.2]" 
              style={{ backgroundColor: item.hex }}
              title={`Navigate to ${item.hex}`}
            >
               <div className="absolute inset-0 bg-black/0 group-hover/swatch:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Overlay - Modern Frosted Glass */}
      <div 
        className="fixed inset-0 bg-slate-500/10 backdrop-blur-xl z-[45] transition-opacity duration-500 animate-in fade-in"
        onClick={onClose}
      />

      {/* Centered Glass Card - Positioned centered */}
      <div className="
        fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50]
        w-[90vw] max-w-lg max-h-[80vh]
        bg-white/80 backdrop-blur-3xl
        border border-white/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)]
        rounded-[2.5rem]
        flex flex-col overflow-hidden
        animate-in zoom-in-95 fade-in duration-300
      ">
        {/* Header Section */}
        <div className="flex-shrink-0 p-8 pb-4 relative z-10 bg-white/40 border-b border-white/20">
          
          {/* Controls */}
          <div className="absolute top-6 right-6 flex items-center gap-3">
             <button 
                onClick={onShuffle}
                className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-slate-500 transition-colors"
                title="Shuffle Random Color"
              >
                <Shuffle size={18} />
              </button>
             <button 
                onClick={onClose}
                className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-slate-500 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
          </div>
          
          <div className="flex items-center gap-5">
             {/* Big Swatch */}
             <div 
               className="w-20 h-20 rounded-[1.5rem] shadow-sm ring-1 ring-black/5 flex-shrink-0"
               style={{ backgroundColor: selectedTile.hex }}
             />
             <div>
                <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1 font-sans">
                  {selectedTile.hueLabel} • {selectedTile.valueLabel}/{selectedTile.chromaLabel}
                </div>
                <div className="font-mono font-bold text-4xl tracking-tight text-slate-900 leading-none">
                  {selectedTile.hex}
                </div>
             </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto px-8 pb-12 pt-6 custom-scrollbar">
          {palettes.map((p, idx) => renderPaletteRow(p.title, p.desc, p.items, idx))}
        </div>
      </div>
    </>
  );
};

export default ColorPopover;