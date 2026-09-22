export type ToolCategory = 'image' | 'photo' | 'application' | 'pdf';

export type ToolId =
  // Image Tools
  | 'resize'
  | 'crop'
  | 'compress'
  | 'convert'
  | 'dpi'
  | 'background'
  | 'editor'
  // Photo Tools
  | 'passport'
  | 'visa'
  | 'id-photo'
  | 'photo-sheet'
  | 'custom-photo'
  // Application Tools
  | 'signature'
  | 'thumb'
  | 'photo-sign'
  | 'scanner'
  // PDF Tools
  | 'img-to-pdf'
  | 'pdf-to-img'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-compress'
  | 'pdf-organizer'
  | 'pdf-annotator';

export type UnitType = 'px' | 'mm' | 'cm' | 'inch';

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'pdf';

export interface PresetRequirement {
  id: string;
  name: string;
  category: 'passport' | 'visa' | 'exam' | 'application' | 'social' | 'custom';
  description: string;
  countryOrOrg?: string;
  width: number;
  height: number;
  unit: UnitType;
  dpi: number;
  format: OutputFormat;
  maxKb?: number;
  minKb?: number;
  aspectRatio?: number;
  bgColor?: string;
  bgType?: 'white' | 'light' | 'transparent' | 'any';
  faceGuideRatio?: {
    headMinPercent: number; // e.g. 50%
    headMaxPercent: number; // e.g. 70%
    eyeLevelPercent: number; // e.g. 60% from bottom
  };
}

export type CustomPreset = PresetRequirement;

export interface UploadedFileItem {
  id: string;
  file: File;
  name: string;
  size: number; // bytes
  type: string;
  dataUrl: string;
  width: number;
  height: number;
  dpi?: number;
  pageCount?: number;
  originalDimensions?: { width: number; height: number };
}

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // 0 to 100
  rotation: number; // 0, 90, 180, 270 degrees
  flipH: boolean;
  flipV: boolean;
  grayscale: boolean;
  binarize: boolean; // black & white threshold
  thresholdLevel?: number; // 0-255
  inkColor?: 'original' | 'black' | 'blue';
  backgroundColor?: string; // hex or 'transparent'
  removeBgActive?: boolean;
  bgTolerance?: number; // 1-100
}

export interface CropArea {
  x: number; // percentage (0 to 1) or pixels
  y: number;
  width: number;
  height: number;
}

export interface EditorSettings {
  mode: 'simple' | 'advanced';
  unit: UnitType;
  width: number;
  height: number;
  dpi: number;
  lockAspectRatio: boolean;
  outputFormat: OutputFormat;
  quality: number; // 1 - 100
  targetMaxKb: number | null; // null for unconstrained
  customFilename: string;
  selectedPresetId: string | null;
}

export interface ComplianceCheckItem {
  category: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

export interface ComplianceReport {
  complianceScore: number; // 0 - 100
  verdict: string;
  summary: string;
  checks: ComplianceCheckItem[];
  actionableTips: string[];
}

export interface HistoryState {
  adjustments: ImageAdjustments;
  cropArea: CropArea | null;
  settings: EditorSettings;
}
