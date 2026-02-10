
import { PaletteItem, DialItem, GridPosition } from '../types';

// Convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Calculate relative luminance
const getLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

// Calculate contrast ratio
export const getContrastRatio = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const getTextColorForBackground = (bgColor: string): string => {
  const whiteContrast = getContrastRatio(bgColor, '#FFFFFF');
  const blackContrast = getContrastRatio(bgColor, '#000000');
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
};

// --- Palette Generators ---

type GetHexFn = (hueIndex: number, row: number, chroma: number) => string | null;

// Helper to construct a palette item from known coordinates
const constructItem = (
    hex: string,
    hueIndex: number,
    row: number,
    chroma: number,
    allHues: DialItem[]
): PaletteItem | null => {
    const totalHues = 40;
    let safeHueIndex = hueIndex % totalHues;
    if (safeHueIndex < 0) safeHueIndex += totalHues;
    const hueInfo = allHues[safeHueIndex];
    if (!hueInfo) return null;

    const valueLabel = 9 - row;
    const chromaLabel = (chroma + 1) * 2;
    
    return {
        id: `${hueInfo.label}-${valueLabel}-${chromaLabel}-${Math.random().toString(36).substr(2, 5)}`,
        hex,
        hueLabel: hueInfo.label,
        valueLabel,
        chromaLabel,
        position: { rowIndex: row, chromaIndex: chroma },
        hueIndex: safeHueIndex
    }
}

// Helper to find nearest existing color if exact coordinate is missing (Ragged Array Safety)
const findValidColor = (
  hueIndex: number, 
  targetRow: number, 
  targetChroma: number, 
  allHues: DialItem[],
  getHexAt: GetHexFn,
  allowChromaShift = true
): PaletteItem | null => {
  const totalHues = 40;
  let safeHueIndex = hueIndex % totalHues;
  if (safeHueIndex < 0) safeHueIndex += totalHues;
  
  // 1. Try exact match
  let hex = getHexAt(safeHueIndex, targetRow, targetChroma);
  let finalChroma = targetChroma;

  // 2. If missing, try reducing chroma (shift left in grid)
  if (!hex && allowChromaShift) {
    for (let c = targetChroma - 1; c >= 0; c--) {
      hex = getHexAt(safeHueIndex, targetRow, c);
      if (hex) {
        finalChroma = c;
        break;
      }
    }
  }

  // 3. If still missing, return null (Out of Gamut)
  if (!hex) return null;

  return constructItem(hex, safeHueIndex, targetRow, finalChroma, allHues);
};

// --- Munsell Structural Scales ---

export const generateChromaScale = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
    const palette: PaletteItem[] = [];
    const { rowIndex } = base.position;
    
    // Scan entire potential chroma range (indices 0 to ~14 which is chroma 2 to 30)
    // This captures the full row regardless of length (2 to 10+)
    for (let c = 0; c < 16; c++) {
        const hex = getHexAt(base.hueIndex, rowIndex, c);
        if (hex) {
            const item = constructItem(hex, base.hueIndex, rowIndex, c, allHues);
            if (item) palette.push(item);
        }
    }
    
    return palette;
};

export const generateValueScale = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
    const palette: PaletteItem[] = [];
    const { chromaIndex } = base.position;

    // Scan entire value column (rows 0 to 9)
    // Lower index = Higher Value (Lightness) in this data structure
    for (let r = 0; r < 10; r++) {
        const hex = getHexAt(base.hueIndex, r, chromaIndex);
        if (hex) {
             const item = constructItem(hex, base.hueIndex, r, chromaIndex, allHues);
             if (item) palette.push(item);
        }
    }
    
    return palette;
};

// --- Artistic Palettes ---

export const generateMonochromatic = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
  const palette: PaletteItem[] = [];
  // Expanded offsets to find more tone-on-tone options
  const offsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  
  offsets.forEach(offset => {
    let targetRow = (base.position.rowIndex) + offset;
    // Bounds check
    if (targetRow >= 0 && targetRow <= 9) {
        const color = findValidColor(base.hueIndex, targetRow, base.position.chromaIndex, allHues, getHexAt);
        if (color && !palette.find(p => p.hex === color.hex)) {
            palette.push(color);
        }
    }
  });

  return palette;
};

