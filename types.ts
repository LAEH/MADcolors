export type HueCode = 'R' | 'YR' | 'Y' | 'GY' | 'G' | 'BG' | 'B' | 'PB' | 'P' | 'RP';

// The inner arrays represent Value levels (Lightness), 
// and the strings inside them represent Chroma steps (Saturation).
export type ValueLevel = string[];

// A specific hue step (e.g. 2.5R) containing all value levels
export type HueStepData = ValueLevel[];

export interface MunsellData {
  codes: HueCode[];
  nvalues: number;
  bycode: Record<HueCode, HueStepData[]>;
  flat: string[][][];
}

export interface DialItem {
  id: string;
  label: string;
  hueCode: HueCode;
  stepIndex: number;
  stepValue: number;
}

export interface GridPosition {
  rowIndex: number;
  chromaIndex: number;
}

export interface PaletteItem {
  id: string;
  hex: string;
  hueLabel: string;
  valueLabel: number;
  chromaLabel: number;
  position: GridPosition;
  hueIndex: number; // 0-39 index in the flattened wheel
}
