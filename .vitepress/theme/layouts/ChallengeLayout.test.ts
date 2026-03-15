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
        flag_verifier: 'abc123',
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

// Mock child panels to isolate layout logic
vi.mock('../components/BrowserPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch'], template: '<div data-browser-panel />' }),
}))
vi.mock('../components/TerminalPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch'], template: '<div data-terminal-panel />' }),
}))
vi.mock('../components/RepeatPanel.vue', () => ({
  default: defineComponent({ props: ['slug', 'dispatch'], template: '<div data-repeat-panel />' }),
}))
vi.mock('../components/FlagSubmit.vue', () => ({
  default: defineComponent({ props: ['verify'], template: '<div data-flag-submit />' }),
}))

// Mock flag verifier
vi.mock('../../challenge/flag-verifier', () => ({
  useFlagVerifier: () => ({ verify: vi.fn().mockResolvedValue(false) }),
}))

let ChallengeLayout: typeof import('./ChallengeLayout.vue').default

beforeEach(async () => {
  const mod = await import('./ChallengeLayout.vue')
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

  it('renders three interaction tabs (Browser, Terminal, Repeater)', () => {
    const wrapper = mount(ChallengeLayout, {
      global: { stubs: { Content: true } },
    })
    const tabs = wrapper.findAll('[data-tab]')
    expect(tabs).toHaveLength(3)
    const tabIds = tabs.map(t => t.attributes('data-tab'))
    expect(tabIds).toContain('browser')
    expect(tabIds).toContain('terminal')
    expect(tabIds).toContain('repeater')
  })
})
