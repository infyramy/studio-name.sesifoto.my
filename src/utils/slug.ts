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
      // Store in sessionStorage to preserve across navigation
      try {
        sessionStorage.setItem('current_studio_slug', studioParam);
      } catch (error) {
        console.error('Failed to store studio slug in sessionStorage:', error);
      }
      return studioParam;
    }

    // Check sessionStorage for current studio context (from navigation)
    try {
      const currentStudioSlug = sessionStorage.getItem('current_studio_slug');
      if (currentStudioSlug) {
        // Update URL to include studio parameter for consistency
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has('studio')) {
          currentUrl.searchParams.set('studio', currentStudioSlug);
          window.history.replaceState({}, '', currentUrl.toString());
        }
        return currentStudioSlug;
      }
    } catch (error) {
      console.error('Failed to read studio slug from sessionStorage:', error);
    }

    // Check localStorage for saved booking state to preserve studio context
    try {
      const savedState = localStorage.getItem('booking_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        const savedAt = new Date(state.savedAt);
        const minutesAgo = (new Date().getTime() - savedAt.getTime()) / (1000 * 60);
        
        // Only use saved studio if there's meaningful progress
        // (not just at step 1 without theme selection)
        const hasMeaningfulProgress = state.selectedTheme || 
                                       state.currentStep > 1 || 
                                       (state.cartItems && state.cartItems.length > 0);
        
        // If no meaningful progress, clear the old state
        if (!hasMeaningfulProgress) {
          localStorage.removeItem('booking_state');
        }
        
        // If saved within 30 minutes with meaningful progress, use that studio slug
        if (minutesAgo <= 30 && state.studioSlug && hasMeaningfulProgress) {
          // Store in sessionStorage for future navigation
          try {
            sessionStorage.setItem('current_studio_slug', state.studioSlug);
          } catch (error) {
            console.error('Failed to store studio slug in sessionStorage:', error);
          }
          // Update URL to include studio parameter
          const currentUrl = new URL(window.location.href);
          if (!currentUrl.searchParams.has('studio')) {
            currentUrl.searchParams.set('studio', state.studioSlug);
            window.history.replaceState({}, '', currentUrl.toString());
          }
          return state.studioSlug;
        }
      }
    } catch (error) {
      console.error('Failed to read saved studio from localStorage:', error);
      // Clear corrupted state
      localStorage.removeItem('booking_state');
    }

    // Default to najiahstudio for local dev
    return 'najiahstudio';
  }

  // Production: extract from subdomain
  // Format: [slug].sesifoto.my
  const parts = hostname.split('.');

  // Should have at least 3 parts: [slug, SESIFOTO, com]
  if (parts.length >= 3) {
    const slug = parts[0];

    // Exclude www and other non-studio subdomains
    if (slug === 'www' || slug === 'api' || slug === 'admin') {
      return null;
    }

    return slug || null;
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
