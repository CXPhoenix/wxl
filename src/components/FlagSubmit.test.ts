import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FlagSubmit from './FlagSubmit.vue'

const CORRECT_FLAG = 'CTF{test_flag}'

describe('FlagSubmit', () => {
  it('shows success indicator when correct flag is submitted', async () => {
    const verify = vi.fn().mockResolvedValue(true)
    const wrapper = mount(FlagSubmit, { props: { verify } })

    await wrapper.find('[data-flag-input]').setValue(CORRECT_FLAG)
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(verify).toHaveBeenCalledWith(CORRECT_FLAG)
    expect(wrapper.find('[data-success]').exists()).toBe(true)
    expect(wrapper.find('[data-failure]').exists()).toBe(false)
  })

  it('shows failure indicator and no hint when wrong flag submitted', async () => {
    const verify = vi.fn().mockResolvedValue(false)
    const wrapper = mount(FlagSubmit, { props: { verify } })

    await wrapper.find('[data-flag-input]').setValue('CTF{wrong}')
    await wrapper.find('[data-submit]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-failure]').exists()).toBe(true)
    expect(wrapper.find('[data-success]').exists()).toBe(false)
    // Response must not leak the correct flag
    expect(wrapper.html()).not.toContain(CORRECT_FLAG)
  })
})
