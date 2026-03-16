<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, type Ref } from 'vue'
import { useChallengePersistence } from '../composables/useChallengePersistence'
import type { PyodidePublicAPI } from '../composables/useWxlsh'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
  /** Pyodide instance passed down from ChallengeLayout. */
  pyodide?: Ref<PyodidePublicAPI | null>
}>()

// ─── Persistence ──────────────────────────────────────────────────────────────

const { saveScript, listScripts, loadScript } = useChallengePersistence()

// ─── Editor state ─────────────────────────────────────────────────────────────

const editorContainerRef = ref<HTMLDivElement | null>(null)
const outputRef = ref<HTMLPreElement | null>(null)

// shallowRef to avoid deep reactivity on CM EditorView
const editorView = shallowRef<import('@codemirror/view').EditorView | null>(null)

const outputText = ref('')
const isRunning = ref(false)

// ─── Script list for Load dropdown ────────────────────────────────────────────

interface ScriptMeta { id: string; name: string }
const scriptList = ref<ScriptMeta[]>([])
const selectedScriptId = ref('')

async function refreshScriptList() {
  const all = await listScripts()
  scriptList.value = all.map(s => ({ id: s.id, name: s.name }))
}

// ─── CodeMirror lazy init ─────────────────────────────────────────────────────

async function initEditor() {
  if (!editorContainerRef.value || editorView.value) return

  // CodeMirror needs a visible container. Skip if the panel is hidden (v-show).
  const { clientWidth, clientHeight } = editorContainerRef.value
  if (clientWidth === 0 && clientHeight === 0) return

  const [
    { EditorView, keymap, lineNumbers, highlightActiveLine },
    { defaultKeymap, historyKeymap, history },
    { python },
    { autocompletion, closeBrackets },
    { syntaxHighlighting, defaultHighlightStyle },
    { indentOnInput },
  ] = await Promise.all([
    import('@codemirror/view'),
    import('@codemirror/commands'),
    import('@codemirror/lang-python'),
    import('@codemirror/autocomplete'),
    import('@codemirror/language'),
    import('@codemirror/language'),
  ])

  const startDoc = '# wxlsh Code Editor\n# Run Python to interact with the challenge\n\nprint("Hello, wxlsh!")\n'

  const view = new EditorView({
    doc: startDoc,
    extensions: [
      history(),
      python(),
      lineNumbers(),
      highlightActiveLine(),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle),
      autocompletion(),
      closeBrackets(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        // Ctrl+Enter or Cmd+Enter → run
        {
          key: 'Ctrl-Enter',
          mac: 'Cmd-Enter',
          run: () => { runCode(); return true },
        },
      ]),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '13px',
          fontFamily: '"Cascadia Code","JetBrains Mono","Fira Code","Menlo",monospace',
          backgroundColor: 'var(--ch-bg-soft)',
          color: 'var(--ch-text-1)',
        },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { caretColor: 'var(--ch-accent)' },
        '.cm-cursor': { borderLeftColor: 'var(--ch-accent)' },
        '.cm-activeLine': { backgroundColor: 'var(--ch-bg-alt, rgba(0,0,0,0.06))' },
        '.cm-gutters': {
          backgroundColor: 'var(--ch-bg-soft)',
          borderRight: '1px solid var(--ch-border)',
          color: 'var(--ch-text-2)',
        },
      }),
    ],
    parent: editorContainerRef.value,
  })

  editorView.value = view
}

// ─── Resizable split ──────────────────────────────────────────────────────────

/** Height of the editor pane as a percentage (0–100). */
const editorHeightPct = ref(65)
const MIN_EDITOR_PX = 120
const MIN_OUTPUT_PX = 80
let isDragging = false
let dragStartY = 0
let dragStartPct = 0
let splitContainerEl: HTMLElement | null = null

