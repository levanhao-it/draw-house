import { describe, it, expect } from 'vitest';
import { contrastRatio, ensureContrast, relativeLuminance } from './contrast';
import type { RGB } from './contrast';

describe('relativeLuminance', () => {
  it('black = 0', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
  });

  it('white ≈ 1', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('black vs white = 21', () => {
    const black: RGB = [0, 0, 0];
    const white: RGB = [255, 255, 255];
    expect(contrastRatio(black, white)).toBeCloseTo(21, 1);
  });

  it('same colour = 1', () => {
    const grey: RGB = [128, 128, 128];
    expect(contrastRatio(grey, grey)).toBeCloseTo(1, 5);
  });
});

describe('ensureContrast', () => {
  it('already passing contrast returns ok=true unchanged', () => {
    const result = ensureContrast('#000000', '#ffffff');
    expect(result.ok).toBe(true);
    expect(result.fg).toBe('#ffffff');
  });

  it('low contrast bg: increases alpha until ok=true', () => {
    // Semi-transparent black over white gives grey; white text is low contrast.
    // After alpha increase the bg darkens enough for white text to pass.
    const result = ensureContrast('rgba(0,0,0,0.2)', '#ffffff');
    expect(result.ok).toBe(true);
  });

  it('preset neon_spotlight cardBg + white text passes', () => {
    const result = ensureContrast('rgba(10,14,25,.88)', '#FFFFFF');
    expect(result.ok).toBe(true);
  });

  it('preset minimal_white cardBg + dark text passes', () => {
    const result = ensureContrast('#FFFFFF', '#111111');
    expect(result.ok).toBe(true);
  });
});
