<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import { Content } from 'vitepress/client'
import BrowserPanel from '../components/BrowserPanel.vue'
import WxlshPanel from '../components/WxlshPanel.vue'
import RepeatPanel from '../components/RepeatPanel.vue'
import CodeEditorPanel from '../components/CodeEditorPanel.vue'
import FlagSubmit from '../components/FlagSubmit.vue'
import { useFlagVerifier } from '../../challenge/flag-verifier'
import { PythonRuntime, type LoadPyodideFn } from '../composables/usePythonRuntime'
import { PhpRuntime } from '../composables/usePhpRuntime'

const { frontmatter, page } = useData()

// Derive slug from relativePath: "challenge/sqli-demo.md" → "sqli-demo"
const slug = computed(() => {
  const rel: string = page.value.relativePath ?? ''
  return rel.replace(/^.*\//, '').replace(/\.md$/, '')
})

const fm = computed(() => frontmatter.value)

// ─── Runtime state ───────────────────────────────────────────────────────────
const runtimeReady = ref(false)
const runtimeError = ref<string | null>(null)

// Pyodide instance — set after Python runtime init; passed to WxlshPanel + CodeEditorPanel
type PyodidePublicAPI = { runPythonAsync(code: string): Promise<unknown>; globals: { get(k: string): unknown; set(k: string, v: unknown): void } }
const pyodideInstance = ref<PyodidePublicAPI | null>(null)

// ─── SW readiness gate ───────────────────────────────────────────────────────
// swReady is true only when navigator.serviceWorker.controller is non-null.
// Without this, tools appear enabled before SW can intercept requests.
const swReady = ref(
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    ? navigator.serviceWorker.controller != null
    : false,
)

const toolsDisabled = computed(() => !runtimeReady.value || !swReady.value)

let runtime: PythonRuntime | PhpRuntime | null = null
let challengePort: MessagePort | null = null  // port1 — page listens here

// ─── Collapsible description panel ───────────────────────────────────────────
const descriptionCollapsed = ref(false)
function toggleDescription() {
  descriptionCollapsed.value = !descriptionCollapsed.value
}

// ─── Tab switching ────────────────────────────────────────────────────────────
type Tab = 'browser' | 'terminal' | 'repeater' | 'code'
const activeTab = ref<Tab>('browser')
const tabs: { id: Tab; label: string }[] = [
  { id: 'browser', label: 'Browser' },
  // { id: 'terminal', label: 'Terminal' },
  { id: 'repeater', label: 'Repeater' },
  // { id: 'code', label: 'Code' },
]

// ─── Challenge dispatch: directly call runtime (bypasses SW round-trip) ──────
async function dispatch(request: Request): Promise<Response> {
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'runtime not ready' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return (runtime as PythonRuntime | PhpRuntime).handleRequest(request)
}

// ─── Flag verification ────────────────────────────────────────────────────────
const { verify: verifyFlag } = useFlagVerifier(slug.value)
async function verify(submitted: string): Promise<boolean> {
  return verifyFlag(submitted, fm.value.flag_verifier ?? fm.value.flagVerifier ?? '')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

/** Map backend type to its required base micropip packages */
const BASE_PACKAGES: Record<string, string[]> = {
  flask:   ['flask', 'sqlite3'],
  fastapi: ['fastapi', 'anyio', 'sqlite3'],
}

// ─── Runtime initialization ───────────────────────────────────────────────────

async function initRuntime(): Promise<void> {
  const backend: string = fm.value.backend ?? 'flask'
  const encryptedFs: Record<string, string> | undefined = fm.value.encryptedFs
  const fsKeyParts: string[] | undefined = fm.value.fsKeyParts
  const extraPackages: string[] = fm.value.packages ?? []

  // Guard: skip if frontmatter doesn't have processed FS data (e.g., placeholder)
  if (!encryptedFs || !fsKeyParts || Object.keys(encryptedFs).length === 0) {
    runtimeError.value = 'Challenge FS data not available (run pnpm challenge:keygen first)'
    return
  }

  // 1. Load virtual-fs WASM module
  const { default: initWasm, wasm_fs_reset, wasm_fs_read } = await import(
    '../../wasm/virtual-fs/virtual_fs.js'
  )
  await initWasm()

  // 2. Reconstruct key from 3 obfuscated fragments
  const hexKey = fsKeyParts.join('')
  const keyBytes = hexToBytes(hexKey)

  // 3. Reset FS store and populate with this challenge's encrypted blobs.
  //    wasm_fs_reset (unlike wasm_fs_init) always clears existing data first,
  //    ensuring cross-challenge navigation doesn't leave stale blobs in the store.
  const paths = Object.keys(encryptedFs)
  const blobs = paths.map((p) => encryptedFs[p])
  wasm_fs_reset(paths, blobs)

  // 4. Decrypt all FS entries; separate __app__ from the rest
  const fsEntries: Record<string, Uint8Array> = {}
  let appCode = ''

  for (const path of paths) {
    const decrypted: Uint8Array = wasm_fs_read(keyBytes, path)
    if (path === '__app__') {
      appCode = new TextDecoder().decode(decrypted)
    } else {
      fsEntries[path] = decrypted
    }
  }

  if (!appCode) {
    runtimeError.value = 'App code not found in encrypted FS'
    return
  }

  // 5. Determine packages: backend defaults + extra from frontmatter
  const packages = [...(BASE_PACKAGES[backend] ?? []), ...extraPackages]

  // 6. Initialize the appropriate runtime (only once — idempotency via initPromise)
  if (backend === 'flask' || backend === 'fastapi') {
    await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js')
    const loadPyodide = (globalThis as any).loadPyodide as LoadPyodideFn
    if (typeof loadPyodide !== 'function') {
      throw new Error('loadPyodide not available after loading pyodide.js')
    }
    runtime = new PythonRuntime(loadPyodide)
    await (runtime as PythonRuntime).initialize(appCode, fsEntries, packages)
  } else if (backend === 'php') {
    runtime = new PhpRuntime(async () => {
      const { PhpWeb } = await import('php-wasm/PhpWeb.mjs')
      const php = new PhpWeb()
      const phpBinary = await (php as any).binary

      return {
        async run(code: string) {
          let output = ''
          const handler = (e: Event) => {
            output += (e as CustomEvent).detail[0]
          }
          php.addEventListener('output', handler)
          const exitCode = await (php as any).run(code) as number
          php.removeEventListener('output', handler)
          return { output, headers: [] as string[], exitCode }
        },
        writeFile(path: string, data: Uint8Array) {
          phpBinary.FS.writeFile(path, data)
        },
      }
    })
    await (runtime as PhpRuntime).initialize(appCode, fsEntries)
  }

  runtimeReady.value = true

  // Expose Pyodide instance for wxlsh and code editor panels
  if (runtime instanceof PythonRuntime) {
    pyodideInstance.value = runtime.getPyodide() as PyodidePublicAPI | null
  }
}

// ─── HANDLE_REQUEST listener ──────────────────────────────────────────────────

async function handleRequest(event: MessageEvent): Promise<void> {
  if (event.data?.type !== 'HANDLE_REQUEST') return
  const { method, url, headers, body, responsePort } = event.data

  try {
    const request = new Request(url, {
      method,
      headers: new Headers(headers ?? []),
      body: (method !== 'GET' && method !== 'HEAD' && body) ? body : undefined,
    })

    const response = await (runtime as PythonRuntime | PhpRuntime).handleRequest(request)
    const resBodyBuffer = await response.arrayBuffer()
    const resHeaders = [...response.headers.entries()]

    responsePort.postMessage(
      { status: response.status, headers: resHeaders, body: resBodyBuffer },
      [resBodyBuffer],
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    responsePort.postMessage({ status: 500, headers: [], body: new TextEncoder().encode(JSON.stringify({ error: message })).buffer })
  }
}

// ─── Register challenge and set up MessageChannel ─────────────────────────────

function registerWithSW(mc: MessageChannel): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready.then((reg) => {
    reg.active?.postMessage(
      { type: 'REGISTER_CHALLENGE', slug: slug.value, backend: fm.value.backend ?? 'flask', port: mc.port2 },
      [mc.port2],
    )
  })
}

onMounted(async () => {
  // Set up MessageChannel — port1 stays in page, port2 goes to SW
  const mc = new MessageChannel()
  challengePort = mc.port1
  challengePort.addEventListener('message', handleRequest)
  challengePort.start()

  // Register with SW (transfers port2)
  registerWithSW(mc)

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Re-register on SW update with a fresh MessageChannel
      const mc2 = new MessageChannel()
      challengePort?.removeEventListener('message', handleRequest)
      challengePort?.close()
      challengePort = mc2.port1
      challengePort.addEventListener('message', handleRequest)
      challengePort.start()
      registerWithSW(mc2)
      // SW now controls the page — unlock the readiness gate
      swReady.value = true
    })
  }

  // Initialize runtime (lazy, idempotent)
  try {
    await initRuntime()
  } catch (err) {
    runtimeError.value = err instanceof Error ? err.message : String(err)
  }
})

