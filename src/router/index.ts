import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useStudioStore } from "@/stores/studio";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("@/pages/landing/index.vue"),
    meta: {
      title: "Home",
    },
  },
  {
    path: "/portfolio",
    name: "portfolio",
    component: () => import("@/pages/landing/PageView.vue"),
    meta: {
      title: "Portfolio",
      pageSlug: "portfolio",
    },
  },
  {
    path: "/services",
    name: "services",
    component: () => import("@/pages/landing/PageView.vue"),
    meta: {
      title: "Services",
      pageSlug: "services",
    },
  },
  {
    path: "/lead-form",
    name: "lead-form",
    component: () => import("@/pages/landing/PageView.vue"),
    meta: {
      title: "Lead form",
      pageSlug: "lead-form",
    },
  },
  {
    path: "/about-us",
    name: "about-us",
    component: () => import("@/pages/landing/PageView.vue"),
    meta: {
      title: "About us",
      pageSlug: "about-us",
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
    path: "/studio-not-found",
    name: "studio-not-found",
    component: () => import("@/pages/studio-not-found.vue"),
    meta: {
      title: "Studio Not Found",
    },
  },
  {
    path: "/portal-launch",
    name: "portal-launch",
    component: () => import("@/pages/portal-launch.vue"),
    meta: { title: "SESIFOTO" },
  },
  {
    path: "/client-portal/:jobId/start",
    name: "client-portal-start",
    component: () => import("@/pages/client-portal/[id].vue"),
    meta: { title: "Client Portal" },
  },
  {
    path: "/client-portal/:jobId/gallery/:galleryId",
    name: "client-portal-gallery",
    component: () => import("@/pages/client-portal/gallery/[galleryId].vue"),
    meta: { title: "Gallery" },
  },
  {
    path: "/client-portal/:jobId",
    name: "client-portal",
    component: () => import("@/pages/client-portal/[id].vue"),
    meta: { title: "Client Portal" },
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
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: "smooth" };
  },
});

router.beforeEach(async (to, _from, next) => {
  const studioStore = useStudioStore();

  if (to.query.r) {
    try {
      const referralCode = (to.query.r as string).toUpperCase();
      sessionStorage.setItem("referral_code", referralCode);
      console.log(
        `[Referral] Stored referral code from query: ${referralCode}`
      );
    } catch (error) {
      console.error("Failed to store referral code from query:", error);
    }
  }

  if (to.name === "studio-not-found" || to.name === "not-found") {
    document.title = (to.meta.title as string) || "SESIFOTO";
    next();
    return;
  }

  if (!studioStore.isLoaded && !studioStore.loading) {
    try {
      await studioStore.loadStudio();
    } catch (error) {
      console.error("Failed to load studio:", error);
      next({ name: "studio-not-found" });
      return;
    }
  }

  if (!studioStore.studio && studioStore.isLoaded) {
    next({ name: "studio-not-found" });
    return;
  }

  if (studioStore.studio?.slug) {
    try {
      sessionStorage.setItem("current_studio_slug", studioStore.studio.slug);
    } catch (error) {
      console.error("Failed to store studio slug in sessionStorage:", error);
    }
  }

  const defaultTitle = studioStore.studio?.name || "SESIFOTO";
  document.title = to.meta.title
    ? `${to.meta.title} | ${defaultTitle}`
    : defaultTitle;

  next();
});

export default router;