export const generateBoldComplement = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
  const palette: PaletteItem[] = [];
  const compIndex = base.hueIndex + 20;

  // 1. Base group
  const baseDarker = findValidColor(base.hueIndex, base.position.rowIndex + 2, base.position.chromaIndex, allHues, getHexAt);
  if (baseDarker) palette.push(baseDarker);
  
  palette.push(base);
  
  const baseLighter = findValidColor(base.hueIndex, base.position.rowIndex - 2, base.position.chromaIndex, allHues, getHexAt);
  if (baseLighter) palette.push(baseLighter);

  // 2. Neutral Connector
  const neutral = findValidColor(base.hueIndex, 8, 0, allHues, getHexAt) || findValidColor(base.hueIndex, 5, 0, allHues, getHexAt);
  if (neutral) palette.push(neutral);

  // 3. Complement group
  // Search for highest chroma in comp hue at similar value
  let comp = findValidColor(compIndex, base.position.rowIndex, base.position.chromaIndex, allHues, getHexAt, false);
  if (!comp) {
      for(let c=14; c>=0; c-=2) {
          const hex = getHexAt(compIndex, base.position.rowIndex, c);
          if (hex) {
              comp = constructItem(hex, compIndex, base.position.rowIndex, c, allHues);
              break;
          }
      }
  }
  
  // Comp variations
  if (comp) {
      const compDarker = findValidColor(compIndex, comp.position.rowIndex + 2, comp.position.chromaIndex, allHues, getHexAt);
      if (compDarker) palette.push(compDarker);
      
      palette.push(comp);

      const compLighter = findValidColor(compIndex, comp.position.rowIndex - 2, comp.position.chromaIndex, allHues, getHexAt);
      if (compLighter) palette.push(compLighter);
  }

  return palette;
};

export const generateHarmonicRange = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
  const palette: PaletteItem[] = [];
  // Expanded analogous range
  const offsets = [-3, -2, -1, 0, 1, 2, 3];
  offsets.forEach(offset => {
    const color = findValidColor(base.hueIndex + offset, base.position.rowIndex, base.position.chromaIndex, allHues, getHexAt);
    if (color) palette.push(color);
  });
  return palette;
};

export const generateSplitComplementary = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
  const palette: PaletteItem[] = [];
  const compIndex = base.hueIndex + 20;
  
  palette.push(base);
  
  // Base variants
  const baseVar1 = findValidColor(base.hueIndex, base.position.rowIndex + 1, base.position.chromaIndex, allHues, getHexAt);
  if (baseVar1) palette.push(baseVar1);
  const baseVar2 = findValidColor(base.hueIndex, base.position.rowIndex - 1, base.position.chromaIndex, allHues, getHexAt);
  if (baseVar2) palette.push(baseVar2);

  // Splits
  const split1 = findValidColor(compIndex - 3, base.position.rowIndex, base.position.chromaIndex, allHues, getHexAt);
  if (split1) palette.push(split1);
  
  const split1Var = findValidColor(compIndex - 3, base.position.rowIndex + 1, base.position.chromaIndex, allHues, getHexAt);
  if (split1Var) palette.push(split1Var);

  const split2 = findValidColor(compIndex + 3, base.position.rowIndex, base.position.chromaIndex, allHues, getHexAt);
  if (split2) palette.push(split2);

  const split2Var = findValidColor(compIndex + 3, base.position.rowIndex + 1, base.position.chromaIndex, allHues, getHexAt);
  if (split2Var) palette.push(split2Var);

  return palette;
};

export const generateTriadic = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
  const palette: PaletteItem[] = [];
  const t1Index = base.hueIndex + 13;
  const t2Index = base.hueIndex + 27;

  palette.push(base);
  const baseVar = findValidColor(base.hueIndex, base.position.rowIndex + 2, base.position.chromaIndex, allHues, getHexAt);
  if (baseVar) palette.push(baseVar);

  const t1 = findValidColor(t1Index, base.position.rowIndex, base.position.chromaIndex, allHues, getHexAt);
  if (t1) palette.push(t1);
  const t1Var = findValidColor(t1Index, base.position.rowIndex - 2, base.position.chromaIndex, allHues, getHexAt);
  if (t1Var) palette.push(t1Var);

  const t2 = findValidColor(t2Index, base.position.rowIndex, base.position.chromaIndex, allHues, getHexAt);
  if (t2) palette.push(t2);
  const t2Var = findValidColor(t2Index, base.position.rowIndex + 2, base.position.chromaIndex, allHues, getHexAt);
  if (t2Var) palette.push(t2Var);

  return palette;
};

export const generatePastelVibes = (base: PaletteItem, allHues: DialItem[], getHexAt: GetHexFn): PaletteItem[] => {
  const palette: PaletteItem[] = [];
  // Target High Value (0, 1, 2) and Low Chroma (0, 1, 2)
  const targetRow = 1; 
  const targetChroma = 2; // ~Chroma 6

  const offsets = [-2, -1, 0, 1, 2, 3];
  offsets.forEach(offset => {
    // Force search in high value area
    const color = findValidColor(base.hueIndex + offset, targetRow, targetChroma, allHues, getHexAt) ||
                  findValidColor(base.hueIndex + offset, 0, 0, allHues, getHexAt);
    if (color) palette.push(color);
  });

  return palette;
};
