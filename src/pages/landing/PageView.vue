<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  MarketingHomePageView,
  PortfolioPageView,
  LeadFormPageView,
  EditorialHomePageView,
  EditorialPortfolioPageView,
  EditorialLeadFormPageView,
  AtelierHomePageView,
  AtelierPortfolioPageView,
  AtelierLeadFormPageView,
  BillboardHomePageView,
  BillboardPortfolioPageView,
  BillboardLeadFormPageView,
  LandingPageBootState,
  normalizeLandingPageConfig,
  normalizePortfolioConfig,
  normalizeLeadFormConfig,
  isEditorialDesign,
  isAtelierDesign,
  isBillboardDesign,
  type LandingPageTheme,
  type PortfolioPageConfig,
  type LeadFormPageConfig,
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
const isLeadForm = computed(() => pageSlug.value === "lead-form");
const isTemplatePage = computed(
  () => isPortfolio.value || isLeadForm.value,
);

const pageLoading = ref(true);
const pageError = ref<string | null>(null);
const productEntitlements = ref<ProductEntitlements>({
  studio: false,
  crm: false,
});
const theme = ref<LandingPageTheme | null>(null);
const portfolioConfig = ref<PortfolioPageConfig | null>(null);
const leadFormConfig = ref<LeadFormPageConfig | null>(null);
const siteStyle = ref<LandingPageTheme | null>(null);

const leadFormViewRef = ref<{
  markSubmitSuccess: () => void;
  markSubmitFailure: (message?: string) => void;
} | null>(null);

const isGalleryOpen = ref(false);
const galleryInitialIndex = ref(0);

const language = computed<StudioLanguage>(() =>
  studioStore.currentLanguage === "EN" ? "en" : "bm",
);

