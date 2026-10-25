export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string, defaultRgb: RGB = { r: 36, g: 75, b: 56 }): RGB {
  if (!hex || typeof hex !== 'string') return defaultRgb;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return defaultRgb;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return defaultRgb;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

// Mix with white (tint) - factor 0 (base) to 1 (pure white)
export function tint(rgb: RGB, factor: number): RGB {
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * factor),
    g: Math.round(rgb.g + (255 - rgb.g) * factor),
    b: Math.round(rgb.b + (255 - rgb.b) * factor),
  };
}

// Mix with black (shade) - factor 0 (base) to 1 (pure black)
export function shade(rgb: RGB, factor: number): RGB {
  return {
    r: Math.round(rgb.r * (1 - factor)),
    g: Math.round(rgb.g * (1 - factor)),
    b: Math.round(rgb.b * (1 - factor)),
  };
}

export function generateColorScale(baseHex: string, defaultRgb: RGB) {
  const base = hexToRgb(baseHex, defaultRgb);
  return {
    base,
    50: tint(base, 0.94),
    100: tint(base, 0.86),
    200: tint(base, 0.70),
    300: tint(base, 0.50),
    400: tint(base, 0.30),
    500: tint(base, 0.14),
    600: base,
    700: shade(base, 0.15),
    800: shade(base, 0.30),
    900: shade(base, 0.45),
    950: shade(base, 0.60),
    dark: shade(base, 0.35),
    secondary: shade(base, 0.18),
    light: tint(base, 0.22),
  };
}

export function generateThemeCss(primaryHex?: string, secondaryHex?: string, accentHex?: string): string {
  const p = generateColorScale(primaryHex || '#244B38', { r: 36, g: 75, b: 56 });
  const s = generateColorScale(secondaryHex || '#8A6445', { r: 138, g: 100, b: 69 });
  const a = hexToRgb(accentHex || '#ea580c', { r: 234, g: 88, b: 12 });

  return `
:root {
  /* Dynamic Primary Color (${rgbToHex(p.base)}) */
  --color-forest-rgb: ${p.base.r} ${p.base.g} ${p.base.b};
  --color-forest: rgb(${p.base.r} ${p.base.g} ${p.base.b});
  --color-forest-dark-rgb: ${p.dark.r} ${p.dark.g} ${p.dark.b};
  --color-forest-dark: rgb(${p.dark.r} ${p.dark.g} ${p.dark.b});
  --color-forest-secondary-rgb: ${p.secondary.r} ${p.secondary.g} ${p.secondary.b};
  --color-forest-secondary: rgb(${p.secondary.r} ${p.secondary.g} ${p.secondary.b});
  --color-forest-light-rgb: ${p.light.r} ${p.light.g} ${p.light.b};
  --color-forest-light: rgb(${p.light.r} ${p.light.g} ${p.light.b});
  --color-forest-50-rgb: ${p[50].r} ${p[50].g} ${p[50].b};
  --color-forest-50: rgb(${p[50].r} ${p[50].g} ${p[50].b});
  --color-forest-100-rgb: ${p[100].r} ${p[100].g} ${p[100].b};
  --color-forest-100: rgb(${p[100].r} ${p[100].g} ${p[100].b});
  --color-forest-200-rgb: ${p[200].r} ${p[200].g} ${p[200].b};
  --color-forest-200: rgb(${p[200].r} ${p[200].g} ${p[200].b});
  --color-forest-300-rgb: ${p[300].r} ${p[300].g} ${p[300].b};
  --color-forest-300: rgb(${p[300].r} ${p[300].g} ${p[300].b});
  --color-forest-400-rgb: ${p[400].r} ${p[400].g} ${p[400].b};
  --color-forest-400: rgb(${p[400].r} ${p[400].g} ${p[400].b});
  --color-forest-500-rgb: ${p[500].r} ${p[500].g} ${p[500].b};
  --color-forest-500: rgb(${p[500].r} ${p[500].g} ${p[500].b});
  --color-forest-600-rgb: ${p[600].r} ${p[600].g} ${p[600].b};
  --color-forest-600: rgb(${p[600].r} ${p[600].g} ${p[600].b});
  --color-forest-700-rgb: ${p[700].r} ${p[700].g} ${p[700].b};
  --color-forest-700: rgb(${p[700].r} ${p[700].g} ${p[700].b});
  --color-forest-800-rgb: ${p[800].r} ${p[800].g} ${p[800].b};
  --color-forest-800: rgb(${p[800].r} ${p[800].g} ${p[800].b});
  --color-forest-900-rgb: ${p[900].r} ${p[900].g} ${p[900].b};
  --color-forest-900: rgb(${p[900].r} ${p[900].g} ${p[900].b});
  --color-forest-950-rgb: ${p[950].r} ${p[950].g} ${p[950].b};
  --color-forest-950: rgb(${p[950].r} ${p[950].g} ${p[950].b});

  /* Dynamic Secondary / Wood Color (${rgbToHex(s.base)}) */
  --color-wood-rgb: ${s.base.r} ${s.base.g} ${s.base.b};
  --color-wood: rgb(${s.base.r} ${s.base.g} ${s.base.b});
  --color-wood-dark-rgb: ${s.dark.r} ${s.dark.g} ${s.dark.b};
  --color-wood-dark: rgb(${s.dark.r} ${s.dark.g} ${s.dark.b});
  --color-wood-light-rgb: ${s.light.r} ${s.light.g} ${s.light.b};
  --color-wood-light: rgb(${s.light.r} ${s.light.g} ${s.light.b});
  --color-wood-50-rgb: ${s[50].r} ${s[50].g} ${s[50].b};
  --color-wood-50: rgb(${s[50].r} ${s[50].g} ${s[50].b});
  --color-wood-100-rgb: ${s[100].r} ${s[100].g} ${s[100].b};
  --color-wood-100: rgb(${s[100].r} ${s[100].g} ${s[100].b});
  --color-wood-200-rgb: ${s[200].r} ${s[200].g} ${s[200].b};
  --color-wood-200: rgb(${s[200].r} ${s[200].g} ${s[200].b});
  --color-wood-300-rgb: ${s[300].r} ${s[300].g} ${s[300].b};
  --color-wood-300: rgb(${s[300].r} ${s[300].g} ${s[300].b});
  --color-wood-400-rgb: ${s[400].r} ${s[400].g} ${s[400].b};
  --color-wood-400: rgb(${s[400].r} ${s[400].g} ${s[400].b});
  --color-wood-500-rgb: ${s[500].r} ${s[500].g} ${s[500].b};
  --color-wood-500: rgb(${s[500].r} ${s[500].g} ${s[500].b});
  --color-wood-600-rgb: ${s[600].r} ${s[600].g} ${s[600].b};
  --color-wood-600: rgb(${s[600].r} ${s[600].g} ${s[600].b});
  --color-wood-700-rgb: ${s[700].r} ${s[700].g} ${s[700].b};
  --color-wood-700: rgb(${s[700].r} ${s[700].g} ${s[700].b});
  --color-wood-800-rgb: ${s[800].r} ${s[800].g} ${s[800].b};
  --color-wood-800: rgb(${s[800].r} ${s[800].g} ${s[800].b});
  --color-wood-900-rgb: ${s[900].r} ${s[900].g} ${s[900].b};
  --color-wood-900: rgb(${s[900].r} ${s[900].g} ${s[900].b});

  /* Accent */
  --color-accent-rgb: ${a.r} ${a.g} ${a.b};
  --color-accent: rgb(${a.r} ${a.g} ${a.b});
}
`.trim();
}
