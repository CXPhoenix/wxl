import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RepeatPanel from '../../../.vitepress/theme/components/RepeatPanel.vue'

describe('RepeatPanel', () => {
  it('parses raw request and shows response with status, headers, body', async () => {
    const mockDispatch = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-Flag': 'nope' },
      }),
    )
    const wrapper = mount(RepeatPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const textarea = wrapper.find('[data-request-input]')
    await textarea.setValue('GET / HTTP/1.1\r\nHost: challenge-test.localhost\r\n\r\n')
    await wrapper.find('[data-send]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockDispatch).toHaveBeenCalledOnce()
    const responseArea = wrapper.find('[data-response-output]')
    expect(responseArea.text()).toContain('200')
    expect(responseArea.text()).toContain('application/json')
    expect(responseArea.text()).toContain('{"ok":true}')
  })

  it('saves and restores request snapshot', async () => {
    const mockDispatch = vi.fn()
    const wrapper = mount(RepeatPanel, {
      props: { slug: 'test', dispatch: mockDispatch },
    })

    const textarea = wrapper.find('[data-request-input]')
    await textarea.setValue('GET /secret HTTP/1.1\r\nHost: test.localhost\r\n\r\n')

    // Save snapshot
    const saveBtn = wrapper.find('[data-save-snapshot]')
    await saveBtn.trigger('click')

    // Modify the textarea
    await textarea.setValue('POST / HTTP/1.1\r\n\r\n')

    // Restore the snapshot
    const snapshot = wrapper.find('[data-snapshot-item]')
    await snapshot.trigger('click')

    expect((textarea.element as HTMLTextAreaElement).value).toContain('GET /secret')
  })
})
