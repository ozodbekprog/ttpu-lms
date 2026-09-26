import { describe, expect, it } from "vitest";

/**
 * WCAG 2.x relative-luminance / contrast-ratio helpers (pure, dependency-free).
 * Ratios are computed from the sRGB hex tokens used by the UI (Tailwind v4 theme),
 * so the same numbers the audit measured are asserted here.
 */
export function relativeLuminance(hex: string): number {
  const value = hex.replace(/^#/, "");
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/** Composite a translucent foreground over an opaque background (alpha 0..1). */
export function blendOver(foreground: string, background: string, alpha: number): string {
  const fg = foreground.replace(/^#/, "");
  const bg = background.replace(/^#/, "");
  const mixed = [0, 2, 4].map((offset) => {
    const channel =
      alpha * parseInt(fg.slice(offset, offset + 2), 16) +
      (1 - alpha) * parseInt(bg.slice(offset, offset + 2), 16);
    return Math.round(channel).toString(16).padStart(2, "0");
  });
  return `#${mixed.join("")}`;
}

const WHITE = "#ffffff";
const SLATE_50 = "#f8fafc";
const SLATE_100 = "#f1f5f9";
const SLATE_400 = "#90a1b9";
const SLATE_500 = "#62748e";
const SLATE_600 = "#45556c";
const GOLD_300 = "#e3c76a";
const GOLD_500 = "#c9a227";
const GOLD_600 = "#a9871f";
const GOLD_700 = "#8a6d18";
const GOLD_800 = "#7a5f14";
const BRAND_950 = "#131f3c";

const AA_NORMAL = 4.5;

describe("WCAG AA contrast regressions", () => {
  it("documents the old failing slate-400 text color on white/slate tints", () => {
    for (const background of [WHITE, SLATE_50, SLATE_100]) {
      expect(contrastRatio(SLATE_400, background)).toBeLessThan(AA_NORMAL);
    }
  });

  it("slate-600 body/hint text passes on white and slate tints", () => {
    for (const background of [WHITE, SLATE_50, SLATE_100]) {
      expect(contrastRatio(SLATE_600, background)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("slate-500 placeholder text passes on pure white", () => {
    expect(contrastRatio(SLATE_500, WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("gold-800 badge/accent text passes on the gold tints used by the UI", () => {
    for (const alpha of [0.15, 0.2, 0.25]) {
      const tint = blendOver(GOLD_300, WHITE, alpha);
      expect(contrastRatio(GOLD_800, tint)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("gold-700 accent text and icons pass on white", () => {
    expect(contrastRatio(GOLD_700, WHITE)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("documents the old failing white-on-gold label", () => {
    expect(contrastRatio(WHITE, GOLD_500)).toBeLessThan(AA_NORMAL);
    expect(contrastRatio(WHITE, GOLD_600)).toBeLessThan(AA_NORMAL);
  });

  it("brand-950 label on the gold button passes for default, hover and active states", () => {
    expect(contrastRatio(BRAND_950, GOLD_500)).toBeGreaterThanOrEqual(AA_NORMAL); // default
    expect(contrastRatio(BRAND_950, GOLD_600)).toBeGreaterThanOrEqual(AA_NORMAL); // hover + active
  });

  it("brand-950 passes on the lightest stop of the gold gradients", () => {
    expect(contrastRatio(BRAND_950, GOLD_300)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
