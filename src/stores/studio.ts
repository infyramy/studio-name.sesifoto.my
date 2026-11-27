import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Studio,
  Theme,
  Addon,
  Language,
  WebsiteSettings,
  BookingPackage,
} from "@/types";
import { api } from "@/services/api";
import { getStudioSlugFromHost } from "@/utils/slug";

const LANGUAGE_SESSION_KEY = "sesifoto_visitor_language";

function normalizeLanguage(value: unknown): Language | null {
  if (value === "EN" || value === "en") return "EN";
  if (value === "BM" || value === "bm") return "BM";
  return null;
}

function readSessionLanguage(): Language | null {
  try {
    return normalizeLanguage(sessionStorage.getItem(LANGUAGE_SESSION_KEY));
  } catch {
    return null;
  }
}

function writeSessionLanguage(lang: Language) {
  try {
    sessionStorage.setItem(LANGUAGE_SESSION_KEY, lang);
  } catch {
    // ignore quota / private-mode failures
  }
}

export const useStudioStore = defineStore("studio", () => {
  // State
  const studio = ref<Studio | null>(null);
  const themes = ref<Theme[]>([]);
  const packages = ref<BookingPackage[]>([]);
  const addons = ref<Addon[]>([]);
  const websiteSettings = ref<WebsiteSettings | null>(null);
  const currentLanguage = ref<Language>(readSessionLanguage() || "BM");
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isLoaded = computed(() => studio.value !== null);
  const studioSlug = computed(() => studio.value?.slug || null);
  const brandColor = computed(() => studio.value?.brand_color || "#A8DADC");
  const activeThemes = computed(() =>
    themes.value.filter((t) => t.status === "active")
  );
  const activeAddons = computed(() =>
    addons.value.filter((a) => a.status === "active")
  );

  // Actions
  async function loadStudio(slug?: string) {
    loading.value = true;
    error.value = null;

    try {
      // Use provided slug or detect from subdomain
      const studioSlug = slug || (await getStudioSlugFromHost());

      if (!studioSlug) {
        throw new Error("Studio tidak dijumpai. Sila semak URL anda.");
      }

      // Fetch studio data and website settings in parallel
      const [studioData, settingsData] = await Promise.all([
        api.getStudioBySlug(studioSlug),
        api.getWebsiteSettings(studioSlug),
      ]);

      studio.value = studioData;
      websiteSettings.value = settingsData;

      // Language: visitor toggle (session) > LP/website default > studio default
      const sessionLang = readSessionLanguage();
      if (sessionLang) {
        currentLanguage.value = sessionLang;
      } else {
        currentLanguage.value =
          normalizeLanguage(settingsData?.defaultLanguage) ||
          normalizeLanguage(studioData.default_language) ||
          "BM";
      }

      // Fetch related data in parallel
      const [themesData, packagesData, addonsData] = await Promise.all([
        api.getThemesByStudio(studioData.id),
        api.getBookingPackages(studioSlug),
        api.getAddonsByStudio(studioData.id),
      ]);

      themes.value = themesData;
      packages.value = packagesData;
      addons.value = addonsData;

      return studio.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Ralat tidak diketahui";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang;
    writeSessionLanguage(lang);
  }

  function toggleLanguage() {
    setLanguage(currentLanguage.value === "BM" ? "EN" : "BM");
  }

  /** Apply landing-page default once when visitor has not chosen a language yet. */
  function applyDefaultLanguageIfUnset(lang: unknown) {
    if (readSessionLanguage()) return;
    const normalized = normalizeLanguage(lang);
    if (!normalized) return;
    currentLanguage.value = normalized;
  }

  function getThemeById(themeId: string): Theme | undefined {
    return themes.value.find((t) => t.id === themeId);
  }

  function getAddonById(addonId: string): Addon | undefined {
    return addons.value.find((a) => a.id === addonId);
  }

  // Load addons for a specific theme (theme may have custom addons)
  async function loadAddonsForTheme(themeId: string) {
    if (!studio.value) return;
    try {
      const addonsData = await api.getAddonsByStudio(studio.value.id, themeId);
      addons.value = addonsData;
    } catch (err) {
      console.error("Failed to load theme-specific addons:", err);
    }
  }

  function getPackageById(packageId: string): BookingPackage | undefined {
    return packages.value.find((p) => p.id === packageId);
  }

  function reset() {
    studio.value = null;
    themes.value = [];
    packages.value = [];
    addons.value = [];
    websiteSettings.value = null;
    currentLanguage.value = readSessionLanguage() || "BM";
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    studio,
    themes,
    packages,
    addons,
    websiteSettings,
    currentLanguage,
    loading,
    error,

    // Computed
    isLoaded,
    studioSlug,
    brandColor,
    activeThemes,
    activeAddons,

    // Actions
    loadStudio,
    setLanguage,
    toggleLanguage,
    applyDefaultLanguageIfUnset,
    getThemeById,
    getPackageById,
    getAddonById,
    loadAddonsForTheme,
    reset,
  };
});