function onDragStart(e: MouseEvent | TouchEvent) {
  isDragging = true
  dragStartY = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragStartPct = editorHeightPct.value
  splitContainerEl = (e.currentTarget as HTMLElement).closest('[data-split]') as HTMLElement
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('touchmove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchend', onDragEnd)
  e.preventDefault()
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging || !splitContainerEl) return
  const y = 'touches' in e ? e.touches[0].clientY : e.clientY
  const totalH = splitContainerEl.clientHeight
  if (totalH === 0) return
  const delta = y - dragStartY
  const deltaPct = (delta / totalH) * 100
  const newPct = Math.max(
    (MIN_EDITOR_PX / totalH) * 100,
    Math.min((1 - MIN_OUTPUT_PX / totalH) * 100, dragStartPct + deltaPct),
  )
  editorHeightPct.value = newPct
}

function onDragEnd() {
  isDragging = false
  splitContainerEl = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchend', onDragEnd)
}

// ─── Code execution ───────────────────────────────────────────────────────────

/** Python requests stub that routes through dispatch(). */
function buildRequestsStub(): string {
  return `
import json as _json

class _RequestsStub:
    class _Response:
        def __init__(self, status, headers, text):
            self.status_code = status
            self.headers = dict(headers)
            self.text = text
            self.content = text.encode()
        def json(self):
            return _json.loads(self.text)
        def __repr__(self):
            return f'<Response [{self.status_code}]>'

    def _dispatch(self, method, url, **kwargs):
        from js import _wxlsh_code_dispatch
        headers = list((kwargs.get('headers') or {}).items())
        body = kwargs.get('data') or kwargs.get('json', '')
        if isinstance(body, dict):
            body = _json.dumps(body)
        r = _wxlsh_code_dispatch.call(method, url, headers, body or '')
        return self._Response(r['status'], r['headers'], r['body'])

    def get(self, url, **kw): return self._dispatch('GET', url, **kw)
    def post(self, url, **kw): return self._dispatch('POST', url, **kw)
    def put(self, url, **kw): return self._dispatch('PUT', url, **kw)
    def delete(self, url, **kw): return self._dispatch('DELETE', url, **kw)
    def patch(self, url, **kw): return self._dispatch('PATCH', url, **kw)
    def head(self, url, **kw): return self._dispatch('HEAD', url, **kw)
    def request(self, method, url, **kw): return self._dispatch(method.upper(), url, **kw)

requests = _RequestsStub()
`
}

async function runCode() {
  const py = props.pyodide?.value
  if (!py || !editorView.value) return

  const code = editorView.value.state.doc.toString()
  isRunning.value = true
  outputText.value = ''

  try {
    // Inject dispatch bridge
    const dispatchBridge = {
      call: async (method: string, url: string, headers: [string, string][], body: string) => {
        const req = new Request(url, {
          method,
          headers: Object.fromEntries(headers),
          body: body || undefined,
        })
        const res = await props.dispatch(req)
        const resHeaders = [...res.headers.entries()]
        const text = await res.text()
        return { status: res.status, headers: resHeaders, body: text }
      },
    }
    py.globals.set('_wxlsh_code_dispatch', dispatchBridge)

    // Capture stdout
    await py.runPythonAsync(`
import sys, io as _io
_wxlsh_stdout = _io.StringIO()
sys.stdout = _wxlsh_stdout
`)

    // Inject requests stub
    await py.runPythonAsync(buildRequestsStub())

    // Run user code
    await py.runPythonAsync(code)

    // Collect output
    const captured = await py.runPythonAsync('_wxlsh_stdout.getvalue()') as string
    outputText.value = captured || '(no output)'
  } catch (err) {
    outputText.value = `Error:\n${err instanceof Error ? err.message : String(err)}`
  } finally {
    // Restore stdout
    try {
      await props.pyodide?.value?.runPythonAsync('import sys; sys.stdout = sys.__stdout__')
    } catch { /* ignore */ }
    isRunning.value = false
    // Scroll output to bottom
    if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight
  }
}

// ─── Save / Load ──────────────────────────────────────────────────────────────

