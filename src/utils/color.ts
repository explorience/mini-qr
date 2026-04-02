export function createRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

export function getRandomItemInArray<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)]
}

/** Convert a hex color string to HSL components [h (0–360), s (0–100), l (0–100)]. */
export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

/** Convert HSL components [h (0–360), s (0–100), l (0–100)] to a hex color string. */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  const sl = s / 100
  const ll = l / 100

  const c = (1 - Math.abs(2 * ll - 1)) * sl
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ll - c / 2

  let r = 0,
    g = 0,
    b = 0
  if (h < 60) {
    r = c
    g = x
    b = 0
  } else if (h < 120) {
    r = x
    g = c
    b = 0
  } else if (h < 180) {
    r = 0
    g = c
    b = x
  } else if (h < 240) {
    r = 0
    g = x
    b = c
  } else if (h < 300) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }

  return (
    '#' +
    [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')
  )
}

export interface ComplementaryColors {
  dots: string
  cornersSquare: string
  cornersDot: string
  background: string
}

/**
 * Generate a set of visually complementary QR code colors.
 * If a base hex color is supplied (e.g. extracted from a logo), its hue is used
 * as the anchor; otherwise a random hue is chosen.
 * One of four classic color-harmony schemes is randomly selected:
 * complementary, triadic, split-complementary, or analogous.
 */
export function createComplementaryColors(baseHex?: string): ComplementaryColors {
  let baseHue: number
  let saturation: number
  let lightness: number

  if (baseHex) {
    const [h, s, l] = hexToHsl(baseHex)
    baseHue = h
    saturation = Math.max(s, 50)
    lightness = Math.min(Math.max(l, 30), 60)
  } else {
    baseHue = Math.floor(Math.random() * 360)
    saturation = Math.floor(Math.random() * 30) + 60 // 60–90 %
    lightness = Math.floor(Math.random() * 20) + 35 // 35–55 %
  }

  const schemes = ['complementary', 'triadic', 'split-complementary', 'analogous']
  const scheme = getRandomItemInArray(schemes)

  let hue2 = baseHue + 180
  let hue3 = baseHue + 180

  switch (scheme) {
    case 'complementary':
      hue2 = baseHue + 180
      hue3 = baseHue + 180
      break
    case 'triadic':
      hue2 = baseHue + 120
      hue3 = baseHue + 240
      break
    case 'split-complementary':
      hue2 = baseHue + 150
      hue3 = baseHue + 210
      break
    case 'analogous':
      hue2 = baseHue + 30
      hue3 = baseHue + 60
      break
  }

  const dots = hslToHex(baseHue, saturation, lightness)
  const cornersSquare = hslToHex(hue2, saturation, lightness)
  const cornersDot = hslToHex(hue3, saturation, lightness)

  // Use a near-neutral background that contrasts with the dots.
  // Dark dots → light background; light dots → dark background.
  const background =
    lightness > 50
      ? hslToHex(baseHue, 15, 10) // dark background for light dots
      : hslToHex(baseHue, 15, 95) // light background for dark dots

  return { dots, cornersSquare, cornersDot, background }
}

/**
 * Sample pixels from an image URL via the Canvas API and return the average
 * color of all non-transparent pixels as a hex string.
 * Returns `null` if the image cannot be loaded or has no opaque pixels.
 */
export function extractDominantColorFromImage(imageSrc: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const size = Math.min(img.width, img.height, 100)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0, size, size)
      const { data } = ctx.getImageData(0, 0, size, size)

      let r = 0,
        g = 0,
        b = 0,
        count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
      }

      if (count === 0) {
        resolve(null)
        return
      }

      resolve(
        '#' +
          [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')
      )
    }
    img.onerror = () => resolve(null)
    img.src = imageSrc
  })
}
