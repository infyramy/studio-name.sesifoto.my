<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  MarketingHomePageView,
  PortfolioPageView,
  ServicesPageView,
  LeadFormPageView,
  AboutPageView,
  normalizeLandingPageConfig,
  normalizePortfolioConfig,
  normalizeServicesConfig,
  normalizeLeadFormConfig,
  normalizeAboutConfig,
  type LandingPageTheme,
  type PortfolioPageConfig,
  type ServicesPageConfig,
  type LeadFormPageConfig,
  type AboutPageConfig,
  type LeadFormSubmitPayload,
  type ProductEntitlements,
  type StudioLanguage,
} from "@/landing-page-ui";
import ImageCarousel from "@/components/ImageCarousel.vue";
import { useLandingPageMeta } from "@/composables/useLandingPageMeta";
import { useStudioStore } from "@/stores/studio";
import { api } from "@/services/api";
import { getStudioSlugFromHost, getStudioSlugFromSubdomain } from "@/utils/slug";

const route = useRoute();
const router = useRouter();
const studioStore = useStudioStore();

const pageSlug = computed(() => (route.meta.pageSlug as string | undefined) ?? undefined);
const isPortfolio = computed(() => pageSlug.value === "portfolio");
const isServices = computed(() => pageSlug.value === "services");
const isLeadForm = computed(() => pageSlug.value === "lead-form");
const isAboutUs = computed(() => pageSlug.value === "about-us");
const isTemplatePage = computed(
  () =>
    isPortfolio.value ||
    isServices.value ||
    isLeadForm.value ||
    isAboutUs.value,
);

const pageLoading = ref(true);
const pageError = ref<string | null>(null);
const productEntitlements = ref<ProductEntitlements>({
  studio: false,
  crm: false,
});
const theme = ref<LandingPageTheme | null>(null);
const portfolioConfig = ref<PortfolioPageConfig | null>(null);
const servicesConfig = ref<ServicesPageConfig | null>(null);
const leadFormConfig = ref<LeadFormPageConfig | null>(null);
const aboutConfig = ref<AboutPageConfig | null>(null);
const siteStyle = ref<LandingPageTheme | null>(null);

const leadFormViewRef = ref<InstanceType<typeof LeadFormPageView> | null>(null);

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
    email: s.email,
    instagram: s.instagram,
    facebook: s.facebook,
    tiktok: s.tiktok,
    pinterest: s.pinterest,
    threads: s.threads,
    address: s.address,
    mapsLink: s.maps_link,
    ssm: s.ssm,
    whatsapp: s.whatsapp,
    description: s.description,
  };
});

const galleryImages = computed(() => {
  if (isLeadForm.value && leadFormConfig.value) {
    return leadFormConfig.value.recentWorkImages ?? [];
  }
  return theme.value?.galleryImages ?? [];
});

const studioName = computed(() => studioStore.studio?.name);
const canonicalUrl = computed(() => {
  const path = pageSlug.value ? `/${pageSlug.value}` : "";
  const hostname = window.location.hostname;
  if (
    hostname !== "localhost" &&
    hostname !== "127.0.0.1" &&
    !hostname.endsWith(".sesifoto.my") &&
    hostname !== "sesifoto.my"
  ) {
    return `${window.location.origin}${path}`;
  }
  const slug = studioStore.studioSlug || getStudioSlugFromSubdomain();
  if (!slug) return undefined;
  return `https://${slug}.sesifoto.my${path}`;
});

useLandingPageMeta(theme, { studioName, canonicalUrl });

const isInitialLoading = computed(
  () =>
    pageLoading.value ||
    studioStore.loading ||
    !studioStore.studio ||
    (!isTemplatePage.value && !theme.value) ||
    (isPortfolio.value && (!portfolioConfig.value || !siteStyle.value)) ||
    (isServices.value && (!servicesConfig.value || !siteStyle.value)) ||
    (isLeadForm.value && (!leadFormConfig.value || !siteStyle.value)) ||
    (isAboutUs.value && (!aboutConfig.value || !siteStyle.value)),
);

