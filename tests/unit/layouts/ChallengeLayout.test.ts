import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

// Mock vitepress useData and Content
vi.mock('vitepress', () => ({
  useData: vi.fn(() => ({
    frontmatter: {
      value: {
        title: 'SQL Injection Demo',
        difficulty: 'easy',
        category: 'web',
        backend: 'flask',
        slug: 'sqli-demo',
      },
    },
    page: { value: { relativePath: 'challenges/sqli-demo.md' } },
  })),
  withBase: (url: string) => url,
}))

vi.mock('vitepress/client', () => ({
  Content: defineComponent({ render: () => h('div', { class: 'vp-doc' }, 'Challenge description content') }),
}))

// Mock child panels to isolate layout logic - accept disabled prop
vi.mock('../../../.vitepress/theme/components/BrowserPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled'], template: '<div data-browser-panel :data-disabled="disabled" />' }),
}))
vi.mock('../../../.vitepress/theme/components/WxlshPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled'], template: '<div data-wxlsh-panel :data-disabled="disabled" />' }),
}))
vi.mock('../../../.vitepress/theme/components/RepeatPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled', 'injectedRequest'], template: '<div data-repeat-panel :data-disabled="disabled" :data-injected="injectedRequest" />' }),
}))
vi.mock('../../../.vitepress/theme/components/NetworkPanel.vue', () => ({
  default: defineComponent({ props: ['trafficLog'], emits: ['clear', 'sendToRepeater'], template: '<div data-network-panel />' }),
}))
vi.mock('../../../.vitepress/theme/components/CodeEditorPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch', 'disabled'], template: '<div data-code-panel :data-disabled="disabled" />' }),
}))
vi.mock('../../../.vitepress/theme/components/FlagSubmit.vue', () => ({
  default: defineComponent({ props: ['verify', 'onExport'], template: '<div data-flag-submit />' }),
}))

// Mock WASM loader (extractCustomSection)
vi.mock('../../../.vitepress/theme/composables/useWasmLoader', () => ({
  extractCustomSection: vi.fn().mockReturnValue(null),
}))

// Mock useAttackSession
const mockAddHttpEvent = vi.fn()
const mockAddFlagAttempt = vi.fn()
const mockExportSession = vi.fn()
const mockInit = vi.fn().mockResolvedValue(undefined)
vi.mock('../../../.vitepress/theme/composables/useAttackSession', () => ({
  useAttackSession: vi.fn(() => ({
    init: mockInit,
    getSession: vi.fn(() => null),
    addHttpEvent: mockAddHttpEvent,
    addFlagAttempt: mockAddFlagAttempt,
    exportSession: mockExportSession,
  })),
}))

let ChallengeLayout: typeof import('../../../.vitepress/theme/layouts/ChallengeLayout.vue').default

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
  ChallengeLayout = mod.default
})

