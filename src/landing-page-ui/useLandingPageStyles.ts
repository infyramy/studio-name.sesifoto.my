import { computed, type ComputedRef, type Ref } from "vue";
import type { LandingPageTheme } from "./types";

export function useLandingPageStyles(theme: Ref<LandingPageTheme> | ComputedRef<LandingPageTheme>) {
  const buttonRadiusClass = computed(() => theme.value.radius || "rounded-2xl");

  const cardRadiusClass = computed(() => {
    const r = theme.value.radius || "rounded-2xl";
    return r === "rounded-full" ? "rounded-2xl" : r;
  });

  const themeStyle = computed(() => {
    const cfg = theme.value;
    const title = encodeURIComponent(cfg.titleFont || "Inter").replace(/%20/g, "+");
    const body = encodeURIComponent(cfg.bodyFont || "Inter").replace(/%20/g, "+");
    const mode = cfg.mode || "dark";
    const isDark = mode === "dark" || mode === "dark-glass";
    const isDarkGlass = mode === "dark-glass";
    const secondary = cfg.secondaryColor || "#050505";
    const secondaryText = cfg.secondaryTextColor || (isDark ? "#ffffff" : "#000000");
    const textMuted = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)";
    const borderColor = isDarkGlass
      ? "rgba(255,255,255,0.12)"
      : isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)";
    const cardBg = isDarkGlass
      ? "rgba(255,255,255,0.03)"
      : mode === "dark"
        ? `color-mix(in srgb, ${secondary}, white 8%)`
        : `color-mix(in srgb, ${secondary}, black 4%)`;
    const iconBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const cardBackdrop = isDarkGlass ? "blur(16px)" : "none";
    const cardShadow = isDarkGlass ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)" : "none";
    const surfaceBackground = isDarkGlass
      ? `background-color: ${secondary};
       background-image:
         radial-gradient(circle at 15% 50%, rgba(67, 20, 7, 0.15), transparent 25%),
         radial-gradient(circle at 85% 30%, rgba(194, 65, 12, 0.08), transparent 25%);`
      : `background-color: ${secondary};`;

    return `
@import url('https://fonts.googleapis.com/css2?family=${title}:wght@400;600;700&family=${body}:wght@300;400;500;600&display=swap');
.landing-surface h1, .landing-surface h2, .landing-surface h3, .landing-surface h4, .landing-surface h5, .landing-surface h6 { font-family: '${cfg.titleFont}', sans-serif; }
.landing-surface {
  --bg-main: ${secondary};
  --text-main: ${secondaryText};
  --text-muted: ${textMuted};
  --border-color: ${borderColor};
  --card-bg: ${cardBg};
  --icon-bg: ${iconBg};
  --card-backdrop: ${cardBackdrop};
  --card-shadow: ${cardShadow};
  color: var(--text-main);
  ${surfaceBackground}
}
.preview-surface h1, .preview-surface h2, .preview-surface h3, .preview-surface h4, .preview-surface h5, .preview-surface h6 { font-family: '${cfg.titleFont}', sans-serif; }
.preview-surface {
  --bg-main: ${secondary};
  --text-main: ${secondaryText};
  --text-muted: ${textMuted};
  --border-color: ${borderColor};
  --card-bg: ${cardBg};
  --icon-bg: ${iconBg};
  --card-backdrop: ${cardBackdrop};
  --card-shadow: ${cardShadow};
  color: var(--text-main);
  ${surfaceBackground}
}
`;
  });

  const gradientOverlayStyle = computed(() => {
    const secondary = theme.value.secondaryColor || "#050505";
    return {
      background: `linear-gradient(to bottom, ${secondary}00 0%, ${secondary}00 50%, ${secondary} 100%)`,
    };
  });

  const containerStyle = computed(() => ({
    fontFamily: theme.value.bodyFont,
  }));

  return {
    buttonRadiusClass,
    cardRadiusClass,
    themeStyle,
    gradientOverlayStyle,
    containerStyle,
  };
}

export function safeHttpUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

export function safeHttpsUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed || !/^https:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}
