/**
 * Extract studio slug from subdomain
 * Example: "najiahstudio.sesifoto.my" => "najiahstudio"
 */
export function getStudioSlugFromSubdomain(): string | null {
  const hostname = window.location.hostname;

  // For local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for URL parameter override for testing
    const urlParams = new URLSearchParams(window.location.search);
    const studioParam = urlParams.get('studio');
    if (studioParam) {
      return studioParam;
    }

    // Default to najiahstudio for local dev
    return 'najiahstudio';
  }

  // Production: extract from subdomain
  // Format: [slug].sesifoto.my
  const parts = hostname.split('.');

  // Should have at least 3 parts: [slug, slotraya, com]
  if (parts.length >= 3) {
    const slug = parts[0];

    // Exclude www and other non-studio subdomains
    if (slug === 'www' || slug === 'api' || slug === 'admin') {
      return null;
    }

    return slug;
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

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://${hostname}:${window.location.port}?studio=${slug}`;
  }

  // Production
  const domain = hostname.split('.').slice(-2).join('.'); // Get "sesifoto.my"
  return `https://${slug}.${domain}`;
}
