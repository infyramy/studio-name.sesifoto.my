import {
  nextTick,
  onMounted,
  onUnmounted,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Staggered enter + scroll reveal for public site sections inside SiteChrome.
 * Only runs when `enabled` is true (live mode).
 */
export function useLandingPageEnter(
  rootRef: Ref<HTMLElement | null>,
  enabled: Ref<boolean> | ComputedRef<boolean>,
) {
  let observer: IntersectionObserver | null = null;

  function teardown() {
    observer?.disconnect();
    observer = null;
    rootRef.value?.classList.remove("is-ready");
  }

  function revealAll(root: HTMLElement) {
    root
      .querySelectorAll<HTMLElement>(".lp-reveal")
      .forEach((el) => el.classList.add("is-in"));
    root.classList.add("is-ready");
  }

  async function setup() {
    teardown();
    await nextTick();
    const root = rootRef.value;
    if (!root || !enabled.value) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(
        "main > section, main > [data-lp-reveal]",
      ),
    );
    sections.forEach((el, i) => {
      el.classList.add("lp-reveal");
      el.style.setProperty("--reveal-i", String(Math.min(i, 5)));
    });

    if (prefersReducedMotion()) {
      revealAll(root);
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-in");
          observer?.unobserve(el);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.08,
      },
    );

    let visibleIndex = 0;
    for (const el of sections) {
      const rect = el.getBoundingClientRect();
      const alreadyVisible =
        rect.top < window.innerHeight * 0.9 && rect.bottom > 40;
      if (alreadyVisible) {
        el.style.setProperty("--reveal-i", String(Math.min(visibleIndex, 4)));
        visibleIndex += 1;
        requestAnimationFrame(() => el.classList.add("is-in"));
      } else {
        observer.observe(el);
      }
    }

    // Footer enters after first paint of above-fold content.
    requestAnimationFrame(() => {
      root.classList.add("is-ready");
    });
  }

  onMounted(setup);

  watch(enabled, (on) => {
    if (on) void setup();
    else {
      teardown();
      if (rootRef.value) revealAll(rootRef.value);
    }
  });

  onUnmounted(teardown);

  return { refresh: setup };
}
