export interface ThemePreset {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    background: string
    surface: string
    text: string
    border: string
  }
}

const PRESETS: readonly ThemePreset[] = [
  {
    id: 'default',
    name: 'Default Blue',
    description: 'Clean and professional blue theme',
    colors: { primary: '#3478FE', background: '#ffffff', surface: '#f8f9fa', text: '#1a1a1a', border: '#e5e7eb' },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural and calming green tones',
    colors: { primary: '#22C55E', background: '#f0fdf4', surface: '#ecfdf5', text: '#14532d', border: '#bbf7d0' },
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    description: 'Warm and energetic orange palette',
    colors: { primary: '#F97316', background: '#fff7ed', surface: '#ffedd5', text: '#7c2d12', border: '#fed7aa' },
  },
  {
    id: 'ocean',
    name: 'Ocean Teal',
    description: 'Cool and refreshing teal hues',
    colors: { primary: '#14B8A6', background: '#f0fdfa', surface: '#ccfbf1', text: '#134e4a', border: '#99f6e4' },
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    description: 'Deep and elegant purple palette',
    colors: { primary: '#8B5CF6', background: '#faf5ff', surface: '#f3e8ff', text: '#3b0764', border: '#d8b4fe' },
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    description: 'Soft and modern pink tones',
    colors: { primary: '#EC4899', background: '#fdf2f8', surface: '#fce7f3', text: '#831843', border: '#fbcfe8' },
  },
]

export function getPresets(): readonly ThemePreset[] {
  return PRESETS
}

export function getPresetById(id: string): ThemePreset | null {
  return PRESETS.find((p) => p.id === id) ?? null
}

export function applyPreset(preset: ThemePreset): Record<string, string> {
  return {
    '--primary': preset.colors.primary,
    '--bg-primary': preset.colors.background,
    '--bg-secondary': preset.colors.surface,
    '--text-primary': preset.colors.text,
    '--border': preset.colors.border,
  }
}