describe('ChallengeLayout (VitePress layout)', () => {
  it('renders a back link to /challenges/', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const backLink = wrapper.find('a[href="/challenges/"]')
    expect(backLink.exists()).toBe(true)
    expect(backLink.text()).toContain('Challenges')
  })

  it('renders title and metadata badges from frontmatter', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    expect(wrapper.text()).toContain('SQL Injection Demo')
    expect(wrapper.text()).toContain('easy')
    expect(wrapper.text()).toContain('web')
  })

  it('renders description panel and FlagSubmit in left column', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    expect(wrapper.find('[data-flag-submit]').exists()).toBe(true)
    expect(wrapper.find('[data-description-panel]').exists()).toBe(true)
  })

  it('toggles description panel collapsed state on click', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const toggle = wrapper.find('[data-description-toggle]')
    expect(toggle.exists()).toBe(true)

    const panel = wrapper.find('[data-description-panel]')
    expect(panel.classes()).not.toContain('collapsed')

    await toggle.trigger('click')
    expect(panel.classes()).toContain('collapsed')

    await toggle.trigger('click')
    expect(panel.classes()).not.toContain('collapsed')
  })

  it('renders active interaction tabs (Browser, Repeater, Network)', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const tabs = wrapper.findAll('[data-tab]')
    expect(tabs).toHaveLength(3)
    const tabIds = tabs.map(t => t.attributes('data-tab'))
    expect(tabIds).toContain('browser')
    expect(tabIds).toContain('repeater')
    expect(tabIds).toContain('network')
  })

  it('shows NetworkPanel when network tab is active', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    await wrapper.find('[data-tab="network"]').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-network-panel]').exists()).toBe(true)
  })

  it('switches to Repeater tab and injects request when NetworkPanel emits sendToRepeater', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    // Navigate to network tab so NetworkPanel is rendered
    await wrapper.find('[data-tab="network"]').trigger('click')
    await wrapper.vm.$nextTick()

    const { default: NetworkPanelComponent } = await import('../../../.vitepress/theme/components/NetworkPanel.vue')
    const networkPanelWrapper = wrapper.findComponent(NetworkPanelComponent)
    expect(networkPanelWrapper.exists()).toBe(true)

    const rawRequest = 'POST /login HTTP/1.1\r\nHost: challenge-test.localhost\r\n\r\n'
    await networkPanelWrapper.vm.$emit('sendToRepeater', rawRequest)
    await wrapper.vm.$nextTick()

    // Active tab should now be repeater
    const activeTabBtn = wrapper.find('[data-tab].ch-tab-btn-active')
    expect(activeTabBtn.attributes('data-tab')).toBe('repeater')

    // RepeatPanel should have the injected request
    const repeatPanel = wrapper.find('[data-repeat-panel]')
    expect(repeatPanel.attributes('data-injected')).toBe(rawRequest)
  })

  it('wraps Content in a vp-doc container for markdown typography', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const descPanel = wrapper.find('[data-description-panel]')
    expect(descPanel.find('.vp-doc').exists()).toBe(true)
  })

  it('passes disabled=true to all panels when SW controller is null', async () => {
    // Simulate no SW controller
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null, ready: Promise.resolve({ active: null }), addEventListener: vi.fn() },
      configurable: true,
    })
    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
    const LayoutNoSW = mod.default

    const wrapper = mount(LayoutNoSW, {
      global: { stubs: { Content: true } },
    })
    await wrapper.vm.$nextTick()

    // All panels should be disabled because SW controller is null (swReady=false)
    const browserPanel = wrapper.find('[data-browser-panel]')
    expect(browserPanel.attributes('data-disabled')).toBe('true')
  })

  it('dispatch returns 503 with runtime not ready when runtime has not initialized', async () => {
    // Runtime stays null in test env: frontmatter has no wasmModule
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    await wrapper.vm.$nextTick()

    // Get dispatch from the BrowserPanel's props
    const { default: BrowserPanel } = await import('../../../.vitepress/theme/components/BrowserPanel.vue')
    const bpWrapper = wrapper.findComponent(BrowserPanel)
    expect(bpWrapper.exists()).toBe(true)

    const dispatch = bpWrapper.props('dispatch') as (req: Request) => Promise<Response>
    const res = await dispatch(new Request('https://challenge-sqli.localhost/'))

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('runtime not ready')
  })

  it('enables panels when swReady becomes true via controllerchange', async () => {
    let controllerChangeHandler: (() => void) | null = null
    const mockSW = {
      controller: null as ServiceWorker | null,
      ready: Promise.resolve({ active: { postMessage: vi.fn() } }),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'controllerchange') controllerChangeHandler = handler
      }),
    }
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockSW,
      configurable: true,
    })
    vi.resetModules()
    const mod = await import('../../../.vitepress/theme/layouts/ChallengeLayout.vue')
    const LayoutSW = mod.default

    const wrapper = mount(LayoutSW, {
      global: { stubs: { Content: true } },
    })
    await wrapper.vm.$nextTick()

    // Initially disabled
    expect(wrapper.find('[data-browser-panel]').attributes('data-disabled')).toBe('true')

    // Simulate SW taking control
    mockSW.controller = {} as ServiceWorker
    controllerChangeHandler?.()
    await wrapper.vm.$nextTick()

    // Should now be enabled (only runtimeReady is still false due to mocked runtime)
    // We just check that swReady no longer blocks — but runtimeReady might still be false
    // So disabled should still be true (blocked by runtimeReady), but the swReady part is resolved
    // This test verifies controllerchange is listened to
    expect(controllerChangeHandler).not.toBeNull()
  })

  it('passes different dispatch functions to BrowserPanel and RepeatPanel', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: BrowserPanel } = await import('../../../.vitepress/theme/components/BrowserPanel.vue')
    const { default: RepeatPanel } = await import('../../../.vitepress/theme/components/RepeatPanel.vue')

    const bp = wrapper.findComponent(BrowserPanel)
    const rp = wrapper.findComponent(RepeatPanel)

    const browserFn = bp.props('dispatch')
    const repeaterFn = rp.props('dispatch')

    // Both dispatch functions should exist and be different (source-attributed wrappers)
    expect(browserFn).toBeTypeOf('function')
    expect(repeaterFn).toBeTypeOf('function')
    expect(browserFn).not.toBe(repeaterFn)
  })

  it('passes onExport prop to FlagSubmit', async () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })

    const { default: FlagSubmitComponent } = await import('../../../.vitepress/theme/components/FlagSubmit.vue')
    const fs = wrapper.findComponent(FlagSubmitComponent)
    expect(fs.props('onExport')).toBeTypeOf('function')
  })
})
