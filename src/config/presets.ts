import { PresetRequirement } from '../types';

// ============================================================================
// REUSABLE CANONICAL BASE SPECS
// Clean, universal dimensions, DPI controls, and file-size boundaries
// ============================================================================

/** Standard 35 x 45 mm (3.5 x 4.5 cm) photo */
const BASE_PHOTO_35X45: Omit<PresetRequirement, 'id' | 'name' | 'description' | 'countryOrOrg'> = {
  category: 'passport',
  width: 35,
  height: 45,
  unit: 'mm',
  dpi: 300,
  format: 'jpeg',
  maxKb: 100,
  minKb: 20,
  bgColor: '#ffffff',
  bgType: 'white',
  faceGuideRatio: {
    headMinPercent: 70,
    headMaxPercent: 80,
    eyeLevelPercent: 60,
  },
};

/** Standard 2 x 2 inch (51 x 51 mm) square photo */
const BASE_PHOTO_51X51: Omit<PresetRequirement, 'id' | 'name' | 'description' | 'countryOrOrg'> = {
  category: 'passport',
  width: 51,
  height: 51,
  unit: 'mm',
  dpi: 300,
  format: 'jpeg',
  maxKb: 200,
  minKb: 20,
  bgColor: '#ffffff',
  bgType: 'white',
  faceGuideRatio: {
    headMinPercent: 55,
    headMaxPercent: 70,
    eyeLevelPercent: 60,
  },
};

/** Standard 3.5 x 1.5 cm signature box */
const BASE_SIGNATURE_35X15: Omit<PresetRequirement, 'id' | 'name' | 'description' | 'countryOrOrg'> = {
  category: 'application',
  width: 3.5,
  height: 1.5,
  unit: 'cm',
  dpi: 300,
  format: 'jpeg',
  maxKb: 30,
  minKb: 4,
  bgColor: '#ffffff',
  bgType: 'white',
};

// ============================================================================
// CLEAN UNIVERSAL PRESETS (Free from cluttered acronyms and regional bias)
// ============================================================================

