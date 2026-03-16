import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BrowserPanel from '../../../.vitepress/theme/components/BrowserPanel.vue'

describe('BrowserPanel', () => {
  it('renders HTML response in iframe on navigate', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('<h1>Hello</h1>', {
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const goBtn = wrapper.find('[data-go]')
    expect(goBtn.exists()).toBe(true)
    await goBtn.trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('sandbox')).toContain('allow-scripts')
    expect(iframe.attributes('sandbox')).toContain('allow-same-origin')
  })

  it('does NOT render HTTP method selector', () => {
    const mockDispatch = vi.fn()
    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })
    expect(wrapper.find('select').exists()).toBe(false)
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

    await wrapper.find('[data-go]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const pre = wrapper.find('[data-response-text]')
    expect(pre.exists()).toBe(true)
    expect(pre.text()).toContain('key')
    const iframe = wrapper.find('iframe')
    expect(iframe.exists()).toBe(false)
  })

  it('triggers navigate on Enter key in URL input', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('OK', { headers: { 'Content-Type': 'text/plain' } }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const input = wrapper.find('[data-url-input]')
    expect(input.exists()).toBe(true)
    await input.trigger('keydown.enter')
    await wrapper.vm.$nextTick()

    expect(mockDispatch).toHaveBeenCalledOnce()
    const req: Request = mockDispatch.mock.calls[0][0]
    expect(req.method).toBe('GET')
  })

  it('dispatches GET-only requests', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('OK', { headers: { 'Content-Type': 'text/plain' } }),
    )

    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    await wrapper.find('[data-go]').trigger('click')
    await wrapper.vm.$nextTick()

    const req: Request = mockDispatch.mock.calls[0][0]
    expect(req.method).toBe('GET')
  })

  it('shows disabled state when disabled prop is true', () => {
    const mockDispatch = vi.fn()
    const wrapper = mount(BrowserPanel, {
      props: { slug: 'test', dispatch: mockDispatch, disabled: true },
    })
    const goBtn = wrapper.find('[data-go]')
    expect(goBtn.attributes('disabled')).toBeDefined()
  })
})
