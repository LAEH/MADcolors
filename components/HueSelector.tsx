import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HueCode } from '../types';

interface DialItem {
  id: string;
  label: string;
  hueCode: HueCode;
  stepValue: number;
}

interface HueSelectorProps {
  items: DialItem[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

const HUE_COLORS: Record<HueCode, string> = {
  'R': '#ef4444',
  'YR': '#f97316',
  'Y': '#eab308',
  'GY': '#84cc16',
  'G': '#22c55e',
  'BG': '#06b6d4',
  'B': '#3b82f6',
  'PB': '#6366f1',
  'P': '#a855f7',
  'RP': '#ec4899',
};

const HueSelector: React.FC<HueSelectorProps> = ({
  items,
  selectedIndex,
  onChange
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

  // Scroll to selected item when index changes externally
  useEffect(() => {
    if (isScrollingRef.current || isDragging) return;
    const container = scrollContainerRef.current;
    const selectedElement = itemRefs.current[selectedIndex];
    if (container && selectedElement) {
      const scrollTo = selectedElement.offsetLeft - (container.offsetWidth / 2) + (selectedElement.offsetWidth / 2);
      if (Math.abs(container.scrollLeft - scrollTo) > 2) {
        container.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isDragging]);

  // Find closest item to center and update selection
  const updateSelectionFromScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerCenter = container.getBoundingClientRect().left + container.clientWidth / 2;

    let closestIndex = selectedIndex;
    let minDiff = Infinity;

    items.forEach((_, i) => {
      const el = itemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        const itemCenter = rect.left + rect.width / 2;
        const diff = Math.abs(containerCenter - itemCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
    });

    if (closestIndex !== selectedIndex) {
      onChange(closestIndex);
    }
  }, [items, selectedIndex, onChange]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => { isScrollingRef.current = false; }, 150);
    updateSelectionFromScroll();
  };

  // Mouse wheel -> horizontal scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;

    // Use deltaY for horizontal scroll (multiplied for better feel)
    const scrollAmount = e.deltaY * 2;
    container.scrollBy({ left: scrollAmount, behavior: 'auto' });

    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      // Snap to nearest after wheel stops
      const selectedElement = itemRefs.current[selectedIndex];
      if (container && selectedElement) {
        const scrollTo = selectedElement.offsetLeft - (container.offsetWidth / 2) + (selectedElement.offsetWidth / 2);
        container.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    }, 150);

    updateSelectionFromScroll();
  }, [updateSelectionFromScroll, selectedIndex]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      scrollLeft: container.scrollLeft
    };
    container.style.scrollBehavior = 'auto';
    container.style.scrollSnapType = 'none';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    container.scrollLeft = dragStartRef.current.scrollLeft - dx;
    updateSelectionFromScroll();
  }, [isDragging, updateSelectionFromScroll]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsDragging(false);
    container.style.scrollBehavior = 'smooth';
    container.style.scrollSnapType = 'x mandatory';

    // Snap to nearest item
    const selectedElement = itemRefs.current[selectedIndex];
    if (selectedElement) {
      const scrollTo = selectedElement.offsetLeft - (container.offsetWidth / 2) + (selectedElement.offsetWidth / 2);
      container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, [isDragging, selectedIndex]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp();
    }
  }, [isDragging, handleMouseUp]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
      onChange(newIndex);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
      onChange(newIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(items.length - 1);
    }
  }, [selectedIndex, items.length, onChange]);

  return (
    <div
      className="w-full h-full relative group flex items-end"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={items.length - 1}
      aria-valuenow={selectedIndex}
      aria-label="Hue selector"
    >

      {/* Center Cursor */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-none z-10 flex flex-col items-center h-full justify-end pb-2">
        <div className="w-0.5 h-6 bg-slate-900 rounded-full shadow-sm opacity-20"></div>
      </div>

      {/* Edge Gradients */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-30 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent z-30 pointer-events-none"></div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`
          relative z-20
          flex overflow-x-auto items-end gap-0 px-[50%] py-4
          snap-x snap-mandatory scroll-smooth no-scrollbar
          h-full select-none
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => {
          const isSelected = selectedIndex === index;
          const hueColor = HUE_COLORS[item.hueCode];
          const isMajorStart = index % 4 === 0;

          return (
            <button
              key={item.id}
              ref={(el) => { itemRefs.current[index] = el; }}
              onClick={() => {
                if (!isDragging) {
                  isScrollingRef.current = false;
                  onChange(index);
                }
              }}
              className={`
                relative flex-shrink-0 flex flex-col items-center justify-end
                w-16 h-20 snap-center focus:outline-none transition-all duration-300 pb-2
                ${isSelected ? 'opacity-100 scale-100' : 'opacity-40 hover:opacity-60'}
              `}
            >
              {isMajorStart && (
                <div className="absolute -top-3 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                  {item.hueCode}
                </div>
              )}

              <span className={`
                text-[10px] font-medium tracking-tight mb-2 transition-colors duration-300
                ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'}
              `}>
                {item.label}
              </span>

              <div className="flex flex-col items-center gap-1">
                 <div
                   className={`
                     w-0.5 rounded-full transition-all duration-300
                     ${isSelected ? 'h-5 bg-slate-800' : isMajorStart ? 'h-3.5 bg-slate-300' : 'h-2.5 bg-slate-200'}
                   `}
                 />
              </div>

              {/* Color Dot */}
              <div
                className={`
                  absolute bottom-0 w-1.5 h-1.5 rounded-full mt-1 transition-all duration-500
                  ${isSelected ? 'opacity-100 translate-y-1' : 'opacity-0 translate-y-0'}
                `}
                style={{ backgroundColor: hueColor }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HueSelector;