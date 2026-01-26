/**
 * Composable to check for app version updates and prompt user to reload
 */
export function useVersionCheck() {
  const VERSION_STORAGE_KEY = 'app_version'
  const CHECK_INTERVAL = 60000 // Check every minute

  /**
   * Get the current build version from the HTML meta tag
   */
  function getCurrentVersion(): string | null {
    const metaTag = document.querySelector('meta[name="app-version"]')
    return metaTag?.getAttribute('content') || null
  }

  /**
   * Get the stored version from localStorage
   */
  function getStoredVersion(): string | null {
    try {
      return localStorage.getItem(VERSION_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to read stored version:', error)
      return null
    }
  }

  /**
   * Store the current version in localStorage
   */
  function storeVersion(version: string): void {
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, version)
    } catch (error) {
      console.error('Failed to store version:', error)
    }
  }

  /**
   * Check if a new version is available
   */
  function checkForUpdate(): boolean {
    const currentVersion = getCurrentVersion()
    const storedVersion = getStoredVersion()

    if (!currentVersion) {
      console.warn('Could not determine current app version')
      return false
    }

    // If no stored version, this is the first load - store it
    if (!storedVersion) {
      storeVersion(currentVersion)
      return false
    }

    // If versions differ, a new build is available
    if (currentVersion !== storedVersion) {
      return true
    }

    return false
  }

  /**
   * Force reload the page to get the latest version
   */
  function forceReload(): void {
    const currentVersion = getCurrentVersion()
    if (currentVersion) {
      storeVersion(currentVersion)
    }
    window.location.reload()
  }

  /**
   * Show a notification to the user about the update
   * Returns a promise that resolves when user chooses to reload
   */
  function showUpdateNotification(): Promise<void> {
    return new Promise((resolve) => {
      // Create notification element
      const notification = document.createElement('div')
      notification.id = 'version-update-notification'
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #3b82f6;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 90%;
        animation: slideDown 0.3s ease-out;
      `

      // Add animation
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `
      document.head.appendChild(style)

      notification.innerHTML = `
        <span>✨ A new version is available!</span>
        <button id="reload-btn" style="
          background: white;
          color: #3b82f6;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: opacity 0.2s;
        " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          Reload Now
        </button>
      `

      document.body.appendChild(notification)

      // Handle reload button click
      const reloadBtn = notification.querySelector('#reload-btn')
      reloadBtn?.addEventListener('click', () => {
        resolve()
        forceReload()
      })

      // Auto-reload after 10 seconds if user doesn't click
      setTimeout(() => {
        if (document.body.contains(notification)) {
          resolve()
          forceReload()
        }
      }, 10000)
    })
  }

  /**
   * Initialize version checking
   * - Checks immediately on load
   * - Sets up periodic checks
   */
  function initialize(): void {
    // Check immediately
    if (checkForUpdate()) {
      showUpdateNotification()
    } else {
      // Store current version if not stored
      const currentVersion = getCurrentVersion()
      if (currentVersion) {
        storeVersion(currentVersion)
      }
    }

    // Set up periodic checks (every minute)
    setInterval(() => {
      if (checkForUpdate()) {
        showUpdateNotification()
      }
    }, CHECK_INTERVAL)
  }

  return {
    checkForUpdate,
    forceReload,
    showUpdateNotification,
    initialize,
    getCurrentVersion,
    getStoredVersion,
  }
}
