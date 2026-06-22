import { onUnmounted, watch, type Ref } from "vue";
import {
  buildLandingPageMeta,
  type LandingPageTheme,
} from "@/landing-page-ui";

const META_ATTR = "data-landing-meta";

type MetaSpec = {
  tag: "meta" | "link";
  selector: string;
  create: () => HTMLElement;
  apply: (el: HTMLElement, value: string) => void;
};

function upsertTag(spec: MetaSpec, value: string) {
  if (!value && spec.tag === "meta") return;

  let el = document.head.querySelector(spec.selector) as HTMLElement | null;
  if (!el) {
    el = spec.create();
    el.setAttribute(META_ATTR, "true");
    document.head.appendChild(el);
  }
  spec.apply(el, value);
}

function removeLandingMetaTags() {
  document.head
    .querySelectorAll(`[${META_ATTR}]`)
    .forEach((node) => node.remove());
}

/**
 * Client-side SEO/OG tags for the landing page route.
 * Not SSR — crawlers that do not run JS may miss these tags.
 */
export function useLandingPageMeta(
  theme: Ref<LandingPageTheme | null>,
  options: {
    studioName?: Ref<string | undefined>;
    canonicalUrl?: Ref<string | undefined>;
  } = {},
) {
  function applyMeta() {
    if (!theme.value) return;

    const meta = buildLandingPageMeta(theme.value, {
      studioName: options.studioName?.value,
      canonicalUrl: options.canonicalUrl?.value,
    });

    document.title = meta.title;

    upsertTag(
      {
        tag: "meta",
        selector: `meta[name="description"][${META_ATTR}]`,
        create: () => {
          const node = document.createElement("meta");
          node.setAttribute("name", "description");
          return node;
        },
        apply: (el, value) => el.setAttribute("content", value),
      },
      meta.description,
    );

    const ogPairs: Array<[string, string]> = [
      ["og:title", meta.title],
      ["og:description", meta.description],
      ["og:type", "website"],
    ];
    if (meta.ogImage) ogPairs.push(["og:image", meta.ogImage]);
    if (meta.canonicalUrl) ogPairs.push(["og:url", meta.canonicalUrl]);

    for (const [property, content] of ogPairs) {
      upsertTag(
        {
          tag: "meta",
          selector: `meta[property="${property}"][${META_ATTR}]`,
          create: () => {
            const node = document.createElement("meta");
            node.setAttribute("property", property);
            return node;
          },
          apply: (el, value) => el.setAttribute("content", value),
        },
        content,
      );
    }

    if (meta.canonicalUrl) {
      upsertTag(
        {
          tag: "link",
          selector: `link[rel="canonical"][${META_ATTR}]`,
          create: () => {
            const node = document.createElement("link");
            node.setAttribute("rel", "canonical");
            return node;
          },
          apply: (el, value) => el.setAttribute("href", value),
        },
        meta.canonicalUrl,
      );
    }

    upsertTag(
      {
        tag: "meta",
        selector: `meta[name="twitter:card"][${META_ATTR}]`,
        create: () => {
          const node = document.createElement("meta");
          node.setAttribute("name", "twitter:card");
          return node;
        },
        apply: (el) => el.setAttribute("content", "summary_large_image"),
      },
      "summary_large_image",
    );

    for (const [name, content] of [
      ["twitter:title", meta.title],
      ["twitter:description", meta.description],
      ...(meta.ogImage ? [["twitter:image", meta.ogImage] as const] : []),
    ]) {
      upsertTag(
        {
          tag: "meta",
          selector: `meta[name="${name}"][${META_ATTR}]`,
          create: () => {
            const node = document.createElement("meta");
            node.setAttribute("name", name);
            return node;
          },
          apply: (el, value) => el.setAttribute("content", value),
        },
        content,
      );
    }
  }

  const stop = watch(
    [theme, () => options.studioName?.value, () => options.canonicalUrl?.value],
    applyMeta,
    { immediate: true, deep: true },
  );

  onUnmounted(() => {
    stop();
    removeLandingMetaTags();
  });
}
