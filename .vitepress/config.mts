import { defineConfig } from 'vitepress'
import UnoCSS from 'unocss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractMarkdownBody } from './challenge/plugin'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  vite: {
    plugins: [UnoCSS(), wasm(), topLevelAwait()],
    optimizeDeps: {
      exclude: ['php-wasm'],
    },
  },

  title: "Web Exploitation Challenges",
  description: "完全基於前端 WASM 的挑戰平台",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Challenges', link: '/challenges/' },
    ],

    sidebar: [],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  },

  transformPageData(pageData, ctx) {
    if (pageData.frontmatter.layout !== 'challenge') return
    const filePath = resolve(ctx.siteConfig.srcDir, pageData.relativePath)
    const raw = readFileSync(filePath, 'utf-8')
    pageData.frontmatter.markdownBody = extractMarkdownBody(raw)
  },
})
