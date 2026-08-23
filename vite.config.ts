import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import type { Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Vite plugin to inject build version into HTML
const injectBuildVersion = (): Plugin => {
  // Generate build version once per build
  const buildVersion = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  return {
    name: 'inject-build-version',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string) {
        // Inject version as a meta tag
        const versionMeta = `  <meta name="app-version" content="${buildVersion}">\n`
        
        // Insert before closing head tag
        return html.replace('</head>', versionMeta + '</head>')
      }
    },
    generateBundle() {
      // Also write version to a JSON file for API access if needed
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ 
          version: buildVersion, 
          timestamp: new Date().toISOString() 
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SESIFOTO',
        short_name: 'SESIFOTO',
        description: 'A modern web application for SESIFOTO',
        theme_color: '#ffffff',
        id: '/',
        start_url: '/portal-launch',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icons/android/android-launchericon-48-48.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/android/android-launchericon-72-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/android/android-launchericon-96-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/ios/128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/android/android-launchericon-144-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/ios/152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/android/android-launchericon-192-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/android/android-launchericon-512-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Never cache API calls — always network for fresh data
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
    injectBuildVersion(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
