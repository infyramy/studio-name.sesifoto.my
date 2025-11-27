import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useStudioStore } from '@/stores/studio';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/home/index-new.vue'),
    meta: {
      title: 'Tempah Sesi Raya Anda',
    },
  },
  {
    path: '/home-new',
    name: 'home-new',
    component: () => import('@/pages/home/index-new.vue'),
    meta: {
      title: 'Tempah Sesi Raya Anda',
    },
  },
  {
    path: '/home-luxe',
    name: 'home-luxe',
    component: () => import('@/pages/home/index-luxe.vue'),
    meta: {
      title: 'Tempah Sesi Raya Anda (Luxe)',
    },
  },
  {
    path: '/home-modern',
    name: 'home-modern',
    component: () => import('@/pages/home/index-modern.vue'),
    meta: {
      title: 'Tempah Sesi Raya Anda (Modern)',
    },
  },
  {
    path: '/theme/:themeId',
    name: 'theme-details',
    component: () => import('@/pages/theme/details.vue'),
    meta: {
      title: 'Maklumat Tema',
    },
  },
  {
    path: '/booking-new',
    name: 'booking-new',
    component: () => import('@/pages/booking/index-new.vue'),
    meta: {
      title: 'Tempahan Baru',
    },
  },
  {
    path: '/booking-cart',
    name: 'booking-cart',
    component: () => import('@/pages/booking/cart.vue'),
    meta: {
      title: 'Tempahan (Troli)',
    },
  },
  {
    path: '/booking',
    name: 'booking',
    component: () => import('@/pages/booking/index.vue'),
    meta: {
      title: 'Tempahan',
    },
  },
  {
    path: '/check-booking',
    name: 'check-booking',
    component: () => import('@/pages/booking/check-new.vue'),
    meta: {
      title: 'Semak Tempahan',
    },
  },
  {
    path: '/success/:bookingId',
    name: 'success',
    component: () => import('@/pages/success/index.vue'),
    meta: {
      title: 'Tempahan Berjaya',
    },
  },
  {
    path: '/lookup',
    name: 'lookup',
    component: () => import('@/pages/home/lookup.vue'),
    meta: {
      title: 'Semak Tempahan',
    },
  },
  {
    path: '/studio-not-found',
    name: 'studio-not-found',
    component: () => import('@/pages/studio-not-found.vue'),
    meta: {
      title: 'Studio Not Found',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/home/not-found.vue'),
    meta: {
      title: 'Halaman Tidak Dijumpai',
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
    return { top: 0, behavior: 'smooth' };
  },
});

// Global navigation guard to load studio data
router.beforeEach(async (to, from, next) => {
  const studioStore = useStudioStore();

  // Skip studio check for studio-not-found and not-found pages
  if (to.name === 'studio-not-found' || to.name === 'not-found') {
    document.title = to.meta.title as string || 'SlotRaya';
    next();
    return;
  }

  // Load studio data if not already loaded
  if (!studioStore.isLoaded && !studioStore.loading) {
    try {
      await studioStore.loadStudio();
    } catch (error) {
      console.error('Failed to load studio:', error);
      // Redirect to studio not found page if studio loading fails
      next({ name: 'studio-not-found' });
      return;
    }
  }

  // If studio failed to load (store has error state), redirect
  if (!studioStore.studio && studioStore.isLoaded) {
    next({ name: 'studio-not-found' });
    return;
  }

  // Set page title
  const defaultTitle = studioStore.studio?.name || 'SlotRaya';
  document.title = to.meta.title ? `${to.meta.title} | ${defaultTitle}` : defaultTitle;

  next();
});

export default router;
