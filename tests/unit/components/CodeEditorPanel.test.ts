import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// ─── Mock CodeMirror ──────────────────────────────────────────────────────────

const mockEditorState = {
  doc: { toString: vi.fn(() => 'print("hello")'), length: 16 },
}
let mockEditorViewInstance: {
  state: typeof mockEditorState
  dispatch: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
}

let editorViewConstructed = false

vi.mock('@codemirror/view', () => {
  class MockEditorView {
    state = mockEditorState
    dispatch = vi.fn()
    destroy = vi.fn()
    static theme = vi.fn(() => ({}))
    constructor(_opts: unknown) {
      editorViewConstructed = true
      mockEditorViewInstance = this as unknown as typeof mockEditorViewInstance
    }
  }
  return {
    EditorView: MockEditorView,
    keymap: { of: vi.fn(() => ({})) },
    lineNumbers: vi.fn(() => ({})),
    highlightActiveLine: vi.fn(() => ({})),
  }
})

vi.mock('@codemirror/commands', () => ({
  defaultKeymap: [],
  historyKeymap: [],
  history: vi.fn(() => ({})),
}))

vi.mock('@codemirror/lang-python', () => ({
  python: vi.fn(() => ({})),
}))

vi.mock('@codemirror/autocomplete', () => ({
  autocompletion: vi.fn(() => ({})),
  closeBrackets: vi.fn(() => ({})),
}))

vi.mock('@codemirror/language', () => ({
  syntaxHighlighting: vi.fn(() => ({})),
  defaultHighlightStyle: {},
  indentOnInput: vi.fn(() => ({})),
}))

vi.mock('@codemirror/state', () => ({
  EditorSelection: { cursor: vi.fn((n: number) => n) },
}))

// ─── Mock useChallengePersistence ─────────────────────────────────────────────

const mockSaveScript = vi.fn(async (_n: string, _c: string) => 'mock-id')
const mockListScripts = vi.fn(async () => [
  { id: 'id1', name: 'my script', content: 'print(1)', createdAt: 1, updatedAt: 1 },
])
const mockLoadScript = vi.fn(async (_id: string) => 'loaded-content')

vi.mock('../../../.vitepress/theme/composables/useChallengePersistence', () => ({
  useChallengePersistence: vi.fn(() => ({
    saveScript: mockSaveScript,
    listScripts: mockListScripts,
    loadScript: mockLoadScript,
    deleteScript: vi.fn(),
    appendHistory: vi.fn(),
    loadHistory: vi.fn(async () => []),
  })),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockDispatch = vi.fn(async (_req: Request) => new Response('ok', { status: 200 }))

async function mountPanel(pyodide: ReturnType<typeof vi.fn> | null = null, disabled = false) {
  const pyRef = ref<{ runPythonAsync: ReturnType<typeof vi.fn>; globals: { set: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> } } | null>(pyodide)
  const wrapper = mount(
    (await import('../../../.vitepress/theme/components/CodeEditorPanel.vue')).default,
    {
      props: {
        slug: 'test',
        dispatch: mockDispatch,
        disabled,
        pyodide: pyRef,
      },
      attachTo: document.body,
    },
  )
  await flushPromises()
  return wrapper
}

function makePyodide() {
  return vi.fn().mockReturnValue({
    runPythonAsync: vi.fn(async (_code: string) => ''),
    globals: {
      set: vi.fn(),
      get: vi.fn(),
    },
  })()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  editorViewConstructed = false
  // jsdom has no layout engine; stub dimensions so initEditor's guard passes.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true, get: () => 800,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true, get: () => 600,
  })
})

afterEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true, get: () => 0,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true, get: () => 0,
  })
})

describe('CodeEditorPanel', () => {
  it('renders Run button', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('[data-run]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders Save button', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('[data-save]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders Load select', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('[data-load-select]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('initialises CodeMirror editor in onMounted', async () => {
    await mountPanel()
    expect(editorViewConstructed).toBe(true)
  })

  it('shows disabled overlay when disabled=true', async () => {
    const wrapper = await mountPanel(null, true)
    expect(wrapper.text()).toMatch(/loading runtime/i)
    wrapper.unmount()
  })

  it('Run button is disabled when no pyodide', async () => {
    const wrapper = await mountPanel(null, false)
    const btn = wrapper.find('[data-run]')
    expect(btn.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('calls runPythonAsync when Run is clicked', async () => {
    const py = makePyodide()
    const wrapper = await mountPanel(py)
    await wrapper.find('[data-run]').trigger('click')
    await flushPromises()
    expect(py.runPythonAsync).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('calls saveScript with name from prompt', async () => {
    vi.stubGlobal('prompt', vi.fn(() => 'my test script'))
    const wrapper = await mountPanel()
    await wrapper.find('[data-save]').trigger('click')
    await flushPromises()
    expect(mockSaveScript).toHaveBeenCalledWith('my test script', expect.any(String))
    vi.unstubAllGlobals()
    wrapper.unmount()
  })

  it('populates Load dropdown from listScripts', async () => {
    const wrapper = await mountPanel()
    await flushPromises()
    const options = wrapper.findAll('[data-load-select] option')
    // First is placeholder; second is from listScripts
    expect(options.length).toBeGreaterThan(1)
    expect(options[1].text()).toContain('my script')
    wrapper.unmount()
  })

  it('destroys editor on unmount', async () => {
    const wrapper = await mountPanel()
    wrapper.unmount()
    expect(mockEditorViewInstance.destroy).toHaveBeenCalled()
  })

  it('renders output area', async () => {
    const wrapper = await mountPanel()
    expect(wrapper.find('[data-output]').exists()).toBe(true)
    wrapper.unmount()
  })
})
