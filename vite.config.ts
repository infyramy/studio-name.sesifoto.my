import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import type { Plugin } from 'vite'

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
  plugins: [vue(), injectBuildVersion()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