async function handleSave() {
  const name = window.prompt('Script name:')?.trim()
  if (!name) return
  const content = editorView.value?.state.doc.toString() ?? ''
  await saveScript(name, content)
  await refreshScriptList()
}

async function handleLoad() {
  if (!selectedScriptId.value) return
  const content = await loadScript(selectedScriptId.value)
  if (content === null || !editorView.value) return
  const { EditorSelection } = await import('@codemirror/state')
  editorView.value.dispatch({
    changes: { from: 0, to: editorView.value.state.doc.length, insert: content },
    selection: EditorSelection.cursor(0),
  })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await initEditor()
  await refreshScriptList()
})

onUnmounted(() => {
  editorView.value?.destroy()
  onDragEnd()
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-[var(--ch-bg-soft)]">

    <!-- Toolbar -->
    <div class="flex items-center gap-2 flex-shrink-0 px-3 py-1.5 border-b border-[var(--ch-border)] bg-[var(--ch-bg)]">
      <!-- Run button -->
      <button
        data-run
        class="px-3 py-1 rounded text-[0.8em] font-medium border-none"
        :class="[
          props.disabled || isRunning || !props.pyodide?.value
            ? 'opacity-40 cursor-not-allowed bg-[var(--ch-bg-soft)] color-[var(--ch-text-2)]'
            : 'bg-[var(--ch-accent)] color-white cursor-pointer hover:opacity-90',
        ]"
        :disabled="props.disabled || isRunning || !props.pyodide?.value"
        @click="runCode"
        title="Run (Ctrl+Enter)"
      >
        {{ isRunning ? 'Running…' : '▶ Run' }}
      </button>

      <span class="text-[0.75em] color-[var(--ch-text-2)] select-none">Ctrl+Enter</span>

      <div class="flex-1" />

      <!-- Save -->
      <button
        data-save
        class="px-2 py-1 rounded text-[0.8em] border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] cursor-pointer hover:border-[var(--ch-accent)]"
        :disabled="props.disabled"
        @click="handleSave"
      >
        Save
      </button>

      <!-- Load dropdown -->
      <select
        data-load-select
        v-model="selectedScriptId"
        class="px-2 py-1 rounded text-[0.8em] border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)]"
        :disabled="props.disabled || scriptList.length === 0"
        @change="handleLoad"
        title="Load a saved script"
      >
        <option value="">Load script…</option>
        <option v-for="s in scriptList" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <!-- Disabled overlay -->
    <div
      v-if="props.disabled"
      class="absolute inset-0 z-10 flex items-center justify-center bg-[var(--ch-bg-soft)] bg-opacity-80 color-[var(--ch-text-2)] text-sm"
    >
      Loading runtime…
    </div>

    <!-- Resizable split: editor + output -->
    <div class="flex flex-col flex-1 overflow-hidden relative" data-split>

      <!-- Editor pane -->
      <div
        class="overflow-hidden flex-shrink-0"
        :style="{ height: editorHeightPct + '%' }"
      >
        <div ref="editorContainerRef" class="h-full w-full" data-editor />
      </div>

      <!-- Drag handle -->
      <div
        class="flex-shrink-0 h-1.5 cursor-row-resize bg-[var(--ch-border)] hover:bg-[var(--ch-accent)] transition-colors select-none"
        data-drag-handle
        @mousedown="onDragStart"
        @touchstart.passive="onDragStart"
        title="Drag to resize"
      />

      <!-- Output pane -->
      <div class="flex flex-col flex-1 overflow-hidden min-h-0">
        <div class="flex items-center px-3 py-1 text-[0.75em] color-[var(--ch-text-2)] border-b border-[var(--ch-border)] flex-shrink-0 select-none">
          Output
        </div>
        <pre
          ref="outputRef"
          data-output
          class="flex-1 m-0 p-3 overflow-auto text-[0.8em] font-mono color-[var(--ch-text-1)] bg-[var(--ch-bg)] whitespace-pre-wrap"
        >{{ outputText }}</pre>
      </div>
    </div>

  </div>
</template>
