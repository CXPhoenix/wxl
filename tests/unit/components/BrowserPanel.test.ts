import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BrowserPanel from '../../../.vitepress/theme/components/BrowserPanel.vue'

describe('BrowserPanel', () => {
  it('renders HTML response in iframe on GET', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('<h1>Hello</h1>', {
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const sendBtn = wrapper.find('[data-send]')
    await sendBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('sandbox')).toContain('allow-scripts')
  })

  it('displays JSON response as formatted text, not iframe', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('{"key":"value"}', {
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    await wrapper.find('[data-send]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    // JSON should appear as text, not in iframe
    const pre = wrapper.find('[data-response-text]')
    expect(pre.exists()).toBe(true)
    expect(pre.text()).toContain('key')
    // iframe should NOT be visible for JSON
    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(false)
  })
})
