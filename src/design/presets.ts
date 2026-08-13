import type { PresetId, ImageKind } from '../types/index';

export interface Preset {
  id: PresetId;
  label: string;
  cardBg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  dimAlpha: number;
  cardRadius: number;
  cardEdge: 'accentBar' | 'softShadow' | 'goldBorder' | 'grayBorder';
  arrowStyle: 'curvedThick' | 'straight' | 'curvedThin' | 'dashedPin';
  arrowWidth: number;
  arrowCurve: number;
  font: string;
  suggestFor: ImageKind[];
}

export const PRESETS: Preset[] = [
  {
    id: 'neon_spotlight',
    label: 'Neon Spotlight',
    cardBg: 'rgba(10,14,25,.88)',
    accent: '#FFD400',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,.82)',
    dimAlpha: 0.55,
    cardRadius: 24,
    cardEdge: 'accentBar',
    arrowStyle: 'curvedThick',
    arrowWidth: 12,
    arrowCurve: 0.18,
    font: 'Be Vietnam Pro',
    suggestFor: ['perspective'],
  },
  {
    id: 'minimal_white',
    label: 'Minimal White',
    cardBg: '#FFFFFF',
    accent: '#FF3B30',
    textPrimary: '#111111',
    textSecondary: '#4A4A4A',
    dimAlpha: 0.40,
    cardRadius: 16,
    cardEdge: 'softShadow',
    arrowStyle: 'straight',
    arrowWidth: 8,
    arrowCurve: 0.0,
    font: 'Inter',
    suggestFor: ['floorplan'],
  },
  {
    id: 'luxe_gold_black',
    label: 'Luxe Gold Black',
    cardBg: '#0A0A0A',
    accent: '#C9A227',
    textPrimary: '#F5F5F5',
    textSecondary: 'rgba(245,245,245,.8)',
    dimAlpha: 0.50,
    cardRadius: 8,
    cardEdge: 'goldBorder',
    arrowStyle: 'curvedThin',
    arrowWidth: 6,
    arrowCurve: 0.12,
    font: 'Be Vietnam Pro',
    suggestFor: ['perspective'],
  },
  {
    id: 'map_clean',
    label: 'Map Clean',
    cardBg: 'rgba(255,255,255,.94)',
    accent: '#1A73E8',
    textPrimary: '#202124',
    textSecondary: '#5F6368',
    dimAlpha: 0.25,
    cardRadius: 12,
    cardEdge: 'grayBorder',
    arrowStyle: 'dashedPin',
    arrowWidth: 8,
    arrowCurve: 0.22,
    font: 'Inter',
    suggestFor: ['map'],
  },
];

export const PRESET_MAP = Object.fromEntries(
  PRESETS.map(p => [p.id, p]),
) as Record<PresetId, Preset>;

export function getPreset(id: PresetId): Preset {
  return PRESET_MAP[id];
}
