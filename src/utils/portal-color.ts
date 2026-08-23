export function normalizePortalHex(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const short = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (short) {
    return `#${short[1]
      .split("")
      .map((character) => character.repeat(2))
      .join("")}`.toUpperCase();
  }

  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed.toUpperCase() : null;
}

interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

function hexToRgb(value: string): RgbColor {
  const hex = normalizePortalHex(value) ?? "#16D69B";
  const color = Number.parseInt(hex.slice(1), 16);
  return {
    red: (color >> 16) & 255,
    green: (color >> 8) & 255,
    blue: color & 255,
  };
}

function rgbToHex({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function mixPortalHex(source: string, target: string, amount: number): string {
  const from = hexToRgb(source);
  const to = hexToRgb(target);
  return rgbToHex({
    red: from.red + (to.red - from.red) * amount,
    green: from.green + (to.green - from.green) * amount,
    blue: from.blue + (to.blue - from.blue) * amount,
  });
}

export function blendPortalHex(
  foreground: string,
  background: string,
  alpha: number,
): string {
  return mixPortalHex(background, foreground, Math.min(1, Math.max(0, alpha)));
}

function relativeLuminance(value: string): number {
  const { red, green, blue } = hexToRgb(value);
  const channelLuminance = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * channelLuminance(red)
    + 0.7152 * channelLuminance(green)
    + 0.0722 * channelLuminance(blue)
  );
}

export function portalContrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function deriveAccessiblePortalAccent(
  source: string | null | undefined,
  surfaces: string[],
  tintAlpha = 0.1,
  minimumContrast = 4.5,
): string {
  const brandColor = normalizePortalHex(source) ?? "#16D69B";
  const backgrounds = surfaces
    .map((surface) => normalizePortalHex(surface))
    .filter((surface): surface is string => Boolean(surface));
  if (!backgrounds.length) return brandColor;

  const minimumRatio = (candidate: string): number =>
    Math.min(
      ...backgrounds.flatMap((surface) => [
        portalContrastRatio(candidate, surface),
        portalContrastRatio(
          candidate,
          blendPortalHex(candidate, surface, tintAlpha),
        ),
      ]),
    );

  if (minimumRatio(brandColor) >= minimumContrast) return brandColor;

  const options: Array<{ color: string; amount: number; ratio: number }> = [];
  for (const target of ["#000000", "#FFFFFF"]) {
    for (let step = 1; step <= 100; step += 1) {
      const amount = step / 100;
      const color = mixPortalHex(brandColor, target, amount);
      const ratio = minimumRatio(color);
      if (ratio >= minimumContrast) {
        options.push({ color, amount, ratio });
        break;
      }
    }
  }

  options.sort(
    (first, second) =>
      first.amount - second.amount
      || second.ratio - first.ratio
      || first.color.localeCompare(second.color),
  );
  if (options[0]) return options[0].color;

  const bestFallback = ["#000000", "#FFFFFF", brandColor]
    .map((color) => ({ color, ratio: minimumRatio(color) }))
    .sort(
      (first, second) =>
        second.ratio - first.ratio
        || first.color.localeCompare(second.color),
    )[0];
  return bestFallback?.color ?? brandColor;
}

export function portalHexToRgba(
  value: string,
  alpha: number,
): string {
  const hex = normalizePortalHex(value);
  if (!hex) return `rgba(22, 214, 155, ${alpha})`;

  const color = Number.parseInt(hex.slice(1), 16);
  const red = (color >> 16) & 255;
  const green = (color >> 8) & 255;
  const blue = color & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function readablePortalAccentText(value: string): string {
  const hex = normalizePortalHex(value) ?? "#16D69B";

  return portalContrastRatio("#000000", hex)
    >= portalContrastRatio("#FFFFFF", hex)
    ? "#000000"
    : "#FFFFFF";
}
