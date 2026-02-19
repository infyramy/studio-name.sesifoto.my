import { computed } from "vue";
import { useStudioStore } from "@/stores/studio";
import { translations } from "@/locales/translations";
import type { TranslationKey } from "@/locales/types";
import type { Language } from "@/types";

export function useTranslation() {
  const studioStore = useStudioStore();

  // Get current language from store's reactive currentLanguage
  // This is set when studio loads and can be toggled by user
  const currentLang = computed<Language>(() => {
    return studioStore.currentLanguage;
  });

  // Translation function (optionally with interpolation params: { placeholder: value })
  const t = (
    key: TranslationKey,
    params?: Record<string, string | number>,
  ): string => {
    let translation = translations[currentLang.value]?.[key];

    if (!translation) {
      console.warn(
        `Translation missing for key: ${key} in language: ${currentLang.value}`,
      );
      return key;
    }

    if (params && typeof translation === "string") {
      translation = Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        translation,
      );
    }

    return translation;
  };

  // Pluralization helper
  const tp = (key: TranslationKey, count: number): string => {
    // Simple pluralization - can be expanded if needed
    return `${count} ${t(key)}`;
  };

  return {
    t,
    tp,
    currentLang,
  };
}
