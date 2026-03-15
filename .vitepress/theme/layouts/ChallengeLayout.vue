<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useData } from 'vitepress'
import { Content } from 'vitepress/client'
import BrowserPanel from '../components/BrowserPanel.vue'
import TerminalPanel from '../components/TerminalPanel.vue'
import RepeatPanel from '../components/RepeatPanel.vue'
import FlagSubmit from '../components/FlagSubmit.vue'
import { useFlagVerifier } from '../../challenge/flag-verifier'

const { frontmatter, page } = useData()

// Derive slug from relativePath: "challenges/sqli-demo.md" → "sqli-demo"
const slug = computed(() => {
  const rel: string = page.value.relativePath ?? ''
  return rel.replace(/^.*\//, '').replace(/\.md$/, '')
})

const fm = computed(() => frontmatter.value)

// Collapsible description panel
const descriptionCollapsed = ref(false)
function toggleDescription() {
  descriptionCollapsed.value = !descriptionCollapsed.value
}

// Tab switching
type Tab = 'browser' | 'terminal' | 'repeater'
const activeTab = ref<Tab>('browser')
const tabs: { id: Tab; label: string }[] = [
  { id: 'browser', label: 'Browser' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'repeater', label: 'Repeater' },
]

// Challenge dispatch: fetch via service worker intercept
async function dispatch(request: Request): Promise<Response> {
  return fetch(request)
}

// Flag verification
const { verify: verifyFlag } = useFlagVerifier(slug.value)
async function verify(submitted: string): Promise<boolean> {
  return verifyFlag(submitted, fm.value.flag_verifier ?? '')
}

// Register challenge with service worker on mount
onMounted(() => {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({
        type: 'REGISTER_CHALLENGE',
        slug: slug.value,
        backend: fm.value.backend ?? 'flask',
      })
    })
  }
})

// Static badge class maps (full class names for UnoCSS extraction)
const difficultyBadge: Record<string, string> = {
  easy:    'ch-badge-easy',
  medium:  'ch-badge-medium',
  hard:    'ch-badge-hard',
  mystery: 'ch-badge-mystery',
}
const categoryBadge: Record<string, string> = {
  web: 'ch-badge-web',
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden bg-[var(--ch-bg)] color-[var(--ch-text-1)]">
    <!-- Top navigation bar -->
    <header class="relative px-4 py-2 border-b border-[var(--ch-border)] bg-[var(--ch-bg)]">
      <div class="flex justify-center items-center gap-4">
        <span class="font-semibold text-[1em] color-[var(--ch-text-1)]">{{ fm.title }}</span>
        <span
        v-if="fm.difficulty"
        :class="difficultyBadge[fm.difficulty] ?? 'ch-badge'"
        >{{ fm.difficulty }}</span>
        <span
        v-if="fm.category"
        :class="categoryBadge[fm.category] ?? 'ch-badge'"
        >{{ fm.category }}</span>
      </div>
      <a href="/challenges/" class="absolute inset-y-2 text-[0.9em] color-[var(--ch-accent)] no-underline whitespace-nowrap hover:underline">← Challenges</a>
    </header>

    <!-- Main content: left + right columns -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left column: description + flag submit -->
      <aside
        data-description-panel
        class="description-column flex flex-col border-r border-[var(--ch-border)] relative overflow-hidden"
        :class="{ collapsed: descriptionCollapsed }"
      >
        <button
          data-description-toggle
          class="absolute top-2 right-2 z-1 bg-[var(--ch-bg-soft)] border border-[var(--ch-border)] rounded px-[6px] py-[2px] cursor-pointer text-[0.75em] color-[var(--ch-text-2)] hover:border-[var(--ch-accent)]"
          :title="descriptionCollapsed ? 'Expand description' : 'Collapse description'"
          @click="toggleDescription"
        >
          {{ descriptionCollapsed ? '▶' : '◀' }}
        </button>

        <div v-show="!descriptionCollapsed" class="vp-doc description-content flex-1 overflow-y-auto p-4 pr-10">
          <Content />
        </div>

        <div v-show="!descriptionCollapsed" class="flex-shrink-0 p-3 border-t border-[var(--ch-border)] bg-[var(--ch-bg)]">
          <FlagSubmit :verify="verify" />
        </div>
      </aside>

      <!-- Right column: interaction panels -->
      <main class="vp-raw flex flex-col flex-1 overflow-hidden bg-[var(--ch-bg-panel)]">
        <nav class="flex gap-1 px-3 py-2 border-b border-[var(--ch-border)] flex-shrink-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :data-tab="tab.id"
            :class="['ch-tab-btn', { 'ch-tab-btn-active': activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div v-show="activeTab === 'browser'" data-panel="browser" class="flex-1 overflow-auto p-3">
          <BrowserPanel :slug="slug" :dispatch="dispatch" />
        </div>
        <div v-show="activeTab === 'terminal'" data-panel="terminal" class="flex-1 overflow-auto p-3">
          <TerminalPanel :slug="slug" :dispatch="dispatch" />
        </div>
        <div v-show="activeTab === 'repeater'" data-panel="repeater" class="flex-1 overflow-auto p-3">
          <RepeatPanel :slug="slug" :dispatch="dispatch" />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Minimal scoped block: only transition rules not expressible as UnoCSS utilities */
.description-column {
  width: 40%;
  min-width: 40%;
  transition: width 0.25s ease, min-width 0.25s ease;
}
.description-column.collapsed {
  width: 36px;
  min-width: 36px;
}
</style>
