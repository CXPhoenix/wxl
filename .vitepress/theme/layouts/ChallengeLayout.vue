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
</script>

<template>
  <div class="challenge-page">
    <!-- Top navigation bar -->
    <header class="challenge-header">
      <a href="/challenges/" class="back-link">← Challenges</a>
      <span class="challenge-title">{{ fm.title }}</span>
      <span v-if="fm.difficulty" class="badge badge-difficulty">{{ fm.difficulty }}</span>
      <span v-if="fm.category" class="badge badge-category">{{ fm.category }}</span>
    </header>

    <!-- Main content: left + right columns -->
    <div class="challenge-body">
      <!-- Left column: description + flag submit -->
      <aside
        data-description-panel
        class="description-column"
        :class="{ collapsed: descriptionCollapsed }"
      >
        <button
          data-description-toggle
          class="collapse-toggle"
          :title="descriptionCollapsed ? 'Expand description' : 'Collapse description'"
          @click="toggleDescription"
        >
          {{ descriptionCollapsed ? '▶' : '◀' }}
        </button>

        <div v-show="!descriptionCollapsed" class="description-content">
          <Content />
        </div>

        <div class="flag-submit-wrapper">
          <FlagSubmit :verify="verify" />
        </div>
      </aside>

      <!-- Right column: interaction panels -->
      <main class="interaction-column">
        <nav class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :data-tab="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div v-show="activeTab === 'browser'" data-panel="browser" class="panel">
          <BrowserPanel :slug="slug" :dispatch="dispatch" />
        </div>
        <div v-show="activeTab === 'terminal'" data-panel="terminal" class="panel">
          <TerminalPanel :slug="slug" :dispatch="dispatch" />
        </div>
        <div v-show="activeTab === 'repeater'" data-panel="repeater" class="panel">
          <RepeatPanel :slug="slug" :dispatch="dispatch" />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.challenge-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.challenge-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  flex-shrink: 0;
}

.back-link {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.9em;
  white-space: nowrap;
}
.back-link:hover { text-decoration: underline; }

.challenge-title {
  font-weight: 600;
  font-size: 1em;
}

.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 500;
}
.badge-difficulty { background: var(--vp-c-yellow-soft); color: var(--vp-c-yellow-3); }
.badge-category   { background: var(--vp-c-indigo-soft); color: var(--vp-c-indigo-3); }

.challenge-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left column */
.description-column {
  display: flex;
  flex-direction: column;
  width: 40%;
  min-width: 40%;
  border-right: 1px solid var(--vp-c-divider);
  transition: width 0.25s ease, min-width 0.25s ease;
  overflow: hidden;
  position: relative;
}
.description-column.collapsed {
  width: 36px;
  min-width: 36px;
}

.collapse-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 0.75em;
}

.description-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-right: 40px; /* avoid overlap with toggle button */
}

.flag-submit-wrapper {
  flex-shrink: 0;
  padding: 12px;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

/* Right column */
.interaction-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}

.tab-btn {
  padding: 4px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875em;
  color: var(--vp-c-text-2);
}
.tab-btn.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.panel {
  flex: 1;
  overflow: auto;
  padding: 12px;
}
</style>
