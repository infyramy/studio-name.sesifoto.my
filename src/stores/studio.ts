import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Studio, Theme, Addon, Language } from '@/types';
import { api } from '@/services/api';
import { getStudioSlugFromSubdomain } from '@/utils/slug';

export const useStudioStore = defineStore('studio', () => {
  // State
  const studio = ref<Studio | null>(null);
  const themes = ref<Theme[]>([]);
  const addons = ref<Addon[]>([]);
  const currentLanguage = ref<Language>('BM');
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isLoaded = computed(() => studio.value !== null);
  const studioSlug = computed(() => studio.value?.slug || null);
  const brandColor = computed(() => studio.value?.brand_color || '#A8DADC');
  const activeThemes = computed(() => themes.value.filter((t) => t.status === 'active'));
  const activeAddons = computed(() => addons.value.filter((a) => a.status === 'active'));

  // Actions
  async function loadStudio(slug?: string) {
    loading.value = true;
    error.value = null;

    try {
      // Use provided slug or detect from subdomain
      const studioSlug = slug || getStudioSlugFromSubdomain();

      if (!studioSlug) {
        throw new Error('Studio tidak dijumpai. Sila semak URL anda.');
      }

      // Fetch studio data
      studio.value = await api.getStudioBySlug(studioSlug);

      // Set default language
      currentLanguage.value = studio.value.default_language;

      // Fetch related data in parallel
      const [themesData, addonsData] = await Promise.all([
        api.getThemesByStudio(studio.value.id),
        api.getAddonsByStudio(studio.value.id),
      ]);

      themes.value = themesData;
      addons.value = addonsData;

      return studio.value;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ralat tidak diketahui';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setLanguage(lang: Language) {
    currentLanguage.value = lang;
  }

  function toggleLanguage() {
    currentLanguage.value = currentLanguage.value === 'BM' ? 'EN' : 'BM';
  }

  function getThemeById(themeId: string): Theme | undefined {
    return themes.value.find((t) => t.id === themeId);
  }

  function getAddonById(addonId: string): Addon | undefined {
    return addons.value.find((a) => a.id === addonId);
  }

  function reset() {
    studio.value = null;
    themes.value = [];
    addons.value = [];
    currentLanguage.value = 'BM';
    loading.value = false;
    error.value = null;
  }

  return {
    // State
    studio,
    themes,
    addons,
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
    getThemeById,
    getAddonById,
    reset,
  };
});
