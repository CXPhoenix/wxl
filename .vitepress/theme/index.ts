// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createPinia } from 'pinia'
import './style.css'
import BrowserPanel from './components/BrowserPanel.vue'
import ChallengeLayout from './components/ChallengeLayout.vue'
import FlagSubmit from './components/FlagSubmit.vue'
import RepeatPanel from './components/RepeatPanel.vue'
import SourceViewer from './components/SourceViewer.vue'
import TerminalPanel from './components/TerminalPanel.vue'

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

    // Register challenge UI components globally for use in Markdown pages
    app.component('BrowserPanel', BrowserPanel)
    app.component('ChallengeLayout', ChallengeLayout)
    app.component('FlagSubmit', FlagSubmit)
    app.component('RepeatPanel', RepeatPanel)
    app.component('SourceViewer', SourceViewer)
    app.component('TerminalPanel', TerminalPanel)

    // Register Service Worker (challenge router)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/challenge-sw.js').catch((err) => {
        console.warn('[challenge-sw] registration failed:', err)
      })
    }
  },
} satisfies Theme
