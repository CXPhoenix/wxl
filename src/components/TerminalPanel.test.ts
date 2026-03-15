import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TerminalPanel from './TerminalPanel.vue'

describe('TerminalPanel', () => {
  it('sends GET request and shows response for curl command', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('{"users":[]}', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )
    const wrapper = mount(TerminalPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const input = wrapper.find('[data-cmd-input]')
    await input.setValue('curl https://challenge-test.localhost/')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockDispatch).toHaveBeenCalledOnce()
    const call = mockDispatch.mock.calls[0][0] as Request
    expect(call.method).toBe('GET')

    const output = wrapper.find('[data-output]')
    expect(output.text()).toContain('200')
  })

  it('shows usage hint for unrecognized command', async () => {
    const mockDispatch = vi.fn()
    const wrapper = mount(TerminalPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const input = wrapper.find('[data-cmd-input]')
    await input.setValue('wget https://example.com')
    await input.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(mockDispatch).not.toHaveBeenCalled()
    const output = wrapper.find('[data-output]')
    expect(output.text()).toMatch(/usage|curl|http/i)
  })
})
