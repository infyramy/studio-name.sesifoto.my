<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  LandingPageView,
  normalizeLandingPageConfig,
  type LandingPageTheme,
  type ProductEntitlements,
  type StudioLanguage,
} from "@/landing-page-ui";
import ImageCarousel from "@/components/ImageCarousel.vue";
import { useLandingPageMeta } from "@/composables/useLandingPageMeta";
import { useStudioStore } from "@/stores/studio";
import { api } from "@/services/api";
import { getStudioSlugFromSubdomain } from "@/utils/slug";

const router = useRouter();
const studioStore = useStudioStore();

const pageLoading = ref(true);
const pageError = ref<string | null>(null);
const productEntitlements = ref<ProductEntitlements>({
  studio: false,
  crm: false,
});
const theme = ref<LandingPageTheme | null>(null);

const isGalleryOpen = ref(false);
const galleryInitialIndex = ref(0);

const language = computed<StudioLanguage>(() =>
  studioStore.currentLanguage === "EN" ? "en" : "bm",
);

const studioDefaults = computed(() => {
  const s = studioStore.studio;
  if (!s) return undefined;
  return {
    name: s.name,
    logoUrl: s.logo_url,
    instagram: s.instagram,
    facebook: s.facebook,
    tiktok: s.tiktok,
    address: s.address,
    ssm: s.ssm,
    whatsapp: s.whatsapp,
  };
});

const galleryImages = computed(() => theme.value?.galleryImages ?? []);

const studioName = computed(() => studioStore.studio?.name);
const canonicalUrl = computed(() => {
  const slug = studioStore.studioSlug || getStudioSlugFromSubdomain();
  return slug ? `https://${slug}.sesifoto.my/` : undefined;
});

useLandingPageMeta(theme, { studioName, canonicalUrl });

const isInitialLoading = computed(
  () =>
    pageLoading.value ||
    studioStore.loading ||
    !studioStore.studio ||
    !theme.value,
);

async function loadLandingPage() {
  const slug = studioStore.studioSlug || getStudioSlugFromSubdomain();
  if (!slug) {
    pageError.value = "Studio not found";
    pageLoading.value = false;
    return;
  }

  pageLoading.value = true;
  pageError.value = null;

  try {
    if (!studioStore.studio && !studioStore.loading) {
      await studioStore.loadStudio(slug);
    } else if (!studioStore.websiteSettings) {
      await studioStore.loadStudio(slug);
    }

    const data = await api.getLandingPage(slug);
    productEntitlements.value = data.products;
    theme.value = normalizeLandingPageConfig(
      data.config,
      studioDefaults.value,
      { pageType: data.type, products: data.products },
    );
  } catch (err: unknown) {
    pageError.value =
      err instanceof Error ? err.message : "Failed to load landing page";
    theme.value = null;
  } finally {
    pageLoading.value = false;
  }
}

async function retryLoad() {
  await loadLandingPage();
}

onMounted(loadLandingPage);

function onBookNow() {
  router.push("/booking");
}

function onCheckBooking() {
  router.push("/check-booking");
}

function onCrmInquiry() {
  const phone = studioStore.studio?.whatsapp?.replace(/[^\d+]/g, "");
  if (!phone) return;
  const text = encodeURIComponent("Hi, I would like to send an inquiry.");
  window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
}
</script>

<template>
  <LandingPageView
    v-if="theme"
    :config="theme"
    :language="language"
    mode="live"
    :product-entitlements="productEntitlements"
    :booking-open="studioStore.websiteSettings?.bookingOpen ?? true"
    :studio-phone="studioStore.studio?.whatsapp ?? ''"
    :loading="isInitialLoading"
    :load-error="pageError"
    @book-now="onBookNow"
    @check-booking="onCheckBooking"
    @crm-inquiry="onCrmInquiry"
    @open-gallery="
      (index) => {
        galleryInitialIndex = index;
        isGalleryOpen = true;
      }
    "
    @retry-load="retryLoad"
  >
    <template #gallery-modal>
      <ImageCarousel
        :show="isGalleryOpen"
        :images="galleryImages.filter((x) => x?.trim())"
        :initial-index="galleryInitialIndex"
        title="Gallery"
        description="View our gallery"
        @close="isGalleryOpen = false"
      />
    </template>
  </LandingPageView>
  <LandingPageView
    v-else
    :config="normalizeLandingPageConfig({}, studioDefaults)"
    :language="language"
    mode="live"
    :loading="true"
  />
</template>
