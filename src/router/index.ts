import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useStudioStore } from "@/stores/studio";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/pages/home/index.vue"),
    meta: {
      title: "Tempah Sesi Raya Anda",
    },
  },
  {
    path: "/theme/:themeId",
    name: "theme-details",
    component: () => import("@/pages/theme/details.vue"),
    meta: {
      title: "Maklumat Tema",
    },
  },
  {
    path: "/booking",
    name: "booking",
    component: () => import("@/pages/booking/index.vue"),
    meta: {
      title: "Tempahan",
    },
  },
  {
    path: "/booking-cart",
    name: "booking-cart",
    component: () => import("@/pages/booking/cart.vue"),
    meta: {
      title: "Tempahan (Troli)",
    },
  },
  {
    path: "/check-booking",
    name: "check-booking",
    component: () => import("@/pages/booking/check.vue"),
    meta: {
      title: "Semak Tempahan",
    },
  },
  {
    path: "/success/:bookingId",
    name: "success",
    component: () => import("@/pages/success/index.vue"),
    meta: {
      title: "Tempahan Berjaya",
    },
  },
  {
    path: "/payment/failed",
    name: "payment-failed",
    component: () => import("@/pages/payment/failed.vue"),
    meta: {
      title: "Pembayaran Gagal",
    },
  },
  {
    path: "/lookup",
    name: "lookup",
    component: () => import("@/pages/home/lookup.vue"),
    meta: {
      title: "Semak Tempahan",
    },
  },
  {
    path: "/studio-not-found",
    name: "studio-not-found",
    component: () => import("@/pages/studio-not-found.vue"),
    meta: {
      title: "Studio Not Found",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/pages/home/not-found.vue"),
    meta: {
      title: "Halaman Tidak Dijumpai",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: "smooth" };
  },
});

// Global navigation guard to load studio data
router.beforeEach(async (to, from, next) => {
  const studioStore = useStudioStore();

  // Skip studio check for studio-not-found and not-found pages
  if (to.name === "studio-not-found" || to.name === "not-found") {
    document.title = (to.meta.title as string) || "SESIFOTO";
    next();
    return;
  }

  // Load studio data if not already loaded
  if (!studioStore.isLoaded && !studioStore.loading) {
    try {
      await studioStore.loadStudio();
    } catch (error) {
      console.error("Failed to load studio:", error);
      // Redirect to studio not found page if studio loading fails
      next({ name: "studio-not-found" });
      return;
    }
  }

  // If studio failed to load (store has error state), redirect
  if (!studioStore.studio && studioStore.isLoaded) {
    next({ name: "studio-not-found" });
    return;
  }

  // Store studio slug in sessionStorage to preserve context across navigation
  if (studioStore.studio?.slug) {
    try {
      sessionStorage.setItem("current_studio_slug", studioStore.studio.slug);
    } catch (error) {
      console.error("Failed to store studio slug in sessionStorage:", error);
    }
  }

  // Set page title
  const defaultTitle = studioStore.studio?.name || "SESIFOTO";
  document.title = to.meta.title
    ? `${to.meta.title} | ${defaultTitle}`
    : defaultTitle;

  next();
});

export default router;