export const BUILT_IN_PRESETS: PresetRequirement[] = [
  // --------------------------------------------------------------------------
  // 📸 STANDARD PORTRAIT & DOCUMENT PHOTOS
  // --------------------------------------------------------------------------
  {
    ...BASE_PHOTO_35X45,
    id: 'passport-standard-35x45',
    name: 'Passport & Identity Photo (35 × 45 mm)',
    countryOrOrg: 'Standard Biometric',
    description: 'Universal 35 × 45 mm biometric portrait with 70–80% face coverage on pure white background.',
    maxKb: 100,
    minKb: 20,
  },
  {
    ...BASE_PHOTO_51X51,
    id: 'square-photo-51x51',
    name: 'Square Photo (2 × 2" / 51 × 51 mm)',
    countryOrOrg: 'Square Format',
    description: 'Square 51 × 51 mm (600 × 600 px at 300 DPI) format on clean white background.',
    maxKb: 200,
    minKb: 20,
  },
  {
    id: 'id-card-photo-25x35',
    name: 'Compact ID Photo (2.5 × 3.5 cm)',
    category: 'application',
    countryOrOrg: 'Card Size',
    description: 'Compact 2.5 × 3.5 cm card portrait under 50 KB.',
    width: 2.5,
    height: 3.5,
    unit: 'cm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 50,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    ...BASE_PHOTO_35X45,
    id: 'offwhite-portrait-35x45',
    name: 'Light Neutral Portrait (35 × 45 mm)',
    countryOrOrg: 'Neutral Gray / White',
    description: 'Standard 35 × 45 mm portrait on light grey or off-white background.',
    bgColor: '#f1f5f9',
    bgType: 'light',
    maxKb: 200,
    minKb: 10,
  },
  {
    id: 'postcard-photo-4x6',
    name: 'Postcard Size Photo (4 × 6")',
    category: 'application',
    countryOrOrg: 'Postcard Format',
    description: 'Large 4 × 6 inch (10 × 15 cm) studio portrait format under 200 KB.',
    width: 4,
    height: 6,
    unit: 'inch',
    dpi: 300,
    format: 'jpeg',
    maxKb: 200,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
    faceGuideRatio: {
      headMinPercent: 75,
      headMaxPercent: 80,
      eyeLevelPercent: 62,
    },
  },
  {
    id: 'portrait-photo-50x70',
    name: 'Large Portrait (50 × 70 mm)',
    category: 'passport',
    countryOrOrg: '50 × 70 mm',
    description: 'Official 50 × 70 mm document portrait under 300 KB.',
    width: 50,
    height: 70,
    unit: 'mm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 300,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'square-portal-photo-350',
    name: 'Square Digital Photo (350 × 350 px)',
    category: 'application',
    countryOrOrg: 'Digital Portal',
    description: 'Clean 1:1 square digital portrait (350 × 350 px, under 300 KB).',
    width: 350,
    height: 350,
    unit: 'px',
    dpi: 150,
    format: 'jpeg',
    maxKb: 300,
    minKb: 20,
    bgColor: '#ffffff',
    bgType: 'white',
  },

  // --------------------------------------------------------------------------
  // ✍️ DIGITAL SIGNATURES & BIOMETRICS
  // --------------------------------------------------------------------------
  {
    ...BASE_SIGNATURE_35X15,
    id: 'signature-box-35x15',
    name: 'Standard Signature Box (3.5 × 1.5 cm)',
    countryOrOrg: 'Standard Signature',
    description: 'Standard 3.5 × 1.5 cm running handwriting signature, strictly 4 – 30 KB.',
  },
  {
    id: 'signature-compact-40x20',
    name: 'Compact Signature Box (4.0 × 2.0 cm)',
    category: 'application',
    countryOrOrg: 'Compact Box',
    description: '4.0 × 2.0 cm running signature in dark ink, strictly 10 – 20 KB.',
    width: 4.0,
    height: 2.0,
    unit: 'cm',
    dpi: 200,
    format: 'jpeg',
    maxKb: 20,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'signature-wide-70x20',
    name: 'Wide Signature Strip (7.0 × 2.0 cm)',
    category: 'application',
    countryOrOrg: 'Wide Strip',
    description: '7.0 × 2.0 cm (aspect ratio 3.5:1) wide signature strip, strictly 5 – 100 KB.',
    width: 7.0,
    height: 2.0,
    unit: 'cm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 100,
    minKb: 5,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'signature-portal-140x60',
    name: 'Web Signature Block (140 × 60 px)',
    category: 'application',
    countryOrOrg: 'Web Portal',
    description: '140 × 60 px digital signature on white background, strictly 10 – 20 KB.',
    width: 140,
    height: 60,
    unit: 'px',
    dpi: 96,
    format: 'jpeg',
    maxKb: 20,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'signature-square-350',
    name: 'Square Signature (350 × 350 px)',
    category: 'application',
    countryOrOrg: 'Square Format',
    description: '350 × 350 px signature box in dark ink, strictly 20 – 300 KB.',
    width: 350,
    height: 350,
    unit: 'px',
    dpi: 150,
    format: 'jpeg',
    maxKb: 300,
    minKb: 20,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'general-signature-png',
    name: 'Transparent Signature (PNG)',
    category: 'application',
    countryOrOrg: 'Transparent PNG',
    description: 'Crisp transparent background signature ready to sign PDFs, certificates, and letters.',
    width: 600,
    height: 240,
    unit: 'px',
    dpi: 300,
    format: 'png',
    maxKb: 100,
    bgColor: 'transparent',
    bgType: 'transparent',
  },
  {
    id: 'general-signature-jpg',
    name: 'Standard Signature (White JPG)',
    category: 'application',
    countryOrOrg: 'White Background',
    description: 'Standard white background signature under 50 KB.',
    width: 600,
    height: 250,
    unit: 'px',
    dpi: 300,
    format: 'jpeg',
    maxKb: 50,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'biometric-thumb-35x15',
    name: 'Biometric Thumb Impression (3.5 × 1.5 cm)',
    category: 'application',
    countryOrOrg: 'Biometric Impression',
    description: 'Standard 3.5 × 1.5 cm biometric thumb impression scan with enhanced ridge contrast, strictly 10 – 50 KB.',
    width: 3.5,
    height: 1.5,
    unit: 'cm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 50,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'general-thumb-impression',
    name: 'Biometric Thumb Impression (3.0 × 3.0 cm Square)',
    category: 'application',
    countryOrOrg: 'Biometric Impression',
    description: '3.0 × 3.0 cm square dermal ridge thumb impression for official applications, 10 – 50 KB.',
    width: 3.0,
    height: 3.0,
    unit: 'cm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 50,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'biometric-thumb-wide',
    name: 'Biometric Fingers & Thumbs Scan (8.0 × 4.0 cm)',
    category: 'application',
    countryOrOrg: 'Biometric Sheet',
    description: '8.0 × 4.0 cm fingers and thumb impression strip, strictly 10 – 200 KB.',
    width: 8.0,
    height: 4.0,
    unit: 'cm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 200,
    minKb: 10,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'photo-sign-combo',
    name: 'Photograph + Signature Combo Slip (3.5 × 6.0 cm)',
    category: 'application',
    countryOrOrg: 'Combo Slip',
    description: 'Combined portrait and signature block for single-upload forms.',
    width: 3.5,
    height: 6.0,
    unit: 'cm',
    dpi: 300,
    format: 'jpeg',
    maxKb: 100,
    minKb: 20,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'declaration-slip-10x5',
    name: 'Handwritten Declaration Slip (10.0 × 5.0 cm)',
    category: 'application',
    countryOrOrg: 'Declaration Slip',
    description: '10.0 × 5.0 cm candidate handwritten declaration slip, strictly 50 – 100 KB.',
    width: 10.0,
    height: 5.0,
    unit: 'cm',
    dpi: 200,
    format: 'jpeg',
    maxKb: 100,
    minKb: 50,
    bgColor: '#ffffff',
    bgType: 'white',
  },
  {
    id: 'avatar-square-800',
    name: 'Professional Profile Avatar (800 × 800 px)',
    category: 'social',
    countryOrOrg: 'Profile Avatar',
    description: 'High-resolution square 800 × 800 px crisp headshot.',
    width: 800,
    height: 800,
    unit: 'px',
    dpi: 150,
    format: 'jpeg',
    maxKb: 500,
  },
];

