import { computed, ref, watch } from "vue";
import {
  blendPortalHex,
  deriveAccessiblePortalAccent,
  normalizePortalHex,
  portalHexToRgba,
  readablePortalAccentText,
} from "@/utils/portal-color";

const THEME_MODE_KEY = "sesifoto_portal_theme_mode";
const ACCENT_KEY = "sesifoto_portal_accent";

function readStoredDark(): boolean {
  try {
    const stored = localStorage.getItem(THEME_MODE_KEY);
    if (stored === "light") return false;
    if (stored === "dark") return true;
  } catch {
    // ignore
  }
  return true;
}

function readStoredAccent(): string | null {
  try {
    return normalizePortalHex(localStorage.getItem(ACCENT_KEY));
  } catch {
    return null;
  }
}

const isDark = ref(readStoredDark());
const accentColor = ref<string | null>(readStoredAccent());

watch(isDark, (dark) => {
  try {
    localStorage.setItem(THEME_MODE_KEY, dark ? "dark" : "light");
  } catch {
    // ignore
  }
});

watch(accentColor, (accent) => {
  try {
    if (accent) localStorage.setItem(ACCENT_KEY, accent);
    else localStorage.removeItem(ACCENT_KEY);
  } catch {
    // ignore
  }
});

export function usePortalTheme(options: { accentOverride?: () => string | null | undefined } = {}) {
  function setAccent(value: string | null | undefined) {
    const next = normalizePortalHex(value ?? null);
    if (next) accentColor.value = next;
  }

  function toggleDark() {
    isDark.value = !isDark.value;
  }

  const resolvedAccent = computed(() => {
    const override = options.accentOverride?.();
    return (
      normalizePortalHex(override)
      ?? accentColor.value
      ?? (isDark.value ? "#16D69B" : "#004037")
    );
  });

  const themeVars = computed(() => {
    const palette = isDark.value
      ? {
          "--p-shell": "#070909",
          "--p-bg": "#0a0c0c",
          "--p-text": "#f2f5f3",
          "--p-card": "#0e1110",
          "--p-border": "rgba(255,255,255,0.08)",
          "--p-muted": "rgba(255,255,255,0.46)",
          "--p-hover": "rgba(255,255,255,0.05)",
          "--p-status": "rgba(137,104,37,0.13)",
          "--p-status-border": "rgba(228,180,76,0.22)",
        }
      : {
          "--p-shell": "#ddd9d1",
          "--p-bg": "#f3f0ea",
          "--p-text": "#1c1c1a",
          "--p-card": "#ffffff",
          "--p-border": "rgba(0,0,0,0.09)",
          "--p-muted": "rgba(0,0,0,0.48)",
          "--p-hover": "rgba(27,59,54,0.06)",
          "--p-status": "rgba(201,183,156,0.22)",
          "--p-status-border": "rgba(137,104,37,0.22)",
        };

    const brandAccent = resolvedAccent.value;
    const tintAlpha = isDark.value ? 0.1 : 0.08;
    const statusSurface = blendPortalHex(
      isDark.value ? "#896825" : "#C9B79C",
      palette["--p-bg"],
      isDark.value ? 0.13 : 0.22,
    );
    const accent = deriveAccessiblePortalAccent(
      brandAccent,
      [
        palette["--p-shell"],
        palette["--p-bg"],
        palette["--p-card"],
        statusSurface,
      ],
      tintAlpha,
    );

    return {
      ...palette,
      "--p-accent": accent,
      "--p-accent-text": readablePortalAccentText(accent),
      "--p-accent-bg": portalHexToRgba(accent, tintAlpha),
      "--p-accent-border": accent,
    };
  });

  return {
    isDark,
    accentColor,
    resolvedAccent,
    themeVars,
    setAccent,
    toggleDark,
  };
}
