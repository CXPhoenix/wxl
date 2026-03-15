import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('vitepress', () => ({
  useData: vi.fn(() => ({
    frontmatter: { value: {} },
  })),
}))

// Mock the data loader (path is relative to this test file's location)
vi.mock('../../../docs/challenges/challenges.data', () => ({
  data: [
    { title: 'SQL Injection Demo', url: '/challenges/sqli-demo', difficulty: 'easy', category: 'web' },
    { title: 'PHP LFI', url: '/challenges/php-demo', difficulty: 'medium', category: 'web' },
  ],
}))

let ChallengeListLayout: typeof import('./ChallengeListLayout.vue').default

beforeEach(async () => {
  const mod = await import('./ChallengeListLayout.vue')
  ChallengeListLayout = mod.default
})

describe('ChallengeListLayout', () => {
  it('renders a card for each challenge', () => {
    const wrapper = mount(ChallengeListLayout)
    const cards = wrapper.findAll('[data-challenge-card]')
    expect(cards).toHaveLength(2)
  })

  it('renders challenge title in each card', () => {
    const wrapper = mount(ChallengeListLayout)
    expect(wrapper.text()).toContain('SQL Injection Demo')
    expect(wrapper.text()).toContain('PHP LFI')
  })

  it('renders difficulty and category badges', () => {
    const wrapper = mount(ChallengeListLayout)
    expect(wrapper.text()).toContain('easy')
    expect(wrapper.text()).toContain('medium')
    expect(wrapper.text()).toContain('web')
  })

  it('each card contains a link to the challenge page', () => {
    const wrapper = mount(ChallengeListLayout)
    const links = wrapper.findAll('a[data-challenge-link]')
    expect(links).toHaveLength(2)
    expect(links[0].attributes('href')).toBe('/challenges/sqli-demo')
    expect(links[1].attributes('href')).toBe('/challenges/php-demo')
  })
})
