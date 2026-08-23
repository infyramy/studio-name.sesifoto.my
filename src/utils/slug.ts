/**
 * Extract studio slug from subdomain
 * Example: "najiahstudio.sesifoto.my" => "najiahstudio"
 */

const BOOKING_DOMAIN = import.meta.env.VITE_BOOKING_DOMAIN || "sesifoto.my";
const DOMAIN_SLUG_CACHE_KEY = "current_studio_slug";
const DOMAIN_RESOLUTION_CACHE_KEY = "custom_domain_resolution";

export interface CustomDomainResolution {
  slug: string;
  customDomain: string;
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isSesifotoSubdomain(hostname: string): boolean {
  return (
    hostname === BOOKING_DOMAIN || hostname.endsWith(`.${BOOKING_DOMAIN}`)
  );
}

function getLocalStudioSlug(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const studioParam = urlParams.get("studio");
  if (studioParam) {
    try {
      sessionStorage.setItem(DOMAIN_SLUG_CACHE_KEY, studioParam);
    } catch (error) {
      console.error("Failed to store studio slug in sessionStorage:", error);
    }
    return studioParam;
  }

  try {
    const currentStudioSlug = sessionStorage.getItem(DOMAIN_SLUG_CACHE_KEY);
    if (currentStudioSlug) {
      const currentUrl = new URL(window.location.href);
      if (!currentUrl.searchParams.has("studio")) {
        currentUrl.searchParams.set("studio", currentStudioSlug);
        window.history.replaceState({}, "", currentUrl.toString());
      }
      return currentStudioSlug;
    }
  } catch (error) {
    console.error("Failed to read studio slug from sessionStorage:", error);
  }

  try {
    const savedState = localStorage.getItem("booking_state");
    if (savedState) {
      const state = JSON.parse(savedState);
      const savedAt = new Date(state.savedAt);
      const minutesAgo =
        (new Date().getTime() - savedAt.getTime()) / (1000 * 60);

      const hasMeaningfulProgress =
        state.selectedTheme ||
        state.currentStep > 1 ||
        (state.cartItems && state.cartItems.length > 0);

      if (!hasMeaningfulProgress) {
        localStorage.removeItem("booking_state");
      }

      if (minutesAgo <= 30 && state.studioSlug && hasMeaningfulProgress) {
        try {
          sessionStorage.setItem(DOMAIN_SLUG_CACHE_KEY, state.studioSlug);
        } catch (error) {
          console.error("Failed to store studio slug in sessionStorage:", error);
        }
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has("studio")) {
          currentUrl.searchParams.set("studio", state.studioSlug);
          window.history.replaceState({}, "", currentUrl.toString());
        }
        return state.studioSlug;
      }
    }
  } catch (error) {
    console.error("Failed to read saved studio from localStorage:", error);
    localStorage.removeItem("booking_state");
  }

  return "najiahstudio";
}

function getSlugFromSesifotoSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");

  if (parts.length >= 3) {
    const slug = parts[0];

    if (slug === "www" || slug === "api" || slug === "admin") {
      return null;
    }

    return slug || null;
  }

  return null;
}

export async function resolveStudioByCustomDomain(
  hostname: string,
): Promise<CustomDomainResolution | null> {
  const cacheKey = `${DOMAIN_RESOLUTION_CACHE_KEY}:${hostname}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as CustomDomainResolution;
    }
  } catch {
    // continue to API
  }

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  try {
    const response = await fetch(
      `${API_BASE}/public/studio/by-domain/${encodeURIComponent(hostname)}`,
    );
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CustomDomainResolution;
    if (!data?.slug) {
      return null;
    }

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(DOMAIN_SLUG_CACHE_KEY, data.slug);
    } catch {
      // ignore storage errors
    }

    return data;
  } catch (error) {
    console.error("Failed to resolve studio by custom domain:", error);
    return null;
  }
}

export async function getStudioSlugFromHost(): Promise<string | null> {
  const hostname = window.location.hostname;

  if (isLocalHost(hostname)) {
    return getLocalStudioSlug();
  }

  if (isSesifotoSubdomain(hostname)) {
    return getSlugFromSesifotoSubdomain(hostname);
  }

  const resolution = await resolveStudioByCustomDomain(hostname);
  return resolution?.slug ?? null;
}

export function getStudioSlugFromSubdomain(): string | null {
  const hostname = window.location.hostname;

  if (isLocalHost(hostname)) {
    return getLocalStudioSlug();
  }

  if (isSesifotoSubdomain(hostname)) {
    return getSlugFromSesifotoSubdomain(hostname);
  }

  try {
    const cachedSlug = sessionStorage.getItem(DOMAIN_SLUG_CACHE_KEY);
    if (cachedSlug) {
      return cachedSlug;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Check if current domain is a valid studio subdomain
 */
export function isStudioSubdomain(): boolean {
  return getStudioSlugFromSubdomain() !== null;
}

/**
 * Generate studio URL from slug
 */
export function getStudioUrl(slug: string): string {
  const hostname = window.location.hostname;

  if (isLocalHost(hostname)) {
    return `http://${hostname}:${window.location.port}?studio=${slug}`;
  }

  if (!isSesifotoSubdomain(hostname)) {
    return `https://${hostname}`;
  }

  const domain = hostname.split(".").slice(-2).join(".");
  return `https://${slug}.${domain}`;
}
