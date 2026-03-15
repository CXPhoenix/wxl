import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vitepress', () => ({
  withBase: vi.fn((path: string) => path),
}))

let ChallengeListLayout: typeof import('./ChallengeListLayout.vue').default

beforeEach(async () => {
  const mod = await import('./ChallengeListLayout.vue')
  ChallengeListLayout = mod.default
})

describe('ChallengeListLayout', () => {
  it('renders a card for each challenge', () => {
    const wrapper = mount(ChallengeListLayout)
    // The actual markdown files have their frontmatter parsed via markdownStub plugin,
    // so sqli-demo.md and php-demo.md produce cards (index.md is filtered out)
    const cards = wrapper.findAll('[data-challenge-card]')
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  it('renders challenge title in each card', () => {
    const wrapper = mount(ChallengeListLayout)
    expect(wrapper.text()).toContain('SQL Injection Demo')
    expect(wrapper.text()).toContain('PHP File Inclusion Demo')
  })

  it('renders difficulty and category badges', () => {
    const wrapper = mount(ChallengeListLayout)
    expect(wrapper.text()).toContain('easy')
    expect(wrapper.text()).toContain('web')
  })

  it('each card contains a link to the challenge page', () => {
    const wrapper = mount(ChallengeListLayout)
    const links = wrapper.findAll('a[data-challenge-link]')
    expect(links.length).toBeGreaterThanOrEqual(1)
    const hrefs = links.map((l) => l.attributes('href'))
    expect(hrefs.some((h) => h?.includes('sqli-demo'))).toBe(true)
    expect(hrefs.some((h) => h?.includes('php-demo'))).toBe(true)
  })
})
