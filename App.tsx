
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import { MUNSELL_DATA } from './services/data';
import HueSelector from './components/HueSelector';
import MunsellGrid from './components/MunsellGrid';
import CommandDeck from './components/CommandDeck';
import ColorPopover from './components/ColorPopover';
import Onboarding, { useOnboarding } from './components/Onboarding';
import { HueCode, GridPosition, PaletteItem } from './types';

// Mobile Not Supported Screen
const MobileNotSupported: React.FC = () => (
  <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6 font-sans">
    <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 max-w-sm text-center border border-white/20 shadow-2xl">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
        <Monitor className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Desktop Required</h1>
      <p className="text-white/80 text-lg mb-6">
        MADcolors requires a larger screen to properly display the color grid.
        Please visit on a desktop or laptop computer.
      </p>
      <div className="flex items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full bg-red-500"></div>
        <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
        <div className="w-8 h-8 rounded-full bg-green-500"></div>
        <div className="w-8 h-8 rounded-full bg-blue-500"></div>
        <div className="w-8 h-8 rounded-full bg-purple-500"></div>
      </div>
    </div>
  </div>
);

// Flatten the data structure for the linear dial
const HUE_ORDER: HueCode[] = ['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP'];
const STEPS = [2.5, 5.0, 7.5, 10.0];

