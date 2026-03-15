// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createPinia } from 'pinia'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app }) {
    // Pinia — installed once at app level; pyodide and php-wasm are lazy-loaded
    // per-challenge page to avoid loading heavy WASM on every page
    app.use(createPinia())

    // Register Service Worker (challenge router)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/challenge-sw.js').catch((err) => {
        console.warn('[challenge-sw] registration failed:', err)
      })
    }
  },
} satisfies Theme