async function loadPage() {
  const slug =
    studioStore.studioSlug ||
    (await getStudioSlugFromHost()) ||
    getStudioSlugFromSubdomain();
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

    const data = await api.getLandingPage(slug, pageSlug.value);
    productEntitlements.value = data.products;

    if (isPortfolio.value) {
      portfolioConfig.value = normalizePortfolioConfig(data.config);
      servicesConfig.value = null;
      leadFormConfig.value = null;
      aboutConfig.value = null;
      siteStyle.value = normalizeLandingPageConfig(
        data.siteStyle ?? {},
        studioDefaults.value,
        { products: data.products },
      );
      theme.value = siteStyle.value;
    } else if (isServices.value) {
      servicesConfig.value = normalizeServicesConfig(data.config);
      portfolioConfig.value = null;
      leadFormConfig.value = null;
      aboutConfig.value = null;
      siteStyle.value = normalizeLandingPageConfig(
        data.siteStyle ?? {},
        studioDefaults.value,
        { products: data.products },
      );
      theme.value = siteStyle.value;
    } else if (isLeadForm.value) {
      leadFormConfig.value = normalizeLeadFormConfig(data.config);
      portfolioConfig.value = null;
      servicesConfig.value = null;
      aboutConfig.value = null;
      siteStyle.value = normalizeLandingPageConfig(
        data.siteStyle ?? {},
        studioDefaults.value,
        { products: data.products },
      );
      theme.value = siteStyle.value;
    } else if (isAboutUs.value) {
      aboutConfig.value = normalizeAboutConfig(data.config);
      portfolioConfig.value = null;
      servicesConfig.value = null;
      leadFormConfig.value = null;
      siteStyle.value = normalizeLandingPageConfig(
        data.siteStyle ?? {},
        studioDefaults.value,
        { products: data.products },
      );
      theme.value = siteStyle.value;
    } else {
      theme.value = normalizeLandingPageConfig(
        data.config,
        studioDefaults.value,
        { pageType: data.type, products: data.products },
      );
      portfolioConfig.value = null;
      servicesConfig.value = null;
      leadFormConfig.value = null;
      aboutConfig.value = null;
      siteStyle.value = null;
    }
  } catch (err: unknown) {
    pageError.value =
      err instanceof Error ? err.message : "Failed to load page";
    theme.value = null;
    portfolioConfig.value = null;
    servicesConfig.value = null;
    leadFormConfig.value = null;
    aboutConfig.value = null;
    siteStyle.value = null;
  } finally {
    pageLoading.value = false;
  }
}

async function retryLoad() {
  await loadPage();
}

onMounted(loadPage);
watch(pageSlug, loadPage);

function onNavigate(url: string) {
  if (url.startsWith("http")) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  if (url.startsWith("/#")) {
    router.push("/");
    return;
  }
  router.push(url);
}

function onLanguageChange(lang: StudioLanguage) {
  studioStore.setLanguage(lang === "en" ? "EN" : "BM");
}

async function onLeadSubmit(payload: LeadFormSubmitPayload) {
  const slug = studioStore.studioSlug || getStudioSlugFromSubdomain();
  try {
    await api.submitLead(slug, payload);
    leadFormViewRef.value?.markSubmitSuccess();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : undefined;
    leadFormViewRef.value?.markSubmitFailure(message);
  }
}

function onLeadGallery(index: number) {
  galleryInitialIndex.value = index;
  isGalleryOpen.value = true;
}
</script>

<template>
  <PortfolioPageView
    v-if="isPortfolio && portfolioConfig && siteStyle"
    :portfolio="portfolioConfig"
    :style-config="siteStyle"
    :language="language"
    mode="live"
    :loading="isInitialLoading"
    :load-error="pageError"
    @navigate="onNavigate"
    @language-change="onLanguageChange"
    @retry-load="retryLoad"
  />
  <ServicesPageView
    v-else-if="isServices && servicesConfig && siteStyle"
    :services="servicesConfig"
    :style-config="siteStyle"
    :language="language"
    mode="live"
    :loading="isInitialLoading"
    :load-error="pageError"
    @navigate="onNavigate"
    @language-change="onLanguageChange"
    @retry-load="retryLoad"
  />
  <LeadFormPageView
    v-else-if="isLeadForm && leadFormConfig && siteStyle"
    ref="leadFormViewRef"
    :lead-form="leadFormConfig"
    :style-config="siteStyle"
    :language="language"
    mode="live"
    :crm-enabled="productEntitlements.crm"
    :loading="isInitialLoading"
    :load-error="pageError"
    @language-change="onLanguageChange"
    @navigate="onNavigate"
    @submit="onLeadSubmit"
    @open-gallery="onLeadGallery"
    @retry-load="retryLoad"
  />
  <AboutPageView
    v-else-if="isAboutUs && aboutConfig && siteStyle"
    :about="aboutConfig"
    :style-config="siteStyle"
    :language="language"
    mode="live"
    :loading="isInitialLoading"
    :load-error="pageError"
    @navigate="onNavigate"
    @language-change="onLanguageChange"
    @retry-load="retryLoad"
  />
  <MarketingHomePageView
    v-else-if="theme"
    :config="theme"
    :language="language"
    mode="live"
    :loading="isInitialLoading"
    :load-error="pageError"
    @navigate="onNavigate"
    @language-change="onLanguageChange"
    @retry-load="retryLoad"
  />
  <MarketingHomePageView
    v-else
    :config="normalizeLandingPageConfig({}, studioDefaults)"
    :language="language"
    mode="live"
    :loading="true"
  />
  <ImageCarousel
    v-if="isLeadForm"
    :show="isGalleryOpen"
    :images="galleryImages.filter((x) => x?.trim())"
    :initial-index="galleryInitialIndex"
    title="Gallery"
    description="View our gallery"
    @close="isGalleryOpen = false"
  />
</template>