const App: React.FC = () => {
  // --- Mobile Detection ---
  const [isMobile, setIsMobile] = useState(false);

  // --- Onboarding ---
  const { showOnboarding, completeOnboarding } = useOnboarding();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show mobile not supported screen on phones
  if (isMobile) {
    return <MobileNotSupported />;
  }

  // --- Data Preparation ---
  const allHues = useMemo(() => {
    return HUE_ORDER.flatMap((code) => 
      STEPS.map((step, index) => ({
        id: `${step}${code}`,
        label: `${step}${code}`,
        hueCode: code,
        stepIndex: index,
        stepValue: step
      }))
    );
  }, []);

  const globalMaxChroma = useMemo(() => {
    let max = 0;
    Object.values(MUNSELL_DATA.bycode).forEach((hueSteps) => {
      hueSteps.forEach((valueLevels) => {
        valueLevels.forEach((chromas) => {
          if (chromas.length > max) max = chromas.length;
        });
      });
    });
    return max;
  }, []);

  // --- State ---
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [prevGridData, setPrevGridData] = useState<string[][] | null>(null);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [palette, setPalette] = useState<PaletteItem[]>([]);
  const [contrastBaseId, setContrastBaseId] = useState<string | null>(null);
  const [selectedTileForPopover, setSelectedTileForPopover] = useState<PaletteItem | null>(null);

  // --- Derived State ---
  const currentSelection = allHues[currentIndex];
  const hueStepsData = MUNSELL_DATA.bycode[currentSelection.hueCode] || [];
  const currentGridData = hueStepsData[currentSelection.stepIndex] || [];
  
  const getHexAt = (hueIndex: number, row: number, chroma: number): string | null => {
    const h = allHues[hueIndex];
    if (!h) return null;
    const data = MUNSELL_DATA.bycode[h.hueCode]?.[h.stepIndex];
    return data?.[row]?.[chroma] || null;
  };

  // --- Effects ---
  const handleHueChange = (newIndex: number) => {
    if (newIndex === currentIndex) return;

    const currentHue = allHues[currentIndex];
    const dataToGhost = MUNSELL_DATA.bycode[currentHue.hueCode]?.[currentHue.stepIndex] || null;
    
    setPrevGridData(dataToGhost);
    setIsFading(false);
    setCurrentIndex(newIndex);

    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setTimeout(() => setIsFading(true), 50);
    fadeTimeoutRef.current = setTimeout(() => {
      setPrevGridData(null);
      setIsFading(false);
    }, 550);
  };

  // --- Actions ---
  const handleTileClick = (hex: string, position: GridPosition) => {
    const valueLabel = 9 - position.rowIndex;
    const chromaLabel = (position.chromaIndex + 1) * 2;
    
    const item: PaletteItem = {
      id: `${currentSelection.label}-${valueLabel}-${chromaLabel}`,
      hex,
      hueLabel: currentSelection.label,
      valueLabel,
      chromaLabel,
      position,
      hueIndex: currentIndex
    };

    setSelectedTileForPopover(item);
  };

  // Navigates the main view to a specific anchor color
  const handleAnchorClick = (item: PaletteItem) => {
    // 1. Move Hue Dial
    handleHueChange(item.hueIndex);
    
    // 2. Set as selected (updating the popover to this new anchor)
    setSelectedTileForPopover(item);
  };

  const handleRandomColor = () => {
    // Attempt to find a valid color (some slots might be empty)
    for (let i = 0; i < 50; i++) {
        const randomHueIndex = Math.floor(Math.random() * allHues.length);
        const hueInfo = allHues[randomHueIndex];
        const hueData = MUNSELL_DATA.bycode[hueInfo.hueCode]?.[hueInfo.stepIndex];
        
        if (hueData && hueData.length > 0) {
            const randomRowIndex = Math.floor(Math.random() * hueData.length);
            const rowData = hueData[randomRowIndex];
            
            if (rowData && rowData.length > 0) {
                const randomChromaIndex = Math.floor(Math.random() * rowData.length);
                const hex = rowData[randomChromaIndex];
                
                if (hex) {
                    const valueLabel = 9 - randomRowIndex;
                    const chromaLabel = (randomChromaIndex + 1) * 2;
                    
                    const newItem: PaletteItem = {
                        id: `${hueInfo.label}-${valueLabel}-${chromaLabel}-rnd`,
                        hex,
                        hueLabel: hueInfo.label,
                        valueLabel,
                        chromaLabel,
                        position: { rowIndex: randomRowIndex, chromaIndex: randomChromaIndex },
                        hueIndex: randomHueIndex
                    };
                    
                    handleAnchorClick(newItem);
                    return;
                }
            }
        }
    }
  };

  const activeContrastHex = contrastBaseId 
    ? palette.find(p => p.id === contrastBaseId)?.hex || null 
    : null;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans bg-[#F5F5F7]">
      
      {/* Light Theme Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-100/50 blur-[150px] mix-blend-multiply"></div>
        <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-rose-100/50 blur-[150px] mix-blend-multiply"></div>
      </div>

      {/* Header - Emoji Icon */}
      <header className="fixed top-6 left-6 md:top-10 md:left-10 z-[60] pointer-events-none">
        <div className="
          w-12 h-12 md:w-16 md:h-16
          rounded-full bg-slate-900 text-white 
          flex items-center justify-center 
          shadow-2xl shadow-slate-900/20
          pointer-events-auto
          transition-transform duration-300 hover:scale-105
        ">
          <span className="text-2xl md:text-3xl">🎨</span>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center w-full h-full pb-32">
        <div
          key={currentSelection.id}
          data-tour="color-grid"
          className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-500"
        >
           <MunsellGrid 
             hue={currentSelection.hueCode} 
             hueLabel={currentSelection.label}
             stepIndex={currentSelection.stepIndex}
             data={currentGridData} 
             
             prevData={prevGridData} 
             isFading={isFading} 
             
             globalMaxChroma={globalMaxChroma}
             lockedPosition={null} 
             contrastBaseColor={activeContrastHex} 
             onColorSelect={handleTileClick} 
           />
        </div>
      </main>

      {/* Popover (Generative Modal) */}
      {selectedTileForPopover && (
        <ColorPopover 
          selectedTile={selectedTileForPopover}
          onClose={() => setSelectedTileForPopover(null)}
          onAnchorClick={handleAnchorClick}
          onShuffle={handleRandomColor}
          allHues={allHues}
          getHexAt={getHexAt}
        />
      )}

      {/* Command Deck (Footer) */}
      <CommandDeck
        palette={palette}
        onRemovePalette={(id) => {
          setPalette(prev => prev.filter(p => p.id !== id));
          if (contrastBaseId === id) setContrastBaseId(null);
        }}
        onSelectContrast={setContrastBaseId}
        contrastBaseId={contrastBaseId}
      >
        <HueSelector
          items={allHues}
          selectedIndex={currentIndex}
          onChange={handleHueChange}
        />
      </CommandDeck>

      {/* Onboarding Tutorial */}
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

    </div>
  );
};

export default App;
