// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { createPinia } from 'pinia'
import './style.css'
import SourceViewer from './components/SourceViewer.vue'
import ChallengePage from './layouts/ChallengeLayout.vue'
import ChallengeListPage from './layouts/ChallengeListLayout.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { frontmatter } = useData()
    const layout = frontmatter.value.layout
    if (layout === 'challenge') return h(ChallengePage)
    if (layout === 'challenge-list') return h(ChallengeListPage)
    return h(DefaultTheme.Layout, null, {})
  },
  enhanceApp({ app }) {
    // Pinia — installed once at app level; pyodide and php-wasm are lazy-loaded
    // per-challenge page to avoid loading heavy WASM on every page
    app.use(createPinia())

    // SourceViewer is used in challenge pages via markdown
    app.component('SourceViewer', SourceViewer)

    // Register Service Worker (challenge router)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/challenge-sw.js').catch((err) => {
        console.warn('[challenge-sw] registration failed:', err)
      })
    }
  },
} satisfies Theme
