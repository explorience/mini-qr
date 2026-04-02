import { describe, it, expect } from 'vitest'
import {
  createRandomColor,
  hexToHsl,
  hslToHex,
  createComplementaryColors
} from './color'

describe('createRandomColor', () => {
  it('returns a valid 7-character hex color string', () => {
    const color = createRandomColor()
    expect(color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('hexToHsl', () => {
  it('converts pure red #ff0000 correctly', () => {
    const [h, s, l] = hexToHsl('#ff0000')
    expect(h).toBe(0)
    expect(s).toBe(100)
    expect(l).toBe(50)
  })

  it('converts pure white #ffffff correctly', () => {
    const [h, s, l] = hexToHsl('#ffffff')
    expect(s).toBe(0)
    expect(l).toBe(100)
  })

  it('converts pure black #000000 correctly', () => {
    const [h, s, l] = hexToHsl('#000000')
    expect(s).toBe(0)
    expect(l).toBe(0)
  })

  it('converts a mid-range blue #0000ff correctly', () => {
    const [h, s, l] = hexToHsl('#0000ff')
    expect(h).toBe(240)
    expect(s).toBe(100)
    expect(l).toBe(50)
  })
})

describe('hslToHex', () => {
  it('converts hue 0 (red) to #ff0000', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000')
  })

  it('converts hue 120 (green) to #00ff00', () => {
    expect(hslToHex(120, 100, 50)).toBe('#00ff00')
  })

  it('converts hue 240 (blue) to #0000ff', () => {
    expect(hslToHex(240, 100, 50)).toBe('#0000ff')
  })

  it('wraps hues beyond 360 correctly', () => {
    expect(hslToHex(360, 100, 50)).toBe(hslToHex(0, 100, 50))
    expect(hslToHex(420, 100, 50)).toBe(hslToHex(60, 100, 50))
  })

  it('handles negative hues by wrapping', () => {
    expect(hslToHex(-120, 100, 50)).toBe(hslToHex(240, 100, 50))
  })

  it('is approximately the inverse of hexToHsl for a round-trip (within rounding)', () => {
    const original = '#3a7bd5'
    const [h, s, l] = hexToHsl(original)
    const result = hslToHex(h, s, l)
    // Due to integer rounding in HSL conversion, channels may differ by ±1
    const toChannels = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ]
    const orig = toChannels(original)
    const res = toChannels(result)
    orig.forEach((c, i) => {
      expect(Math.abs(c - res[i])).toBeLessThanOrEqual(1)
    })
  })
})

describe('createComplementaryColors', () => {
  it('returns an object with dots, cornersSquare, cornersDot, and background keys', () => {
    const colors = createComplementaryColors()
    expect(colors).toHaveProperty('dots')
    expect(colors).toHaveProperty('cornersSquare')
    expect(colors).toHaveProperty('cornersDot')
    expect(colors).toHaveProperty('background')
  })

  it('all returned values are valid hex color strings', () => {
    const colors = createComplementaryColors()
    const hexPattern = /^#[0-9a-f]{6}$/i
    expect(colors.dots).toMatch(hexPattern)
    expect(colors.cornersSquare).toMatch(hexPattern)
    expect(colors.cornersDot).toMatch(hexPattern)
    expect(colors.background).toMatch(hexPattern)
  })

  it('produces consistent hue relationships when a base color is provided', () => {
    // Run several times to cover different scheme selections
    for (let i = 0; i < 20; i++) {
      const colors = createComplementaryColors('#e63946')
      const hexPattern = /^#[0-9a-f]{6}$/i
      expect(colors.dots).toMatch(hexPattern)
      expect(colors.cornersSquare).toMatch(hexPattern)
      expect(colors.cornersDot).toMatch(hexPattern)
      expect(colors.background).toMatch(hexPattern)
    }
  })

  it('background contrasts with dots (dark bg when dots are light, light bg when dots are dark)', () => {
    // Input with lightness that stays > 50 after clamping (high lightness → dark background)
    const lightColors = createComplementaryColors('#e8f4f8') // very light blue, l ≈ 94 → clamped to 60
    const [, , bgL] = hexToHsl(lightColors.background)
    // Background should be very dark (<= 20) when dots lightness is high
    expect(bgL).toBeLessThanOrEqual(20)

    // Input with lightness that stays < 50 after clamping (low lightness → light background)
    const darkColors = createComplementaryColors('#1a3a6a') // dark blue, l ≈ 25 → clamped to 30
    const [, , bgL2] = hexToHsl(darkColors.background)
    // Background should be very light (>= 80) when dots lightness is low
    expect(bgL2).toBeGreaterThanOrEqual(80)
  })
})