const isEditorial = computed(() =>
  isEditorialDesign(
    (isTemplatePage.value ? siteStyle.value : theme.value)?.designId,
  ),
);
const isAtelier = computed(() =>
  isAtelierDesign(
    (isTemplatePage.value ? siteStyle.value : theme.value)?.designId,
  ),
);
const isBillboard = computed(() =>
  isBillboardDesign(
    (isTemplatePage.value ? siteStyle.value : theme.value)?.designId,
  ),
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

const lastSiteTheme = ref<LandingPageTheme | null>(readCachedSiteTheme());

function siteThemeCacheKey() {
  const slug =
    studioStore.studioSlug ||
    getStudioSlugFromSubdomain() ||
    "default";
  return `sesifoto_lp_theme_${slug}`;
}

function readCachedSiteTheme(): LandingPageTheme | null {
  try {
    const raw = sessionStorage.getItem(siteThemeCacheKey());
    if (!raw) return null;
    return normalizeLandingPageConfig(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return null;
  }
}

function rememberSiteTheme(next: LandingPageTheme) {
  lastSiteTheme.value = next;
  try {
    sessionStorage.setItem(
      siteThemeCacheKey(),
      JSON.stringify({
        presetName: next.presetName,
        primaryColor: next.primaryColor,
        primaryTextColor: next.primaryTextColor,
        secondaryColor: next.secondaryColor,
        secondaryTextColor: next.secondaryTextColor,
        mode: next.mode,
        titleFont: next.titleFont,
        bodyFont: next.bodyFont,
        logoUrl: next.logoUrl,
        studioName: next.studioName,
        radius: next.radius,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

const isInitialLoading = computed(
  () =>
    pageLoading.value ||
    studioStore.loading ||
    !studioStore.studio ||
    (!isTemplatePage.value && !theme.value) ||
    (isPortfolio.value && (!portfolioConfig.value || !siteStyle.value)) ||
    (isLeadForm.value && (!leadFormConfig.value || !siteStyle.value)),
);

const hasReadyPage = computed(() => {
  if (isPortfolio.value) return !!(portfolioConfig.value && siteStyle.value);
  if (isLeadForm.value) return !!(leadFormConfig.value && siteStyle.value);
  return !!theme.value;
});

const showBoot = computed(
  () => isInitialLoading.value || (!!pageError.value && !hasReadyPage.value),
);

const bootTheme = computed(
  () =>
    siteStyle.value ||
    theme.value ||
    lastSiteTheme.value ||
    normalizeLandingPageConfig({}, studioDefaults.value),
);

function clearPageConfigs() {
  portfolioConfig.value = null;
  leadFormConfig.value = null;
  // Keep theme/siteStyle for themed boot until new page data arrives.
}

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
  clearPageConfigs();

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
      siteStyle.value = normalizeLandingPageConfig(
        data.siteStyle ?? {},
        studioDefaults.value,
        { products: data.products },
      );
      theme.value = siteStyle.value;
      rememberSiteTheme(siteStyle.value);
    } else if (isLeadForm.value) {
      leadFormConfig.value = normalizeLeadFormConfig(data.config);
      siteStyle.value = normalizeLandingPageConfig(
        data.siteStyle ?? {},
        studioDefaults.value,
        { products: data.products },
      );
      theme.value = siteStyle.value;
      rememberSiteTheme(siteStyle.value);
    } else {
      theme.value = normalizeLandingPageConfig(
        data.config,
        studioDefaults.value,
        { pageType: data.type, products: data.products },
      );
      siteStyle.value = theme.value;
      rememberSiteTheme(theme.value);
    }
  } catch (err: unknown) {
    pageError.value =
      err instanceof Error ? err.message : "Failed to load page";
    clearPageConfigs();
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
  <div class="min-h-dvh w-full">
    <LandingPageBootState
      v-if="showBoot"
      :theme="bootTheme"
      :error="pageError"
      label="Loading"
      @retry="retryLoad"
    />
    <template v-else-if="isEditorial">
      <EditorialPortfolioPageView
        v-if="isPortfolio && portfolioConfig && siteStyle"
        :portfolio="portfolioConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
      <EditorialLeadFormPageView
        v-else-if="isLeadForm && leadFormConfig && siteStyle"
        ref="leadFormViewRef"
        :lead-form="leadFormConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
        :crm-enabled="productEntitlements.crm"
        @language-change="onLanguageChange"
        @navigate="onNavigate"
        @submit="onLeadSubmit"
        @open-gallery="onLeadGallery"
        @retry-load="retryLoad"
      />
      <EditorialHomePageView
        v-else-if="theme"
        :config="theme"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
    </template>
    <template v-else-if="isAtelier">
      <AtelierPortfolioPageView
        v-if="isPortfolio && portfolioConfig && siteStyle"
        :portfolio="portfolioConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
      <AtelierLeadFormPageView
        v-else-if="isLeadForm && leadFormConfig && siteStyle"
        ref="leadFormViewRef"
        :lead-form="leadFormConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
        :crm-enabled="productEntitlements.crm"
        @language-change="onLanguageChange"
        @navigate="onNavigate"
        @submit="onLeadSubmit"
        @open-gallery="onLeadGallery"
        @retry-load="retryLoad"
      />
      <AtelierHomePageView
        v-else-if="theme"
        :config="theme"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
    </template>
    <template v-else-if="isBillboard">
      <BillboardPortfolioPageView
        v-if="isPortfolio && portfolioConfig && siteStyle"
        :portfolio="portfolioConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
      <BillboardLeadFormPageView
        v-else-if="isLeadForm && leadFormConfig && siteStyle"
        ref="leadFormViewRef"
        :lead-form="leadFormConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
        :crm-enabled="productEntitlements.crm"
        @language-change="onLanguageChange"
        @navigate="onNavigate"
        @submit="onLeadSubmit"
        @open-gallery="onLeadGallery"
        @retry-load="retryLoad"
      />
      <BillboardHomePageView
        v-else-if="theme"
        :config="theme"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
    </template>
    <template v-else>
      <PortfolioPageView
        v-if="isPortfolio && portfolioConfig && siteStyle"
        :portfolio="portfolioConfig"
        :style-config="siteStyle"
        :language="language"
        mode="live"
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
        @language-change="onLanguageChange"
        @navigate="onNavigate"
        @submit="onLeadSubmit"
        @open-gallery="onLeadGallery"
        @retry-load="retryLoad"
      />
      <MarketingHomePageView
        v-else-if="theme"
        :config="theme"
        :language="language"
        mode="live"
        @navigate="onNavigate"
        @language-change="onLanguageChange"
        @retry-load="retryLoad"
      />
    </template>
    <ImageCarousel
      v-if="isLeadForm"
      :show="isGalleryOpen"
      :images="galleryImages.filter((x) => x?.trim())"
      :initial-index="galleryInitialIndex"
      title="Gallery"
      description="View our gallery"
      @close="isGalleryOpen = false"
    />
  </div>
</template>