onUnmounted(() => {
  challengePort?.removeEventListener('message', handleRequest)
  challengePort?.close()
  challengePort = null
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.active?.postMessage({ type: 'UNREGISTER_CHALLENGE', slug: slug.value })
    })
  }
})

// ─── Static badge class maps (full class names for UnoCSS extraction) ─────────
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
        <!-- Runtime status indicator -->
        <span v-if="!runtimeReady && !runtimeError" class="ch-badge text-[0.75em] opacity-60">Loading...</span>
        <span v-if="runtimeError" class="ch-badge ch-badge-hard text-[0.75em]" :title="runtimeError">Runtime Error</span>
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
          <BrowserPanel :slug="slug" :dispatch="dispatch" :disabled="toolsDisabled" />
        </div>
        <!-- <div v-show="activeTab === 'terminal'" data-panel="terminal" class="flex-1 overflow-hidden">
          <WxlshPanel :slug="slug" :dispatch="dispatch" :disabled="toolsDisabled" :pyodide="pyodideInstance" />
        </div> -->
        <div v-show="activeTab === 'repeater'" data-panel="repeater" class="flex-1 overflow-hidden">
          <RepeatPanel :slug="slug" :dispatch="dispatch" :disabled="toolsDisabled" />
        </div>
        <!-- <div v-show="activeTab === 'code'" data-panel="code" class="flex-1 overflow-hidden">
          <CodeEditorPanel :slug="slug" :dispatch="dispatch" :disabled="toolsDisabled" :pyodide="pyodideInstance" />
        </div> -->
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