// ============================================================================
// LOCAL STORAGE MANAGEMENT FOR USER CUSTOM PRESETS
// ============================================================================

const LOCAL_STORAGE_KEY = 'docuprep_custom_presets_v1';

export function getCustomPresets(): PresetRequirement[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse custom presets from localStorage', e);
    return [];
  }
}

export function saveCustomPreset(preset: PresetRequirement): void {
  try {
    const existing = getCustomPresets().filter((p) => p.id !== preset.id);
    const updated = [preset, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom preset', e);
  }
}

export function deleteCustomPreset(id: string): void {
  try {
    const existing = getCustomPresets().filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to delete custom preset', e);
  }
}

export const ORIGINAL_DIMENSIONS_PRESET: PresetRequirement = {
  id: 'original',
  name: 'Original Dimensions (Keep Natural Size)',
  category: 'custom',
  countryOrOrg: 'Original',
  description: 'Maintain exact original dimensions without resizing or aspect distortion.',
  width: 0,
  height: 0,
  unit: 'px',
  dpi: 300,
  format: 'jpeg',
  bgType: 'any',
};

export function getPresetAspectRatioDisplay(
  preset: PresetRequirement | null,
  width?: number,
  height?: number
): string {
  if (!preset || preset.id === 'original') {
    return 'Original';
  }
  const w = width ?? preset.width;
  const h = height ?? preset.height;
  if (!w || !h) return 'Original';

  if (w === h) return '1:1 (Square)';
  if ((w === 35 && h === 45) || (w === 3.5 && h === 4.5)) return '35:45 (Standard Portrait)';
  if (w === 4 && h === 6) return '4:6 (Postcard Size)';
  if ((w === 3.5 && h === 1.5) || (w === 35 && h === 15)) return '7:3 (3.5 × 1.5 cm Standard)';
  if (w === 4.0 && h === 2.0) return '2:1 (Signature Box)';
  if (w === 7.0 && h === 2.0) return '3.5:1 (Wide Strip)';
  if (w === 50 && h === 70) return '5:7 (50 × 70 mm)';
  if (w === 140 && h === 60) return '140:60 (7:3 Signature)';
  if (w === 2 && h === 2) return '1:1 (2 × 2")';

  if (Number.isInteger(w) && Number.isInteger(h)) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(w, h);
    if (d > 1) {
      return `${w / d}:${h / d} (${w}×${h})`;
    }
  }

  return `${w}:${h}`;
}

export function getAllPresets(): PresetRequirement[] {
  return [ORIGINAL_DIMENSIONS_PRESET, ...BUILT_IN_PRESETS, ...getCustomPresets()];
}
