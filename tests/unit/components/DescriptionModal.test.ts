import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import DescriptionModal from '../../../.vitepress/theme/components/DescriptionModal.vue'

const defaultProps = {
  title: 'SQL Injection Demo',
  difficulty: 'easy',
  category: 'web',
}

describe('DescriptionModal', () => {
  it('renders fullscreen overlay', () => {
    const wrapper = mount(DescriptionModal, {
      props: defaultProps,
      slots: { default: '<p>Challenge description</p>' },
    })
    const overlay = wrapper.find('[data-description-modal]')
    expect(overlay.exists()).toBe(true)
  })

  it('renders title and badges in modal header', () => {
    const wrapper = mount(DescriptionModal, {
      props: defaultProps,
      slots: { default: '<p>Challenge description</p>' },
    })
    expect(wrapper.text()).toContain('SQL Injection Demo')
    expect(wrapper.text()).toContain('easy')
    expect(wrapper.text()).toContain('web')
  })

  it('renders slot content (description)', () => {
    const wrapper = mount(DescriptionModal, {
      props: defaultProps,
      slots: { default: '<p class="test-content">Challenge description here</p>' },
    })
    expect(wrapper.find('.test-content').exists()).toBe(true)
  })

  it('renders flag-submit slot', () => {
    const wrapper = mount(DescriptionModal, {
      props: defaultProps,
      slots: {
        default: '<p>Desc</p>',
        'flag-submit': '<div data-flag-input>Flag input</div>',
      },
    })
    expect(wrapper.find('[data-flag-input]').exists()).toBe(true)
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = mount(DescriptionModal, {
      props: defaultProps,
      slots: { default: '<p>Desc</p>' },
    })
    const closeBtn = wrapper.find('[data-modal-close]')
    expect(closeBtn.exists()).toBe(true)
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
