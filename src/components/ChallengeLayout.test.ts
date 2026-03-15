import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChallengeLayout from './ChallengeLayout.vue'

describe('ChallengeLayout tab switching', () => {
  it('renders three tab buttons', () => {
    const wrapper = mount(ChallengeLayout, {
      props: { slug: 'test-challenge' },
    })
    const tabs = wrapper.findAll('[data-tab]')
    expect(tabs).toHaveLength(3)
  })

  it('preserves input state when switching tabs', async () => {
    const wrapper = mount(ChallengeLayout, {
      props: { slug: 'test-challenge' },
    })

    // Type in the Browser panel URL input
    const urlInput = wrapper.find('[data-panel="browser"] input[data-url]')
    await urlInput.setValue('https://challenge-test.localhost/custom')

    // Switch to Terminal tab
    const terminalTab = wrapper.find('[data-tab="terminal"]')
    await terminalTab.trigger('click')

    // Switch back to Browser tab
    const browserTab = wrapper.find('[data-tab="browser"]')
    await browserTab.trigger('click')

    // Input value should be preserved (panel uses v-show not v-if)
    const urlInputAgain = wrapper.find('[data-panel="browser"] input[data-url]')
    expect((urlInputAgain.element as HTMLInputElement).value).toBe(
      'https://challenge-test.localhost/custom',
    )
  })
})
