import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import "./style.css";
import { useStudioStore } from "./stores/studio";
import { watch } from "vue";
import { useVersionCheck } from "./composables/useVersionCheck";

// Prevent zoom on input focus (iOS Safari)
const preventZoomOnInputFocus = () => {
  // Get all input and textarea elements
  const inputs = document.querySelectorAll("input, textarea, select");

  inputs.forEach((input) => {
    // Prevent zoom by ensuring font-size is at least 16px
    const element = input as HTMLElement;
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize);

    if (fontSize < 16) {
      element.style.fontSize = "16px";
    }

    // Add touch-action to prevent pinch zoom
    element.style.touchAction = "manipulation";
  });
};

// Run on mount and when DOM changes
const observer = new MutationObserver(() => {
  preventZoomOnInputFocus();
});

// Prevent pinch zoom globally
document.addEventListener("gesturestart", (e) => {
  e.preventDefault();
});

document.addEventListener("gesturechange", (e) => {
  e.preventDefault();
});

document.addEventListener("gestureend", (e) => {
  e.preventDefault();
});

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

app.mount("#app");

// Initialize version checking to detect new builds
const versionCheck = useVersionCheck();
versionCheck.initialize();

// Get studio store after pinia is initialized
const studioStore = useStudioStore();

// Watch for studio changes and update document title and favicon
watch(
  () => studioStore.studio,
  (studio) => {
    if (studio) {
      // Update document title
      document.title = studio.name;

      // Update favicon
      const favicon = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement;
      if (favicon && studio.logo_url) {
        favicon.href = studio.logo_url;
      }
    }
  },
  { immediate: true }
);

// Observe DOM changes and prevent zoom on new inputs
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Run once on mount
preventZoomOnInputFocus();
