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

  // Translation function
  const t = (key: TranslationKey): string => {
    const translation = translations[currentLang.value]?.[key];

    if (!translation) {
      console.warn(
        `Translation missing for key: ${key} in language: ${currentLang.value}`
      );
      return key;
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
